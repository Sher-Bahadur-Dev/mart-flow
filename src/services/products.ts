import { doc, getDoc, type DocumentData } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asNumber, asString } from "@/lib/firebase/mapper";
import { listOwnerDocs, requireOwnerId } from "@/lib/tenant";
import type { Product } from "@/types";

export function hydrateProduct(id: string, data: DocumentData): Product {
  return {
    id,
    name: asString(data.name),
    sku: asString(data.sku),
    barcode: typeof data.barcode === "string" ? data.barcode : null,
    categoryId: typeof data.categoryId === "string" ? data.categoryId : null,
    brand: typeof data.brand === "string" ? data.brand : null,
    unit: asString(data.unit, "pcs"),
    purchasePrice: asNumber(data.purchasePrice),
    sellingPrice: asNumber(data.sellingPrice),
    tax: asNumber(data.tax),
    discount: asNumber(data.discount),
    currentStock: asNumber(data.currentStock),
    minimumStock: asNumber(data.minimumStock),
    maximumStock: typeof data.maximumStock === "number" ? data.maximumStock : null,
    supplierId: typeof data.supplierId === "string" ? data.supplierId : null,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
    description: typeof data.description === "string" ? data.description : null,
    status: data.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    createdBy: asString(data.createdBy),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listProducts(): Promise<Product[]> {
  const docs = await listOwnerDocs(COLLECTIONS.products);
  return docs.map((item) => hydrateProduct(item.id, item.data())).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProduct(id: string) {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.products, id));
  if (!snap.exists() || snap.data().ownerId !== requireOwnerId()) {
    return null;
  }
  return hydrateProduct(snap.id, snap.data());
}
