import { collection, doc, getDoc, getDocs, type DocumentData } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asString } from "@/lib/firebase/mapper";
import { listProducts } from "@/services/products";
import { listPurchases } from "@/services/purchases";
import type { Supplier } from "@/types";

export function hydrateSupplier(id: string, data: DocumentData): Supplier {
  return {
    id,
    name: asString(data.name),
    company: typeof data.company === "string" ? data.company : null,
    phone: typeof data.phone === "string" ? data.phone : null,
    email: typeof data.email === "string" ? data.email : null,
    address: typeof data.address === "string" ? data.address : null,
    taxNumber: typeof data.taxNumber === "string" ? data.taxNumber : null,
    notes: typeof data.notes === "string" ? data.notes : null,
    status: data.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listSuppliers() {
  const snap = await getDocs(collection(requireDb(), COLLECTIONS.suppliers));
  return snap.docs
    .map((item) => hydrateSupplier(item.id, item.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSupplier(id: string) {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.suppliers, id));
  if (!snap.exists()) {
    return null;
  }
  return hydrateSupplier(snap.id, snap.data());
}

export async function getSupplierDetail(id: string) {
  const supplier = await getSupplier(id);
  if (!supplier) {
    return null;
  }
  const [products, purchases] = await Promise.all([listProducts(), listPurchases()]);
  const supplied = products.filter((product) => product.supplierId === id);
  const history = purchases.filter((purchase) => purchase.supplierId === id);
  const outstanding = history
    .filter((purchase) => purchase.status !== "CANCELLED")
    .reduce((sum, purchase) => sum + purchase.outstanding, 0);
  return { supplier, products: supplied, purchases: history, outstanding };
}
