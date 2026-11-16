import { Result, ResultAsync, err, ok } from "neverthrow";
import { z } from "zod";

import { decode } from "@/core/decode";
import { type Millis, millis } from "@/core/model";

/** The OAuth client the deploy names. Without one the app offers no sync. */
const CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;

/**
 * Whether this build can sync: it was given a Google client id.
 *
 * @effects build environment
 */
export const syncAvailable = CLIENT_ID !== undefined;

/** The hidden folder in a person's Drive that only this app can read. */
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const FILE_NAME = "sofi-anki.json";
const DRIVE = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

/** Why a step of sync failed: the sign-in was closed or refused, the token expired, the network is down, or Google answered with an error. */
export type DriveError =
  | { readonly kind: "signInClosed" }
  | { readonly kind: "expired" }
  | { readonly kind: "offline" }
  | { readonly kind: "refused"; readonly detail: string };

export type Token = { readonly token: string; readonly expiresAt: Millis };

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

/**
 * A token for the app folder, from Google's sign-in popup. It must start from a click, or the
 * browser blocks the popup. A person who already agreed sees the popup close at once.
 *
 * @effects network, DOM, clock
 */
export function signIn(): Promise<Result<Token, DriveError>> {
  const clientId = CLIENT_ID;
  if (clientId === undefined) return Promise.resolve(err({ kind: "refused", detail: "no client id" }));
  return loadSignIn().then(
    () =>
      new Promise((resolve) => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPE,
          prompt: "",
          callback: (answer) =>
            resolve(
              answer.error || !answer.access_token
                ? err({ kind: "refused", detail: answer.error_description ?? answer.error ?? "no token" })
                : ok({ token: answer.access_token, expiresAt: millis(Date.now() + Number(answer.expires_in) * 1000) }),
            ),
          error_callback: () => resolve(err({ kind: "signInClosed" })),
        });
        client.requestAccessToken();
      }),
    () => err({ kind: "offline" }),
  );
}

/**
 * The token given back to Google, which then refuses it on the person's Drive.
 *
 * @effects network
 */
export function signOut(token: string): void {
  if (typeof google !== "undefined") google.accounts.oauth2.revoke(token, () => undefined);
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
