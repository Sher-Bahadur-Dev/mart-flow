import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asNumber, asString } from "@/lib/firebase/mapper";
import { listOwnerDocs, requireOwnerId } from "@/lib/tenant";
import { getStoreSettings } from "@/services/settings";
import type { Purchase, PurchaseItem, PurchaseStatus } from "@/types";

function hydrateItems(value: unknown): PurchaseItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item: DocumentData) => ({
    productId: asString(item.productId),
    name: asString(item.name),
    sku: asString(item.sku),
    quantity: asNumber(item.quantity),
    unitPrice: asNumber(item.unitPrice ?? item.purchasePrice),
    discount: asNumber(item.discount),
    tax: asNumber(item.tax),
    lineTotal: asNumber(item.lineTotal),
    receivedQuantity: asNumber(item.receivedQuantity),
  }));
}

export function hydratePurchase(id: string, data: DocumentData): Purchase {
  const items = hydrateItems(data.items);
  const total = asNumber(data.total);
  const amountPaid = asNumber(data.amountPaid);
  return {
    id,
    orderNumber: asString(data.orderNumber, id),
    supplierId: asString(data.supplierId),
    status: (asString(data.status, "ORDERED") as PurchaseStatus) || "ORDERED",
    items,
    subtotal: asNumber(data.subtotal),
    tax: asNumber(data.tax),
    total,
    amountPaid,
    outstanding: asNumber(data.outstanding, Math.max(0, total - amountPaid)),
    notes: typeof data.notes === "string" ? data.notes : null,
    createdBy: asString(data.createdBy),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export const PURCHASE_STATUS_LABEL: Record<PurchaseStatus, string> = {
  DRAFT: "Draft",
  ORDERED: "Pending",
  PARTIALLY_RECEIVED: "Partial",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export async function listPurchases(): Promise<Purchase[]> {
  const docs = await listOwnerDocs(COLLECTIONS.purchases);
  return docs
    .map((item) => hydratePurchase(item.id, item.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPurchase(id: string) {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.purchases, id));
  if (!snap.exists() || snap.data().ownerId !== requireOwnerId()) {
    return null;
  }
  return hydratePurchase(snap.id, snap.data());
}

export async function createPurchaseOrder(input: {
  supplierId: string;
  createdBy: string;
  items: Array<{ productId: string; name: string; sku: string; quantity: number; unitPrice: number }>;
  notes?: string | null;
}) {
  if (!input.supplierId) {
    throw new Error("Select a supplier.");
  }
  if (input.items.length === 0) {
    throw new Error("Add at least one product.");
  }
  const settings = await getStoreSettings();
  const db = requireDb();
  const ref = doc(collection(db, COLLECTIONS.purchases));
  const items: PurchaseItem[] = input.items.map((item) => ({
    ...item,
    discount: 0,
    tax: 0,
    lineTotal: item.unitPrice * item.quantity,
    receivedQuantity: 0,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const status: PurchaseStatus = settings.purchaseRequireApproval ? "DRAFT" : "ORDERED";
  await runTransaction(db, async (transaction) => {
    transaction.set(ref, {
      id: ref.id,
      ownerId: requireOwnerId(),
      orderNumber: `PO-${ref.id.slice(-6).toUpperCase()}`,
      supplierId: input.supplierId,
      status,
      items,
      subtotal,
      tax: 0,
      total: subtotal,
      amountPaid: 0,
      outstanding: subtotal,
      notes: input.notes ?? null,
      createdBy: input.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  return getPurchase(ref.id);
}

export async function approvePurchase(id: string) {
  const current = await getPurchase(id);
  if (!current) {
    throw new Error("Purchase order not found.");
  }
  if (current.status !== "DRAFT") {
    throw new Error("Only draft purchase orders can be approved.");
  }
  await updateDoc(doc(requireDb(), COLLECTIONS.purchases, id), {
    status: "ORDERED",
    updatedAt: serverTimestamp(),
  });
  return getPurchase(id);
}

export async function receivePurchase(id: string, receipts: Record<string, number>, userId: string) {
  const db = requireDb();
  const purchaseRef = doc(db, COLLECTIONS.purchases, id);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(purchaseRef);
    if (!snap.exists()) {
      throw new Error("Purchase order not found.");
    }
    const current = hydratePurchase(snap.id, snap.data());
    if (current.status === "DRAFT") {
      throw new Error("Approve this purchase order before receiving stock.");
    }
    if (current.status === "CANCELLED" || current.status === "RECEIVED") {
      throw new Error("This order cannot be received.");
    }
    const items = current.items.map((item) => {
      const incoming = Math.max(0, receipts[item.productId] ?? 0);
      const receivedQuantity = Math.min(item.quantity, item.receivedQuantity + incoming);
      return { ...item, receivedQuantity, added: receivedQuantity - item.receivedQuantity };
    });
    for (const item of items) {
      if (item.added < 1) {
        continue;
      }
      const productRef = doc(db, COLLECTIONS.products, item.productId);
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) {
        continue;
      }
      const previousStock = asNumber(productSnap.data().currentStock);
      const newStock = previousStock + item.added;
      transaction.update(productRef, { currentStock: newStock, updatedAt: serverTimestamp() });
      const txRef = doc(collection(db, COLLECTIONS.inventoryTransactions));
      transaction.set(txRef, {
        id: txRef.id,
        ownerId: requireOwnerId(),
        productId: item.productId,
        type: "PURCHASE",
        quantity: item.added,
        previousStock,
        newStock,
        reason: `Receive ${current.orderNumber}`,
        referenceId: current.id,
        userId,
        createdAt: serverTimestamp(),
      });
    }
    const fully = items.every((item) => item.receivedQuantity >= item.quantity);
    const any = items.some((item) => item.receivedQuantity > 0);
    const status: PurchaseStatus = fully ? "RECEIVED" : any ? "PARTIALLY_RECEIVED" : "ORDERED";
    const amountPaid = fully ? current.total : current.amountPaid;
    transaction.update(purchaseRef, {
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        lineTotal: item.lineTotal,
        receivedQuantity: item.receivedQuantity,
      })),
      status,
      amountPaid,
      outstanding: Math.max(0, current.total - amountPaid),
      updatedAt: serverTimestamp(),
    });
  });
  return getPurchase(id);
}

export async function cancelPurchase(id: string) {
  const current = await getPurchase(id);
  if (!current) {
    throw new Error("Purchase order not found.");
  }
  if (current.status === "RECEIVED") {
    throw new Error("Received orders cannot be cancelled.");
  }
  await updateDoc(doc(requireDb(), COLLECTIONS.purchases, id), {
    status: "CANCELLED",
    updatedAt: serverTimestamp(),
  });
  return getPurchase(id);
}
