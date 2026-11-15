import { Result, err, ok } from "neverthrow";
import { z } from "zod";

/** Why a text did not decode: it was not JSON, or its JSON was not the shape asked for. */
export type DecodeError =
  | { readonly kind: "notJson" }
  | { readonly kind: "badShape"; readonly detail: string };

export const parseJson = Result.fromThrowable(
  (text: string): unknown => JSON.parse(text),
  (): DecodeError => ({ kind: "notJson" }),
);

export function decode<T>(schema: z.ZodType<T>, value: unknown): Result<T, DecodeError> {
  const parsed = schema.safeParse(value);
  return parsed.success
    ? ok(parsed.data)
    : err({ kind: "badShape", detail: z.prettifyError(parsed.error) });
}

/** `text` parsed as JSON and decoded with `schema`. */
export const decodeJson = <T>(schema: z.ZodType<T>, text: string): Result<T, DecodeError> =>
  parseJson(text).andThen((value) => decode(schema, value));
