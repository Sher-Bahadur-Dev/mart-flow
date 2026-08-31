import assert from "node:assert/strict";
import test from "node:test";

import { publicAuthError } from "../lib/auth/safe-error";

test("firebase admin configuration errors are surfaced", () => {
  assert.match(
    publicAuthError(
      new Error(
        "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID in the environment.",
      ),
    ),
    /FIREBASE_PROJECT_ID/,
  );
});

test("firebase auth configuration errors are surfaced", () => {
  assert.match(
    publicAuthError(
      new Error("Firebase Auth is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY."),
    ),
    /NEXT_PUBLIC_FIREBASE_API_KEY/,
  );
});

test("session secret errors are surfaced", () => {
  assert.match(
    publicAuthError(new Error("SESSION_SECRET is missing or shorter than 32 characters.")),
    /SESSION_SECRET/,
  );
});

test("invalid private key errors are surfaced", () => {
  assert.match(
    publicAuthError(new Error("Failed to parse private key: Error: Invalid PEM formatted message.")),
    /FIREBASE_PRIVATE_KEY/,
  );
});

test("duplicate email is not hidden behind a generic hint", () => {
  assert.equal(
    publicAuthError(new Error("That email is already in use.")),
    "That email is already in use.",
  );
});

test("missing Google store profile errors are surfaced", () => {
  assert.match(
    publicAuthError(
      new Error("No store account found for this Google user. Create one on the sign-up page."),
    ),
    /Google/,
  );
});
