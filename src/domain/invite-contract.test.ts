import assert from "node:assert/strict";
import { test } from "node:test";
import { parseInvitedGmail } from "./email-key";
import { sentInviteResponse } from "./invite-response";

test("invited Gmail is trimmed, lowercased, and canonicalized", () => {
  const parsed = parseInvitedGmail("  Ada.Lovelace+kid@GoogleMail.com ");
  assert.deepEqual(parsed, {
    email: "ada.lovelace+kid@googlemail.com",
    key: "adalovelace@gmail.com",
  });
  assert.equal(parseInvitedGmail("ada@gmail.com")?.key, "ada@gmail.com");
  assert.equal(parseInvitedGmail("a.b+tag@gmail.com")?.key, "ab@gmail.com");
  assert.equal(parseInvitedGmail("ada@example.com"), null);
  assert.equal(parseInvitedGmail("ada@gmail.com.evil.com"), null);
  assert.equal(parseInvitedGmail("+tag@gmail.com"), null);
  assert.equal(parseInvitedGmail("  "), null);
  assert.equal(parseInvitedGmail(null), null);
});

test("sent invite JSON has no raw token and no hash", () => {
  const raw = "raw-connect-token-not-stored";
  const hash = "a".repeat(64);
  const body = sentInviteResponse({
    id: "00000000-0000-4000-8000-000000000001",
    invited_email: "ada@gmail.com",
    expires_at: "2026-10-20T12:00:00.000Z",
    state: "sent",
    token: raw,
    rawToken: raw,
    token_hash: hash,
    invited_email_key: "ada@gmail.com",
  });
  assert.ok(body);
  assert.deepEqual(Object.keys(body).sort(), ["expires_at", "id", "invited_email", "state"]);
  assert.equal(body.state, "sent");
  const json = JSON.stringify(body);
  assert.equal(json.includes(raw), false);
  assert.equal(json.includes(hash), false);
  assert.equal("token" in body, false);
  assert.equal("token_hash" in body, false);
});