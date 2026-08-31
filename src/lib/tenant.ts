import { collection, getDocs, query, where, type QueryDocumentSnapshot } from "firebase/firestore";

import { COLLECTIONS, type CollectionName } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { isOwnerRole } from "@/lib/permissions";
import type { UserProfile } from "@/types";

let activeOwnerId: string | null = null;

export function ownerIdFromProfile(profile: Pick<UserProfile, "id" | "role" | "ownerId"> | null | undefined) {
  if (!profile) {
    return null;
  }
  if (profile.ownerId) {
    return profile.ownerId;
  }
  if (isOwnerRole(profile.role)) {
    return profile.id;
  }
  return null;
}

export function setActiveOwnerId(ownerId: string | null) {
  activeOwnerId = ownerId;
}

export function getActiveOwnerId() {
  return activeOwnerId;
}

export function requireOwnerId() {
  if (!activeOwnerId) {
    throw new Error("No store is linked to this account.");
  }
  return activeOwnerId;
}

export function ownerStoreId(ownerId = requireOwnerId()) {
  return `store_${ownerId}`;
}

export function ownerSettingsId(ownerId = requireOwnerId()) {
  return ownerId;
}

export function ownerDemoSettingsId(ownerId = requireOwnerId()) {
  return `demo_${ownerId}`;
}

export function ownerRoleDocId(role: string, ownerId = requireOwnerId()) {
  return `${ownerId}_${role}`;
}

export function walkInCustomerId(ownerId = requireOwnerId()) {
  return `walkin_${ownerId}`;
}

export function tenantRecordId(baseId: string, ownerId = requireOwnerId()) {
  return `${ownerId}_${baseId}`;
}

export function withOwner<T extends Record<string, unknown>>(payload: T, ownerId = requireOwnerId()) {
  return { ...payload, ownerId };
}

export async function listOwnerDocs(collectionName: CollectionName): Promise<QueryDocumentSnapshot[]> {
  const ownerId = requireOwnerId();
  const snap = await getDocs(
    query(collection(requireDb(), collectionName), where("ownerId", "==", ownerId)),
  );
  return snap.docs;
}

export function isOwnerDocument(data: { ownerId?: unknown } | undefined, ownerId = getActiveOwnerId()) {
  return Boolean(ownerId && data && data.ownerId === ownerId);
}

export { COLLECTIONS };
