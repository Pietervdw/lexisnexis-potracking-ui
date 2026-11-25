import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError, concatMap, map } from 'rxjs/operators';
import { PurchaseOrderService } from '../data-access/purchaseorder-service';
import { ApiError, NotFoundError } from '../../../core/http/api-error';
import type { PurchaseOrderDetail as PurchaseOrderDetailModel } from '../data-access/purchaseorder-service';
import { CustomerService } from '../../customers/data-access/customer-service';
import {
  PURCHASE_ORDER_STATUSES,
  isTerminalPurchaseOrderStatus,
  purchaseOrderStatusBadgeClass,
  purchaseOrderStatusName,
} from './purchase-order-status';

@Component({
  selector: 'app-purchase-order-detail',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './purchase-order-detail.html',
})
export class PurchaseOrderDetail {
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly customerService = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);

  protected readonly purchaseOrder = signal<PurchaseOrderDetailModel | null>(null);
  protected readonly customerName = signal('');
  protected readonly statusName = computed(() =>
    purchaseOrderStatusName(this.purchaseOrder()?.status),
  );
  protected readonly statusBadgeClass = computed(() =>
    purchaseOrderStatusBadgeClass(this.purchaseOrder()?.status),
  );
  protected readonly isLoading = signal(true);
  protected readonly hasFailed = signal(false);
  protected readonly isNotFound = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly isTerminal = computed(() =>
    isTerminalPurchaseOrderStatus(this.purchaseOrder()?.status),
  );
  protected readonly selectableStatuses = computed(() => {
    const current = this.purchaseOrder()?.status;
    return PURCHASE_ORDER_STATUSES.filter((status) => status.value !== current);
  });
  protected readonly selectedStatus = signal<number | null>(null);
  protected readonly isUpdating = signal(false);
  protected readonly updateErrors = signal<string[]>([]);

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.load(params.get('number') ?? ''));
  }

  private currentLoad?: Subscription;
  private currentUpdate?: Subscription;

  private load(number: string): void {
    this.currentLoad?.unsubscribe();
    this.currentUpdate?.unsubscribe();
    this.selectedStatus.set(null);
    this.updateErrors.set([]);
    this.currentLoad = this.purchaseOrderService
      .getByNumber(number)
      .pipe(
        concatMap((purchaseOrder) =>
          this.customerService.getAll().pipe(
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

  protected onStatusSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedStatus.set(select.value === '' ? null : Number(select.value));
  }

  protected updateStatus(): void {
    const current = this.purchaseOrder();
    const status = this.selectedStatus();
    if (current === null || status === null || this.isUpdating()) {
      return;
    }
    this.isUpdating.set(true);
    this.updateErrors.set([]);
    this.currentUpdate?.unsubscribe();
    this.currentUpdate = this.purchaseOrderService.changeStatus(current.number, status).subscribe({
      next: () => {
        this.isUpdating.set(false);
        this.selectedStatus.set(null);
        this.load(current.number);
      },
      error: (error: unknown) => {
        this.isUpdating.set(false);
        this.updateErrors.set(
          error instanceof ApiError && error.errors.length > 0
            ? error.errors
            : ['The status could not be updated.'],
        );
      },
    });
  }
}
