import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  AuthTokens,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyTokenRequest,
  UserProfile,
  UpdateProfileRequest
} from '../models/api.models';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiBaseUrl}/auth`;

  // ── Token helpers ────────────────────────────────────────────────────────

  getAccessToken(): string | null {
    return typeof window !== 'undefined'
      ? localStorage.getItem(ACCESS_TOKEN_KEY)
      : null;
  }

  getRefreshToken(): string | null {
    return typeof window !== 'undefined'
      ? localStorage.getItem(REFRESH_TOKEN_KEY)
      : null;
  }

  storeTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    }
  }

  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    this.router.navigate(['/login']);
  }

  get isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  // ── Auth endpoints ───────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.base}/login`, credentials).pipe(
      tap(tokens => this.storeTokens(tokens))
    );
  }

  register(data: RegisterRequest): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.base}/register`, data).pipe(
      tap(tokens => this.storeTokens(tokens))
    );
  }

  refreshToken(refreshToken: string): Observable<AuthTokens> {
    const body: RefreshTokenRequest = { refreshToken };
    return this.http.post<AuthTokens>(`${this.base}/refresh-token`, body);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, {}).pipe(
      tap(() => this.clearSession())
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/change-password`, data);
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/forgot-password`, data);
  }

  resetPassword(data: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/reset-password`, data);
  }

  verifyToken(data: VerifyTokenRequest): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.base}/verify-token`, data);
  }

  confirmEmail(token: string): Observable<void> {
    return this.http.get<void>(`${this.base}/confirm-email`, {
      params: { token }
    });
  }

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/me`);
  }

  updateProfile(data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.base}/profile`, data);
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${this.base}/account`);
  }
}