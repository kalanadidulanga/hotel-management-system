export type Order = {
  invoiceNo: number;
  customerName: string;
  waiter: string;
  tableMap: string;
  state: string;
  orderDate: string;
  totalAmount: number;
};

export const orders: Order[] = [
  {
    invoiceNo: 160,
    customerName: "Efe Chia",
    waiter: "1",
    tableMap: "1",
    state: "Pending",
    orderDate: "2025-07-10",
    totalAmount: 814.0,
  },
  {
    invoiceNo: 159,
    customerName: "Efe Chia",
    waiter: "4",
    tableMap: "4",
    state: "Pending",
    orderDate: "2025-07-09",
    totalAmount: 224.0,
  },
  {
    invoiceNo: 158,
    customerName: "Efe Chia",
    waiter: "2",
    tableMap: "2",
    state: "Pending",
    orderDate: "2025-07-09",
    totalAmount: 560.0,
  },
  {
    invoiceNo: 157,
    customerName: "Kisembo Ishikawa",
    waiter: "2",
    tableMap: "2",
    state: "Served",
    orderDate: "2025-07-08",
    totalAmount: 56.0,
  },
  // ...add more mock orders as needed
]; 