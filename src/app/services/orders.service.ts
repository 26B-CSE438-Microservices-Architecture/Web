import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Order, RefundRequest, PagedResult } from '../models/api.models';
import {
  OrderResponse,
  PageResponse,
  UpdateOrderStatusRequest,
  ConfirmOrderRequest,
  RejectOrderRequest,
  OrderStatus
} from '../models/orders.models';

// Re-export legacy types for components that import from orders.models directly
export type {
  OrderResponse,
  PageResponse,
  UpdateOrderStatusRequest,
  ConfirmOrderRequest,
  RejectOrderRequest,
  OrderStatus,
  AddressResponse,
  MoneyResponse,
  OrderItemResponse,
  OrderStatusHistoryResponse
} from '../models/orders.models';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/orders`;
  private readonly restaurantBase = `${this.base}/restaurant`;

  // ── Customer-facing ──────────────────────────────────────────────────────

  getMyOrders(): Observable<Order[] | PagedResult<Order>> {
    return this.http.get<Order[] | PagedResult<Order>>(`${this.base}/my`);
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.base}/${id}`);
  }

  cancelOrder(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.base}/${id}/cancel`, {});
  }

  reorder(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.base}/${id}/reorder`, {});
  }

  requestRefund(id: string, data?: RefundRequest): Observable<Order> {
    return this.http.post<Order>(`${this.base}/${id}/request-refund`, data ?? {});
  }

  // ── Restaurant-side (admin panel) ────────────────────────────────────────

  getRestaurantOrders(
    status?: OrderStatus,
    page = 0,
    size = 20
  ): Observable<PageResponse<OrderResponse>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (status) {
      params = params.set('status', status);
    }

    return this.http
      .get<unknown>(this.restaurantBase, { params })
      .pipe(
        map((response) => this.normalizeRestaurantOrdersResponse(response, page, size))
      );
  }

  confirmOrder(orderId: string, request?: ConfirmOrderRequest): Observable<void> {
    return this.http.patch<void>(`${this.restaurantBase}/${orderId}/confirm`, request ?? {});
  }

  rejectOrder(orderId: string, request: RejectOrderRequest): Observable<void> {
    return this.http.patch<void>(`${this.restaurantBase}/${orderId}/reject`, request);
  }

  updateOrderStatus(orderId: string, request: UpdateOrderStatusRequest): Observable<void> {
    return this.http.patch<void>(`${this.restaurantBase}/${orderId}/status`, request);
  }

  private normalizeRestaurantOrdersResponse(
    response: unknown,
    page: number,
    size: number
  ): PageResponse<OrderResponse> {
    if (Array.isArray(response)) {
      return {
        content: response.map((order) => this.normalizeOrderResponse(order)),
        totalElements: response.length,
        totalPages: response.length > 0 ? 1 : 0,
        currentPage: page,
        pageSize: size,
        hasNext: false,
        hasPrevious: page > 0
      };
    }

    const payload = this.asRecord(response);
    const data = Array.isArray(payload['content'])
      ? payload['content']
      : Array.isArray(payload['data'])
        ? payload['data']
        : [];

    const totalElements = this.readNumber(payload, 'totalElements', 'total') || data.length;
    const currentPage = this.readNumber(payload, 'currentPage', 'page');
    const pageSize = this.readNumber(payload, 'pageSize', 'size') || size;
    const totalPages = this.readNumber(payload, 'totalPages') || (pageSize > 0 ? Math.ceil(totalElements / pageSize) : 0);

    return {
      content: data.map((order) => this.normalizeOrderResponse(order)),
      totalElements,
      totalPages,
      currentPage,
      pageSize,
      hasNext: this.readBoolean(payload, 'hasNext') || currentPage < Math.max(totalPages - 1, 0),
      hasPrevious: this.readBoolean(payload, 'hasPrevious') || currentPage > 0
    };
  }

  private normalizeOrderResponse(response: unknown): OrderResponse {
    const order = this.asRecord(response);
    const deliveryAddress = this.asRecord(order['deliveryAddress']);
    const totalAmount = this.normalizeMoney(order['totalAmount'], this.readNumber(order, 'totalAmount'), this.readString(order, 'currency') || 'TRY');
    const deliveryFee = this.normalizeMoney(order['deliveryFee'], this.readNumber(order, 'deliveryFee'), totalAmount.currency);
    const items = Array.isArray(order['items']) ? order['items'].map((item) => this.normalizeOrderItem(item, totalAmount.currency)) : [];
    const statusHistory = Array.isArray(order['statusHistory'])
      ? order['statusHistory'].map((entry) => this.normalizeStatusHistory(entry))
      : [];

    return {
      orderId: this.readString(order, 'orderId', 'id'),
      status: this.readString(order, 'status') as OrderStatus,
      orderType: this.readString(order, 'orderType') as OrderResponse['orderType'],
      restaurantId: this.readString(order, 'restaurantId'),
      totalAmount,
      deliveryFee,
      deliveryAddress: {
        street: this.readString(deliveryAddress, 'street'),
        city: this.readString(deliveryAddress, 'city'),
        zipCode: this.readString(deliveryAddress, 'zipCode', 'postalCode'),
        country: this.readString(deliveryAddress, 'country') || 'Turkey'
      },
      notes: this.readString(order, 'notes') || undefined,
      paymentStatus: this.readString(order, 'paymentStatus') as OrderResponse['paymentStatus'],
      cancellationReason: (this.readString(order, 'cancellationReason') || null) as OrderResponse['cancellationReason'],
      estimatedDeliveryTime: this.readString(order, 'estimatedDeliveryTime'),
      createdAt: this.readString(order, 'createdAt', 'updatedAt'),
      items,
      statusHistory
    };
  }

  private normalizeOrderItem(item: unknown, fallbackCurrency: string): OrderResponse['items'][number] {
    const record = this.asRecord(item);
    const unitPrice = this.normalizeMoney(record['unitPrice'], this.readNumber(record, 'price'), fallbackCurrency);
    const subtotal = this.normalizeMoney(record['subtotal'] ?? record['totalPrice'], unitPrice.amount * this.readNumber(record, 'quantity'), unitPrice.currency);

    return {
      id: this.readString(record, 'id'),
      productId: this.readString(record, 'productId', 'menuItemId'),
      productName: this.readString(record, 'productName', 'menuItemName', 'name'),
      quantity: this.readNumber(record, 'quantity'),
      unitPrice,
      subtotal,
      specialInstructions: this.readString(record, 'specialInstructions') || undefined
    };
  }

  private normalizeStatusHistory(entry: unknown): OrderResponse['statusHistory'][number] {
    const record = this.asRecord(entry);

    return {
      id: this.readString(record, 'id') || `${this.readString(record, 'changedAt')}-${this.readString(record, 'toStatus', 'status')}`,
      status: this.readString(record, 'status', 'toStatus') as OrderStatus,
      changedBy: this.readString(record, 'changedBy') || 'system',
      reason: this.readString(record, 'reason') || undefined,
      changedAt: this.readString(record, 'changedAt')
    };
  }

  private normalizeMoney(source: unknown, fallbackAmount = 0, fallbackCurrency = 'TRY'): OrderResponse['totalAmount'] {
    if (typeof source === 'number') {
      return { amount: source, currency: fallbackCurrency };
    }

    const record = this.asRecord(source);
    return {
      amount: this.readNumber(record, 'amount') || fallbackAmount,
      currency: this.readString(record, 'currency') || fallbackCurrency
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private readString(record: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string') {
        return value;
      }
    }

    return '';
  }

  private readNumber(record: Record<string, unknown>, ...keys: string[]): number {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return 0;
  }

  private readBoolean(record: Record<string, unknown>, ...keys: string[]): boolean {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'boolean') {
        return value;
      }
    }

    return false;
  }
}
