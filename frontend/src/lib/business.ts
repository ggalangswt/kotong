import type { Sale } from "./types";
export const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
export const day = (date: string | Date) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(
    new Date(date),
  );
export const dateTime = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
export function change(total: number, cash: number) {
  return Number.isSafeInteger(cash) && cash >= total ? cash - total : null;
}
export function report(sales: Sale[], start: string, end: string) {
  const selected = sales.filter(
    (sale) => day(sale.date) >= start && day(sale.date) <= end,
  );
  const daily = new Map<
    string,
    { date: string; count: number; revenue: number }
  >();
  const products = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();
  for (const sale of selected) {
    const date = day(sale.date);
    const row = daily.get(date) || { date, count: 0, revenue: 0 };
    row.count++;
    row.revenue += sale.totalAmount;
    daily.set(date, row);
    for (const item of sale.items) {
      const p = products.get(item.productId) || {
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };
      p.quantity += item.quantity;
      p.revenue += item.subtotal;
      products.set(item.productId, p);
    }
  }
  return {
    sales: selected,
    revenue: selected.reduce((sum, sale) => sum + sale.totalAmount, 0),
    daily: [...daily.values()].sort((a, b) => b.date.localeCompare(a.date)),
    products: [...products.values()].sort((a, b) => b.quantity - a.quantity),
  };
}
