import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { mapAuthError } from "@/lib/auth/errors";
import { requireClientAuth } from "@/lib/firebase/db";

import { createOwnerBootstrap, createUserProfile, getUserProfile, ownerExists } from "@/services/users";
import { writeEmployeeRecord } from "@/services/employees";
import { seedCatalog } from "@/services/seed";

export async function signInStaff(email: string, password: string) {
  const auth = requireClientAuth();
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const profile = await getUserProfile(credential.user.uid);
    if (!profile) {
      await signOut(auth);
      throw new Error("No staff record is linked to this login. Ask the owner to add you as an employee.");
    }
    if (profile.status !== "ACTIVE") {
      await signOut(auth);
      throw new Error("This account is inactive or suspended. Contact the store owner.");
    }
    return profile;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("No staff")) {
      throw error;
    }
    if (error instanceof Error && error.message.startsWith("This account is")) {
      throw error;
    }
    throw new Error(mapAuthError(error));
  }
}

export async function registerOwner(input: { name: string; email: string; password: string }) {
  if (await ownerExists()) {
    throw new Error("An owner account already exists. Ask them to add you from Employees.");
  }

  const auth = requireClientAuth();
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      input.email.trim(),
      input.password,
    );
    await updateProfile(credential.user, { displayName: input.name });
    const uid = credential.user.uid;

    try {
      await writeEmployeeRecord({
        id: uid,
        name: input.name,
        email: input.email,
        role: "SUPER_ADMIN",
        userId: uid,
        employeeCode: "OWN-0001",
        jobTitle: "Owner",
        isActive: true,
      });
      await createUserProfile({
        id: uid,
        name: input.name,
        email: input.email,
        role: "SUPER_ADMIN",
        employeeId: uid,
      });
      await createOwnerBootstrap(uid);
    } catch (error) {
      await credential.user.delete();
      throw error;
    }

    try {
      await seedCatalog(uid);
    } catch {
      // Owner can load demo catalog from Settings if this fails.
    }

    return getUserProfile(uid);
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function requestPasswordReset(email: string) {
  const auth = requireClientAuth();
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function signOutStaff() {
  const auth = requireClientAuth();
  await signOut(auth);
}
