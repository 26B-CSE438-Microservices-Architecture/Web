import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private readonly platformId = inject(PLATFORM_ID);

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    if (this.auth.isLoggedIn) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}