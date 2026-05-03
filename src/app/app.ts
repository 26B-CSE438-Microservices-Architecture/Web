import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly title = signal('restaurant-admin-panel');

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
}
