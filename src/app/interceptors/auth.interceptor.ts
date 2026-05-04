import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/confirm-email',
  '/auth/verify-token'
];

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some(path => req.url.includes(path));

  const authReq = token && !isPublicAuthRequest ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh-token')) {
        return handle401Error(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
}

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();

    // If no refresh token, clear session and redirect (no throw)
    if (!refreshToken) {
      isRefreshing = false;
      authService.clearSession();
      // Return a 401-like error that doesn't "crash" the component but stops the request
      return throwError(() => new Error('Authentication required.'));
    }

    return authService.refreshToken(refreshToken).pipe(
      switchMap(tokens => {
        isRefreshing = false;
        authService.storeTokens(tokens);
        refreshTokenSubject.next(tokens.access_token);
        return next(addToken(req, tokens.access_token));
      }),
      catchError(err => {
        isRefreshing = false;
        authService.clearSession();
        return throwError(() => err);
      })
    );
  }

  // If already refreshing, wait for the new token
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(addToken(req, token as string)))
  );
}
