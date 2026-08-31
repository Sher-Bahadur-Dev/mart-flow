"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { useTheme } from "@/components/layout/theme-provider";
import { FormAlert } from "@/components/ui/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DEMO_PASSWORD, DEMO_STAFF } from "@/config/demo";
import { hasPermission, PERMISSIONS, ROLE_LABELS, ROLES, type Permission, type Role } from "@/lib/permissions";
import { seedDemoData } from "@/services/seed";
import { getRolePermissionMap, getStoreSettings, saveRolePermissions, saveStoreSettings } from "@/services/settings";
import { applyRolePermissions, updateUserProfile } from "@/services/users";
import type { StoreSettings } from "@/types";

const SECTIONS = [
  { id: "business", label: "Store / Business" },
  { id: "currency", label: "Currency" },
  { id: "tax", label: "Tax / VAT" },
  { id: "receipt", label: "Receipt" },
  { id: "invoice", label: "Invoice" },
  { id: "payments", label: "Payment methods" },
  { id: "pos", label: "POS" },
  { id: "inventory", label: "Inventory" },
  { id: "lowstock", label: "Low stock" },
  { id: "purchase", label: "Purchases" },
  { id: "supplier", label: "Suppliers" },
  { id: "customer", label: "Customers" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "appearance", label: "Theme / Appearance" },
  { id: "profile", label: "User profile" },
  { id: "roles", label: "Roles & permissions" },
  { id: "utilities", label: "Utilities" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function CheckRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" disabled={disabled} checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export function SettingsPanel() {
  const { profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const canEdit = hasPermission(profile?.permissions, "settings.edit") || profile?.role === "SUPER_ADMIN";
  const canSeed = profile?.role === "SUPER_ADMIN" || hasPermission(profile?.permissions, "employees.create");

  const [section, setSection] = useState<SectionId>("business");
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [roles, setRoles] = useState<Record<Role, Permission[]> | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>("MANAGER");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([getStoreSettings(), getRolePermissionMap()]).then(([nextStore, nextRoles]) => {
      setStore(nextStore);
      setRoles(nextRoles);
      setTheme(nextStore.appearance);
    });
  }, [setTheme]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.name);
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const currentPermissions = roles?.[selectedRole] ?? [];

  function patch<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setStore((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveStore() {
    if (!store) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = await saveStoreSettings(store);
      setStore(saved);
      setTheme(saved.appearance);
      setSuccess("Settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  const title = useMemo(() => SECTIONS.find((item) => item.id === section)?.label ?? "Settings", [section]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Store, POS, tax, receipts, inventory, security, and staff roles. Changes are stored in Firestore and reload
          when you open the app again.
        </p>
      </div>
      <FormAlert message={error} />
      <FormAlert message={success} tone="success" />

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
          {SECTIONS.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={section === item.id ? "default" : "outline"}
              className="justify-start"
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="space-y-4">
          {section === "business" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Legal and contact details printed on receipts and invoices.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="storeName">Store name</Label>
                  <Input
                    id="storeName"
                    disabled={!canEdit}
                    value={store.storeName}
                    onChange={(event) => patch("storeName", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    disabled={!canEdit}
                    value={store.address ?? ""}
                    onChange={(event) => patch("address", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    disabled={!canEdit}
                    value={store.phone ?? ""}
                    onChange={(event) => patch("phone", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    disabled={!canEdit}
                    value={store.email ?? ""}
                    onChange={(event) => patch("email", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    disabled={!canEdit}
                    value={store.timezone}
                    onChange={(event) => patch("timezone", event.target.value)}
                  />
                </div>
                {canEdit ? (
                  <div className="sm:col-span-2">
                    <Button disabled={busy} onClick={() => void saveStore()}>
                      Save store information
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "currency" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>ISO currency code used for prices and reports (for example PKR, USD).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    disabled={!canEdit}
                    value={store.currency}
                    onChange={(event) => patch("currency", event.target.value.toUpperCase())}
                  />
                </div>
                {canEdit ? (
                  <Button disabled={busy} onClick={() => void saveStore()}>
                    Save currency
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "tax" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Applied on POS checkout when tax is enabled.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <CheckRow
                  label="Enable tax / VAT"
                  disabled={!canEdit}
                  checked={store.taxEnabled}
                  onChange={(checked) => patch("taxEnabled", checked)}
                />
                <CheckRow
                  label="Prices already include tax"
                  disabled={!canEdit}
                  checked={store.taxInclusive}
                  onChange={(checked) => patch("taxInclusive", checked)}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="taxLabel">Tax label</Label>
                  <Input
                    id="taxLabel"
                    disabled={!canEdit}
                    value={store.taxLabel}
                    onChange={(event) => patch("taxLabel", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tax">Rate %</Label>
                  <Input
                    id="tax"
                    type="number"
                    min={0}
                    disabled={!canEdit}
                    value={store.tax}
                    onChange={(event) => patch("tax", Number(event.target.value) || 0)}
                  />
                </div>
                {canEdit ? (
                  <div className="sm:col-span-2">
                    <Button disabled={busy} onClick={() => void saveStore()}>
                      Save tax settings
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "receipt" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="receiptHeader">Header</Label>
                  <Input
                    id="receiptHeader"
                    disabled={!canEdit}
                    value={store.receiptHeader ?? ""}
                    onChange={(event) => patch("receiptHeader", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="receiptFooter">Footer</Label>
                  <Input
                    id="receiptFooter"
                    disabled={!canEdit}
                    value={store.receiptFooter ?? ""}
                    onChange={(event) => patch("receiptFooter", event.target.value)}
                  />
                </div>
                <CheckRow
                  label="Show tax line on receipts"
                  disabled={!canEdit}
                  checked={store.receiptShowTax}
                  onChange={(checked) => patch("receiptShowTax", checked)}
                />
                {canEdit ? (
                  <Button disabled={busy} onClick={() => void saveStore()}>
                    Save receipt settings
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "invoice" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Prefix is used on new POS invoices (for example MF-A1B2C3).</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="invoicePrefix">Invoice prefix</Label>
                  <Input
                    id="invoicePrefix"
                    disabled={!canEdit}
                    value={store.invoicePrefix}
                    onChange={(event) => patch("invoicePrefix", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invoiceNextNumber">Next sequence (reference)</Label>
                  <Input
                    id="invoiceNextNumber"
                    type="number"
                    min={1}
                    disabled={!canEdit}
                    value={store.invoiceNextNumber}
                    onChange={(event) => patch("invoiceNextNumber", Number(event.target.value) || 1)}
                  />
                </div>
                {canEdit ? (
                  <div className="sm:col-span-2">
                    <Button disabled={busy} onClick={() => void saveStore()}>
                      Save invoice settings
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "payments" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Comma-separated methods offered at POS (CASH, CARD, BANK_TRANSFER, OTHER).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="payments">Payment methods</Label>
                  <Input
                    id="payments"
                    disabled={!canEdit}
                    value={store.paymentMethods.join(", ")}
                    onChange={(event) =>
                      patch(
                        "paymentMethods",
                        event.target.value
                          .split(",")
                          .map((item) => item.trim().toUpperCase())
                          .filter(Boolean),
                      )
                    }
                  />
                </div>
                {canEdit ? (
                  <Button disabled={busy} onClick={() => void saveStore()}>
                    Save payment methods
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "pos" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CheckRow
                  label="POS enabled"
                  disabled={!canEdit}
                  checked={store.posEnabled}
                  onChange={(checked) => patch("posEnabled", checked)}
                />
                <CheckRow
                  label="Barcode / SKU search on POS"
                  disabled={!canEdit}
                  checked={store.posBarcodeEnabled}
                  onChange={(checked) => patch("posBarcodeEnabled", checked)}
                />
                <CheckRow
                  label="Require a named customer (walk-in still allowed if enabled below)"
                  disabled={!canEdit}
                  checked={store.posRequireCustomer}
                  onChange={(checked) => patch("posRequireCustomer", checked)}
                />
                {canEdit ? (
                  <Button disabled={busy} onClick={() => void saveStore()}>
                    Save POS settings
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "inventory" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CheckRow
                  label="Allow negative stock on POS"
                  disabled={!canEdit}
                  checked={store.allowNegativeStock}
                  onChange={(checked) => patch("allowNegativeStock", checked)}
                />
                <CheckRow
                  label="Suggest auto-reorder when stock is low"
                  disabled={!canEdit}
                  checked={store.autoReorder}
                  onChange={(checked) => patch("autoReorder", checked)}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="units">Units (comma separated)</Label>
                  <Input
                    id="units"
                    disabled={!canEdit}
                    value={store.units.join(", ")}
                    onChange={(event) =>
                      patch(
                        "units",
                        event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </div>
                {canEdit ? (
                  <Button disabled={busy} onClick={() => void saveStore()}>
                    Save inventory settings
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "lowstock" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="lowStockThreshold">Low-stock threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min={0}
                    disabled={!canEdit}
                    value={store.lowStockThreshold}
                    onChange={(event) => patch("lowStockThreshold", Number(event.target.value) || 0)}
                  />
                </div>
                <CheckRow
                  label="Send low-stock alerts"
                  disabled={!canEdit}
                  checked={store.lowStockAlerts}
                  onChange={(checked) => patch("lowStockAlerts", checked)}
                />
                {canEdit ? (
                  <Button disabled={busy} onClick={() => void saveStore()}>
                    Save low-stock settings
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "purchase" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <CheckRow
                  label="Require approval before a purchase order is created"
                  disabled={!canEdit}
                  checked={store.purchaseRequireApproval}
                  onChange={(checked) => patch("purchaseRequireApproval", checked)}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="defaultPaymentTermsDays">Default payment terms (days)</Label>
                  <Input
                    id="defaultPaymentTermsDays"
                    type="number"
                    min={0}
                    disabled={!canEdit}
                    value={store.defaultPaymentTermsDays}
                    onChange={(event) => patch("defaultPaymentTermsDays", Number(event.target.value) || 0)}
                  />
                </div>
                {canEdit ? (
                  <div className="sm:col-span-2">
                    <Button disabled={busy} onClick={() => void saveStore()}>
                      Save purchase settings
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "supplier" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="supplierCreditLimit">Default supplier credit limit</Label>
                  <Input
                    id="supplierCreditLimit"
                    type="number"
                    min={0}
                    disabled={!canEdit}
                    value={store.supplierCreditLimit}
                    onChange={(event) => patch("supplierCreditLimit", Number(event.target.value) || 0)}
                  />
                </div>
                <CheckRow
                  label="Require tax ID on supplier records"
                  disabled={!canEdit}
                  checked={store.supplierRequireTaxId}
                  onChange={(checked) => patch("supplierRequireTaxId", checked)}
                />
                {canEdit ? (
                  <div className="sm:col-span-2">
                    <Button disabled={busy} onClick={() => void saveStore()}>
                      Save supplier settings
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "customer" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CheckRow
                  label="Allow walk-in customer on POS"
                  disabled={!canEdit}
                  checked={store.walkInCustomerEnabled}
                  onChange={(checked) => patch("walkInCustomerEnabled", checked)}
                />
                <CheckRow
                  label="Allow customer store credit"
                  disabled={!canEdit}
                  checked={store.customerCreditEnabled}
                  onChange={(checked) => patch("customerCreditEnabled", checked)}
                />
                {canEdit ? (
                  <Button disabled={busy} onClick={() => void saveStore()}>
                    Save customer settings
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "notifications" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CheckRow
                  label="Notify on sales"
                  disabled={!canEdit}
                  checked={store.notifySales}
                  onChange={(checked) => patch("notifySales", checked)}
                />
                <CheckRow
                  label="Notify on purchases"
                  disabled={!canEdit}
                  checked={store.notifyPurchases}
                  onChange={(checked) => patch("notifyPurchases", checked)}
                />
                <CheckRow
                  label="Low-stock notifications"
                  disabled={!canEdit}
                  checked={store.lowStockAlerts}
                  onChange={(checked) => patch("lowStockAlerts", checked)}
                />
                {canEdit ? (
                  <Button disabled={busy} onClick={() => void saveStore()}>
                    Save notification settings
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "security" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                  Session timeout is stored for the workspace. Staff passwords are managed through Firebase Auth reset
                  emails.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sessionTimeoutMinutes">Session timeout (minutes)</Label>
                  <Input
                    id="sessionTimeoutMinutes"
                    type="number"
                    min={5}
                    disabled={!canEdit}
                    value={store.sessionTimeoutMinutes}
                    onChange={(event) => patch("sessionTimeoutMinutes", Number(event.target.value) || 5)}
                  />
                </div>
                <CheckRow
                  label="Require strong passwords for new staff"
                  disabled={!canEdit}
                  checked={store.requireStrongPasswords}
                  onChange={(checked) => patch("requireStrongPasswords", checked)}
                />
                {canEdit ? (
                  <Button disabled={busy} onClick={() => void saveStore()}>
                    Save security settings
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "appearance" && store ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Saved with store settings and applied immediately on this device.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="appearance">Theme</Label>
                  <Select
                    id="appearance"
                    disabled={!canEdit}
                    value={store.appearance}
                    onChange={(event) => {
                      const next = event.target.value as StoreSettings["appearance"];
                      patch("appearance", next);
                      setTheme(next);
                    }}
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </Select>
                  <p className="text-xs text-muted-foreground">Current device theme: {theme}</p>
                </div>
                {canEdit ? (
                  <Button disabled={busy} onClick={() => void saveStore()}>
                    Save appearance
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {section === "profile" ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Your signed-in account. Role changes for other people are on Employees.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profilePhone">Phone</Label>
                  <Input id="profilePhone" value={phone} onChange={(event) => setPhone(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={profile?.email ?? ""} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Input value={profile ? ROLE_LABELS[profile.role] : ""} disabled />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    disabled={busy || !profile}
                    onClick={async () => {
                      if (!profile) {
                        return;
                      }
                      setBusy(true);
                      setError(null);
                      try {
                        await updateUserProfile(profile.id, { name: displayName, phone: phone || null });
                        await refreshProfile();
                        setSuccess("Profile saved.");
                      } catch (saveError) {
                        setError(saveError instanceof Error ? saveError.message : "Could not save profile.");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Save profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {section === "roles" ? (
            <Card>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>
                  Owner, Manager, Employee, Cashier, Inventory Staff, Purchases, and Supplier. Saving a role updates
                  every user currently assigned to it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((role) => (
                    <Button
                      key={role}
                      size="sm"
                      variant={selectedRole === role ? "default" : "outline"}
                      onClick={() => setSelectedRole(role)}
                    >
                      {ROLE_LABELS[role]}
                    </Button>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {PERMISSIONS.map((permission) => {
                    const checked = currentPermissions.includes(permission);
                    return (
                      <label key={permission} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          disabled={!canEdit || selectedRole === "SUPER_ADMIN"}
                          checked={checked}
                          onChange={() => {
                            setRoles((current) => {
                              if (!current) {
                                return current;
                              }
                              const next = new Set(current[selectedRole]);
                              if (next.has(permission)) {
                                next.delete(permission);
                              } else {
                                next.add(permission);
                              }
                              return { ...current, [selectedRole]: [...next] as Permission[] };
                            });
                          }}
                        />
                        {permission}
                      </label>
                    );
                  })}
                </div>
                {canEdit && selectedRole !== "SUPER_ADMIN" ? (
                  <Button
                    disabled={busy || !roles}
                    onClick={async () => {
                      if (!roles) {
                        return;
                      }
                      setBusy(true);
                      setError(null);
                      try {
                        await saveRolePermissions(selectedRole, roles[selectedRole]);
                        await applyRolePermissions(selectedRole, roles[selectedRole]);
                        await refreshProfile();
                        setSuccess(`${ROLE_LABELS[selectedRole]} permissions saved.`);
                      } catch (saveError) {
                        setError(saveError instanceof Error ? saveError.message : "Could not save role.");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Save role
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">Owner always keeps full access.</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Manage individual staff on{" "}
                  <Link className="underline" href="/employees">
                    Employees
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          ) : null}

          {section === "utilities" ? (
            <Card>
              <CardHeader>
                <CardTitle>Optional demo catalogue</CardTitle>
                <CardDescription>
                  Settings already persist without this. Use it only to load sample products and staff into an empty
                  store.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Demo staff password: <span className="font-medium text-foreground">{DEMO_PASSWORD}</span>
                </p>
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {DEMO_STAFF.map((member) => (
                    <li key={member.email}>
                      {member.name} — {member.email} ({ROLE_LABELS[member.role]})
                    </li>
                  ))}
                </ul>
                {canSeed ? (
                  <Button
                    disabled={busy || !profile}
                    onClick={async () => {
                      if (!profile) {
                        return;
                      }
                      setBusy(true);
                      setError(null);
                      setSuccess(null);
                      try {
                        const result = await seedDemoData(profile.id);
                        setSuccess(
                          `Demo catalogue is ready.${result.staffCreated.length ? ` Created staff: ${result.staffCreated.join(", ")}.` : ""}${result.staffSkipped.length ? ` Already present: ${result.staffSkipped.join(", ")}.` : ""}`,
                        );
                      } catch (seedError) {
                        setError(seedError instanceof Error ? seedError.message : "Could not load demo data.");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {busy ? "Loading…" : "Load demo catalogue & staff"}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">Only the owner or a manager can load demo staff.</p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {!store && section !== "profile" && section !== "roles" && section !== "utilities" ? (
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
