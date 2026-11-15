import { ResultAsync } from "neverthrow";

/** Why a file or the clipboard was not read or written. */
export type FileError =
  | { readonly kind: "unreadableFile"; readonly name: string }
  | { readonly kind: "clipboardRefused" };

/**
 * The text of a file the person picked.
 *
 * @effects file read
 */
export const readFileText = (file: File): ResultAsync<string, FileError> =>
  ResultAsync.fromPromise(file.text(), (): FileError => ({ kind: "unreadableFile", name: file.name }));

/**
 * The bytes of a file the person picked.
 *
 * @effects file read
 */
export const readFileBytes = (file: File): ResultAsync<Uint8Array, FileError> =>
  ResultAsync.fromPromise(
    file.arrayBuffer().then((buffer) => new Uint8Array(buffer)),
    (): FileError => ({ kind: "unreadableFile", name: file.name }),
  );

/**
 * The browser saves `data` as a file called `name`.
 *
 * @effects DOM, download
 */
export function download(name: string, data: string | Uint8Array<ArrayBuffer>, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * `text` on the clipboard.
 *
 * @effects clipboard
 */
export const copyText = (text: string): ResultAsync<void, FileError> =>
  ResultAsync.fromPromise(navigator.clipboard.writeText(text), (): FileError => ({ kind: "clipboardRefused" }));
