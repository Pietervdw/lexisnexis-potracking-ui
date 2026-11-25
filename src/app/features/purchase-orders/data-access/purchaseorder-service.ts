import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface ApiResponse {
  success: boolean;
  errors?: string[] | null;
}

interface PurchaseOrdersGetResponse extends ApiResponse {
  purchaseOrders: PurchaseOrderListItem[];
}

export interface PurchaseOrderListItem {
  number: string;
  externalRef: string;
  customerName: string;
  total: number;
}

interface PurchaseOrderGetResponse extends ApiResponse {
  purchaseOrder: PurchaseOrderDetail | null;
}

export interface PurchaseOrderLineItem {
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseOrderDetail {
  customerId: number;
  number: string;
  externalRef: string;
  deliveryFee: number;
  taxPercentage: number;
  status: number;
  createdAt: string;
  lines: PurchaseOrderLineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
}

export class ApiError extends Error {
  constructor(readonly errors: string[]) {
    super(errors.length > 0 ? errors.join(' ') : 'The API reported a failure.');
  }
}

export class NotFoundError extends ApiError {}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);

  private unwrapEnvelope<T extends ApiResponse>(envelope: T): T {
    if (!envelope.success) {
      throw new ApiError(envelope.errors ?? []);
    }
    return envelope;
  }

  list(): Observable<PurchaseOrderListItem[]> {
    return this.http.get<PurchaseOrdersGetResponse>('/purchaseorders').pipe(
      map((response) => {
        const { purchaseOrders } = this.unwrapEnvelope(response);
        return [...purchaseOrders].sort((a, b) => b.number.localeCompare(a.number));
      }),
    );
  }

  getByNumber(number: string): Observable<PurchaseOrderDetail> {
    return this.http
      .get<PurchaseOrderGetResponse>(`/purchaseorders/${number}`)
      .pipe(
        map((response) => {
          const { purchaseOrder } = this.unwrapEnvelope(response);
          if (purchaseOrder === null) {
            throw new ApiError(['The Purchase Order data is missing from the response.']);
          }
          return purchaseOrder;
        }),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse) {
            const envelope = (error.error as Pick<ApiResponse, 'errors'> | null) ?? { errors: null };
            const apiError =
              error.status === 404
                ? new NotFoundError(envelope.errors ?? [])
                : new ApiError(envelope.errors ?? []);
            throw apiError;
          }
          throw error;
        }),
      );
  }
}
