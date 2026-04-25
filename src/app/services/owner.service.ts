import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { OwnerInfo, RestaurantStatus } from '../models/owner.models';

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = '/api';

  // Mock mode: set to true to use in-memory data instead of backend calls.
  private readonly useMockData = true;

  private mockOwner: OwnerInfo = {
    id: 'mock-owner-1',
    restaurantId: 'mock-restaurant-1',
    name: 'Mock Owner',
    restaurantName: 'Mock Bistro',
    openClosedStatus: 'OPEN'
  };

  getCurrentOwner(): Observable<OwnerInfo> {
    if (this.useMockData) {
      return of({ ...this.mockOwner });
    }

    return this.http.get<OwnerInfo>(`${this.apiBaseUrl}/owners/me`);
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
      `${this.apiBaseUrl}/restaurants/status`,
      {
        status
      }
    );
  }
}

