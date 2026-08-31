export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "EMPLOYEE",
  "CASHIER",
  "INVENTORY_STAFF",
  "PURCHASING",
  "SUPPLIER",
  "ACCOUNTANT",
] as const;

export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "dashboard.view",
  "products.view",
  "products.create",
  "products.edit",
  "products.delete",
  "categories.view",
  "categories.create",
  "categories.edit",
  "categories.delete",
  "inventory.view",
  "inventory.adjust",
  "sales.view",
  "sales.create",
  "sales.refund",
  "purchases.view",
  "purchases.create",
  "purchases.receive",
  "customers.view",
  "customers.create",
  "customers.edit",
  "customers.delete",
  "suppliers.view",
  "suppliers.create",
  "suppliers.edit",
  "suppliers.delete",
  "expenses.view",
  "expenses.create",
  "employees.view",
  "employees.create",
  "employees.edit",
  "employees.update",
  "employees.delete",
  "cash.view",
  "cash.manage",
  "reports.view",
  "notifications.view",
  "settings.view",
  "settings.edit",
  "pos.access",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: PERMISSIONS.filter((permission) => permission !== "employees.delete"),
  MANAGER: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.edit",
    "categories.view",
    "categories.create",
    "categories.edit",
    "inventory.view",
    "inventory.adjust",
    "sales.view",
    "sales.create",
    "sales.refund",
    "purchases.view",
    "purchases.create",
    "purchases.receive",
    "customers.view",
    "customers.create",
    "customers.edit",
    "suppliers.view",
    "suppliers.create",
    "suppliers.edit",
    "expenses.view",
    "expenses.create",
    "employees.view",
    "employees.create",
    "employees.edit",
    "employees.update",
    "cash.view",
    "cash.manage",
    "reports.view",
    "notifications.view",
    "settings.view",
    "settings.edit",
    "pos.access",
  ],
  CASHIER: [
    "dashboard.view",
    "products.view",
    "inventory.view",
    "sales.view",
    "sales.create",
    "customers.view",
    "customers.create",
    "pos.access",
    "notifications.view",
  ],
  EMPLOYEE: [
    "dashboard.view",
    "products.view",
    "inventory.view",
    "sales.view",
    "customers.view",
    "notifications.view",
  ],
  INVENTORY_STAFF: [
    "dashboard.view",
    "products.view",
    "categories.view",
    "inventory.view",
    "inventory.adjust",
    "purchases.view",
    "purchases.receive",
    "suppliers.view",
    "notifications.view",
  ],
  PURCHASING: [
    "dashboard.view",
    "products.view",
    "categories.view",
    "inventory.view",
    "purchases.view",
    "purchases.create",
    "purchases.receive",
    "suppliers.view",
    "suppliers.create",
    "suppliers.edit",
    "notifications.view",
  ],
  SUPPLIER: [
    "dashboard.view",
    "products.view",
    "purchases.view",
    "suppliers.view",
    "notifications.view",
  ],
  ACCOUNTANT: [
    "dashboard.view",
    "sales.view",
    "purchases.view",
    "expenses.view",
    "expenses.create",
    "customers.view",
    "suppliers.view",
    "cash.view",
    "reports.view",
    "notifications.view",
  ],
};

const PERMISSION_ALIASES: Partial<Record<Permission, readonly Permission[]>> = {
  "employees.update": ["employees.update", "employees.edit"],
  "employees.edit": ["employees.edit", "employees.update"],
};

export function hasPermission(
  permissions: readonly Permission[] | undefined,
  required: Permission,
) {
  if (!permissions) {
    return false;
  }
  const accepted = PERMISSION_ALIASES[required] ?? [required];
  return accepted.some((permission) => permissions.includes(permission));
}

export function roleBand(role: Role): "Owner" | "Manager" | "Employee" {
  if (role === "SUPER_ADMIN") {
    return "Owner";
  }
  if (role === "ADMIN" || role === "MANAGER") {
    return "Manager";
  }
  return "Employee";
}

export function isOwnerRole(role: Role) {
  return role === "SUPER_ADMIN";
}

export const ASSIGNABLE_ROLES = [
  "ADMIN",
  "MANAGER",
  "EMPLOYEE",
  "CASHIER",
  "INVENTORY_STAFF",
  "PURCHASING",
  "SUPPLIER",
  "ACCOUNTANT",
] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
  CASHIER: "Cashier",
  INVENTORY_STAFF: "Inventory Staff",
  PURCHASING: "Purchases",
  SUPPLIER: "Supplier",
  ACCOUNTANT: "Accountant",
};
