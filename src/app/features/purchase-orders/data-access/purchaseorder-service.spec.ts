import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiError, PurchaseOrderService } from './purchaseorder-service';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PurchaseOrderService);
    http = TestBed.inject(HttpTestingController);
  });

  it('lists Purchase Orders with a GET to /purchaseorders', () => {
    const orders = service.list();
    orders.subscribe();
    const request = http.expectOne('/purchaseorders');
    expect(request.request.method).toEqual('GET');
    request.flush({ success: true, purchaseOrders: [] });
    http.verify();
  });

  it('parses the list envelope into Purchase Order list items', () => {
    let items: unknown;
    service.list().subscribe((result) => (items = result));
    http.expectOne('/purchaseorders').flush({
      success: true,
      purchaseOrders: [
        { number: 'PO0002', externalRef: 'REF-B', customerName: 'Acme', total: 150.5 },
        { number: 'PO0001', externalRef: 'REF-A', customerName: 'Globex', total: 99 },
      ],
    });
    expect(items).toEqual([
      { number: 'PO0002', externalRef: 'REF-B', customerName: 'Acme', total: 150.5 },
      { number: 'PO0001', externalRef: 'REF-A', customerName: 'Globex', total: 99 },
    ]);
  });

  it('sorts Latest first, by PO Number descending', () => {
    let items: unknown;
    service.list().subscribe((result) => (items = result));
    http.expectOne('/purchaseorders').flush({
      success: true,
      purchaseOrders: [
        { number: 'PO0003', externalRef: 'REF-C', customerName: 'Initech', total: 10 },
        { number: 'PO0001', externalRef: 'REF-A', customerName: 'Globex', total: 99 },
        { number: 'PO0002', externalRef: 'REF-B', customerName: 'Acme', total: 150.5 },
      ],
    });
    expect(items).toEqual([
      { number: 'PO0003', externalRef: 'REF-C', customerName: 'Initech', total: 10 },
      { number: 'PO0002', externalRef: 'REF-B', customerName: 'Acme', total: 150.5 },
      { number: 'PO0001', externalRef: 'REF-A', customerName: 'Globex', total: 99 },
    ]);
  });

  it('emits an empty list when the API returns no Purchase Orders', () => {
    let items: unknown;
    service.list().subscribe((result) => (items = result));
    http.expectOne('/purchaseorders').flush({ success: true, purchaseOrders: [] });
    expect(items).toEqual([]);
  });

  it('fails with the API error messages when the envelope reports Success false', () => {
    let error: unknown;
    service.list().subscribe({ error: (e) => (error = e) });
    http.expectOne('/purchaseorders').flush({
      success: false,
      errors: ['Something went wrong on the server.'],
      purchaseOrders: [],
    });
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errors).toEqual(['Something went wrong on the server.']);
  });

  it('fails with an empty error list when the envelope reports Success false without messages', () => {
    let error: unknown;
    service.list().subscribe({ error: (e) => (error = e) });
    http.expectOne('/purchaseorders').flush({ success: false, errors: null, purchaseOrders: [] });
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errors).toEqual([]);
  });
});
