import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { PurchaseOrderService } from './purchaseorder-service';
import type { PurchaseOrderDetail } from './purchaseorder-service';
import { ApiError, NotFoundError } from '../../../core/http/api-error';

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
    const request = http.expectOne(`${environment.apiUrl}/purchaseorders`);
    expect(request.request.method).toEqual('GET');
    request.flush({ success: true, purchaseOrders: [] });
    http.verify();
  });

  it('parses the list envelope into Purchase Order list items', () => {
    let items: unknown;
    service.list().subscribe((result) => (items = result));
    http.expectOne(`${environment.apiUrl}/purchaseorders`).flush({
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
    http.expectOne(`${environment.apiUrl}/purchaseorders`).flush({
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
    http.expectOne(`${environment.apiUrl}/purchaseorders`).flush({ success: true, purchaseOrders: [] });
    expect(items).toEqual([]);
  });

  it('fails with the API error messages when the envelope reports Success false', () => {
    let error: unknown;
    service.list().subscribe({ error: (e) => (error = e) });
    http.expectOne(`${environment.apiUrl}/purchaseorders`).flush({
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
    http.expectOne(`${environment.apiUrl}/purchaseorders`).flush({ success: false, errors: null, purchaseOrders: [] });
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errors).toEqual([]);
  });

  it('fetches a Purchase Order by PO Number with a GET to /purchaseorders/:number', () => {
    service.getByNumber('PO0001').subscribe();
    const request = http.expectOne(`${environment.apiUrl}/purchaseorders/PO0001`);
    expect(request.request.method).toEqual('GET');
    request.flush({ success: true, purchaseOrder: DETAIL_ENVELOPE.purchaseOrder });
    http.verify();
  });

  it('parses the detail envelope into a Purchase Order detail', () => {
    let detail: unknown;
    service.getByNumber('PO0001').subscribe((result) => (detail = result));
    http.expectOne(`${environment.apiUrl}/purchaseorders/PO0001`).flush(DETAIL_ENVELOPE);
    expect(detail).toEqual(DETAIL_ENVELOPE.purchaseOrder);
  });

  it('creates with a POST to /purchaseorders carrying the request body', () => {
    let created: PurchaseOrderDetail | null = null;
    service
      .create({
        customerId: 3,
        externalRef: 'REF-A',
        lines: [{ sku: 'SKU-1', productName: 'Widget', quantity: 2, unitPrice: 25 }],
      })
      .subscribe((result) => (created = result));
    const request = http.expectOne(`${environment.apiUrl}/purchaseorders`);
    expect(request.request.method).toEqual('POST');
    expect(request.request.body).toEqual({
      customerId: 3,
      externalRef: 'REF-A',
      lines: [{ sku: 'SKU-1', productName: 'Widget', quantity: 2, unitPrice: 25 }],
    });
    request.flush({ success: true, purchaseOrder: DETAIL_ENVELOPE.purchaseOrder });
    expect(created).toEqual(DETAIL_ENVELOPE.purchaseOrder);
  });

  it('fails with the API messages when the create is rejected with a custom envelope 400', () => {
    let error: unknown;
    service
      .create({ customerId: 1, externalRef: 'REF-A', lines: [] })
      .subscribe({ error: (e) => (error = e) });
    http.expectOne(`${environment.apiUrl}/purchaseorders`).flush(
      {
        success: false,
        errors: ["An order with external reference 'REF-A' already exists."],
      },
      { status: 400, statusText: 'Bad Request' },
    );
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errors).toEqual([
      "An order with external reference 'REF-A' already exists.",
    ]);
  });

  it('flattens the field errors when model binding rejects the create with ValidationProblemDetails', () => {
    let error: unknown;
    service
      .create({
        customerId: 1,
        externalRef: '',
        lines: [{ sku: '', productName: '', quantity: 0, unitPrice: -1 }],
      })
      .subscribe({ error: (e) => (error = e) });
    http.expectOne(`${environment.apiUrl}/purchaseorders`).flush(
      {
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: {
          ExternalRef: ['The ExternalRef field is required.'],
          'Lines[0].Quantity': ['Quantity must be greater than 0.'],
          'Lines[0].UnitPrice': ['Unit price cannot be less than 0.'],
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errors).toEqual([
      'The ExternalRef field is required.',
      'Quantity must be greater than 0.',
      'Unit price cannot be less than 0.',
    ]);
  });

  it('requests a status change with a PATCH to /purchaseorders/:number/status', () => {
    const done = service.changeStatus('PO0001', 1);
    done.subscribe();
    const request = http.expectOne(`${environment.apiUrl}/purchaseorders/PO0001/status`);
    expect(request.request.method).toEqual('PATCH');
    request.flush({ success: true });
    http.verify();
  });

  it('sends the integer status in the PATCH body', () => {
    service.changeStatus('PO0002', 2).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/purchaseorders/PO0002/status`);
    expect(request.request.body).toEqual({ status: 2 });
    request.flush({ success: true });
    http.verify();
  });

  it('completes without errors when the API reports a successful change', () => {
    let completed = false;
    let failure: unknown;
    service
      .changeStatus('PO0001', 0)
      .subscribe({ complete: () => (completed = true), error: (e) => (failure = e) });
    http.expectOne(`${environment.apiUrl}/purchaseorders/PO0001/status`).flush({ success: true });
    expect(completed).toBe(true);
    expect(failure).toBeUndefined();
    http.verify();
  });

  it('fails with the API 400 message when the transition is rejected', () => {
    let error: unknown;
    service.changeStatus('PO0001', 3).subscribe({ error: (e) => (error = e) });
    http
      .expectOne(`${environment.apiUrl}/purchaseorders/PO0001/status`)
      .flush(
        { success: false, errors: ['Cannot change status from Pending to Fulfilled.'] },
        { status: 400, statusText: 'Bad Request' },
      );
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errors).toEqual(['Cannot change status from Pending to Fulfilled.']);
  });

  it('fails with an empty error list when the API 400 carries no error messages', () => {
    let error: unknown;
    service.changeStatus('PO0001', 4).subscribe({ error: (e) => (error = e) });
    http
      .expectOne(`${environment.apiUrl}/purchaseorders/PO0001/status`)
      .flush({ success: false, errors: null }, { status: 400, statusText: 'Bad Request' });
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).errors).toEqual([]);
  });

  it('fails with a NotFoundError carrying the envelope errors when the API returns 404', () => {
    let error: unknown;
    service.getByNumber('PO9999').subscribe({ error: (e) => (error = e) });
    http
      .expectOne(`${environment.apiUrl}/purchaseorders/PO9999`)
      .flush(
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
