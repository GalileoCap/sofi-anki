import { Result, ResultAsync, err, ok } from "neverthrow";
import { z } from "zod";

import { decode } from "@/core/decode";
import { type Millis, millis } from "@/core/model";

/** The OAuth client and the token server (A20) the deploy names. Without both the app offers no sync. */
const CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;
const AUTH_SERVER: string | undefined = import.meta.env.VITE_AUTH_SERVER || undefined;

/**
 * Whether this build can sync: it was given a Google client id and a token server.
 *
 * @effects build environment
 */
export const syncAvailable = CLIENT_ID !== undefined && AUTH_SERVER !== undefined;

/** The hidden folder in a person's Drive that only this app can read. */
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const FILE_NAME = "sofi-anki.json";
const DRIVE = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

/**
 * Why a step of sync failed: the sign-in was closed or refused, the token expired, Google wants
 * the person to sign in once more to grant lasting access, the network is down, or Google or the
 * token server answered with an error.
 */
export type DriveError =
  | { readonly kind: "signInClosed" }
  | { readonly kind: "expired" }
  | { readonly kind: "signInAgain" }
  | { readonly kind: "offline" }
  | { readonly kind: "refused"; readonly detail: string };

/** An access token and when it expires. */
export type Token = { readonly token: string; readonly expiresAt: Millis };
/** A first sign-in's token, with the renewal token the token server sealed for this browser to keep. */
export type SignedIn = Token & { readonly sealed: string };

let gis: Promise<void> | null = null;

/**
 * Google's sign-in script, loaded once on the first sign-in.
 *
 * @effects network, DOM
 */
function loadSignIn(): Promise<void> {
  gis ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gis = null;
      reject(new Error("sign-in script"));
    };
    document.head.append(script);
  });
  return gis;
}

const tokenSchema = z.object({ token: z.string(), expiresIn: z.number() });
const signedInSchema = tokenSchema.extend({ sealed: z.string() });
const errorSchema = z.object({ error: z.string() });

/**
 * `body` posted to the token server's `path`, its answer decoded with `schema`. A 401 or a seal
 * the server cannot open is the sign-in gone.
 *
 * @effects network, clock
 */
function askServer<T extends { expiresIn: number }>(path: string, body: unknown, schema: z.ZodType<T>): ResultAsync<T & { expiresAt: Millis }, DriveError> {
  return ResultAsync.fromPromise(
    fetch(`${AUTH_SERVER}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    (): DriveError => ({ kind: "offline" }),
  ).andThen((response) =>
    ResultAsync.fromPromise(response.json(), (): DriveError => ({ kind: "refused", detail: `${response.status}` })).andThen(
      (value): Result<T & { expiresAt: Millis }, DriveError> => {
        if (response.ok) {
          return decode(schema, value)
            .map((answer) => ({ ...answer, expiresAt: millis(Date.now() + answer.expiresIn * 1000) }))
            .mapErr((): DriveError => ({ kind: "refused", detail: "answer" }));
        }
        const code = decode(errorSchema, value).map((e) => e.error).unwrapOr(`${response.status}`);
        if (code === "sign_in_again") return err({ kind: "signInAgain" });
        if (response.status === 401 || code === "bad_seal") return err({ kind: "expired" });
        return err({ kind: "refused", detail: code });
      },
    ),
  );
}

/**
 * A token for the app folder and a sealed renewal token, from Google's sign-in popup and the
 * token server. It must start from a click, or the browser blocks the popup.
 *
 * @effects network, DOM, clock
 */
export function signIn(): Promise<Result<SignedIn, DriveError>> {
  const clientId = CLIENT_ID;
  if (clientId === undefined || AUTH_SERVER === undefined) return Promise.resolve(err({ kind: "refused", detail: "no client id" }));
  return loadSignIn().then(
    () =>
      new Promise<Result<string, DriveError>>((resolve) => {
        const client = google.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: SCOPE,
          ux_mode: "popup",
          callback: (answer) => resolve(answer.error || !answer.code ? err({ kind: "refused", detail: answer.error || "no code" }) : ok(answer.code)),
          error_callback: () => resolve(err({ kind: "signInClosed" })),
        });
        client.requestCode();
      }).then((code) =>
        code.asyncAndThen((c) => askServer("/exchange", { code: c }, signedInSchema)).map(({ token, expiresAt, sealed }) => ({ token, expiresAt, sealed })),
      ),
    () => err({ kind: "offline" }),
  );
}

/**
 * A new access token from the sealed renewal token, with no click.
 *
 * @effects network, clock
 */
export const renew = (sealed: string): ResultAsync<Token, DriveError> =>
  askServer("/refresh", { sealed }, tokenSchema).map(({ token, expiresAt }) => ({ token, expiresAt }));

/**
 * The renewal token revoked at Google through the token server, so it reaches the person's
 * Drive no more. Best effort: turning sync off goes on whatever the answer.
 *
 * @effects network
 */
export function signOut(sealed: string): void {
  void fetch(`${AUTH_SERVER}/revoke`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sealed }), keepalive: true }).catch(
    () => undefined,
  );
}

const call = (token: string, url: string, init: RequestInit = {}): ResultAsync<Response, DriveError> =>
  ResultAsync.fromPromise(
    fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } }),
    (): DriveError => ({ kind: "offline" }),
  ).andThen((response) =>
    response.ok
      ? ok(response)
      : err<Response, DriveError>(response.status === 401 ? { kind: "expired" } : { kind: "refused", detail: `${response.status} ${response.statusText}` }),
  );

const listSchema = z.object({ files: z.array(z.object({ id: z.string() })) });
const createdSchema = z.object({ id: z.string() });

const json = <T>(schema: z.ZodType<T>) => (response: Response): ResultAsync<T, DriveError> =>
  ResultAsync.fromPromise(response.json(), (): DriveError => ({ kind: "refused", detail: "not JSON" })).andThen((value) =>
    decode(schema, value).mapErr((error): DriveError => ({ kind: "refused", detail: error.kind })),
  );

/** The sync file in Drive: its id and text, or null when there is none yet. */
export type DriveFile = { readonly id: string; readonly text: string } | null;

/**
 * The sync file from the person's app folder.
 *
 * @effects network
 */
export function readDriveFile(token: string): ResultAsync<DriveFile, DriveError> {
  const query = new URLSearchParams({ spaces: "appDataFolder", q: `name = '${FILE_NAME}'`, fields: "files(id)" });
  return call(token, `${DRIVE}?${query}`)
    .andThen(json(listSchema))
    .andThen(({ files }) => {
      const id = files[0]?.id;
      if (id === undefined) return ok(null);
      return call(token, `${DRIVE}/${id}?alt=media`).andThen((response) =>
        ResultAsync.fromPromise(response.text(), (): DriveError => ({ kind: "offline" })).map((text) => ({ id, text })),
      );
    });
}

/**
 * `text` written to the sync file, made when `id` is null. Gives the file's id.
 *
 * @effects network
 */
export function writeDriveFile(token: string, id: string | null, text: string): ResultAsync<string, DriveError> {
  if (id !== null) {
    return call(token, `${UPLOAD}/${id}?uploadType=media`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: text }).map(() => id);
  }
  const body = new FormData();
  body.append("metadata", new Blob([JSON.stringify({ name: FILE_NAME, parents: ["appDataFolder"] })], { type: "application/json" }));
  body.append("file", new Blob([text], { type: "application/json" }));
  return call(token, `${UPLOAD}?uploadType=multipart&fields=id`, { method: "POST", body })
    .andThen(json(createdSchema))
    .map(({ id: made }) => made);
}

/**
 * Calls `onChange` when the page comes back into view or the browser back online, the moments a
 * device may have missed changes. Gives the function that stops it.
 *
 * @effects DOM
 */
export function onReturn(onChange: () => void): () => void {
  const visible = () => document.visibilityState === "visible" && onChange();
  document.addEventListener("visibilitychange", visible);
  window.addEventListener("online", onChange);
  return () => {
    document.removeEventListener("visibilitychange", visible);
    window.removeEventListener("online", onChange);
  };
}
