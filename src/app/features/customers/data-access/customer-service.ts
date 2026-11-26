import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Customer {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${environment.apiUrl}/customers`);
  }
}
