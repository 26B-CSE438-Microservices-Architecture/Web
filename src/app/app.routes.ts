import { AuthGuard } from './guards/auth.guard';
import { Routes } from '@angular/router';
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
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
      import('./pages/simple-page.component').then(m => m.SimplePageComponent),
    canActivate: [AuthGuard],   // <-- protected
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
    path: 'categories',
    loadComponent: () =>
      import('./pages/simple-page.component').then(m => m.SimplePageComponent),
    canActivate: [AuthGuard],   // <-- protected
    data: { title: 'Categories', subtitle: 'Organize menu categories for quick filtering.' }
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/simple-page.component').then(m => m.SimplePageComponent),
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