import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, of, switchMap, map, catchError, throwError, from } from 'rxjs';
import { environment } from '../../environments/environment';

import { OwnerInfo, RestaurantStatus, RestaurantProfile, UpdateRestaurantProfileDto } from '../models/owner.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly usersApiUrl = `${environment.apiBaseUrl}/users`;
  private readonly restaurantApiUrl = `${environment.apiBaseUrl}/vendors`;
  private readonly restaurantIdStorageKey = 'menu_restaurant_id';
  private readonly restaurantNameStorageKey = 'menu_restaurant_name';

  // Mock mode: false — data comes from the backend API
  private readonly useMockData = false;

  private mockOwner: OwnerInfo = {
    id: 'mock-owner-1',
    restaurantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Mock Owner',
    restaurantName: 'Mock Bistro',
    openClosedStatus: 'OPEN',
    restaurantSetupRequired: false
  };

  private mockProfile: RestaurantProfile = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Mock Bistro',
    description: 'Best burgers in town with fresh ingredients and bold flavors.',
    addressText: 'Taksim Square, Istanbul, Turkey',
    logoUrl: '',
    minOrderAmount: 15.00,
    deliveryFee: 2.50,
    status: 'Open',
    openingTime: '09:00:00',
    closingTime: '22:00:00'
  };

  getCurrentOwner(): Observable<OwnerInfo> {
    if (this.useMockData) {
      return of({ ...this.mockOwner });
    }

    return this.getAuthorizedJson<unknown>(`${this.usersApiUrl}/me`).pipe(
      switchMap((user) =>
        this.resolveRestaurantContext(user).pipe(
          switchMap((restaurant) => {
            if (!restaurant.id) {
              return of(this.normalizeOwnerInfo(user, restaurant.name, undefined, 'CLOSED'));
            }

            return this.getRestaurantProfile(restaurant.id).pipe(
              map((profile) =>
                this.normalizeOwnerInfo(user, restaurant.name || profile.name, restaurant.id, this.toOwnerStatus(profile.status))
              ),
              catchError(() =>
                of(this.normalizeOwnerInfo(user, restaurant.name, restaurant.id, 'CLOSED'))
              )
            );
          })
        )
      )
    );
  }

  setRestaurantStatus(status: RestaurantStatus): Observable<OwnerInfo> {
    if (this.useMockData) {
      this.mockOwner = {
        ...this.mockOwner,
        openClosedStatus: status
      };
      return of({ ...this.mockOwner });
    }

    return this.resolveRestaurantContext().pipe(
      switchMap((restaurant) => {
        if (!restaurant.id) {
          return throwError(() => new Error('Restaurant context unavailable'));
        }

        return this.sendAuthorizedRequest(
          `${this.restaurantApiUrl}/${restaurant.id}/status`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: this.toProfileStatus(status) })
          }
        ).pipe(
          switchMap(() => this.getCurrentOwner()),
          map((owner) => ({
            ...owner,
            restaurantId: restaurant.id,
            restaurantName: restaurant.name || owner.restaurantName,
            openClosedStatus: status,
            restaurantSetupRequired: false
          }))
        );
      })
    );
  }

  getRestaurantProfile(restaurantId: string): Observable<RestaurantProfile> {
    if (this.useMockData) {
      return of({ ...this.mockProfile });
    }

    return this.getAuthorizedJson<unknown>(`${this.restaurantApiUrl}/${restaurantId}`).pipe(
      map((response) => this.normalizeRestaurantProfile(response, restaurantId))
    );
  }

  createRestaurantProfile(dto: UpdateRestaurantProfileDto): Observable<RestaurantProfile> {
    if (this.useMockData) {
      const restaurantId = `mock-${Date.now()}`;

      this.mockProfile = {
        ...this.mockProfile,
        id: restaurantId,
        name: dto.name,
        description: dto.description,
        addressText: dto.addressText,
        logoUrl: dto.logoUrl,
        minOrderAmount: dto.minOrderAmount,
        deliveryFee: dto.deliveryFee
      };

      this.mockOwner = {
        ...this.mockOwner,
        restaurantId,
        restaurantName: dto.name,
        restaurantSetupRequired: false
      };

      this.storeRestaurantContext(restaurantId, dto.name);
      return of({ ...this.mockProfile });
    }

    const payload = {
      name: dto.name,
      description: dto.description,
      address_text: dto.addressText,
      logo_url: dto.logoUrl,
      min_order_amount: dto.minOrderAmount,
      delivery_fee: dto.deliveryFee
    };

    return this.http.post<unknown>(this.restaurantApiUrl, payload, { observe: 'response' }).pipe(
      switchMap((response) => {
        const restaurantId = this.extractRestaurantIdFromCreateResponse(response);

        if (!restaurantId) {
          return throwError(() => new Error('Restaurant was created but no id was returned by the API.'));
        }

        this.storeRestaurantContext(restaurantId, dto.name);
        return this.getRestaurantProfile(restaurantId);
      })
    );
  }

  updateRestaurantProfile(restaurantId: string, dto: UpdateRestaurantProfileDto): Observable<RestaurantProfile> {
    if (this.useMockData) {
      this.mockProfile = { ...this.mockProfile, ...dto };
      this.storeRestaurantContext(restaurantId, dto.name);
      return of({ ...this.mockProfile });
    }

    const payload = {
      name: dto.name,
      description: dto.description,
      address_text: dto.addressText,
      logo_url: dto.logoUrl,
      min_order_amount: dto.minOrderAmount,
      delivery_fee: dto.deliveryFee
    };

    return this.sendAuthorizedRequest(`${this.restaurantApiUrl}/${restaurantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).pipe(
      switchMap(() => this.getRestaurantProfile(restaurantId)),
      map((profile) => {
        this.storeRestaurantContext(profile.id, profile.name);
        return profile;
      })
    );
  }

  updateRestaurantStatus(restaurantId: string, status: string): Observable<RestaurantProfile> {
    if (this.useMockData) {
      this.mockProfile = { ...this.mockProfile, status };
      return of({ ...this.mockProfile });
    }

    return this.sendAuthorizedRequest(`${this.restaurantApiUrl}/${restaurantId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).pipe(
      switchMap(() => this.getRestaurantProfile(restaurantId))
    );
  }

  private sendAuthorizedRequest(url: string, init: RequestInit): Observable<void> {
    return this.sendAuthorizedResponse(url, init).pipe(
      switchMap(async (response) => {
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Request failed with status ${response.status}`);
        }
      })
    );
  }

  private getAuthorizedJson<T>(url: string): Observable<T> {
    return this.sendAuthorizedResponse(url, { method: 'GET' }).pipe(
      switchMap(async (response) => {
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || `Request failed with status ${response.status}`);
        }

        return response.json() as Promise<T>;
      })
    );
  }

  private sendAuthorizedResponse(url: string, init: RequestInit): Observable<Response> {
    const accessToken = this.authService.getAccessToken();
    if (!accessToken) {
      return throwError(() => new Error('Authentication required'));
    }

    return from(
      fetch(url, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          Authorization: `Bearer ${accessToken}`
        }
      })
    );
  }

  private resolveRestaurantContext(userResponse?: unknown): Observable<{ id?: string; name: string }> {
    const userLinkedRestaurant = this.extractRestaurantContextFromUser(userResponse);
    if (userLinkedRestaurant.id) {
      this.storeRestaurantContext(userLinkedRestaurant.id, userLinkedRestaurant.name);
      return of(userLinkedRestaurant);
    }

    const savedId = this.readBrowserStorage(this.restaurantIdStorageKey);
    const savedName = this.readBrowserStorage(this.restaurantNameStorageKey);

    if (savedId) {
      return of({ id: savedId, name: savedName });
    }

    if (environment.defaultVendorId) {
      return of({ id: environment.defaultVendorId, name: environment.defaultVendorName ?? '' });
    }

    return of({ id: undefined, name: '' });
  }

  private extractRestaurantContextFromUser(userResponse: unknown): { id?: string; name: string } {
    const user = this.asRecord(userResponse);
    const vendor = this.asRecord(user['vendor']);
    const restaurant = this.asRecord(user['restaurant']);

    const id =
      this.readString(user, 'restaurantId', 'restaurant_id', 'vendorId', 'vendor_id') ||
      this.readString(vendor, 'id', 'vendorId', 'vendor_id', 'restaurantId', 'restaurant_id') ||
      this.readString(restaurant, 'id', 'restaurantId', 'restaurant_id', 'vendorId', 'vendor_id');

    const name =
      this.readString(user, 'restaurantName', 'restaurant_name', 'vendorName', 'vendor_name') ||
      this.readString(vendor, 'name', 'restaurantName', 'restaurant_name', 'vendorName', 'vendor_name') ||
      this.readString(restaurant, 'name', 'restaurantName', 'restaurant_name', 'vendorName', 'vendor_name');

    return {
      id: id || undefined,
      name
    };
  }

  private normalizeOwnerInfo(
    response: unknown,
    restaurantName: string,
    restaurantId?: string,
    openClosedStatus: RestaurantStatus = 'CLOSED'
  ): OwnerInfo {
    const user = this.asRecord(response);

    return {
      id: this.readString(user, 'id'),
      restaurantId,
      name: this.readString(user, 'name') || 'Owner',
      email: this.readString(user, 'email'),
      phone: this.readNullableString(user, 'phone'),
      role: this.readString(user, 'role'),
      active: this.readBoolean(user, 'active'),
      createdAt: this.readString(user, 'createdAt', 'created_at'),
      restaurantName,
      openClosedStatus,
      restaurantSetupRequired: !restaurantId
    };
  }

  private normalizeRestaurantProfile(response: unknown, restaurantId: string): RestaurantProfile {
    const restaurant = this.asRecord(response);
    const workingHours = this.asRecord(restaurant['working_hours']);
    const deliveryInfo = this.asRecord(restaurant['delivery_info']);
    const status = this.readString(restaurant, 'status') || (this.readBoolean(workingHours, 'is_open') ? 'Open' : 'Closed');

    return {
      id: this.readString(restaurant, 'id') || restaurantId,
      name: this.readString(restaurant, 'name'),
      description: this.readString(restaurant, 'description'),
      addressText: this.readString(restaurant, 'address_text', 'addressText'),
      logoUrl: this.readString(restaurant, 'logo_url', 'logoUrl'),
      minOrderAmount: this.readNumber(deliveryInfo, 'minimum_basket_amount', 'min_order_amount', 'minimumBasketAmount'),
      deliveryFee: this.readNumber(deliveryInfo, 'delivery_fee', 'deliveryFee'),
      status,
      openingTime: this.readString(workingHours, 'open', 'opening_time', 'openingTime'),
      closingTime: this.readString(workingHours, 'close', 'closing_time', 'closingTime')
    };
  }

  private toOwnerStatus(status: string): RestaurantStatus {
    switch (status.toUpperCase()) {
      case 'OPEN':
        return 'OPEN';
      case 'BUSY':
        return 'BUSY';
      default:
        return 'CLOSED';
    }
  }

  private toProfileStatus(status: RestaurantStatus): string {
    switch (status) {
      case 'OPEN':
        return 'Open';
      case 'BUSY':
        return 'Busy';
      default:
        return 'Closed';
    }
  }

  private readBrowserStorage(key: string): string {
    if (typeof window === 'undefined') {
      return '';
    }

    return localStorage.getItem(key) ?? '';
  }

  private writeBrowserStorage(key: string, value: string): void {
    if (typeof window !== 'undefined' && value) {
      localStorage.setItem(key, value);
    }
  }

  private storeRestaurantContext(id: string, name: string): void {
    this.writeBrowserStorage(this.restaurantIdStorageKey, id);
    this.writeBrowserStorage(this.restaurantNameStorageKey, name);
  }

  private extractRestaurantIdFromCreateResponse(response: HttpResponse<unknown>): string {
    const body = this.asRecord(response.body);
    const directId = this.readString(body, 'id', 'vendor_id', 'vendorId');
    if (directId) {
      return directId;
    }

    const locationHeader = response.headers.get('location') ?? response.headers.get('Location');
    if (!locationHeader) {
      return '';
    }

    const parts = locationHeader.split('/').filter(Boolean);
    return parts.at(-1) ?? '';
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value === 'object' && value !== null) {
      return value as Record<string, unknown>;
    }

    return {};
  }

  private readString(record: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string') {
        return value;
      }
    }

    return '';
  }

  private readNullableString(record: Record<string, unknown>, ...keys: string[]): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string') {
        return value;
      }
      if (value === null) {
        return null;
      }
    }

    return null;
  }

  private readNumber(record: Record<string, unknown>, ...keys: string[]): number {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return 0;
  }

  private readBoolean(record: Record<string, unknown>, ...keys: string[]): boolean {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'boolean') {
        return value;
      }
    }

    return false;
  }
}

