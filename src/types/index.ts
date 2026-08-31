import type { Permission, Role } from "@/lib/permissions";

export type TimestampFields = {
  createdAt: Date;
  updatedAt: Date;
};

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type ProductStatus = "ACTIVE" | "ARCHIVED";
export type RecordStatus = "ACTIVE" | "ARCHIVED";
export type SaleStatus = "COMPLETED" | "REFUNDED" | "CANCELLED";
export type PurchaseStatus =
  | "DRAFT"
  | "ORDERED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "OTHER";
export type CustomerType = "WALK_IN_CUSTOMER" | "REGISTERED_CUSTOMER";
export type InventoryTransactionType =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "DAMAGE"
  | "EXPIRY"
  | "ADJUSTMENT"
  | "STOCK_IN"
  | "STOCK_OUT";
export type ExpenseCategory =
  | "Rent"
  | "Electricity"
  | "Water"
  | "Internet"
  | "Transport"
  | "Salary"
  | "Maintenance"
  | "Supplies"
  | "Other";

export type UserProfile = TimestampFields & {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  role: Role;
  permissions: Permission[];
  status: UserStatus;
  employeeId: string | null;
};

export type Product = TimestampFields & {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: string | null;
  brand: string | null;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  tax: number;
  discount: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number | null;
  supplierId: string | null;
  imageUrl: string | null;
  description: string | null;
  status: ProductStatus;
  createdBy: string;
};

export type Category = TimestampFields & {
  id: string;
  name: string;
  parentId: string | null;
  status: RecordStatus;
};

export type InventoryTransaction = {
  id: string;
  productId: string;
  type: InventoryTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  referenceId: string | null;
  userId: string;
  createdAt: Date;
};

export type SaleItem = {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
};

export type Sale = TimestampFields & {
  id: string;
  invoiceNumber: string;
  customerId: string | null;
  cashierId: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  status: SaleStatus;
};

export type PurchaseItem = SaleItem & {
  receivedQuantity: number;
};

export type Purchase = TimestampFields & {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  outstanding: number;
  notes: string | null;
  createdBy: string;
};

export type Supplier = TimestampFields & {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  notes: string | null;
  status: RecordStatus;
};

export type Customer = TimestampFields & {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customerType: CustomerType;
  balance: number;
  status: RecordStatus;
};

export type Expense = TimestampFields & {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string | null;
  date: Date;
  createdBy: string;
};

export type CashSession = TimestampFields & {
  id: string;
  openedBy: string;
  closedBy: string | null;
  openingCash: number;
  cashSales: number;
  cashExpenses: number;
  cashRefunds: number;
  withdrawals: number;
  actualCash: number | null;
  expectedCash: number | null;
  difference: number | null;
  closedAt: Date | null;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
};

export type StoreSettings = TimestampFields & {
  id: string;
  storeName: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  tax: number;
  taxEnabled: boolean;
  taxLabel: string;
  taxInclusive: boolean;
  receiptHeader: string | null;
  receiptFooter: string | null;
  receiptShowTax: boolean;
  invoicePrefix: string;
  invoiceNextNumber: number;
  lowStockThreshold: number;
  units: string[];
  paymentMethods: string[];
  posEnabled: boolean;
  posRequireCustomer: boolean;
  posBarcodeEnabled: boolean;
  allowNegativeStock: boolean;
  autoReorder: boolean;
  purchaseRequireApproval: boolean;
  defaultPaymentTermsDays: number;
  supplierCreditLimit: number;
  supplierRequireTaxId: boolean;
  customerCreditEnabled: boolean;
  walkInCustomerEnabled: boolean;
  notifySales: boolean;
  notifyPurchases: boolean;
  lowStockAlerts: boolean;
  sessionTimeoutMinutes: number;
  requireStrongPasswords: boolean;
  appearance: "light" | "dark" | "system";
  timezone: string;
};

export type AuditLog = {
  id: string;
  action: string;
  userId: string;
  entity: string;
  entityId: string;
  details: Record<string, string | number | boolean | null>;
  timestamp: Date;
};

export type Store = TimestampFields & {
  id: string;
  name: string;
  isActive: boolean;
  address: string | null;
  phone: string | null;
};

export type Employee = TimestampFields & {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  joiningDate: Date;
  userId: string | null;
  photoUrl: string | null;
  employeeCode: string;
  jobTitle: string;
  salary: number | null;
  storeId: string | null;
  hireDate: Date;
  isActive: boolean;
  removed: boolean;
  address: string | null;
  emergencyContact: string | null;
};
