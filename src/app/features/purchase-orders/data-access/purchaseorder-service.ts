import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

export class ApiError extends Error {
  constructor(readonly errors: string[]) {
    super(errors.length > 0 ? errors.join(' ') : 'The API reported a failure.');
  }
}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);

  list(): Observable<PurchaseOrderListItem[]> {
    return this.http.get<PurchaseOrdersGetResponse>('/purchaseorders').pipe(
      map((response) => {
        if (!response.success) {
          throw new ApiError(response.errors ?? []);
        }
        return [...response.purchaseOrders].sort((a, b) => b.number.localeCompare(a.number));
      }),
    );
  }
}
