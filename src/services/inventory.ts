import { collection, getDocs, limit, orderBy, query, type DocumentData } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asNumber, asString } from "@/lib/firebase/mapper";
import type { InventoryTransaction, InventoryTransactionType } from "@/types";

function hydrateTransaction(id: string, data: DocumentData): InventoryTransaction {
  return {
    id,
    productId: asString(data.productId),
    type: (asString(data.type, "ADJUSTMENT") || "ADJUSTMENT") as InventoryTransactionType,
    quantity: asNumber(data.quantity),
    previousStock: asNumber(data.previousStock),
    newStock: asNumber(data.newStock),
    reason: typeof data.reason === "string" ? data.reason : null,
    referenceId: typeof data.referenceId === "string" ? data.referenceId : null,
    userId: asString(data.userId),
    createdAt: asDate(data.createdAt),
  };
}

export async function listInventoryTransactions(): Promise<InventoryTransaction[]> {
  const snap = await getDocs(
    query(collection(requireDb(), COLLECTIONS.inventoryTransactions), orderBy("createdAt", "desc"), limit(50)),
  );
  return snap.docs.map((item) => hydrateTransaction(item.id, item.data()));
}
