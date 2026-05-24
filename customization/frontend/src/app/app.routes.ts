import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./modules/stock/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'stock-items',
    loadComponent: () =>
      import('./modules/stock/pages/stock-items/stock-items.component').then(m => m.StockItemsComponent)
  },
  {
    path: 'warehouses',
    loadComponent: () =>
      import('./modules/stock/pages/warehouses/warehouses.component').then(m => m.WarehousesComponent)
  },
  {
    path: 'suppliers',
    loadComponent: () =>
      import('./modules/stock/pages/suppliers/suppliers.component').then(m => m.SuppliersComponent)
  },
  {
    path: 'movements',
    loadComponent: () =>
      import('./modules/stock/pages/movements/movements.component').then(m => m.MovementsComponent)
  },
  {
    path: 'alerts',
    loadComponent: () =>
      import('./modules/stock/pages/alerts/alerts.component').then(m => m.AlertsComponent)
  },
  {
    path: 'reference-data',
    loadComponent: () =>
      import('./modules/stock/pages/reference-data/reference-data.component').then(m => m.ReferenceDataComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
