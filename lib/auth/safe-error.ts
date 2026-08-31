export function publicAuthError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Authentication failed.";
  const lower = message.toLowerCase();

  if (lower.includes("failed to parse") && lower.includes("private key")) {
    return "Failed to parse FIREBASE_PRIVATE_KEY. Copy private_key from the Firebase service account JSON into double quotes, keeping the \\n sequences.";
  }
  if (lower.includes("firebase admin is not configured")) {
    return "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.";
  }
  if (lower.includes("firebase auth is not configured") || lower.includes("api_key")) {
    return "Firebase Auth is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY.";
  }
  if (lower.includes("session_secret")) {
    return "SESSION_SECRET is missing or shorter than 32 characters.";
  }
  if (
    lower.includes("already in use") ||
    lower.includes("invalid email") ||
    lower.includes("disabled") ||
    lower.includes("too many") ||
    lower.includes("password") ||
    lower.includes("username") ||
    lower.includes("google") ||
    lower.includes("no store account") ||
    lower.includes("authentication failed")
  ) {
    return message;
  }

  console.error("Auth error", error);
  return message.replace(/\s+/g, " ").trim().slice(0, 280);
}

export function isNextRedirect(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.includes("NEXT_REDIRECT");
}
