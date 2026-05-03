import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

import { OwnerInfo, RestaurantStatus, RestaurantProfile, UpdateRestaurantProfileDto } from '../models/owner.models';

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = `${environment.apiBaseUrl}/auth`;
  private readonly restaurantApiUrl = `${environment.apiBaseUrl}/vendors`;

  // Mock mode: false — data comes from the backend API
  private readonly useMockData = false;

  private mockOwner: OwnerInfo = {
    id: 'mock-owner-1',
    restaurantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Mock Owner',
    restaurantName: 'Mock Bistro',
    openClosedStatus: 'OPEN'
  };

  private mockProfile: RestaurantProfile = {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Mock Bistro',
    description: 'Best burgers in town with fresh ingredients and bold flavors.',
    cuisineType: 'American',
    addressText: 'Taksim Square, Istanbul, Turkey',
    latitude: 41.0082,
    longitude: 28.9784,
    logoUrl: '',
    minOrderAmount: 15.00,
    deliveryFee: 2.50,
    isActive: true,
    status: 'Open',
    openingTime: '09:00:00',
    closingTime: '22:00:00',
    createdAt: '2026-01-15T10:00:00',
    updatedAt: '2026-04-01T08:30:00'
  };

  getCurrentOwner(): Observable<OwnerInfo> {
    if (this.useMockData) {
      return of({ ...this.mockOwner });
    }

    return this.http.get<OwnerInfo>(`${this.apiBaseUrl}/me`);
  }

  setRestaurantStatus(status: RestaurantStatus): Observable<OwnerInfo> {
    if (this.useMockData) {
      this.mockOwner = {
        ...this.mockOwner,
        openClosedStatus: status
      };
      return of({ ...this.mockOwner });
    }

    return this.http.patch<OwnerInfo>(
      `${this.restaurantApiUrl}/me/status`,
      { status }
    );
  }

  getRestaurantProfile(restaurantId: string): Observable<RestaurantProfile> {
    if (this.useMockData) {
      return of({ ...this.mockProfile });
    }
    return this.http.get<RestaurantProfile>(`${this.restaurantApiUrl}/${restaurantId}`);
  }

  updateRestaurantProfile(restaurantId: string, dto: UpdateRestaurantProfileDto): Observable<RestaurantProfile> {
    if (this.useMockData) {
      this.mockProfile = { ...this.mockProfile, ...dto, updatedAt: new Date().toISOString() };
      return of({ ...this.mockProfile });
    }
    return this.http.put<RestaurantProfile>(`${this.restaurantApiUrl}/${restaurantId}`, dto);
  }

  updateRestaurantStatus(restaurantId: string, status: string): Observable<RestaurantProfile> {
    if (this.useMockData) {
      this.mockProfile = { ...this.mockProfile, status };
      return of({ ...this.mockProfile });
    }
    return this.http.patch<RestaurantProfile>(`${this.restaurantApiUrl}/${restaurantId}/status`, { status });
  }
}

