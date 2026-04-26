import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import {
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

  // Gateway route: /api/order/**, downstream order-service route: /orders/**
  private readonly apiBaseUrl = '/api/order';

  // Mock mode: set to true to use in-memory data instead of backend calls.
  private readonly useMockData = true;

  private mockOrders: OrderResponse[] = [
    {
      orderId: 'order-001',
      status: 'PAYMENT_HELD',
      orderType: 'DELIVERY',
      restaurantId: 'rest-001',
      totalAmount: { amount: 45.99, currency: 'USD' },
      deliveryFee: { amount: 3.5, currency: 'USD' },
      deliveryAddress: {
        street: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'USA'
      },
      notes: 'Extra sauce on the side',
      paymentStatus: 'HELD',
      cancellationReason: null,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      items: [
        {
          id: 'item-001',
          productId: 'prod-001',
          productName: 'Cheeseburger',
          quantity: 2,
          unitPrice: { amount: 9.99, currency: 'USD' },
          subtotal: { amount: 19.98, currency: 'USD' }
        },
        {
          id: 'item-002',
          productId: 'prod-002',
          productName: 'Caesar Salad',
          quantity: 1,
          unitPrice: { amount: 7.99, currency: 'USD' },
          subtotal: { amount: 7.99, currency: 'USD' }
        }
      ],
      statusHistory: [
        {
          id: 'hist-001',
          status: 'CREATED',
          changedBy: 'CUSTOMER',
          changedAt: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          id: 'hist-002',
          status: 'PAYMENT_PENDING',
          changedBy: 'SYSTEM',
          changedAt: new Date(Date.now() - 4 * 60000).toISOString()
        },
        {
          id: 'hist-003',
          status: 'PAYMENT_HELD',
          changedBy: 'PAYMENT_SERVICE',
          reason: 'Payment hold confirmed',
          changedAt: new Date(Date.now() - 3 * 60000).toISOString()
        }
      ]
    },
    {
      orderId: 'order-002',
      status: 'CONFIRMED_BY_RESTAURANT',
      orderType: 'DELIVERY',
      restaurantId: 'rest-001',
      totalAmount: { amount: 32.50, currency: 'USD' },
      deliveryFee: { amount: 2.5, currency: 'USD' },
      deliveryAddress: {
        street: '456 Park Ave',
        city: 'New York',
        zipCode: '10002',
        country: 'USA'
      },
      notes: 'Allergic to nuts',
      paymentStatus: 'CAPTURED',
      cancellationReason: null,
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      items: [
        {
          id: 'item-003',
          productId: 'prod-003',
          productName: 'Grilled Chicken',
          quantity: 1,
          unitPrice: { amount: 11.99, currency: 'USD' },
          subtotal: { amount: 11.99, currency: 'USD' }
        },
        {
          id: 'item-004',
          productId: 'prod-004',
          productName: 'Fries',
          quantity: 1,
          unitPrice: { amount: 3.99, currency: 'USD' },
          subtotal: { amount: 3.99, currency: 'USD' }
        }
      ],
      statusHistory: [
        {
          id: 'hist-004',
          status: 'CREATED',
          changedBy: 'CUSTOMER',
          changedAt: new Date(Date.now() - 15 * 60000).toISOString()
        },
        {
          id: 'hist-005',
          status: 'PAID',
          changedBy: 'PAYMENT_SERVICE',
          changedAt: new Date(Date.now() - 10 * 60000).toISOString()
        },
        {
          id: 'hist-006',
          status: 'CONFIRMED_BY_RESTAURANT',
          changedBy: 'RESTAURANT',
          changedAt: new Date(Date.now() - 5 * 60000).toISOString()
        }
      ]
    },
    {
      orderId: 'order-003',
      status: 'PREPARING',
      orderType: 'DELIVERY',
      restaurantId: 'rest-001',
      totalAmount: { amount: 28.75, currency: 'USD' },
      deliveryFee: { amount: 2.0, currency: 'USD' },
      deliveryAddress: {
        street: '789 Broadway',
        city: 'New York',
        zipCode: '10003',
        country: 'USA'
      },
      notes: '',
      paymentStatus: 'CAPTURED',
      cancellationReason: null,
      estimatedDeliveryTime: new Date(Date.now() + 20 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      items: [
        {
          id: 'item-005',
          productId: 'prod-005',
          productName: 'Pasta Carbonara',
          quantity: 1,
          unitPrice: { amount: 13.99, currency: 'USD' },
          subtotal: { amount: 13.99, currency: 'USD' }
        }
      ],
      statusHistory: [
        {
          id: 'hist-007',
          status: 'CREATED',
          changedBy: 'CUSTOMER',
          changedAt: new Date(Date.now() - 25 * 60000).toISOString()
        },
        {
          id: 'hist-008',
          status: 'PAID',
          changedBy: 'PAYMENT_SERVICE',
          changedAt: new Date(Date.now() - 20 * 60000).toISOString()
        },
        {
          id: 'hist-009',
          status: 'CONFIRMED_BY_RESTAURANT',
          changedBy: 'RESTAURANT',
          changedAt: new Date(Date.now() - 15 * 60000).toISOString()
        },
        {
          id: 'hist-010',
          status: 'PREPARING',
          changedBy: 'RESTAURANT',
          changedAt: new Date(Date.now() - 5 * 60000).toISOString()
        }
      ]
    },
    {
      orderId: 'order-004',
      status: 'READY_FOR_PICKUP',
      orderType: 'TAKEOUT',
      restaurantId: 'rest-001',
      totalAmount: { amount: 19.99, currency: 'USD' },
      deliveryFee: { amount: 0.0, currency: 'USD' },
      deliveryAddress: {
        street: '',
        city: '',
        zipCode: '',
        country: ''
      },
      notes: 'Please put in container',
      paymentStatus: 'CAPTURED',
      cancellationReason: null,
      estimatedDeliveryTime: new Date(Date.now() + 2 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
      items: [
        {
          id: 'item-006',
          productId: 'prod-006',
          productName: 'Margherita Pizza',
          quantity: 1,
          unitPrice: { amount: 11.99, currency: 'USD' },
          subtotal: { amount: 11.99, currency: 'USD' }
        }
      ],
      statusHistory: [
        {
          id: 'hist-011',
          status: 'CREATED',
          changedBy: 'CUSTOMER',
          changedAt: new Date(Date.now() - 10 * 60000).toISOString()
        },
        {
          id: 'hist-012',
          status: 'PAID',
          changedBy: 'PAYMENT_SERVICE',
          changedAt: new Date(Date.now() - 8 * 60000).toISOString()
        },
        {
          id: 'hist-013',
          status: 'CONFIRMED_BY_RESTAURANT',
          changedBy: 'RESTAURANT',
          changedAt: new Date(Date.now() - 6 * 60000).toISOString()
        },
        {
          id: 'hist-014',
          status: 'READY_FOR_PICKUP',
          changedBy: 'RESTAURANT',
          changedAt: new Date(Date.now() - 1 * 60000).toISOString()
        }
      ]
    },
    {
      orderId: 'order-005',
      status: 'DELIVERED',
      orderType: 'DELIVERY',
      restaurantId: 'rest-001',
      totalAmount: { amount: 55.40, currency: 'USD' },
      deliveryFee: { amount: 3.5, currency: 'USD' },
      deliveryAddress: {
        street: '321 5th Ave',
        city: 'New York',
        zipCode: '10004',
        country: 'USA'
      },
      notes: '',
      paymentStatus: 'CAPTURED',
      cancellationReason: null,
      estimatedDeliveryTime: new Date(Date.now() - 5 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
      items: [
        {
          id: 'item-007',
          productId: 'prod-007',
          productName: 'Steak & Fries',
          quantity: 2,
          unitPrice: { amount: 18.99, currency: 'USD' },
          subtotal: { amount: 37.98, currency: 'USD' }
        }
      ],
      statusHistory: [
        {
          id: 'hist-015',
          status: 'CREATED',
          changedBy: 'CUSTOMER',
          changedAt: new Date(Date.now() - 90 * 60000).toISOString()
        },
        {
          id: 'hist-016',
          status: 'PAID',
          changedBy: 'PAYMENT_SERVICE',
          changedAt: new Date(Date.now() - 85 * 60000).toISOString()
        },
        {
          id: 'hist-017',
          status: 'CONFIRMED_BY_RESTAURANT',
          changedBy: 'RESTAURANT',
          changedAt: new Date(Date.now() - 80 * 60000).toISOString()
        },
        {
          id: 'hist-018',
          status: 'PREPARING',
          changedBy: 'RESTAURANT',
          changedAt: new Date(Date.now() - 70 * 60000).toISOString()
        },
        {
          id: 'hist-019',
          status: 'READY_FOR_PICKUP',
          changedBy: 'RESTAURANT',
          changedAt: new Date(Date.now() - 50 * 60000).toISOString()
        },
        {
          id: 'hist-020',
          status: 'ON_THE_WAY',
          changedBy: 'SYSTEM',
          changedAt: new Date(Date.now() - 40 * 60000).toISOString()
        },
        {
          id: 'hist-021',
          status: 'DELIVERED',
          changedBy: 'DELIVERY_SERVICE',
          changedAt: new Date(Date.now() - 5 * 60000).toISOString()
        }
      ]
    },
    {
      orderId: 'order-006',
      status: 'REJECTED_BY_RESTAURANT',
      orderType: 'DELIVERY',
      restaurantId: 'rest-001',
      totalAmount: { amount: 22.50, currency: 'USD' },
      deliveryFee: { amount: 2.5, currency: 'USD' },
      deliveryAddress: {
        street: '654 Madison Ave',
        city: 'New York',
        zipCode: '10005',
        country: 'USA'
      },
      notes: '',
      paymentStatus: 'CAPTURED',
      cancellationReason: 'RESTAURANT_REJECTED',
      estimatedDeliveryTime: new Date(Date.now() - 30 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
      items: [
        {
          id: 'item-008',
          productId: 'prod-008',
          productName: 'Fish Tacos',
          quantity: 3,
          unitPrice: { amount: 5.99, currency: 'USD' },
          subtotal: { amount: 17.97, currency: 'USD' }
        }
      ],
      statusHistory: [
        {
          id: 'hist-022',
          status: 'CREATED',
          changedBy: 'CUSTOMER',
          changedAt: new Date(Date.now() - 45 * 60000).toISOString()
        },
        {
          id: 'hist-023',
          status: 'PAID',
          changedBy: 'PAYMENT_SERVICE',
          changedAt: new Date(Date.now() - 40 * 60000).toISOString()
        },
        {
          id: 'hist-024',
          status: 'REJECTED_BY_RESTAURANT',
          changedBy: 'RESTAURANT',
          reason: 'Ingredients out of stock',
          changedAt: new Date(Date.now() - 35 * 60000).toISOString()
        }
      ]
    }
  ];

  getRestaurantOrders(
    status?: OrderStatus,
    page: number = 0,
    size: number = 20
  ): Observable<PageResponse<OrderResponse>> {
    if (this.useMockData) {
      return this.getMockOrders(status, page, size);
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PageResponse<OrderResponse>>(
      `${this.apiBaseUrl}/orders/restaurant`,
      { params }
    );
  }

  getOrderDetails(orderId: string): Observable<OrderResponse> {
    if (this.useMockData) {
      return of(this.mockOrders.find(o => o.orderId === orderId)!);
    }

    return this.http.get<OrderResponse>(`${this.apiBaseUrl}/orders/${orderId}`);
  }

  confirmOrder(
    orderId: string,
    request?: ConfirmOrderRequest
  ): Observable<void> {
    if (this.useMockData) {
      const order = this.mockOrders.find(o => o.orderId === orderId);
      if (order) {
        order.status = 'CONFIRMED_BY_RESTAURANT';
        order.statusHistory.push({
          id: `hist-${Date.now()}`,
          status: 'CONFIRMED_BY_RESTAURANT',
          changedBy: 'RESTAURANT',
          changedAt: new Date().toISOString()
        });
      }
      return of(void 0);
    }

    return this.http.patch<void>(
      `${this.apiBaseUrl}/orders/restaurant/${orderId}/confirm`,
      request || {}
    );
  }

  rejectOrder(
    orderId: string,
    request: RejectOrderRequest
  ): Observable<void> {
    if (this.useMockData) {
      const order = this.mockOrders.find(o => o.orderId === orderId);
      if (order) {
        order.status = 'REJECTED_BY_RESTAURANT';
        order.cancellationReason = 'RESTAURANT_REJECTED';
        order.statusHistory.push({
          id: `hist-${Date.now()}`,
          status: 'REJECTED_BY_RESTAURANT',
          changedBy: 'RESTAURANT',
          reason: request.reason,
          changedAt: new Date().toISOString()
        });
      }
      return of(void 0);
    }

    return this.http.patch<void>(
      `${this.apiBaseUrl}/orders/restaurant/${orderId}/reject`,
      request
    );
  }

  updateOrderStatus(
    orderId: string,
    request: UpdateOrderStatusRequest
  ): Observable<void> {
    if (this.useMockData) {
      const order = this.mockOrders.find(o => o.orderId === orderId);
      if (order) {
        order.status = request.status;
        order.statusHistory.push({
          id: `hist-${Date.now()}`,
          status: request.status,
          changedBy: 'RESTAURANT',
          reason: request.notes,
          changedAt: new Date().toISOString()
        });
      }
      return of(void 0);
    }

    return this.http.patch<void>(
      `${this.apiBaseUrl}/orders/restaurant/${orderId}/status`,
      request
    );
  }

  private getMockOrders(
    status?: OrderStatus,
    page: number = 0,
    size: number = 20
  ): Observable<PageResponse<OrderResponse>> {
    let filtered = this.mockOrders;

    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }

    const startIdx = page * size;
    const endIdx = startIdx + size;
    const content = filtered.slice(startIdx, endIdx);

    return of({
      content,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      currentPage: page,
      pageSize: size,
      hasNext: endIdx < filtered.length,
      hasPrevious: page > 0
    });
  }
}
