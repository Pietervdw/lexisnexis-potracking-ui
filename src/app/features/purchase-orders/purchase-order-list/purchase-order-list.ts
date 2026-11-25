import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PurchaseOrderService } from '../data-access/purchaseorder-service';
import type { PurchaseOrderListItem } from '../data-access/purchaseorder-service';

@Component({
  selector: 'app-purchase-order-list',
  imports: [DecimalPipe],
  templateUrl: './purchase-order-list.html',
})
export class PurchaseOrderList {
  private readonly purchaseOrderService = inject(PurchaseOrderService);

  protected readonly orders = signal<PurchaseOrderListItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasFailed = signal(false);

  constructor() {
    this.purchaseOrderService.list().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasFailed.set(true);
        this.isLoading.set(false);
      },
    });
  }
}
