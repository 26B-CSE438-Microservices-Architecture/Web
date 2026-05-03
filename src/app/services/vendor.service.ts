import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Vendor,
  CreateVendorRequest,
  UpdateVendorRequest,
  VendorStatusPatch,
  VendorMenu,
  Review,
  Campaign,
  CreateCategoryRequest,
  NearbyQuery,
  PagedResult
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/vendors`;

  // ── Listing ──────────────────────────────────────────────────────────────

  getAll(page = 0, size = 20): Observable<PagedResult<Vendor> | Vendor[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
    return this.http.get<PagedResult<Vendor> | Vendor[]>(this.base, { params });
  }

  getNearby(query: NearbyQuery): Observable<Vendor[]> {
    let params = new HttpParams()
      .set('latitude', query.latitude)
      .set('longitude', query.longitude);
    if (query.radiusKm != null) {
      params = params.set('radiusKm', query.radiusKm);
    }
    return this.http.get<Vendor[]>(`${this.base}/nearby`, { params });
  }

  getById(vendorId: string): Observable<Vendor> {
    return this.http.get<Vendor>(`${this.base}/${vendorId}`);
  }

  // ── Sub-resources ────────────────────────────────────────────────────────

  getMenu(vendorId: string): Observable<VendorMenu> {
    return this.http.get<VendorMenu>(`${this.base}/${vendorId}/menu`);
  }

  getReviews(vendorId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/${vendorId}/reviews`);
  }

  getCampaigns(vendorId: string): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.base}/${vendorId}/campaigns`);
  }

  // ── Mutations ────────────────────────────────────────────────────────────

  create(data: CreateVendorRequest): Observable<Vendor> {
    return this.http.post<Vendor>(this.base, data);
  }

  update(vendorId: string, data: UpdateVendorRequest): Observable<Vendor> {
    return this.http.put<Vendor>(`${this.base}/${vendorId}`, data);
  }

  patchStatus(vendorId: string, data: VendorStatusPatch): Observable<Vendor> {
    return this.http.patch<Vendor>(`${this.base}/${vendorId}/status`, data);
  }

  delete(vendorId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${vendorId}`);
  }

  addCategory(vendorId: string, data: CreateCategoryRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${vendorId}/categories`, data);
  }
}
