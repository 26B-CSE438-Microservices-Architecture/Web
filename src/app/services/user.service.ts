import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  UserProfile,
  UpdateProfileRequest,
  Address,
  CreateAddressRequest,
  FavoriteVendor
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/users`;

  // ── Profile ──────────────────────────────────────────────────────────────

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/me`);
  }

  updateMe(data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/me`, data);
  }

  // ── Addresses ────────────────────────────────────────────────────────────

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.base}/me/addresses`);
  }

  addAddress(data: CreateAddressRequest): Observable<Address> {
    return this.http.post<Address>(`${this.base}/me/addresses`, data);
  }

  deleteAddress(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/me/addresses/${id}`);
  }

  // ── Favorites ────────────────────────────────────────────────────────────

  getFavorites(): Observable<FavoriteVendor[]> {
    return this.http.get<FavoriteVendor[]>(`${this.base}/me/favorites`);
  }

  addFavorite(vendorId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/me/favorites/${vendorId}`, {});
  }

  removeFavorite(vendorId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/me/favorites/${vendorId}`);
  }
}
