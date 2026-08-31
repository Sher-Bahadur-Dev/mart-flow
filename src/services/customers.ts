import { collection, doc, getDoc, getDocs, type DocumentData } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asNumber, asString } from "@/lib/firebase/mapper";
import { listOwnerDocs, requireOwnerId } from "@/lib/tenant";
import type { Customer } from "@/types";

function hydrateCustomer(id: string, data: DocumentData): Customer {
  return {
    id,
    name: asString(data.name),
    phone: typeof data.phone === "string" ? data.phone : null,
    email: typeof data.email === "string" ? data.email : null,
    address: typeof data.address === "string" ? data.address : null,
    customerType: data.customerType === "REGISTERED_CUSTOMER" ? "REGISTERED_CUSTOMER" : "WALK_IN_CUSTOMER",
    balance: asNumber(data.balance),
    status: data.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listCustomers(): Promise<Customer[]> {
  const docs = await listOwnerDocs(COLLECTIONS.customers);
  return docs.map((item) => hydrateCustomer(item.id, item.data())).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCustomer(id: string) {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.customers, id));
  if (!snap.exists() || snap.data().ownerId !== requireOwnerId()) {
    return null;
  }
  return hydrateCustomer(snap.id, snap.data());
}
