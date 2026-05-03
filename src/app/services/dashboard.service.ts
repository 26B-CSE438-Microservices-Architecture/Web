import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardSummary, OrderSummary } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiBaseUrl}/home/discover`);
  }

  getRecentOrders(limit = 6): Observable<OrderSummary[]> {
    const params = new HttpParams().set('size', String(limit));
    return this.http.get<OrderSummary[]>(`${this.apiBaseUrl}/orders/my`, { params });
  }
}
