import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { DashboardSummary, OrderSummary } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = '/api';

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiBaseUrl}/dashboard/summary`);
  }

  getRecentOrders(limit = 6): Observable<OrderSummary[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<OrderSummary[]>(`${this.apiBaseUrl}/orders/active`, {
      params
    });
  }
}
