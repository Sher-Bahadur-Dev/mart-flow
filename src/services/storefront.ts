import { listProducts } from "@/services/products";
import { listSales } from "@/services/sales";

export async function ensureOperationalData(_userId?: string) {
  return {
    products: await listProducts(),
    sales: await listSales(),
  };
}
