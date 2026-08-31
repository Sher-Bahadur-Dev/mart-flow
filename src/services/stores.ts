import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, type DocumentData } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asBoolean, asDate, asString } from "@/lib/firebase/mapper";
import type { Store } from "@/types";

export const DEFAULT_STORE_ID = "store_main";

export function hydrateStore(id: string, data: DocumentData): Store {
  return {
    id,
    name: asString(data.name, asString(data.storeName, "Store")),
    isActive: asBoolean(data.isActive, data.status !== "INACTIVE"),
    address: typeof data.address === "string" ? data.address : null,
    phone: typeof data.phone === "string" ? data.phone : null,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listStores() {
  const snap = await getDocs(collection(requireDb(), COLLECTIONS.stores));
  return snap.docs
    .map((item) => hydrateStore(item.id, item.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStore(id: string) {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.stores, id));
  if (!snap.exists()) {
    return null;
  }
  return hydrateStore(snap.id, snap.data());
}

export async function ensureDefaultStore() {
  const existing = await getStore(DEFAULT_STORE_ID);
  if (existing) {
    return existing;
  }

  const settings = await getDoc(doc(requireDb(), COLLECTIONS.settings, "store"));
  const data = settings.data() ?? {};
  const payload = {
    id: DEFAULT_STORE_ID,
    name: asString(data.storeName, "MartFlow Demo Mart"),
    isActive: true,
    address: typeof data.address === "string" ? data.address : null,
    phone: typeof data.phone === "string" ? data.phone : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(requireDb(), COLLECTIONS.stores, DEFAULT_STORE_ID), payload);
  return getStore(DEFAULT_STORE_ID);
}
