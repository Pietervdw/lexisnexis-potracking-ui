import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CustomerService } from './customer-service';
import { environment } from '../../../../environments/environment';

describe('CustomerService', () => {
  let service: CustomerService;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CustomerService);
    http = TestBed.inject(HttpTestingController);
  });

  it('lists Customers with a GET to /customers', () => {
    service.getAll().subscribe();
    const request = http.expectOne(`${environment.apiUrl}/customers`);
    expect(request.request.method).toEqual('GET');
    request.flush([{ id: 3, name: 'Acme' }]);
    http.verify();
  });

  it('returns the Customers the API serves', () => {
    let customers: unknown;
    service.getAll().subscribe((result) => (customers = result));
    http
      .expectOne(`${environment.apiUrl}/customers`)
      .flush([
        { id: 3, name: 'Acme' },
        { id: 1, name: 'Globex' },
      ]);
    expect(customers).toEqual([
      { id: 3, name: 'Acme' },
      { id: 1, name: 'Globex' },
    ]);
  });
});
