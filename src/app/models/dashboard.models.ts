export type OrderStatus =
  | 'PENDING'
  | 'PREPARING'
  | 'READY'
  | 'CANCELLED'
  | 'COMPLETED';

export interface OrderSummary {
  orderId: string;
  customerName: string;
  totalPrice: number;
  orderTime: string;
  status: OrderStatus;
}

export interface DashboardSummary {
  dailyOrders: number;
  activeOrders: number;
  dailyRevenue: number;
}
