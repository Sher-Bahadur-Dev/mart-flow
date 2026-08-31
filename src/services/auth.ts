import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { mapAuthError } from "@/lib/auth/errors";
import { requireClientAuth } from "@/lib/firebase/db";
import { setActiveOwnerId } from "@/lib/tenant";

import { writeEmployeeRecord } from "@/services/employees";
import { createOwnerSettings } from "@/services/settings";
import { createOwnerStore } from "@/services/stores";
import { createUserProfile, getUserProfile } from "@/services/users";

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
    setActiveOwnerId(profile.ownerId || (profile.role === "SUPER_ADMIN" ? profile.id : null));
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
  const auth = requireClientAuth();
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      input.email.trim(),
      input.password,
    );
    await updateProfile(credential.user, { displayName: input.name });
    const uid = credential.user.uid;
    const storeName = `${input.name.trim()}'s Store`;
    setActiveOwnerId(uid);

    try {
      await createUserProfile({
        id: uid,
        name: input.name,
        email: input.email,
        role: "SUPER_ADMIN",
        employeeId: uid,
        ownerId: uid,
      });
      await writeEmployeeRecord({
        id: uid,
        name: input.name,
        email: input.email,
        role: "SUPER_ADMIN",
        userId: uid,
        employeeCode: "OWN-0001",
        jobTitle: "Owner",
        isActive: true,
        ownerId: uid,
        storeId: `store_${uid}`,
      });
      await createOwnerStore({
        ownerId: uid,
        name: storeName,
        email: input.email.trim().toLowerCase(),
      });
      await createOwnerSettings({
        ownerId: uid,
        storeName,
        email: input.email.trim().toLowerCase(),
      });
    } catch (error) {
      await credential.user.delete();
      setActiveOwnerId(null);
      throw error;
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
  setActiveOwnerId(null);
  const auth = requireClientAuth();
  await signOut(auth);
}
