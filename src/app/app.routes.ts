import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'purchase-orders' },
  {
    path: 'purchase-orders',
    loadComponent: () =>
      import('./features/purchase-orders/purchase-order-list/purchase-order-list').then(
        (m) => m.PurchaseOrderList,
      ),
  },
  {
    path: 'purchase-orders/new',
    loadComponent: () =>
      import('./features/purchase-orders/purchase-order-create/purchase-order-create').then(
        (m) => m.PurchaseOrderCreate,
      ),
  },
  {
    path: 'purchase-orders/:number',
    loadComponent: () =>
      import('./features/purchase-orders/purchase-order-detail/purchase-order-detail').then(
        (m) => m.PurchaseOrderDetail,
      ),
  },
];
