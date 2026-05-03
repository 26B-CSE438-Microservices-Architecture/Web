import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';

import { DashboardSummary } from '../models/dashboard.models';
import { MenuService } from '../services/menu.service';
import { OrdersService } from '../services/orders.service';
import { MenuDto, ProductDto } from '../models/menu.models';
import { OrderResponse, OrderStatus as ApiOrderStatus } from '../models/orders.models';
import { environment } from '../../environments/environment';

type DashboardOrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'CANCELLED' | 'COMPLETED';

interface RecentOrderRow {
  orderId: string;
  orderTypeLabel: string;
  totalPrice: number;
  orderTime: string;
  status: DashboardOrderStatus;
}

interface TopSellerItem {
  id: string;
  name: string;
  soldUnits: number;
  revenue: number;
  stockLeft: number | null;
}

interface HourlyRevenuePoint {
  hourLabel: string;
  amount: number;
}

interface StatusSlice {
  status: DashboardOrderStatus;
  count: number;
  percentage: number;
}

interface DashboardViewModel {
  todayLabel: string;
  summary: DashboardSummary;
  menuItemsCount: number;
  lowStockItemsCount: number;
  topSellers: TopSellerItem[];
  recentOrders: RecentOrderRow[];
  hourlyRevenue: HourlyRevenuePoint[];
  statusBreakdown: StatusSlice[];
}

const EMPTY_VIEW_MODEL: DashboardViewModel = {
  todayLabel: new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }),
  summary: {
    dailyOrders: 0,
    activeOrders: 0,
    dailyRevenue: 0
  },
  menuItemsCount: 0,
  lowStockItemsCount: 0,
  topSellers: [],
  recentOrders: [],
  hourlyRevenue: [],
  statusBreakdown: []
};

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly menuService = inject(MenuService);

  private readonly viewModel = toSignal(
    combineLatest({
      orders: this.ordersService.getRestaurantOrders(undefined, 0, 100).pipe(
        map(response => response.content ?? []),
        catchError(() => of([] as OrderResponse[]))
      ),
      menu: this.menuService.getRestaurants().pipe(
        switchMap(restaurants => {
          // Prefer saved ID from menu page, then env default, then name match, then first
          const savedId = typeof localStorage !== 'undefined' ? localStorage.getItem('menu_restaurant_id') : null;
          const defaultId = environment.defaultVendorId;
          const defaultName = environment.defaultVendorName?.trim().toLowerCase();

          let restaurantId: string | undefined;
          if (savedId) {
            restaurantId = savedId;
          } else if (defaultId) {
            restaurantId = defaultId;
          } else if (defaultName) {
            restaurantId = restaurants.find(r => r.name.trim().toLowerCase() === defaultName)?.id;
          }
          if (!restaurantId) {
            restaurantId = restaurants[0]?.id;
          }

          if (!restaurantId) {
            return of(null);
          }
          return this.menuService.getRestaurantMenu(restaurantId).pipe(catchError(() => of(null)));
        }),
        catchError(() => of(null))
      )
    }).pipe(map(({ orders, menu }) => this.buildViewModel(orders, menu))),
    { initialValue: EMPTY_VIEW_MODEL }
  );

  readonly today = computed(() => this.viewModel().todayLabel);
  readonly summary = computed(() => this.viewModel().summary);
  readonly menuItemsCount = computed(() => this.viewModel().menuItemsCount);
  readonly lowStockItemsCount = computed(() => this.viewModel().lowStockItemsCount);
  readonly topSellers = computed(() => this.viewModel().topSellers);
  readonly recentOrders = computed(() => this.viewModel().recentOrders);
  readonly hourlyRevenue = computed(() => this.viewModel().hourlyRevenue);
  readonly statusBreakdown = computed(() => this.viewModel().statusBreakdown);

  readonly hasOrders = computed(() => this.recentOrders().length > 0);
  readonly peakHour = computed(() => {
    const data = this.hourlyRevenue();
    if (data.length === 0) {
      return null;
    }

    return data.reduce((max, item) => (item.amount > max.amount ? item : max));
  });
  readonly maxHourlyRevenue = computed(() =>
    Math.max(...this.hourlyRevenue().map(item => item.amount), 1)
  );

  barHeight(amount: number): number {
    if (amount <= 0) {
      return 0;
    }

    return Math.max((amount / this.maxHourlyRevenue()) * 100, 8);
  }

  stockLabel(stockLeft: number | null): string {
    if (stockLeft === null) {
      return 'Stock n/a';
    }

    return `${stockLeft} left`;
  }

  statusLabel(status: DashboardOrderStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'PREPARING':
        return 'Preparing';
      case 'READY':
        return 'Ready';
      case 'CANCELLED':
        return 'Cancelled';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  }

  private buildViewModel(orders: OrderResponse[], menu: MenuDto | null): DashboardViewModel {
    const now = new Date();
    const todayOrders = orders.filter(order => this.isSameDay(order.createdAt, now));
    const sortedOrders = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const products = this.flattenMenuProducts(menu);
    const menuItemsCount = products.length;
    const lowStockItemsCount = products.filter(
      product => product.isAvailable && (product.stockCount ?? 0) > 0 && (product.stockCount ?? 0) <= 10
    ).length;
    const activeOrders = todayOrders.filter(order => !this.isTerminalStatus(order.status));

    return {
      todayLabel: now.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      summary: {
        dailyOrders: todayOrders.length,
        activeOrders: activeOrders.length,
        dailyRevenue: this.computeDailyRevenue(todayOrders)
      },
      menuItemsCount,
      lowStockItemsCount,
      topSellers: this.computeTopSellers(orders, products),
      recentOrders: sortedOrders.slice(0, 6).map(order => ({
        orderId: order.orderId,
        orderTypeLabel: this.formatOrderType(order.orderType),
        totalPrice: order.totalAmount.amount,
        orderTime: order.createdAt,
        status: this.mapOrderStatus(order.status)
      })),
      hourlyRevenue: this.computeHourlyRevenue(todayOrders),
      statusBreakdown: this.computeStatusBreakdown(activeOrders)
    };
  }

  private flattenMenuProducts(menu: MenuDto | null): ProductDto[] {
    if (!menu) {
      return [];
    }

    return menu.categories.flatMap(category => category.products);
  }

  private computeDailyRevenue(orders: OrderResponse[]): number {
    return orders
      .filter(order => order.paymentStatus !== 'FAILED' && !this.isCancelledLikeStatus(order.status))
      .reduce((sum, order) => sum + order.totalAmount.amount, 0);
  }

  private computeTopSellers(orders: OrderResponse[], menuProducts: ProductDto[]): TopSellerItem[] {
    const stockByName = new Map(
      menuProducts.map(product => [product.name.trim().toLowerCase(), product.stockCount ?? null])
    );
    const aggregated = new Map<string, TopSellerItem>();

    for (const order of orders) {
      for (const item of order.items) {
        const key = item.productName.trim().toLowerCase();
        const existing = aggregated.get(key);

        if (!existing) {
          aggregated.set(key, {
            id: item.productId,
            name: item.productName,
            soldUnits: item.quantity,
            revenue: item.subtotal.amount,
            stockLeft: stockByName.get(key) ?? null
          });
          continue;
        }

        existing.soldUnits += item.quantity;
        existing.revenue += item.subtotal.amount;
      }
    }

    return [...aggregated.values()]
      .sort((a, b) => b.soldUnits - a.soldUnits)
      .slice(0, 3);
  }

  private computeHourlyRevenue(todayOrders: OrderResponse[]): HourlyRevenuePoint[] {
    const groupedByHour = new Map<number, number>();

    for (const order of todayOrders) {
      if (this.isCancelledLikeStatus(order.status) || order.paymentStatus === 'FAILED') {
        continue;
      }

      const hour = new Date(order.createdAt).getHours();
      groupedByHour.set(hour, (groupedByHour.get(hour) ?? 0) + order.totalAmount.amount);
    }

    return [...groupedByHour.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, amount]) => ({
        hourLabel: `${String(hour).padStart(2, '0')}:00`,
        amount
      }));
  }

  private computeStatusBreakdown(activeOrders: OrderResponse[]): StatusSlice[] {
    if (activeOrders.length === 0) {
      return [];
    }

    const grouped = new Map<DashboardOrderStatus, number>([
      ['PENDING', 0],
      ['PREPARING', 0],
      ['READY', 0],
      ['COMPLETED', 0],
      ['CANCELLED', 0]
    ]);

    for (const order of activeOrders) {
      const mappedStatus = this.mapOrderStatus(order.status);
      grouped.set(mappedStatus, (grouped.get(mappedStatus) ?? 0) + 1);
    }

    return [...grouped.entries()]
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        status,
        count,
        percentage: Math.round((count / activeOrders.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }

  private formatOrderType(orderType: OrderResponse['orderType']): string {
    return orderType.toLowerCase().replace('_', ' ');
  }

  private mapOrderStatus(status: ApiOrderStatus): DashboardOrderStatus {
    switch (status) {
      case 'PREPARING':
        return 'PREPARING';
      case 'READY_FOR_PICKUP':
      case 'ON_THE_WAY':
        return 'READY';
      case 'DELIVERED':
        return 'COMPLETED';
      case 'CANCELLED':
      case 'REJECTED_BY_RESTAURANT':
      case 'PAYMENT_FAILED':
      case 'RESTAURANT_TIMEOUT':
      case 'EXPIRED':
      case 'REFUND_REQUESTED':
      case 'REFUNDED':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }

  private isTerminalStatus(status: ApiOrderStatus): boolean {
    return (
      status === 'DELIVERED' ||
      status === 'CANCELLED' ||
      status === 'REJECTED_BY_RESTAURANT' ||
      status === 'PAYMENT_FAILED' ||
      status === 'EXPIRED' ||
      status === 'REFUNDED'
    );
  }

  private isCancelledLikeStatus(status: ApiOrderStatus): boolean {
    return (
      status === 'CANCELLED' ||
      status === 'REJECTED_BY_RESTAURANT' ||
      status === 'PAYMENT_FAILED' ||
      status === 'RESTAURANT_TIMEOUT' ||
      status === 'EXPIRED' ||
      status === 'REFUND_REQUESTED' ||
      status === 'REFUNDED'
    );
  }

  private isSameDay(isoDate: string, now: Date): boolean {
    const date = new Date(isoDate);
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }
}
