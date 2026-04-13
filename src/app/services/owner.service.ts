import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { OwnerInfo, RestaurantStatus } from '../models/owner.models';

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = '/api';

  getCurrentOwner(): Observable<OwnerInfo> {
    return this.http.get<OwnerInfo>(`${this.apiBaseUrl}/owners/me`);
  }

  setRestaurantStatus(status: RestaurantStatus): Observable<OwnerInfo> {
    return this.http.patch<OwnerInfo>(
      `${this.apiBaseUrl}/restaurants/status`,
      {
        status
      }
    );
  }
}

