import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CustomerService } from '../../customers/data-access/customer-service';
import type { Customer } from '../../customers/data-access/customer-service';
import { PurchaseOrderService } from '../data-access/purchaseorder-service';
import type { PurchaseOrderCreateRequest } from '../data-access/purchaseorder-service';
import { ApiError } from '../../../core/http/api-error';
import {
  PURCHASE_ORDER_MESSAGES,
  validatePurchaseOrderDraft,
} from './purchase-order-create-validation';
import type {
  LineField,
  PurchaseOrderDraft,
  PurchaseOrderLineDraft,
} from './purchase-order-create-validation';

interface LineDraft extends PurchaseOrderLineDraft {
  id: number;
}

@Component({
  selector: 'app-purchase-order-create',
  templateUrl: './purchase-order-create.html',
})
export class PurchaseOrderCreate {
  private readonly customerService = inject(CustomerService);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly customers = signal<Customer[]>([]);
  protected readonly customerId = signal('');
  protected readonly externalRef = signal('');
  protected readonly lines = signal<LineDraft[]>([
    { id: 1, sku: '', productName: '', quantity: '', unitPrice: '' },
  ]);

  protected readonly submitAttempted = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly touched = signal<Set<string>>(new Set());
  protected readonly apiErrors = signal<string[]>([]);

  protected readonly draft = computed<PurchaseOrderDraft>(() => ({
    externalRef: this.externalRef(),
    customerId: this.customerId(),
    lines: this.lines(),
  }));

  protected readonly formErrors = computed(() => validatePurchaseOrderDraft(this.draft()));

  protected readonly noLinesRequiredMessage = PURCHASE_ORDER_MESSAGES.noLinesRequired;

  constructor() {
    this.customerService.getAll().subscribe({
      next: (customers) => this.customers.set(customers),
      error: () => this.customers.set([]),
    });
  }

  protected addLine(): void {
    this.lines.update((lines) => [
      ...lines,
      {
        id: Math.max(0, ...lines.map((line) => line.id)) + 1,
        sku: '',
        productName: '',
        quantity: '',
        unitPrice: '',
      },
    ]);
  }

  protected removeLine(id: number): void {
    this.lines.update((lines) => lines.filter((line) => line.id !== id));
  }

  protected setExternalRef(value: string): void {
    this.externalRef.set(value);
  }

  protected setCustomerId(value: string): void {
    this.customerId.set(value);
  }

  protected setLineValue(line: LineDraft, field: LineField, value: string): void {
    this.lines.update((lines) =>
      lines.map((candidate) =>
        candidate.id === line.id ? { ...candidate, [field]: value } : candidate,
      ),
    );
  }

  protected markTouched(key: string): void {
    this.touched.update((keys) => new Set(keys).add(key));
  }

  protected visibleMessage(key: string, message: string | null): string | null {
    return this.submitAttempted() || this.touched().has(key) ? message : null;
  }

  protected lineFieldKey(lineId: number, field: LineField): string {
    return `line-${lineId}-${field}`;
  }

  protected submit(): void {
    if (this.isSubmitting()) return;
    this.submitAttempted.set(true);
    const { externalRef, customerId, lineErrors, noLines } = this.formErrors();
    const hasErrors =
      externalRef !== null ||
      customerId !== null ||
      noLines !== null ||
      lineErrors.some((errors) => Object.values(errors).some((message) => message !== null));
    if (hasErrors) return;

    const request: PurchaseOrderCreateRequest = {
      externalRef: this.externalRef().trim(),
      customerId: Number(this.customerId()),
      lines: this.lines().map((line) => ({
        sku: line.sku.trim(),
        productName: line.productName.trim(),
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
      })),
    };
    this.isSubmitting.set(true);
    this.purchaseOrderService
      .create(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (purchaseOrder) => this.router.navigate(['/purchase-orders', purchaseOrder.number]),
        error: (error: unknown) => {
          if (error instanceof ApiError) {
            this.apiErrors.set(error.errors);
          }
          this.isSubmitting.set(false);
        },
      });
  }
}
