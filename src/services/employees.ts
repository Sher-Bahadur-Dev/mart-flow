import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";

import { getStaffProvisioningAuth } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireClientAuth, requireDb } from "@/lib/firebase/db";
import { asBoolean, asDate, asNumber, asString } from "@/lib/firebase/mapper";
import { isOwnerRole, type Permission, type Role } from "@/lib/permissions";
import { mapAuthError } from "@/lib/auth/errors";
import type { Employee, UserStatus } from "@/types";

import { writeAuditLog } from "@/services/audit";
import { createUserProfile, updateUserProfile } from "@/services/users";
import { listOwnerDocs, ownerStoreId, requireOwnerId } from "@/lib/tenant";

function statusFromActive(isActive: boolean): UserStatus {
  return isActive ? "ACTIVE" : "INACTIVE";
}

function isActiveFromRecord(data: DocumentData): boolean {
  if (asBoolean(data.removed)) {
    return false;
  }
  if (typeof data.isActive === "boolean") {
    return data.isActive;
  }
  return asString(data.status, "ACTIVE") === "ACTIVE";
}

export function hydrateEmployee(id: string, data: DocumentData): Employee {
  const isActive = isActiveFromRecord(data);
  const hireDate = asDate(data.hireDate ?? data.joiningDate ?? data.createdAt);
  return {
    id,
    name: asString(data.name),
    phone: typeof data.phone === "string" ? data.phone : null,
    email: asString(data.email).toLowerCase(),
    role: (asString(data.role, "CASHIER") || "CASHIER") as Role,
    status: isActive ? "ACTIVE" : ((asString(data.status, "INACTIVE") as UserStatus) || "INACTIVE"),
    joiningDate: hireDate,
    userId: typeof data.userId === "string" ? data.userId : null,
    photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : null,
    employeeCode: asString(data.employeeCode),
    jobTitle: asString(data.jobTitle),
    salary: typeof data.salary === "number" ? data.salary : data.salary == null ? null : asNumber(data.salary, 0),
    storeId: typeof data.storeId === "string" && data.storeId ? data.storeId : null,
    hireDate,
    isActive,
    removed: asBoolean(data.removed),
    address: typeof data.address === "string" ? data.address : null,
    emergencyContact: typeof data.emergencyContact === "string" ? data.emergencyContact : null,
    ownerId: asString(data.ownerId),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listEmployees() {
  const docs = await listOwnerDocs(COLLECTIONS.employees);
  return docs.map((item) => hydrateEmployee(item.id, item.data())).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEmployee(id: string) {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.employees, id));
  if (!snap.exists() || asString(snap.data().ownerId) !== requireOwnerId()) {
    return null;
  }
  return hydrateEmployee(snap.id, snap.data());
}

export async function findEmployeeByEmail(email: string, excludeId?: string) {
  const normalized = email.toLowerCase();
  const employees = await listEmployees();
  return employees.find((item) => item.email === normalized && item.id !== excludeId) ?? null;
}

export async function findEmployeeByCode(employeeCode: string, excludeId?: string) {
  const code = employeeCode.trim();
  const employees = await listEmployees();
  return employees.find((item) => item.employeeCode === code && item.id !== excludeId) ?? null;
}

type EmployeeWriteInput = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  userId: string | null;
  status?: UserStatus;
  isActive?: boolean;
  joiningDate?: Date;
  hireDate?: Date;
  employeeCode?: string;
  jobTitle?: string;
  salary?: number | null;
  storeId?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  ownerId?: string;
};

function employeePayload(input: EmployeeWriteInput) {
  const isActive = input.isActive ?? (input.status !== "INACTIVE" && input.status !== "SUSPENDED");
  const hireDate = input.hireDate ?? input.joiningDate;
  return {
    id: input.id,
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone ?? null,
    role: input.role,
    status: input.status ?? statusFromActive(isActive),
    isActive,
    removed: false,
    joiningDate: hireDate ?? serverTimestamp(),
    hireDate: hireDate ?? serverTimestamp(),
    userId: input.userId,
    employeeCode: input.employeeCode?.trim() ?? "",
    jobTitle: input.jobTitle?.trim() ?? "",
    salary: input.salary ?? null,
    storeId: input.storeId ?? null,
    address: input.address?.trim() || null,
    emergencyContact: input.emergencyContact?.trim() || null,
    ownerId: input.ownerId ?? requireOwnerId(),
    updatedAt: serverTimestamp(),
  };
}

export async function writeEmployeeRecord(input: EmployeeWriteInput) {
  const ref = doc(requireDb(), COLLECTIONS.employees, input.id);
  const existing = await getDoc(ref);
  const payload = employeePayload(input);
  if (existing.exists()) {
    await setDoc(ref, payload, { merge: true });
  } else {
    await setDoc(ref, { ...payload, photoUrl: null, createdAt: serverTimestamp() });
  }
  return getEmployee(input.id);
}

function randomPassword() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `Mf!${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("").slice(0, 16)}`;
}

export type EmployeeProfileInput = {
  name: string;
  email: string;
  phone: string;
  role: Role;
  employeeCode: string;
  jobTitle: string;
  storeId: string;
  hireDate: Date;
  salary?: number | null;
  isActive?: boolean;
  address?: string | null;
  emergencyContact?: string | null;
  password?: string;
};

export async function createEmployeeAccount(input: EmployeeProfileInput & { actorId?: string }) {
  const email = input.email.trim().toLowerCase();
  const code = input.employeeCode.trim();

  if (await findEmployeeByEmail(email)) {
    throw new Error("An employee with that email already exists.");
  }
  if (await findEmployeeByCode(code)) {
    throw new Error("That employee code is already in use.");
  }

  const provisioning = getStaffProvisioningAuth();
  const password = input.password?.trim() || randomPassword();
  const isActive = input.isActive ?? true;

  try {
    const credential = await createUserWithEmailAndPassword(provisioning, email, password);
    await updateProfile(credential.user, { displayName: input.name });
    const uid = credential.user.uid;

    try {
      await writeEmployeeRecord({
        id: uid,
        name: input.name,
        email,
        role: input.role,
        phone: input.phone,
        userId: uid,
        status: statusFromActive(isActive),
        isActive,
        hireDate: input.hireDate,
        joiningDate: input.hireDate,
        employeeCode: code,
        jobTitle: input.jobTitle,
        salary: input.salary ?? null,
        storeId: input.storeId || ownerStoreId(),
        address: input.address,
        emergencyContact: input.emergencyContact,
        ownerId: requireOwnerId(),
      });
      await createUserProfile({
        id: uid,
        name: input.name,
        email,
        role: input.role,
        phone: input.phone,
        employeeId: uid,
        ownerId: requireOwnerId(),
        status: statusFromActive(isActive),
      });
      await signOut(provisioning);

      if (!input.password) {
        try {
          await sendPasswordResetEmail(requireClientAuth(), email);
        } catch {
          // Profile exists; managers can resend from the employee list.
        }
      }

      if (input.actorId) {
        await writeAuditLog({
          action: "employee.created",
          userId: input.actorId,
          entity: "employees",
          entityId: uid,
          details: { employeeCode: code, role: input.role, storeId: input.storeId },
        });
      }

      return getEmployee(uid);
    } catch (error) {
      try {
        await credential.user.delete();
      } catch {
        await signOut(provisioning);
      }
      throw error;
    }
  } catch (error) {
    try {
      await signOut(provisioning);
    } catch {
      // The provisioning session is best-effort cleanup.
    }
    throw new Error(error instanceof Error && !("code" in error) ? error.message : mapAuthError(error));
  }
}

export async function updateEmployeeRecord(
  id: string,
  input: {
    name: string;
    email: string;
    phone: string;
    role: Role;
    employeeCode: string;
    jobTitle: string;
    storeId: string;
    hireDate: Date;
    salary?: number | null;
    isActive: boolean;
    address?: string | null;
    emergencyContact?: string | null;
    permissions?: Permission[];
    actorId?: string;
  },
) {
  const current = await getEmployee(id);
  if (!current) {
    throw new Error("Employee not found.");
  }
  if (isOwnerRole(current.role) && input.role !== current.role) {
    throw new Error("The owner account cannot be reassigned to another role.");
  }
  if (isOwnerRole(current.role) && !input.isActive) {
    throw new Error("The owner account cannot be deactivated.");
  }

  const email = input.email.trim().toLowerCase();
  const code = input.employeeCode.trim();
  if (await findEmployeeByEmail(email, id)) {
    throw new Error("An employee with that email already exists.");
  }
  if (await findEmployeeByCode(code, id)) {
    throw new Error("That employee code is already in use.");
  }

  const status = statusFromActive(input.isActive);
  await updateDoc(doc(requireDb(), COLLECTIONS.employees, id), {
    name: input.name,
    email,
    phone: input.phone,
    role: isOwnerRole(current.role) ? current.role : input.role,
    employeeCode: code,
    jobTitle: input.jobTitle,
    storeId: input.storeId,
    hireDate: input.hireDate,
    joiningDate: input.hireDate,
    salary: input.salary ?? null,
    isActive: input.isActive,
    status,
    removed: input.isActive ? false : current.removed,
    address: input.address?.trim() || null,
    emergencyContact: input.emergencyContact?.trim() || null,
    updatedAt: serverTimestamp(),
  });

  if (current.userId) {
    await updateUserProfile(current.userId, {
      name: input.name,
      email,
      phone: input.phone,
      role: isOwnerRole(current.role) ? current.role : input.role,
      status,
      permissions: input.permissions,
    });
  }

  if (input.actorId) {
    await writeAuditLog({
      action: "employee.updated",
      userId: input.actorId,
      entity: "employees",
      entityId: id,
      details: { employeeCode: code, role: input.role, storeId: input.storeId },
    });
  }

  return getEmployee(id);
}

export async function setEmployeeActive(id: string, isActive: boolean, actorId: string) {
  const current = await getEmployee(id);
  if (!current) {
    throw new Error("Employee not found.");
  }
  if (isOwnerRole(current.role) && !isActive) {
    throw new Error("The owner account cannot be deactivated.");
  }
  if (current.userId === actorId && !isActive) {
    throw new Error("You cannot deactivate your own account.");
  }

  const status = statusFromActive(isActive);
  await updateDoc(doc(requireDb(), COLLECTIONS.employees, id), {
    isActive,
    status,
    removed: isActive ? false : current.removed,
    updatedAt: serverTimestamp(),
  });
  if (current.userId) {
    await updateUserProfile(current.userId, { status });
  }
  await writeAuditLog({
    action: isActive ? "employee.activated" : "employee.deactivated",
    userId: actorId,
    entity: "employees",
    entityId: id,
    details: { employeeCode: current.employeeCode || null },
  });
  return getEmployee(id);
}

export async function deleteEmployeeRecord(id: string, actorId: string) {
  const current = await getEmployee(id);
  if (!current) {
    throw new Error("Employee not found.");
  }
  if (isOwnerRole(current.role)) {
    throw new Error("The owner account cannot be removed.");
  }
  if (current.userId === actorId) {
    throw new Error("You cannot remove your own account.");
  }

  await updateDoc(doc(requireDb(), COLLECTIONS.employees, id), {
    isActive: false,
    status: "INACTIVE",
    removed: true,
    removedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (current.userId) {
    await updateUserProfile(current.userId, { status: "INACTIVE" });
  }
  await writeAuditLog({
    action: "employee.removed",
    userId: actorId,
    entity: "employees",
    entityId: id,
    details: { employeeCode: current.employeeCode || null, keepHistory: true },
  });
}

export async function sendEmployeePasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(requireClientAuth(), email.trim().toLowerCase());
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function getEmployeeDashboardCounts() {
  const employees = await listEmployees();
  return {
    total: employees.length,
    active: employees.filter((item) => item.isActive).length,
    inactive: employees.filter((item) => !item.isActive).length,
    managers: employees.filter((item) => item.role === "MANAGER" || item.role === "ADMIN").length,
  };
}
