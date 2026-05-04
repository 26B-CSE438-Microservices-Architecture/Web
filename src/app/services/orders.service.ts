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
      .set('page', page.toString())
      .set('size', size.toString());
      
    if (status) {
      params = params.set('status', status);
    }

    return this.http
      .get<OrderResponse[] | PageResponse<OrderResponse>>(`${this.base}/my`, { params })
      .pipe(
        map(res => {
          if (Array.isArray(res)) {
            return {
              content: res,
              totalElements: res.length,
              totalPages: 1,
              currentPage: page,
              pageSize: size,
              hasNext: false,
              hasPrevious: page > 0
            } as PageResponse<OrderResponse>;
          }
          return res as PageResponse<OrderResponse>;
        })
      );
  }

  confirmOrder(orderId: string, request?: ConfirmOrderRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${orderId}/confirm`, request ?? {});
  }

  rejectOrder(orderId: string, request: RejectOrderRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${orderId}/cancel`, request);
  }

  updateOrderStatus(orderId: string, request: UpdateOrderStatusRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/${orderId}/status`, request);
  }
}
