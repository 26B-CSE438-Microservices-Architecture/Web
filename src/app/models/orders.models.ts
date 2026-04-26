export type OrderStatus = 
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_HELD'
  | 'PAYMENT_CAPTURE_PENDING'
  | 'PAYMENT_FAILED'
  | 'PAID'
  | 'CONFIRMED_BY_RESTAURANT'
  | 'REJECTED_BY_RESTAURANT'
  | 'RESTAURANT_TIMEOUT'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED';

export type OrderType = 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
export type PaymentStatus = 'PENDING' | 'HELD' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
export type OrderCancellationReason = 'PAYMENT_FAILED' | 'PAYMENT_CAPTURE_FAILED' | 'RESTAURANT_REJECTED' | 'CUSTOMER_REQUEST' | 'EXPIRED' | null;

export interface MoneyResponse {
  amount: number;
  currency: string;
}

export interface AddressResponse {
  street: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: MoneyResponse;
  subtotal: MoneyResponse;
  specialInstructions?: string;
}

export interface OrderStatusHistoryResponse {
  id: string;
  status: OrderStatus;
  changedBy: string;
  reason?: string;
  changedAt: string;
}

export interface OrderResponse {
  orderId: string;
  status: OrderStatus;
  orderType: OrderType;
  restaurantId: string;
  totalAmount: MoneyResponse;
  deliveryFee: MoneyResponse;
  deliveryAddress: AddressResponse;
  notes?: string;
  paymentStatus: PaymentStatus;
  cancellationReason: OrderCancellationReason;
  estimatedDeliveryTime: string;
  createdAt: string;
  items: OrderItemResponse[];
  statusHistory: OrderStatusHistoryResponse[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
}

export interface ConfirmOrderRequest {
  estimatedPrepTime?: string;
}

export interface RejectOrderRequest {
  reason: string;
}
