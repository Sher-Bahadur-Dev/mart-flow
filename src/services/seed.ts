import { collection, doc, getDoc, serverTimestamp, setDoc, Timestamp, writeBatch } from "firebase/firestore";

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
import { ensureDefaultStore } from "@/services/stores";
import {
  listOwnerDocs,
  ownerDemoSettingsId,
  ownerStoreId,
  requireOwnerId,
  tenantRecordId,
  withOwner,
} from "@/lib/tenant";

export type DemoSeedStatus = {
  catalogSeeded: boolean;
  staffSeeded: boolean;
  staffCreated: string[];
  staffSkipped: string[];
};

async function readDemoStatus() {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.settings, ownerDemoSettingsId()));
  const data = snap.data();
  return {
    catalogSeeded: data?.catalogSeeded === true,
    staffSeeded: data?.staffSeeded === true,
  };
}

async function writeDemoStatus(patch: { catalogSeeded?: boolean; staffSeeded?: boolean }) {
  const current = await readDemoStatus();
  const ownerId = requireOwnerId();
  await setDoc(
    doc(requireDb(), COLLECTIONS.settings, ownerDemoSettingsId(ownerId)),
    withOwner(
      {
        catalogSeeded: patch.catalogSeeded ?? current.catalogSeeded,
        staffSeeded: patch.staffSeeded ?? current.staffSeeded,
        updatedAt: serverTimestamp(),
      },
      ownerId,
    ),
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
  const ownerId = requireOwnerId();

  for (const category of DEMO_CATEGORIES) {
    const id = tenantRecordId(category.id, ownerId);
    batch.set(doc(db, COLLECTIONS.categories, id), withOwner({
      id,
      name: category.name,
      parentId: null,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    }, ownerId));
  }

  for (const supplier of DEMO_SUPPLIERS) {
    const id = tenantRecordId(supplier.id, ownerId);
    batch.set(doc(db, COLLECTIONS.suppliers, id), withOwner({
      ...supplier,
      id,
      taxNumber: null,
      notes: "Demo supplier",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    }, ownerId));
  }

  for (const customer of DEMO_CUSTOMERS) {
    const id = tenantRecordId(customer.id, ownerId);
    batch.set(doc(db, COLLECTIONS.customers, id), withOwner({
      ...customer,
      id,
      address: null,
      balance: 0,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    }, ownerId));
  }

  for (const product of DEMO_PRODUCTS) {
    const id = tenantRecordId(product.id, ownerId);
    batch.set(doc(db, COLLECTIONS.products, id), withOwner({
      ...product,
      id,
      categoryId: product.categoryId ? tenantRecordId(product.categoryId, ownerId) : null,
      supplierId: product.supplierId ? tenantRecordId(product.supplierId, ownerId) : null,
      tax: 0,
      discount: 0,
      maximumStock: null,
      imageUrl: null,
      description: "Demo catalogue item",
      status: "ACTIVE",
      createdBy,
      createdAt: now,
      updatedAt: now,
    }, ownerId));
    const txRef = doc(collection(db, COLLECTIONS.inventoryTransactions));
    batch.set(txRef, withOwner({
      id: txRef.id,
      productId: id,
      type: "STOCK_IN",
      quantity: product.currentStock,
      previousStock: 0,
      newStock: product.currentStock,
      reason: "Demo opening stock",
      referenceId: "demo-seed",
      userId: createdBy,
      createdAt: now,
    }, ownerId));
  }

  batch.set(
    doc(db, COLLECTIONS.settings, ownerDemoSettingsId(ownerId)),
    withOwner({
      catalogSeeded: true,
      staffSeeded: status.staffSeeded,
      updatedAt: now,
    }, ownerId),
    { merge: true },
  );

  await batch.commit();
  return { catalogSeeded: true, staffSeeded: status.staffSeeded, staffCreated: [], staffSkipped: [] };
}

export async function seedDemoStaff(): Promise<DemoSeedStatus> {
  const status = await readDemoStatus();
  const store = await ensureDefaultStore();
  const storeId = store?.id ?? ownerStoreId();
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
  const ownerId = requireOwnerId();
  const existing = await listOwnerDocs(COLLECTIONS.sales);
  if (existing.length > 0) {
    return;
  }

  const productSnap = await listOwnerDocs(COLLECTIONS.products);
  const products = productSnap.map((item) => ({
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
      ownerId,
      invoiceNumber: `MF-D${String(dayOffset + 1).padStart(3, "0")}`,
      customerId: dayOffset % 2 === 0 ? tenantRecordId("cust_walkin", ownerId) : tenantRecordId("cust_ahmed", ownerId),
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
  const ownerId = requireOwnerId();

  const purchaseSnap = await listOwnerDocs(COLLECTIONS.purchases);
  if (purchaseSnap.length === 0) {
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
        productId: tenantRecordId(item.productId, ownerId),
        discount: 0,
        tax: 0,
        lineTotal: item.unitPrice * item.quantity,
      }));
      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const created = new Date();
      created.setDate(created.getDate() - (orders.length - index));
      const id = tenantRecordId(order.id, ownerId);
      batch.set(doc(db, COLLECTIONS.purchases, id), withOwner({
        id,
        orderNumber: `PO-${String(index + 1).padStart(4, "0")}`,
        supplierId: tenantRecordId(order.supplierId, ownerId),
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
      }, ownerId));
    });
    await batch.commit();
  }

  const expenseSnap = await listOwnerDocs(COLLECTIONS.expenses);
  if (expenseSnap.length === 0) {
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
      batch.set(ref, withOwner({
        id: ref.id,
        ...expense,
        paymentMethod: "BANK_TRANSFER",
        description: "Store operating expense",
        date: Timestamp.fromDate(date),
        createdBy,
        createdAt: now,
        updatedAt: now,
      }, ownerId));
    });
    await batch.commit();
  }

  const cashSnap = await listOwnerDocs(COLLECTIONS.cashSessions);
  if (cashSnap.length === 0) {
    const ref = doc(collection(db, COLLECTIONS.cashSessions));
    await setDoc(ref, withOwner({
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
    }, ownerId));
  }

  const noteSnap = await listOwnerDocs(COLLECTIONS.notifications);
  if (noteSnap.length === 0) {
    const batch = writeBatch(db);
    [
      { title: "Low stock: Basmati Rice 5kg", body: "On-hand quantity is below the minimum. Raise a purchase order." },
      { title: "PO-0001 pending", body: "Metro Cash & Carry order is waiting to be received." },
      { title: "POS shift", body: "Today's cash sales are recorded on the open till." },
    ].forEach((note) => {
      const ref = doc(collection(db, COLLECTIONS.notifications));
      batch.set(ref, withOwner({ id: ref.id, ...note, read: false, createdAt: now }, ownerId));
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
