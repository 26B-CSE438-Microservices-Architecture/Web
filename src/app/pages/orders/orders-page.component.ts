import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, switchMap } from 'rxjs';

import { OrdersService } from '../../services/orders.service';
import { AuthService } from '../../services/auth.service';
import { OwnerService } from '../../services/owner.service';
import {
  OrderResponse,
  OrderStatus,
  PageResponse,
  UpdateOrderStatusRequest,
  RejectOrderRequest
} from '../../models/orders.models';

@Component({
  selector: 'app-orders-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPageComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly authService = inject(AuthService);
  private readonly ownerService = inject(OwnerService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private hasRetriedForbidden = false;

  readonly orders = signal<OrderResponse[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly currentPage = signal(0);
  readonly pageSize = signal(20);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);

  readonly selectedStatusFilter = signal<OrderStatus | null>(null);
  readonly showingDetails = signal<string | null>(null);
  readonly editingOrderId = signal<string | null>(null);
  readonly showingRejectForm = signal<string | null>(null);
  readonly showingStatusForm = signal<string | null>(null);

  readonly filterStatuses: OrderStatus[] = [
    'PAYMENT_PENDING',
    'PAYMENT_HELD',
    'CONFIRMED_BY_RESTAURANT',
    'PAID',
    'PREPARING',
    'READY_FOR_PICKUP',
    'ON_THE_WAY',
    'DELIVERED',
    'CANCELLED',
    'EXPIRED'
  ];

  private static readonly RESTAURANT_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
    'PAYMENT_PENDING':        ['PAYMENT_HELD', 'PAYMENT_FAILED', 'EXPIRED', 'CANCELLED'],
    // PAYMENT_HELD → CONFIRMED/REJECTED handled by dedicated Confirm/Reject buttons
    'CONFIRMED_BY_RESTAURANT': ['PAYMENT_CAPTURE_PENDING', 'CANCELLED'],
    'PAYMENT_CAPTURE_PENDING': ['PAID', 'PAYMENT_FAILED'],
    'PAID':                   ['PREPARING', 'CANCELLED'],
    'PREPARING':              ['READY_FOR_PICKUP', 'CANCELLED'],
    'READY_FOR_PICKUP':       ['ON_THE_WAY'],
    'ON_THE_WAY':             ['DELIVERED'],
    'CANCELLED':              ['REFUND_REQUESTED'],
    'REFUND_REQUESTED':       ['REFUNDED'],
  };

  getAvailableStatuses(currentStatus: OrderStatus): OrderStatus[] {
    return OrdersPageComponent.RESTAURANT_TRANSITIONS[currentStatus] ?? [];
  }

  readonly filteredOrders = computed(() => {
    return this.orders();
  });

  readonly rejectForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.maxLength(500)]]
  });

  readonly statusForm = this.fb.nonNullable.group({
    status: ['PREPARING' as OrderStatus, [Validators.required]],
    notes: ['', [Validators.maxLength(500)]]
  });

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    this.initializeOrders();
  }

  private initializeOrders(): void {
    this.ownerService
      .getCurrentOwner()
      .pipe(
        switchMap((owner) => {
          if (!owner.restaurantId || !this.authService.getRefreshToken()) {
            return EMPTY;
          }

          return this.authService.refreshSession().pipe(
            catchError(() => EMPTY)
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        complete: () => {
          this.loadOrders();
        }
      });
  }

  loadOrders(): void {
    const status = this.selectedStatusFilter();
    this.loading.set(true);
    this.errorMessage.set(null);

    this.ordersService
      .getRestaurantOrders(status || undefined, this.currentPage(), this.pageSize())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: PageResponse<OrderResponse>) => {
          this.orders.set(response.content);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
        },
        error: (error: unknown) => {
          if (this.tryRecoverFromForbidden(error)) {
            return;
          }

          this.errorMessage.set(this.extractErrorMessage(error));
          this.orders.set([]);
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        }
      });
  }

  filterByStatus(status: OrderStatus | null): void {
    this.selectedStatusFilter.set(status);
    this.currentPage.set(0);
    this.loadOrders();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadOrders();
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadOrders();
    }
  }

  showOrderDetails(orderId: string): void {
    if (this.showingDetails() === orderId) {
      this.showingDetails.set(null);
    } else {
      this.showingDetails.set(orderId);
      this.editingOrderId.set(null);
      this.showingRejectForm.set(null);
      this.showingStatusForm.set(null);
    }
  }

  startEditOrder(orderId: string): void {
    this.editingOrderId.set(orderId);
    this.showingRejectForm.set(null);
    this.showingStatusForm.set(null);
  }

  cancelEdit(): void {
    this.editingOrderId.set(null);
    this.showingRejectForm.set(null);
    this.showingStatusForm.set(null);
  }

  confirmOrder(orderId: string): void {
    if (!confirm('Confirm this order?')) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.ordersService
      .confirmOrder(orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Order confirmed successfully.');
          this.editingOrderId.set(null);
          this.loadOrders();
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.extractErrorMessage(error));
        },
        complete: () => {
          this.submitting.set(false);
        }
      });
  }

  startRejectOrder(orderId: string): void {
    this.showingRejectForm.set(orderId);
    this.showingStatusForm.set(null);
    this.rejectForm.reset();
  }

  rejectOrder(orderId: string): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    const request: RejectOrderRequest = this.rejectForm.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.ordersService
      .rejectOrder(orderId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Order rejected successfully.');
          this.showingRejectForm.set(null);
          this.editingOrderId.set(null);
          this.loadOrders();
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.extractErrorMessage(error));
        },
        complete: () => {
          this.submitting.set(false);
        }
      });
  }

  startChangeStatus(orderId: string, currentStatus: OrderStatus): void {
    const available = this.getAvailableStatuses(currentStatus);
    this.showingStatusForm.set(orderId);
    this.showingRejectForm.set(null);
    this.statusForm.patchValue({ status: available[0] ?? 'PREPARING' });
  }

  updateOrderStatus(orderId: string): void {
    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    const request: UpdateOrderStatusRequest = this.statusForm.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.ordersService
      .updateOrderStatus(orderId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set('Order status updated successfully.');
          this.showingStatusForm.set(null);
          this.editingOrderId.set(null);
          this.loadOrders();
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.extractErrorMessage(error));
        },
        complete: () => {
          this.submitting.set(false);
        }
      });
  }

  getStatusBadgeClass(status: OrderStatus): string {
    const statusClasses: { [key in OrderStatus]: string } = {
      'CREATED': 'status-badge status-neutral',
      'PAYMENT_PENDING': 'status-badge status-warning',
      'PAYMENT_HELD': 'status-badge status-warning',
      'PAYMENT_CAPTURE_PENDING': 'status-badge status-warning',
      'PAYMENT_FAILED': 'status-badge status-danger',
      'PAID': 'status-badge status-success',
      'CONFIRMED_BY_RESTAURANT': 'status-badge status-success',
      'REJECTED_BY_RESTAURANT': 'status-badge status-danger',
      'RESTAURANT_TIMEOUT': 'status-badge status-danger',
      'PREPARING': 'status-badge status-info',
      'READY_FOR_PICKUP': 'status-badge status-success',
      'ON_THE_WAY': 'status-badge status-info',
      'DELIVERED': 'status-badge status-success',
      'CANCELLED': 'status-badge status-danger',
      'EXPIRED': 'status-badge status-danger',
      'REFUND_REQUESTED': 'status-badge status-warning',
      'REFUNDED': 'status-badge status-neutral'
    };
    return statusClasses[status] || 'status-badge status-neutral';
  }

  getStatusLabel(status: OrderStatus): string {
    const labels: { [key in OrderStatus]: string } = {
      'CREATED': 'Created',
      'PAYMENT_PENDING': 'Payment Pending',
      'PAYMENT_HELD': 'Payment Held',
      'PAYMENT_CAPTURE_PENDING': 'Capture Pending',
      'PAYMENT_FAILED': 'Payment Failed',
      'PAID': 'Paid',
      'CONFIRMED_BY_RESTAURANT': 'Confirmed',
      'REJECTED_BY_RESTAURANT': 'Rejected',
      'RESTAURANT_TIMEOUT': 'Restaurant Timeout',
      'PREPARING': 'Preparing',
      'READY_FOR_PICKUP': 'Ready',
      'ON_THE_WAY': 'On the Way',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled',
      'EXPIRED': 'Expired',
      'REFUND_REQUESTED': 'Refund Requested',
      'REFUNDED': 'Refunded'
    };
    return labels[status] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString();
  }

  clearBanner(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private extractErrorMessage(error: any): string {
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return 'An error occurred. Please try again.';
  }

  private tryRecoverFromForbidden(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse) || error.status !== 403) {
      return false;
    }

    if (this.hasRetriedForbidden || !this.authService.getRefreshToken()) {
      return false;
    }

    this.hasRetriedForbidden = true;
    this.authService
      .refreshSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadOrders();
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set(this.extractErrorMessage(error));
          this.orders.set([]);
        }
      });

    return true;
  }
}
