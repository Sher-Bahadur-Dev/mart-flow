export const COLLECTIONS = {
  users: "users",
  employees: "employees",
  roles: "roles",
  permissions: "permissions",
  rolePermissions: "rolePermissions",
  userPermissions: "userPermissions",
  stores: "stores",
  counters: "counters",
  products: "products",
  categories: "categories",
  suppliers: "suppliers",
  customers: "customers",
  sales: "sales",
  purchases: "purchases",
  inventoryTransactions: "inventoryTransactions",
  expenses: "expenses",
  cashSessions: "cashSessions",
  notifications: "notifications",
  settings: "settings",
  auditLogs: "auditLogs",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
