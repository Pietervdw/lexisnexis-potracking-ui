import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PurchaseOrdersGetResponse {
  purchaseOrders: PurchaseOrderListItem[];
}

export interface PurchaseOrderListItem {
  number: string;
  externalRef: string;
  customerName: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);

  list(): Observable<PurchaseOrderListItem[]> {
    return this.http
      .get<PurchaseOrdersGetResponse>('/purchaseorders')
      .pipe(
        map((response) =>
          [...response.purchaseOrders].sort((a, b) => b.number.localeCompare(a.number)),
        ),
      );
  }
}
