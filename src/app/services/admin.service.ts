import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminUser, UpdateUserRequest, PagedResult } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin`;

  getUsers(): Observable<AdminUser[] | PagedResult<AdminUser>> {
    return this.http.get<AdminUser[] | PagedResult<AdminUser>>(`${this.base}/users`);
  }

  updateUser(userId: string, data: UpdateUserRequest): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.base}/users/${userId}`, data);
  }

  activateUser(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/users/${id}/activate`, {});
  }

  deactivateUser(id: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/users/${id}/deactivate`, {});
  }
}
