import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import {
  ApiError,
  NotFoundError,
  PurchaseOrderService,
} from '../data-access/purchaseorder-service';
import type { PurchaseOrderDetail as PurchaseOrderDetailModel } from '../data-access/purchaseorder-service';
import { CustomerService } from '../../customers/data-access/customer-service';
import {
  purchaseOrderStatusBadgeClass,
  purchaseOrderStatusName,
} from './purchase-order-status';

@Component({
  selector: 'app-purchase-order-detail',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './purchase-order-detail.html',
})
export class PurchaseOrderDetail {
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);

  protected readonly purchaseOrder = signal<PurchaseOrderDetailModel | null>(null);
  protected readonly customerName = signal('');
  protected readonly statusName = computed(() => purchaseOrderStatusName(this.purchaseOrder()?.status));
  protected readonly statusBadgeClass = computed(() =>
    purchaseOrderStatusBadgeClass(this.purchaseOrder()?.status),
  );
  protected readonly isLoading = signal(true);
  protected readonly hasFailed = signal(false);
  protected readonly isNotFound = signal(false);
  protected readonly errors = signal<string[]>([]);

  constructor() {
    this.route.paramMap.subscribe((params) => this.load(params.get('number') ?? ''));
  }

  private currentLoad?: Subscription;

  private load(number: string): void {
    this.currentLoad?.unsubscribe();
    this.currentLoad = this.purchaseOrderService
      .getByNumber(number)
      .pipe(
        concatMap((purchaseOrder) =>
          this.customerService
            .getAll()
            .pipe(
              catchError(() => of([])),
              map((customers) => ({ purchaseOrder, customers })),
            ),
        ),
      )
      .subscribe({
        next: ({ purchaseOrder, customers }) => {
          this.purchaseOrder.set(purchaseOrder);
          this.customerName.set(
            customers.find((customer) => customer.id === purchaseOrder.customerId)?.name ?? '',
          );
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.isNotFound.set(error instanceof NotFoundError);
          this.hasFailed.set(!(error instanceof NotFoundError));
          if (error instanceof ApiError) {
            this.errors.set(error.errors);
          }
          this.isLoading.set(false);
        },
      });
  }
}
