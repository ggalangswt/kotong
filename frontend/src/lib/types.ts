export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cashier";
  status: "active" | "inactive";
};
export type Product = {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
};
export type Sale = {
  id: string;
  date: string;
  cashierId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    priceAtTransaction: number;
    subtotal: number;
  }[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status?: SaleStatus;
  payment?: {
    qrString?: string;
    expiresAt?: string;
    paidAt?: string;
  };
};
export type PaymentMethod = "cash" | "qris";
export type SaleStatus =
  "paid" | "pending" | "expired" | "cancelled" | "failed";
export type Movement = {
  _id: string;
  createdAt: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  type: string;
};
export type Store = {
  name: string;
  type: string;
  updatedAt?: string;
};
