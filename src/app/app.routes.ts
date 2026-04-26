import { AuthGuard } from './guards/auth.guard';
import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
  path: 'forgot-password',
  loadComponent: () =>
    import('./pages/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
},
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
   path: 'dashboard',
  loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  canActivate: [AuthGuard]  // protected
  },
  {
  path: 'orders',
  loadComponent: () =>
    import('./pages/orders/orders-page.component').then(m => m.OrdersPageComponent),
  canActivate: [AuthGuard],
  data: { title: 'Orders', subtitle: 'Track and manage incoming orders.' }
  },
  {
    path: 'menu',
    loadComponent: () =>
      import('./pages/menu/menu-page.component').then(m => m.MenuPageComponent),
    canActivate: [AuthGuard],   // <-- protected
    data: { title: 'Menu', subtitle: 'Maintain menu items and pricing.' }
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/restaurant-profile/restaurant-profile.component').then(
        m => m.RestaurantProfileComponent
      ),
    canActivate: [AuthGuard],   // <-- protected
    data: { title: 'Restaurant Profile', subtitle: 'Update details, hours, and availability.' }
  },
  
  {
    path: '**',
    loadComponent: () =>
      import('./pages/simple-page.component').then(m => m.SimplePageComponent),
    data: { title: 'Page Not Found', subtitle: 'The page you are looking for does not exist.' }
  }
];