import { doc, getDoc, serverTimestamp, setDoc, type DocumentData } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asBoolean, asDate, asString } from "@/lib/firebase/mapper";
import { listOwnerDocs, ownerStoreId, requireOwnerId, withOwner } from "@/lib/tenant";
import type { Store } from "@/types";

export function hydrateStore(id: string, data: DocumentData): Store {
  return {
    id,
    name: asString(data.name, asString(data.storeName, "Store")),
    isActive: asBoolean(data.isActive, data.status !== "INACTIVE"),
    address: typeof data.address === "string" ? data.address : null,
    phone: typeof data.phone === "string" ? data.phone : null,
    ownerId: asString(data.ownerId),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listStores() {
  const docs = await listOwnerDocs(COLLECTIONS.stores);
  return docs.map((item) => hydrateStore(item.id, item.data())).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStore(id: string) {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.stores, id));
  if (!snap.exists() || snap.data().ownerId !== requireOwnerId()) {
    return null;
  }
  return hydrateStore(snap.id, snap.data());
}

export async function createOwnerStore(input: {
  ownerId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}) {
  const id = ownerStoreId(input.ownerId);
  const existing = await getDoc(doc(requireDb(), COLLECTIONS.stores, id));
  if (existing.exists()) {
    return hydrateStore(existing.id, existing.data());
  }
  const payload = withOwner(
    {
      id,
      name: input.name,
      isActive: true,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    input.ownerId,
  );
  await setDoc(doc(requireDb(), COLLECTIONS.stores, id), payload);
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.stores, id));
  return hydrateStore(snap.id, snap.data() ?? payload);
}

export async function ensureDefaultStore() {
  const ownerId = requireOwnerId();
  const id = ownerStoreId(ownerId);
  const existing = await getStore(id);
  if (existing) {
    return existing;
  }
  return createOwnerStore({ ownerId, name: "My Store" });
}

export const DEFAULT_STORE_ID = "store_main";
