import { listProducts } from "@/services/products";
import { listSales } from "@/services/sales";

export type DashboardSummary = {
  revenue: number | null;
  stockValue: number | null;
  lowStockCount: number | null;
  openShiftCash: number | null;
  ticketCount: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [products, sales] = await Promise.all([listProducts(), listSales()]);
  const completed = sales.filter((sale) => sale.status === "COMPLETED");
  const revenue = completed.reduce((sum, sale) => sum + sale.total, 0);
  const cashToday = completed
    .filter((sale) => {
      const sameDay = new Date(sale.createdAt).toDateString() === new Date().toDateString();
      return sameDay && sale.paymentMethod === "CASH";
    })
    .reduce((sum, sale) => sum + sale.total, 0);

  if (products.length === 0 && completed.length === 0) {
    return {
      revenue: null,
      stockValue: null,
      lowStockCount: null,
      openShiftCash: null,
      ticketCount: 0,
    };
  }

  const stockValue = products.reduce(
    (total, product) => total + product.currentStock * product.purchasePrice,
    0,
  );
  const lowStockCount = products.filter(
    (product) => product.currentStock <= product.minimumStock,
  ).length;

  return {
    revenue,
    stockValue,
    lowStockCount,
    openShiftCash: cashToday,
    ticketCount: completed.length,
  };
}
