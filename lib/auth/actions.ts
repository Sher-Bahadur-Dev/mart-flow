"use server";

import { FieldValue } from "firebase-admin/firestore";
import { redirect } from "next/navigation";

import { writeAuditLog, getRequestContext } from "@/lib/auth/audit";
import { getCurrentUser } from "@/lib/auth/dal";
import { consumeLoginAttempt } from "@/lib/auth/rate-limit";
import { isNextRedirect, publicAuthError } from "@/lib/auth/safe-error";
import { createSession, deleteSession } from "@/lib/auth/session";
import { collections } from "@/lib/data/fs";
import { findUserByEmail, findUserByUsername, getStore, getUser } from "@/lib/data/queries";
import type { UserDoc } from "@/lib/data/types";
import { adminAuth, firestore } from "@/lib/firebase-admin";
import { signInWithEmailPassword } from "@/lib/firebase/rest-auth";
import { LoginSchema, type LoginFormState } from "@/lib/validation/auth";

function looksLikeEmail(value: string) {
  return value.includes("@");
}

async function finishSuccessfulLogin(
  profile: UserDoc,
  metadata: { identifier: string; provider: "password" | "google" },
) {
  const store = profile.storeId ? await getStore(profile.storeId) : null;
  if (!profile.isActive || store?.isActive === false) {
    await writeAuditLog({
      action: "LOGIN_FAILED",
      entity: "AUTH",
      userId: profile.id,
      storeId: profile.storeId,
      metadata: { ...metadata, reason: "inactive" },
    });
    throw new Error("Invalid email, username, or password.");
  }

  await createSession(profile.id);
  await firestore.collection(collections.users).doc(profile.id).set(
    {
      lastLoginAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await writeAuditLog({
    action: "LOGIN",
    entity: "AUTH",
    entityId: profile.id,
    userId: profile.id,
    storeId: profile.storeId,
    metadata: {
      email: profile.email,
      username: profile.username,
      provider: metadata.provider,
    },
  });
}

export async function login(
  _prevState: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState> {
  try {
    const parsed = LoginSchema.safeParse({
      identifier: formData.get("identifier") ?? formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      return { error: "Enter a valid email or username and password." };
    }

    const identifier = parsed.data.identifier.toLowerCase().trim();
    const { ipAddress } = await getRequestContext();
    const allowed = consumeLoginAttempt(`${ipAddress}:${identifier}`);

    if (!allowed) {
      await writeAuditLog({
        action: "LOGIN_RATE_LIMITED",
        entity: "AUTH",
        metadata: { identifier },
      });
      return { error: "Too many sign-in attempts. Try again in 15 minutes." };
    }

    const profile = looksLikeEmail(identifier)
      ? await findUserByEmail(identifier)
      : await findUserByUsername(identifier);

    if (!profile) {
      await writeAuditLog({
        action: "LOGIN_FAILED",
        entity: "AUTH",
        metadata: { identifier },
      });
      return { error: "Invalid email, username, or password." };
    }

    let idToken: string;
    try {
      const signedIn = await signInWithEmailPassword(
        profile.email,
        parsed.data.password,
      );
      idToken = signedIn.idToken;
    } catch {
      await writeAuditLog({
        action: "LOGIN_FAILED",
        entity: "AUTH",
        userId: profile.id,
        storeId: profile.storeId,
        metadata: { identifier },
      });
      return { error: "Invalid email, username, or password." };
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    if (decoded.uid !== profile.id) {
      return { error: "Invalid email, username, or password." };
    }

    const store = profile.storeId ? await getStore(profile.storeId) : null;
    if (!profile.isActive || store?.isActive === false) {
      await writeAuditLog({
        action: "LOGIN_FAILED",
        entity: "AUTH",
        userId: profile.id,
        storeId: profile.storeId,
        metadata: { identifier, reason: "inactive" },
      });
      return { error: "Invalid email, username, or password." };
    }

    await createSession(profile.id);
    await firestore.collection(collections.users).doc(profile.id).set(
      {
        lastLoginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    await finishSuccessfulLogin(profile, { identifier, provider: "password" });
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    console.error("Login failed", error);
    return { error: publicAuthError(error) };
  }

  redirect("/dashboard");
}

export async function loginWithGoogle(
  _prevState: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState> {
  try {
    const idToken = String(formData.get("idToken") ?? "").trim();
    if (!idToken) {
      return { error: "Google sign-in did not complete." };
    }

    const { ipAddress } = await getRequestContext();
    const allowed = consumeLoginAttempt(`${ipAddress}:google`);
    if (!allowed) {
      return { error: "Too many sign-in attempts. Try again in 15 minutes." };
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const profile =
      (await getUser(decoded.uid)) ??
      (decoded.email ? await findUserByEmail(decoded.email.toLowerCase()) : null);

    if (!profile) {
      await writeAuditLog({
        action: "LOGIN_FAILED",
        entity: "AUTH",
        metadata: { provider: "google", reason: "no-store-profile" },
      });
      return { error: "No store account found for this Google user. Create one on the sign-up page." };
    }

    if (profile.id !== decoded.uid) {
      return { error: "An account already exists with this email. Sign in with email and password." };
    }

    await finishSuccessfulLogin(profile, {
      identifier: profile.email,
      provider: "google",
    });
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    console.error("Google login failed", error);
    return { error: publicAuthError(error) };
  }

  redirect("/dashboard");
}

export async function logout() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error("Logout lookup failed", error);
  }

  await deleteSession();

  if (user) {
    await writeAuditLog({
      action: "LOGOUT",
      entity: "AUTH",
      entityId: user.id,
      userId: user.id,
      storeId: user.storeId,
      metadata: { email: user.email },
    });
  }

  redirect("/login");
}
