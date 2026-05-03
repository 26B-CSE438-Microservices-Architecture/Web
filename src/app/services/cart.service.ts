import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Cart,
  AddCartItemRequest,
  UpdateCartItemRequest,
  CheckoutRequest,
  Order
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/cart`;

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.base);
  }

  addItem(data: AddCartItemRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.base}/items`, data);
  }

  updateItem(productId: string, data: UpdateCartItemRequest): Observable<Cart> {
    return this.http.put<Cart>(`${this.base}/items/${productId}`, data);
  }

  removeItem(productId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.base}/items/${productId}`);
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(this.base);
  }

  checkout(data: CheckoutRequest): Observable<Order> {
    return this.http.post<Order>(`${this.base}/checkout`, data);
  }
}
