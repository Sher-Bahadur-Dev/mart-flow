export function mapAuthError(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: string }).code)
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
    case "auth/missing-password":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "That email is already in use.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled for this Firebase project.";
    case "auth/weak-password":
      return "Password must be at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    case "auth/user-disabled":
      return "This account is disabled.";
    default:
      return error instanceof Error ? error.message : "Authentication failed.";
  }
}
