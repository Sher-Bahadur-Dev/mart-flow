import type { LucideIcon } from "lucide-react";
import {
  Apple,
  BadgeDollarSign,
  Banknote,
  Bell,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  UserRound,
  Wallet,
} from "lucide-react";

import type { Permission } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { href: "/pos", label: "POS", icon: ShoppingCart, permission: "pos.access" },
  { href: "/sales", label: "Sales", icon: Receipt, permission: "sales.view" },
  { href: "/purchases", label: "Purchases", icon: ClipboardList, permission: "purchases.view" },
  { href: "/inventory", label: "Inventory", icon: Boxes, permission: "inventory.view" },
  { href: "/grocery", label: "Grocery", icon: Apple, permission: "products.view" },
  { href: "/products", label: "Products", icon: Package, permission: "products.view" },
  { href: "/categories", label: "Categories", icon: Tags, permission: "categories.view" },
  { href: "/suppliers", label: "Suppliers", icon: Truck, permission: "suppliers.view" },
  { href: "/customers", label: "Customers", icon: Users, permission: "customers.view" },
  { href: "/employees", label: "Employees", icon: UserRound, permission: "employees.view" },
  { href: "/expenses", label: "Expenses", icon: Wallet, permission: "expenses.view" },
  { href: "/cash-management", label: "Cash", icon: Banknote, permission: "cash.view" },
  { href: "/reports", label: "Reports", icon: BadgeDollarSign, permission: "reports.view" },
  { href: "/notifications", label: "Notifications", icon: Bell, permission: "notifications.view" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings.view" },
];

export function filterNavItems(_permissions: readonly Permission[] | undefined) {
  return NAV_ITEMS;
}
