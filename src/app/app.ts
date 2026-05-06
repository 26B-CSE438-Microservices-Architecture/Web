import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly title = signal('restaurant-admin-panel');

  constructor() {
    this.persistRestaurantContextFromUrl();
  }

  /**
   * Returns true if the current route is one of the authentication pages.
   */
  get isAuthPage(): boolean {
    const authRoutes = ['/login', '/register', '/forgot-password'];
    // We check if the current URL starts with any of the auth routes
    return authRoutes.some(route => this.router.url.startsWith(route));
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  private persistRestaurantContextFromUrl(): void {
    if (!this.isBrowser) {
      return;
    }

    const url = new URL(window.location.href);
    const restaurantId =
      url.searchParams.get('restaurantId') ||
      url.searchParams.get('vendorId') ||
      '';
    const restaurantName =
      url.searchParams.get('restaurantName') ||
      url.searchParams.get('vendorName') ||
      '';

    if (!restaurantId) {
      return;
    }

    localStorage.setItem('menu_restaurant_id', restaurantId);
    if (restaurantName) {
      localStorage.setItem('menu_restaurant_name', restaurantName);
    }

    url.searchParams.delete('restaurantId');
    url.searchParams.delete('vendorId');
    url.searchParams.delete('restaurantName');
    url.searchParams.delete('vendorName');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
}
