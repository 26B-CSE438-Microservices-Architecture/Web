import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Payment, CreatePaymentRequest, PagedResult } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/payments`;

  createPayment(data: CreatePaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.base, data);
  }

  getPayments(): Observable<Payment[] | PagedResult<Payment>> {
    return this.http.get<Payment[] | PagedResult<Payment>>(this.base);
  }

  getPayment(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.base}/${id}`);
  }

  capturePayment(id: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.base}/${id}/capture`, {});
  }

  cancelPayment(id: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.base}/${id}/cancel`, {});
  }
}
