import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
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

  // -- Token helpers --------------------------------------------------------

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  storeTokens(tokens: AuthTokens, rememberMe: boolean = false): void {
    if (typeof window === 'undefined') return;
    
    // Clear existing tokens from both to prevent conflicts
    this.clearSessionOnly();
    
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    if (tokens.refresh_token) {
      storage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    }
  }

  private clearSessionOnly(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  clearSession(): void {
    this.clearSessionOnly();
    this.router.navigate(['/login']);
  }

  get isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  // -- Auth endpoints -------------------------------------------------------

  login(credentials: LoginRequest, rememberMe: boolean = false): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.base}/login`, credentials).pipe(
      tap(tokens => this.storeTokens(tokens, rememberMe))
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.base}/register`, data);
  }

  refreshToken(refreshToken: string): Observable<AuthTokens> {
    const body: RefreshTokenRequest = { refresh_token: refreshToken };
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

  resetPassword(data: ResetPasswordRequest): Observable<string> {
    return this.http.post<string>(`${this.base}/reset-password`, data);
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
