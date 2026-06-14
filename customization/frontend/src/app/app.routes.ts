import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/users/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/stock/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'stock-items',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/stock/pages/stock-items/stock-items.component').then(m => m.StockItemsComponent)
  },
  {
    path: 'warehouses',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/stock/pages/warehouses/warehouses.component').then(m => m.WarehousesComponent)
  },
  {
    path: 'suppliers',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/stock/pages/suppliers/suppliers.component').then(m => m.SuppliersComponent)
  },
  {
    path: 'movements',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/stock/pages/movements/movements.component').then(m => m.MovementsComponent)
  },
  {
    path: 'alerts',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/stock/pages/alerts/alerts.component').then(m => m.AlertsComponent)
  },
  {
    path: 'reference-data',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/stock/pages/reference-data/reference-data.component').then(m => m.ReferenceDataComponent)
  },
  {
    path: 'lots',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/stock/pages/lots/lots.component').then(m => m.LotsComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/stock/pages/reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/stock/pages/inventory/inventory.component').then(m => m.InventoryComponent)
  },
  {
    path: 'audit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/stock/pages/audit/audit.component').then(m => m.AuditComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/users/pages/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./modules/users/pages/user-management/user-management.component').then(m => m.UserManagementComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

