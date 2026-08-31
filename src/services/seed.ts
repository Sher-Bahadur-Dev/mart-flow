import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp, writeBatch } from "firebase/firestore";

import {
  DEMO_CATEGORIES,
  DEMO_CUSTOMERS,
  DEMO_PASSWORD,
  DEMO_PRODUCTS,
  DEMO_STAFF,
  DEMO_SUPPLIERS,
} from "@/config/demo";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { createEmployeeAccount, findEmployeeByEmail } from "@/services/employees";
import { DEFAULT_STORE_ID, ensureDefaultStore } from "@/services/stores";

const DEMO_DOC = "demo";

export type DemoSeedStatus = {
  catalogSeeded: boolean;
  staffSeeded: boolean;
  staffCreated: string[];
  staffSkipped: string[];
};

async function readDemoStatus() {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.settings, DEMO_DOC));
  const data = snap.data();
  return {
    catalogSeeded: data?.catalogSeeded === true,
    staffSeeded: data?.staffSeeded === true,
  };
}

async function writeDemoStatus(patch: { catalogSeeded?: boolean; staffSeeded?: boolean }) {
  const current = await readDemoStatus();
  await setDoc(
    doc(requireDb(), COLLECTIONS.settings, DEMO_DOC),
    {
      catalogSeeded: patch.catalogSeeded ?? current.catalogSeeded,
      staffSeeded: patch.staffSeeded ?? current.staffSeeded,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function seedCatalog(createdBy: string): Promise<DemoSeedStatus> {
  const status = await readDemoStatus();
  if (status.catalogSeeded) {
    return { ...status, staffCreated: [], staffSkipped: [] };
  }

  const db = requireDb();
  const batch = writeBatch(db);
  const now = serverTimestamp();

  for (const category of DEMO_CATEGORIES) {
    batch.set(doc(db, COLLECTIONS.categories, category.id), {
      id: category.id,
      name: category.name,
      parentId: null,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const supplier of DEMO_SUPPLIERS) {
    batch.set(doc(db, COLLECTIONS.suppliers, supplier.id), {
      ...supplier,
      taxNumber: null,
      notes: "Demo supplier",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const customer of DEMO_CUSTOMERS) {
    batch.set(doc(db, COLLECTIONS.customers, customer.id), {
      ...customer,
      address: null,
      balance: 0,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const product of DEMO_PRODUCTS) {
    batch.set(doc(db, COLLECTIONS.products, product.id), {
      ...product,
      tax: 0,
      discount: 0,
      maximumStock: null,
      imageUrl: null,
      description: "Demo catalogue item",
      status: "ACTIVE",
      createdBy,
      createdAt: now,
      updatedAt: now,
    });
    const txRef = doc(collection(db, COLLECTIONS.inventoryTransactions));
    batch.set(txRef, {
      id: txRef.id,
      productId: product.id,
      type: "STOCK_IN",
      quantity: product.currentStock,
      previousStock: 0,
      newStock: product.currentStock,
      reason: "Demo opening stock",
      referenceId: "demo-seed",
      userId: createdBy,
      createdAt: now,
    });
  }

  batch.set(
    doc(db, COLLECTIONS.settings, "store"),
    {
      id: "store",
      storeName: "MartFlow Demo Mart",
      logoUrl: null,
      address: "Shop 12, Gulshan-e-Iqbal, Karachi",
      phone: "021-34900000",
      email: "owner@martflow.demo",
      currency: "PKR",
      tax: 0,
      receiptFooter: "Thank you for shopping with us.",
      invoicePrefix: "MF",
      lowStockThreshold: 10,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  batch.set(
    doc(db, COLLECTIONS.stores, DEFAULT_STORE_ID),
    {
      id: DEFAULT_STORE_ID,
      name: "MartFlow Demo Mart",
      isActive: true,
      address: "Shop 12, Gulshan-e-Iqbal, Karachi",
      phone: "021-34900000",
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );

  batch.set(
    doc(db, COLLECTIONS.settings, DEMO_DOC),
    {
      catalogSeeded: true,
      staffSeeded: status.staffSeeded,
      updatedAt: now,
    },
    { merge: true },
  );

  await batch.commit();
  return { catalogSeeded: true, staffSeeded: status.staffSeeded, staffCreated: [], staffSkipped: [] };
}

export async function seedDemoStaff(): Promise<DemoSeedStatus> {
  const status = await readDemoStatus();
  const store = await ensureDefaultStore();
  const storeId = store?.id ?? DEFAULT_STORE_ID;
  const staffCreated: string[] = [];
  const staffSkipped: string[] = [];

  for (const member of DEMO_STAFF) {
    const existing = await findEmployeeByEmail(member.email);
    if (existing) {
      staffSkipped.push(member.email);
      continue;
    }
    try {
      await createEmployeeAccount({
        name: member.name,
        email: member.email,
        password: DEMO_PASSWORD,
        role: member.role,
        phone: member.phone,
        employeeCode: member.employeeCode,
        jobTitle: member.jobTitle,
        storeId,
        hireDate: new Date(member.hireDate),
        salary: member.salary,
        isActive: true,
      });
      staffCreated.push(member.email);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create staff.";
      if (message.toLowerCase().includes("already")) {
        staffSkipped.push(member.email);
        continue;
      }
      throw error;
    }
  }

  await writeDemoStatus({ staffSeeded: true });
  return {
    catalogSeeded: status.catalogSeeded,
    staffSeeded: true,
    staffCreated,
    staffSkipped,
  };
}

export async function seedDemoSales(createdBy: string) {
  const db = requireDb();
  const existing = await getDocs(collection(db, COLLECTIONS.sales));
  if (!existing.empty) {
    return;
  }

  const productSnap = await getDocs(collection(db, COLLECTIONS.products));
  const products = productSnap.docs.map((item) => ({
    id: item.id,
    name: String(item.data().name ?? ""),
    sku: String(item.data().sku ?? ""),
    sellingPrice: Number(item.data().sellingPrice ?? 0),
  }));
  if (products.length === 0) {
    return;
  }

  const patterns = [
    [0, 1],
    [2, 5],
    [3],
    [1, 6, 7],
    [4, 8],
    [0, 9],
    [5, 6],
    [2, 3, 1],
    [7, 8],
    [0, 4],
    [6],
    [1, 2, 9],
  ];

  const batch = writeBatch(db);
  const now = new Date();

  patterns.forEach((indexes, dayOffset) => {
    const saleRef = doc(collection(db, COLLECTIONS.sales));
    const created = new Date(now);
    created.setDate(now.getDate() - (patterns.length - 1 - dayOffset));
    created.setHours(10 + (dayOffset % 8), 15, 0, 0);
    const items = indexes.map((index) => {
      const product = products[index % products.length];
      const quantity = 1 + (dayOffset % 3);
      const unitPrice = product.sellingPrice;
      return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity,
        unitPrice,
        discount: 0,
        tax: 0,
        lineTotal: unitPrice * quantity,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    batch.set(saleRef, {
      id: saleRef.id,
      invoiceNumber: `MF-D${String(dayOffset + 1).padStart(3, "0")}`,
      customerId: dayOffset % 2 === 0 ? "cust_walkin" : "cust_ahmed",
      cashierId: createdBy,
      items,
      subtotal,
      discount: 0,
      tax: 0,
      total: subtotal,
      paymentMethod: dayOffset % 3 === 0 ? "CARD" : "CASH",
      amountPaid: subtotal,
      change: 0,
      status: "COMPLETED",
      source: "POS",
      createdAt: Timestamp.fromDate(created),
      updatedAt: Timestamp.fromDate(created),
    });
  });

  await batch.commit();
}

export async function seedOperationalModules(createdBy: string) {
  const db = requireDb();
  const now = Timestamp.now();

  const purchaseSnap = await getDocs(collection(db, COLLECTIONS.purchases));
  if (purchaseSnap.empty) {
    const batch = writeBatch(db);
    const orders = [
      {
        id: "po_metro_open",
        supplierId: "sup_metro",
        status: "ORDERED",
        items: [
          { productId: "prd_sugar", name: "White Sugar 1kg", sku: "SUG-1KG", quantity: 40, unitPrice: 140, receivedQuantity: 0 },
          { productId: "prd_oil", name: "Cooking Oil 5L", sku: "OIL-5L", quantity: 12, unitPrice: 1850, receivedQuantity: 0 },
        ],
        amountPaid: 0,
      },
      {
        id: "po_nestle_partial",
        supplierId: "sup_nestle",
        status: "PARTIALLY_RECEIVED",
        items: [
          { productId: "prd_milk", name: "Olper's Milk 1L", sku: "MILK-1L", quantity: 24, unitPrice: 220, receivedQuantity: 10 },
        ],
        amountPaid: 0,
      },
      {
        id: "po_metro_done",
        supplierId: "sup_metro",
        status: "RECEIVED",
        items: [
          { productId: "prd_atta", name: "Wheat Atta 10kg", sku: "ATTA-10", quantity: 8, unitPrice: 1150, receivedQuantity: 8 },
        ],
        amountPaid: 9200,
      },
      {
        id: "po_nestle_cancel",
        supplierId: "sup_nestle",
        status: "CANCELLED",
        items: [
          { productId: "prd_tea", name: "Tea Whitener 350ml", sku: "TEA-350", quantity: 20, unitPrice: 85, receivedQuantity: 0 },
        ],
        amountPaid: 0,
      },
    ] as const;

    orders.forEach((order, index) => {
      const items = order.items.map((item) => ({
        ...item,
        discount: 0,
        tax: 0,
        lineTotal: item.unitPrice * item.quantity,
      }));
      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const created = new Date();
      created.setDate(created.getDate() - (orders.length - index));
      batch.set(doc(db, COLLECTIONS.purchases, order.id), {
        id: order.id,
        orderNumber: `PO-${String(index + 1).padStart(4, "0")}`,
        supplierId: order.supplierId,
        status: order.status,
        items,
        subtotal,
        tax: 0,
        total: subtotal,
        amountPaid: order.amountPaid,
        outstanding: Math.max(0, subtotal - order.amountPaid),
        notes: "Demo supplier order",
        createdBy,
        createdAt: Timestamp.fromDate(created),
        updatedAt: Timestamp.fromDate(created),
      });
    });
    await batch.commit();
  }

  const expenseSnap = await getDocs(collection(db, COLLECTIONS.expenses));
  if (expenseSnap.empty) {
    const batch = writeBatch(db);
    [
      { title: "Shop rent", category: "Rent", amount: 85000 },
      { title: "Electricity bill", category: "Electricity", amount: 18400 },
      { title: "Delivery van fuel", category: "Transport", amount: 6200 },
      { title: "Shelf repair", category: "Maintenance", amount: 3500 },
    ].forEach((expense, index) => {
      const ref = doc(collection(db, COLLECTIONS.expenses));
      const date = new Date();
      date.setDate(date.getDate() - index * 3);
      batch.set(ref, {
        id: ref.id,
        ...expense,
        paymentMethod: "BANK_TRANSFER",
        description: "Store operating expense",
        date: Timestamp.fromDate(date),
        createdBy,
        createdAt: now,
        updatedAt: now,
      });
    });
    await batch.commit();
  }

  const cashSnap = await getDocs(collection(db, COLLECTIONS.cashSessions));
  if (cashSnap.empty) {
    const ref = doc(collection(db, COLLECTIONS.cashSessions));
    await setDoc(ref, {
      id: ref.id,
      openedBy: createdBy,
      closedBy: null,
      openingCash: 15000,
      cashSales: 8400,
      cashExpenses: 1200,
      cashRefunds: 0,
      withdrawals: 0,
      actualCash: null,
      expectedCash: 22200,
      difference: null,
      closedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  const noteSnap = await getDocs(collection(db, COLLECTIONS.notifications));
  if (noteSnap.empty) {
    const batch = writeBatch(db);
    [
      { title: "Low stock: Basmati Rice 5kg", body: "On-hand quantity is below the minimum. Raise a purchase order." },
      { title: "PO-0001 pending", body: "Metro Cash & Carry order is waiting to be received." },
      { title: "POS shift", body: "Today's cash sales are recorded on the open till." },
    ].forEach((note) => {
      const ref = doc(collection(db, COLLECTIONS.notifications));
      batch.set(ref, { id: ref.id, ...note, read: false, createdAt: now });
    });
    await batch.commit();
  }
}

export async function seedDemoData(createdBy: string) {
  await ensureDefaultStore();
  const catalog = await seedCatalog(createdBy);
  await seedDemoSales(createdBy);
  await seedOperationalModules(createdBy);
  const staff = await seedDemoStaff();
  return {
    catalogSeeded: catalog.catalogSeeded,
    staffSeeded: staff.staffSeeded,
    staffCreated: staff.staffCreated,
    staffSkipped: staff.staffSkipped,
  };
}

export async function getDemoStatus() {
  return readDemoStatus();
}
