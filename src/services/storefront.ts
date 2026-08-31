import { listProducts } from "@/services/products";
import { listSales } from "@/services/sales";
import { seedCatalog, seedDemoSales, seedOperationalModules } from "@/services/seed";

export async function ensureOperationalData(userId: string) {
  let products = await listProducts();
  if (products.length === 0) {
    try {
      await seedCatalog(userId);
      products = await listProducts();
    } catch {
      // Catalogue seed requires manager/owner write access.
    }
  }

  const sales = await listSales();
  if (sales.length === 0) {
    try {
      await seedDemoSales(userId);
    } catch {
      // Historical demo invoices are best-effort.
    }
  }
  try {
    await seedOperationalModules(userId);
  } catch {
    // Purchases, expenses, cash, and notifications are best-effort.
  }

  return {
    products: await listProducts(),
    sales: await listSales(),
  };
}
