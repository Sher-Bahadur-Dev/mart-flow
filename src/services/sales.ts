import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asNumber, asString } from "@/lib/firebase/mapper";
import { getStoreSettings } from "@/services/settings";
import type { PaymentMethod, Sale, SaleItem, SaleStatus } from "@/types";

export function hydrateSale(id: string, data: DocumentData): Sale {
  const items = Array.isArray(data.items)
    ? data.items.map((item: DocumentData) => ({
        productId: asString(item.productId),
        name: asString(item.name),
        sku: asString(item.sku),
        quantity: asNumber(item.quantity),
        unitPrice: asNumber(item.unitPrice),
        discount: asNumber(item.discount),
        tax: asNumber(item.tax),
        lineTotal: asNumber(item.lineTotal),
      }))
    : [];

  return {
    id,
    invoiceNumber: asString(data.invoiceNumber, id),
    customerId: typeof data.customerId === "string" ? data.customerId : null,
    cashierId: asString(data.cashierId),
    items,
    subtotal: asNumber(data.subtotal),
    discount: asNumber(data.discount),
    tax: asNumber(data.tax),
    total: asNumber(data.total),
    paymentMethod: (asString(data.paymentMethod, "CASH") as PaymentMethod) || "CASH",
    amountPaid: asNumber(data.amountPaid),
    change: asNumber(data.change),
    status: (asString(data.status, "COMPLETED") as SaleStatus) || "COMPLETED",
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listSales(): Promise<Sale[]> {
  const snap = await getDocs(collection(requireDb(), COLLECTIONS.sales));
  return snap.docs
    .map((item) => hydrateSale(item.id, item.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getSale(id: string) {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.sales, id));
  if (!snap.exists()) {
    return null;
  }
  return hydrateSale(snap.id, snap.data());
}

export type PosCartLine = {
  productId: string;
  quantity: number;
};

export async function createPosSale(input: {
  cashierId: string;
  customerId?: string | null;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  lines: PosCartLine[];
}) {
  if (input.lines.length === 0) {
    throw new Error("Add at least one product to the cart.");
  }

  const db = requireDb();
  const settings = await getStoreSettings();
  if (!settings.posEnabled) {
    throw new Error("POS is disabled in Settings.");
  }
  const saleRef = doc(collection(db, COLLECTIONS.sales));

  await runTransaction(db, async (transaction) => {
    const products = [];
    for (const line of input.lines) {
      const productRef = doc(db, COLLECTIONS.products, line.productId);
      const snap = await transaction.get(productRef);
      if (!snap.exists()) {
        throw new Error("A product in the cart is no longer available.");
      }
      const data = snap.data();
      const stock = asNumber(data.currentStock);
      if (line.quantity < 1) {
        throw new Error("Quantity must be at least 1.");
      }
      if (stock < line.quantity && !settings.allowNegativeStock) {
        throw new Error(`${asString(data.name, "Product")} does not have enough stock.`);
      }
      products.push({
        ref: productRef,
        id: snap.id,
        data,
        quantity: line.quantity,
        previousStock: stock,
        newStock: stock - line.quantity,
      });
    }

    const rate = settings.taxEnabled ? settings.tax / 100 : 0;
    const items: SaleItem[] = products.map((product) => {
      const unitPrice = asNumber(product.data.sellingPrice);
      const quantity = product.quantity;
      const discount = 0;
      const lineNet = unitPrice * quantity - discount;
      const tax = settings.taxInclusive && rate > 0 ? lineNet - lineNet / (1 + rate) : lineNet * rate;
      return {
        productId: product.id,
        name: asString(product.data.name),
        sku: asString(product.data.sku),
        quantity,
        unitPrice,
        discount,
        tax,
        lineTotal: settings.taxInclusive ? lineNet : lineNet + tax,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const discount = 0;
    const tax = items.reduce((sum, item) => sum + item.tax, 0);
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
    if (input.amountPaid < total) {
      throw new Error("Amount paid is less than the sale total.");
    }

    const invoiceNumber = `${settings.invoicePrefix || "MF"}-${saleRef.id.slice(-6).toUpperCase()}`;
    const now = serverTimestamp();

    for (const product of products) {
      transaction.update(product.ref, {
        currentStock: product.newStock,
        updatedAt: now,
      });
      const txRef = doc(collection(db, COLLECTIONS.inventoryTransactions));
      transaction.set(txRef, {
        id: txRef.id,
        productId: product.id,
        type: "SALE",
        quantity: product.quantity,
        previousStock: product.previousStock,
        newStock: product.newStock,
        reason: "POS sale",
        referenceId: saleRef.id,
        userId: input.cashierId,
        createdAt: now,
      });
    }

    transaction.set(saleRef, {
      id: saleRef.id,
      invoiceNumber,
      customerId: input.customerId ?? (settings.walkInCustomerEnabled ? "cust_walkin" : null),
      cashierId: input.cashierId,
      items,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod: input.paymentMethod,
      amountPaid: input.amountPaid,
      change: input.amountPaid - total,
      status: "COMPLETED",
      source: "POS",
      createdAt: now,
      updatedAt: now,
    });
  });

  return getSale(saleRef.id);
}

export function salesByDay(sales: Sale[], days = 7) {
  const buckets = new Map<string, number>();
  const today = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    const key = day.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  for (const sale of sales) {
    if (sale.status !== "COMPLETED") {
      continue;
    }
    const key = new Date(sale.createdAt).toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + sale.total);
    }
  }
  return [...buckets.entries()].map(([date, total]) => ({
    date: new Date(`${date}T00:00:00`).toLocaleDateString("en-PK", { weekday: "short", day: "numeric" }),
    total,
  }));
}

export function topSellingProducts(sales: Sale[], limit = 5) {
  const counts = new Map<string, { name: string; quantity: number; total: number }>();
  for (const sale of sales) {
    if (sale.status !== "COMPLETED") {
      continue;
    }
    for (const item of sale.items) {
      const current = counts.get(item.productId) ?? { name: item.name, quantity: 0, total: 0 };
      current.quantity += item.quantity;
      current.total += item.lineTotal;
      counts.set(item.productId, current);
    }
  }
  return [...counts.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}
