import "server-only";
import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

export type ConnectToken = {
  raw: string;
  hash: string;
};

export function createConnectToken(): ConnectToken {
  const raw = randomBytes(TOKEN_BYTES).toString("base64url");
  return { raw, hash: hashConnectToken(raw) };
}

export function hashConnectToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}