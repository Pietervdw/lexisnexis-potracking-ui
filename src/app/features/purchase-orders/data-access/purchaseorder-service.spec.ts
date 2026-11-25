import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiError, NotFoundError, PurchaseOrderService } from './purchaseorder-service';

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

  it('fetches a Purchase Order by PO Number with a GET to /purchaseorders/:number', () => {
    service.getByNumber('PO0001').subscribe();
    const request = http.expectOne('/purchaseorders/PO0001');
    expect(request.request.method).toEqual('GET');
    request.flush({ success: true, purchaseOrder: DETAIL_ENVELOPE.purchaseOrder });
    http.verify();
  });

  it('parses the detail envelope into a Purchase Order detail', () => {
    let detail: unknown;
    service.getByNumber('PO0001').subscribe((result) => (detail = result));
    http.expectOne('/purchaseorders/PO0001').flush(DETAIL_ENVELOPE);
    expect(detail).toEqual(DETAIL_ENVELOPE.purchaseOrder);
  });

  it('fails with a NotFoundError carrying the envelope errors when the API returns 404', () => {
    let error: unknown;
    service.getByNumber('PO9999').subscribe({ error: (e) => (error = e) });
    http.expectOne('/purchaseorders/PO9999').flush(
      { success: false, errors: ["Purchase order with number 'PO9999' not found."] },
      { status: 404, statusText: 'Not Found' },
    );
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errors).toEqual(["Purchase order with number 'PO9999' not found."]);
  });
});

const DETAIL_ENVELOPE = {
  success: true,
  purchaseOrder: {
    customerId: 3,
    number: 'PO0001',
    externalRef: 'REF-A',
    deliveryFee: 0,
    taxPercentage: 15,
    status: 0,
    createdAt: '2026-11-24T09:30:00Z',
    lines: [
      { sku: 'SKU-1', productName: 'Widget', quantity: 2, unitPrice: 25, lineTotal: 50 },
      { sku: 'SKU-2', productName: 'Gadget', quantity: 1, unitPrice: 99.5, lineTotal: 99.5 },
    ],
    subtotal: 149.5,
    taxAmount: 22.425,
    total: 171.925,
  },
};
