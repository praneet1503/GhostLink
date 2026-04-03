import { customAlphabet } from "nanoid";

const generate = customAlphabet(
  "1234567890abcdefghijklmnopqrstuvwxyz",
  6,
);

export function createSlug(): string {
  return generate();
}
