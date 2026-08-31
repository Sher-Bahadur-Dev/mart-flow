"use server";

import { FieldValue } from "firebase-admin/firestore";
import { redirect } from "next/navigation";

import { ROLE_CODES, ROLE_PERMISSIONS } from "@/constants/permissions";
import { writeAuditLog, getRequestContext } from "@/lib/auth/audit";
import { ensureRolesAndPermissions, ROLE_META } from "@/lib/auth/bootstrap";
import { consumeLoginAttempt } from "@/lib/auth/rate-limit";
import { isNextRedirect, publicAuthError } from "@/lib/auth/safe-error";
import { createSession } from "@/lib/auth/session";
import { collections, newId } from "@/lib/data/fs";
import {
  findStoreBySlug,
  findUserByEmail,
  findUserByUsername,
  getUser,
} from "@/lib/data/queries";
import { adminAuth, firestore } from "@/lib/firebase-admin";
import { mapAdminAuthError } from "@/lib/firebase/rest-auth";
import { nextDocumentNumber } from "@/lib/utils/document-number";
import { slugify } from "@/lib/utils/money";
import {
  GoogleSignupSchema,
  SignupSchema,
  type LoginFormState,
} from "@/lib/validation/auth";

type OwnerProvisionInput = {
  userId: string;
  email: string;
  name: string;
  username: string;
  phone: string | null;
  storeName: string;
};

async function uniqueStoreSlug(name: string) {
  const base = slugify(name) || "store";
  for (let index = 0; index < 30; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`;
    const exists = await findStoreBySlug(slug);
    if (!exists) {
      return slug;
    }
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function rollbackSignup(uid?: string, storeId?: string) {
  if (uid) {
    await adminAuth.deleteUser(uid).catch((error) => {
      console.error("Failed to delete Firebase Auth user during signup rollback", error);
    });
    const employeeSnap = await firestore
      .collection(collections.employees)
      .where("userId", "==", uid)
      .get();
    const batch = firestore.batch();
    employeeSnap.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(firestore.collection(collections.users).doc(uid));
    await batch.commit().catch((error) => {
      console.error("Failed to delete Firestore user during signup rollback", error);
    });
  }
  if (storeId) {
    const names = [
      collections.settings,
      collections.units,
      collections.expenseCategories,
      collections.counters,
      collections.employees,
    ] as const;
    const batch = firestore.batch();
    for (const name of names) {
      const snap = await firestore.collection(name).where("storeId", "==", storeId).get();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
    }
    batch.delete(firestore.collection(collections.stores).doc(storeId));
    await batch.commit().catch((error) => {
      console.error("Failed to delete store during signup rollback", error);
    });
  }
}

async function provisionOwnerAccount(input: OwnerProvisionInput) {
  const { ownerRole } = await ensureRolesAndPermissions();
  const ownerPermissions = [...ROLE_PERMISSIONS[ROLE_CODES.OWNER]];
  const storeRef = firestore.collection(collections.stores).doc();
  const storeId = storeRef.id;
  const slug = await uniqueStoreSlug(input.storeName);
  const now = FieldValue.serverTimestamp();
  const employeeId = newId(collections.employees);
  const employeeCode = await nextDocumentNumber(storeId, "employee", "EMP");

  const batch = firestore.batch();
  batch.set(storeRef, {
    id: storeId,
    name: input.storeName,
    slug,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(firestore.collection(collections.users).doc(input.userId), {
    id: input.userId,
    storeId,
    roleId: ownerRole.id,
    roleCode: ROLE_CODES.OWNER,
    roleName: ROLE_META.OWNER.name,
    name: input.name,
    email: input.email,
    username: input.username,
    phone: input.phone,
    permissions: ownerPermissions,
    isActive: true,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(firestore.collection(collections.employees).doc(employeeId), {
    id: employeeId,
    storeId,
    userId: input.userId,
    employeeCode,
    phone: input.phone,
    jobTitle: "Owner",
    hireDate: now,
    salary: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  for (const code of ownerPermissions) {
    batch.set(firestore.collection("userPermissions").doc(`${input.userId}_${code}`), {
      userId: input.userId,
      permissionId: code,
      permissionCode: code,
    });
  }
  batch.set(firestore.collection(collections.settings).doc(`${storeId}_receipt_footer`), {
    id: `${storeId}_receipt_footer`,
    storeId,
    key: "receipt_footer",
    value: `Thank you for shopping at ${input.storeName}.`,
  });
  for (const unit of [
    { name: "Piece", abbreviation: "pcs" },
    { name: "Kilogram", abbreviation: "kg" },
    { name: "Litre", abbreviation: "L" },
  ]) {
    const unitId = newId(collections.units);
    batch.set(firestore.collection(collections.units).doc(unitId), {
      id: unitId,
      storeId,
      ...unit,
    });
  }
  for (const name of ["Rent", "Utilities", "Transport"]) {
    const categoryId = newId(collections.expenseCategories);
    batch.set(firestore.collection(collections.expenseCategories).doc(categoryId), {
      id: categoryId,
      storeId,
      name,
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    await rollbackSignup(input.userId, storeId);
    throw error;
  }

  return storeId;
}

export async function signup(
  _prevState: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState> {
  let storeId: string | undefined;
  let userId: string | undefined;

  try {
    const parsed = SignupSchema.safeParse({
      storeName: formData.get("storeName"),
      name: formData.get("name"),
      email: formData.get("email"),
      username: formData.get("username"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Enter valid signup details.",
      };
    }

    const { ipAddress } = await getRequestContext();
    const allowed = consumeLoginAttempt(`${ipAddress}:signup:${parsed.data.email}`);
    if (!allowed) {
      return { error: "Too many signup attempts. Try again in 15 minutes." };
    }

    const email = parsed.data.email.toLowerCase().trim();
    const username = parsed.data.username.toLowerCase().trim();
    if (await findUserByEmail(email)) {
      return { error: "That email is already in use." };
    }
    if (await findUserByUsername(username)) {
      return { error: "That username is already in use." };
    }

    let authUser;
    try {
      authUser = await adminAuth.createUser({
        email,
        password: parsed.data.password,
        displayName: parsed.data.name,
        disabled: false,
      });
    } catch (error) {
      return { error: mapAdminAuthError(error) ?? publicAuthError(error) };
    }
    userId = authUser.uid;

    storeId = await provisionOwnerAccount({
      userId,
      email,
      name: parsed.data.name,
      username,
      phone: parsed.data.phone?.trim() || null,
      storeName: parsed.data.storeName,
    });

    await createSession(userId);
    await writeAuditLog({
      action: "SIGNUP",
      entity: "User",
      entityId: userId,
      userId,
      storeId,
      metadata: { email, username, provider: "password" },
    });
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    console.error("Signup failed", error);
    await rollbackSignup(userId, storeId).catch((rollbackError) => {
      console.error("Signup rollback failed", rollbackError);
    });
    return { error: publicAuthError(error) };
  }

  redirect("/dashboard");
}

export async function signupWithGoogle(
  _prevState: LoginFormState | undefined,
  formData: FormData,
): Promise<LoginFormState> {
  let storeId: string | undefined;
  let userId: string | undefined;

  try {
    const parsed = GoogleSignupSchema.safeParse({
      idToken: formData.get("idToken"),
      storeName: formData.get("storeName"),
      name: formData.get("name"),
      username: formData.get("username"),
      phone: formData.get("phone"),
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Enter store name and username, then continue with Google.",
      };
    }

    const decoded = await adminAuth.verifyIdToken(parsed.data.idToken);
    const email = decoded.email?.toLowerCase().trim();
    if (!email) {
      return { error: "Google did not provide an email address for this account." };
    }

    const { ipAddress } = await getRequestContext();
    const allowed = consumeLoginAttempt(`${ipAddress}:signup:${email}`);
    if (!allowed) {
      return { error: "Too many signup attempts. Try again in 15 minutes." };
    }

    userId = decoded.uid;
    const username = parsed.data.username.toLowerCase().trim();
    const existingProfile = await getUser(userId);
    if (existingProfile) {
      return { error: "This Google account already has a store. Sign in instead." };
    }
    if (await findUserByEmail(email)) {
      return { error: "That email is already in use. Sign in with email and password." };
    }
    if (await findUserByUsername(username)) {
      return { error: "That username is already in use." };
    }

    const name =
      parsed.data.name?.trim() ||
      decoded.name ||
      email.split("@")[0] ||
      "Owner";

    storeId = await provisionOwnerAccount({
      userId,
      email,
      name,
      username,
      phone: parsed.data.phone?.trim() || null,
      storeName: parsed.data.storeName,
    });

    await createSession(userId);
    await writeAuditLog({
      action: "SIGNUP",
      entity: "User",
      entityId: userId,
      userId,
      storeId,
      metadata: { email, username, provider: "google" },
    });
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    console.error("Google signup failed", error);
    await rollbackSignup(userId, storeId).catch((rollbackError) => {
      console.error("Google signup rollback failed", rollbackError);
    });
    return { error: publicAuthError(error) };
  }

  redirect("/dashboard");
}
