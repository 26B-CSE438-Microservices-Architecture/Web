import { ChangeDetectionStrategy, Component, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { DashboardService } from '../services/dashboard.service';
import { DashboardSummary, OrderSummary, OrderStatus } from '../models/dashboard.models';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly emptySummary: DashboardSummary = {
    dailyOrders: 0,
    activeOrders: 0,
    dailyRevenue: 0
  };

  readonly summary = this.isBrowser
    ? toSignal(
        this.dashboardService.getDashboardSummary().pipe(
          catchError(() => of(this.emptySummary))
        ),
        {
          initialValue: this.emptySummary
        }
      )
    : signal(this.emptySummary);

  readonly recentOrders = this.isBrowser
    ? toSignal(
        this.dashboardService.getRecentOrders(6).pipe(
          catchError(() => of([] as OrderSummary[]))
        ),
        {
          initialValue: [] as OrderSummary[]
        }
      )
    : signal([] as OrderSummary[]);

  readonly hasOrders = computed(() => this.recentOrders().length > 0);

  statusLabel(status: OrderStatus): string {
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
}
