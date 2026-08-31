import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asString } from "@/lib/firebase/mapper";
import { ROLE_PERMISSIONS, type Role } from "@/lib/permissions";
import type { UserProfile, UserStatus } from "@/types";

export function hydrateUser(id: string, data: DocumentData): UserProfile {
  const role = (asString(data.role, "CASHIER") || "CASHIER") as Role;
  return {
    id,
    name: asString(data.name),
    email: asString(data.email),
    phone: typeof data.phone === "string" ? data.phone : null,
    photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : null,
    role,
    permissions: Array.isArray(data.permissions)
      ? data.permissions.filter((item): item is UserProfile["permissions"][number] => typeof item === "string")
      : [...(ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.EMPLOYEE)],
    status: (asString(data.status, "ACTIVE") as UserStatus) || "ACTIVE",
    employeeId: typeof data.employeeId === "string" ? data.employeeId : null,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listUsers() {
  const snap = await getDocs(collection(requireDb(), COLLECTIONS.users));
  return snap.docs.map((item) => hydrateUser(item.id, item.data()));
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.users, uid));
  if (!snap.exists()) {
    return null;
  }
  return hydrateUser(snap.id, snap.data());
}

export async function applyRolePermissions(role: Role, permissions: UserProfile["permissions"]) {
  const users = await listUsers();
  await Promise.all(
    users
      .filter((user) => user.role === role)
      .map((user) =>
        updateDoc(doc(requireDb(), COLLECTIONS.users, user.id), {
          permissions,
          updatedAt: serverTimestamp(),
        }),
      ),
  );
}

export async function createUserProfile(input: {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  employeeId: string;
  status?: UserStatus;
}) {
  const payload = {
    id: input.id,
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone ?? null,
    photoUrl: null,
    role: input.role,
    permissions: [...(ROLE_PERMISSIONS[input.role] ?? ROLE_PERMISSIONS.EMPLOYEE)],
    status: input.status ?? "ACTIVE",
    employeeId: input.employeeId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(requireDb(), COLLECTIONS.users, input.id), payload);
  return getUserProfile(input.id);
}

export async function updateUserProfile(
  uid: string,
  input: {
    name?: string;
    email?: string;
    phone?: string | null;
    role?: Role;
    status?: UserStatus;
    permissions?: UserProfile["permissions"];
  },
) {
  const patch: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (input.name !== undefined) {
    patch.name = input.name;
  }
  if (input.email !== undefined) {
    patch.email = input.email.toLowerCase();
  }
  if (input.phone !== undefined) {
    patch.phone = input.phone;
  }
  if (input.role !== undefined) {
    patch.role = input.role;
    patch.permissions = input.permissions ?? [...(ROLE_PERMISSIONS[input.role] ?? ROLE_PERMISSIONS.EMPLOYEE)];
  } else if (input.permissions !== undefined) {
    patch.permissions = input.permissions;
  }
  if (input.status !== undefined) {
    patch.status = input.status;
  }
  await updateDoc(doc(requireDb(), COLLECTIONS.users, uid), patch);
  return getUserProfile(uid);
}

export async function ownerExists() {
  if (!isFirebaseClientConfigured()) {
    return false;
  }
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.settings, "bootstrap"));
  return snap.exists();
}

export async function createOwnerBootstrap(ownerId: string) {
  await setDoc(doc(requireDb(), COLLECTIONS.settings, "bootstrap"), {
    ownerRegistered: true,
    ownerId,
    createdAt: serverTimestamp(),
  });
}
