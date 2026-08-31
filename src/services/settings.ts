import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asBoolean, asDate, asNumber, asString } from "@/lib/firebase/mapper";
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES, type Permission, type Role } from "@/lib/permissions";
import type { StoreSettings } from "@/types";

const DEFAULT_UNITS = ["pcs", "carton", "bag", "bottle", "pack", "bar", "kg", "L"];
const DEFAULT_PAYMENTS = ["CASH", "CARD", "BANK_TRANSFER", "OTHER"];

function stringList(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;
}

export function defaultStoreSettings(): StoreSettings {
  const now = new Date();
  return {
    id: "store",
    storeName: "MartFlow Demo Mart",
    logoUrl: null,
    address: "Shop 12, Gulshan-e-Iqbal, Karachi",
    phone: "021-34900000",
    email: "hello@martflow.demo",
    currency: "PKR",
    tax: 0,
    taxEnabled: false,
    taxLabel: "VAT",
    taxInclusive: false,
    receiptHeader: "MartFlow Demo Mart",
    receiptFooter: "Thank you for shopping with us.",
    receiptShowTax: true,
    invoicePrefix: "MF",
    invoiceNextNumber: 1,
    lowStockThreshold: 10,
    units: DEFAULT_UNITS,
    paymentMethods: DEFAULT_PAYMENTS,
    posEnabled: true,
    posRequireCustomer: false,
    posBarcodeEnabled: true,
    allowNegativeStock: false,
    autoReorder: false,
    purchaseRequireApproval: false,
    defaultPaymentTermsDays: 14,
    supplierCreditLimit: 0,
    supplierRequireTaxId: false,
    customerCreditEnabled: false,
    walkInCustomerEnabled: true,
    notifySales: true,
    notifyPurchases: true,
    lowStockAlerts: true,
    sessionTimeoutMinutes: 60,
    requireStrongPasswords: true,
    appearance: "system",
    timezone: "Asia/Karachi",
    createdAt: now,
    updatedAt: now,
  };
}

export function hydrateStoreSettings(data: Record<string, unknown> | undefined): StoreSettings {
  const base = defaultStoreSettings();
  if (!data) {
    return base;
  }
  const appearance = asString(data.appearance, base.appearance);
  return {
    ...base,
    storeName: asString(data.storeName, base.storeName),
    logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
    address: typeof data.address === "string" ? data.address : base.address,
    phone: typeof data.phone === "string" ? data.phone : base.phone,
    email: typeof data.email === "string" ? data.email : base.email,
    currency: asString(data.currency, base.currency),
    tax: asNumber(data.tax, base.tax),
    taxEnabled: asBoolean(data.taxEnabled, base.tax > 0),
    taxLabel: asString(data.taxLabel, base.taxLabel),
    taxInclusive: asBoolean(data.taxInclusive, false),
    receiptHeader: typeof data.receiptHeader === "string" ? data.receiptHeader : base.receiptHeader,
    receiptFooter: typeof data.receiptFooter === "string" ? data.receiptFooter : base.receiptFooter,
    receiptShowTax: asBoolean(data.receiptShowTax, true),
    invoicePrefix: asString(data.invoicePrefix, base.invoicePrefix),
    invoiceNextNumber: asNumber(data.invoiceNextNumber, base.invoiceNextNumber),
    lowStockThreshold: asNumber(data.lowStockThreshold, base.lowStockThreshold),
    units: stringList(data.units, base.units),
    paymentMethods: stringList(data.paymentMethods, base.paymentMethods),
    posEnabled: asBoolean(data.posEnabled, true),
    posRequireCustomer: asBoolean(data.posRequireCustomer, false),
    posBarcodeEnabled: asBoolean(data.posBarcodeEnabled, true),
    allowNegativeStock: asBoolean(data.allowNegativeStock, false),
    autoReorder: asBoolean(data.autoReorder, false),
    purchaseRequireApproval: asBoolean(data.purchaseRequireApproval, false),
    defaultPaymentTermsDays: asNumber(data.defaultPaymentTermsDays, base.defaultPaymentTermsDays),
    supplierCreditLimit: asNumber(data.supplierCreditLimit, 0),
    supplierRequireTaxId: asBoolean(data.supplierRequireTaxId, false),
    customerCreditEnabled: asBoolean(data.customerCreditEnabled, false),
    walkInCustomerEnabled: asBoolean(data.walkInCustomerEnabled, true),
    notifySales: asBoolean(data.notifySales, true),
    notifyPurchases: asBoolean(data.notifyPurchases, true),
    lowStockAlerts: asBoolean(data.lowStockAlerts, true),
    sessionTimeoutMinutes: asNumber(data.sessionTimeoutMinutes, base.sessionTimeoutMinutes),
    requireStrongPasswords: asBoolean(data.requireStrongPasswords, true),
    appearance: appearance === "light" || appearance === "dark" || appearance === "system" ? appearance : "system",
    timezone: asString(data.timezone, base.timezone),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const snap = await getDoc(doc(requireDb(), COLLECTIONS.settings, "store"));
  return hydrateStoreSettings(snap.exists() ? (snap.data() as Record<string, unknown>) : undefined);
}

export async function saveStoreSettings(input: Partial<StoreSettings>) {
  const current = await getStoreSettings();
  const next = hydrateStoreSettings({ ...current, ...input } as unknown as Record<string, unknown>);
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = next;
  await setDoc(
    doc(requireDb(), COLLECTIONS.settings, "store"),
    {
      ...payload,
      createdAt: current.createdAt,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return getStoreSettings();
}

export async function getRolePermissionMap(): Promise<Record<Role, Permission[]>> {
  const map = Object.fromEntries(
    ROLES.map((role) => [role, [...(ROLE_PERMISSIONS[role] ?? [])]]),
  ) as Record<Role, Permission[]>;
  for (const role of ROLES) {
    const snap = await getDoc(doc(requireDb(), COLLECTIONS.roles, role));
    if (snap.exists() && Array.isArray(snap.data().permissions)) {
      map[role] = snap
        .data()
        .permissions.filter((item: unknown): item is Permission =>
          typeof item === "string" && (PERMISSIONS as readonly string[]).includes(item),
        );
    }
  }
  return map;
}

export async function saveRolePermissions(role: Role, permissions: Permission[]) {
  await setDoc(
    doc(requireDb(), COLLECTIONS.roles, role),
    {
      id: role,
      role,
      permissions,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
