import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  withDisabledInitialNavigation,
} from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PurchaseOrderDetail } from './purchase-order-detail';

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

const CUSTOMERS = [{ id: 3, name: 'Acme' }];

function detailWithStatus(status: number) {
  return {
    ...DETAIL_ENVELOPE,
    purchaseOrder: { ...DETAIL_ENVELOPE.purchaseOrder, status },
  };
}

describe('PurchaseOrderDetail', () => {
  let http: HttpTestingController;
  let paramMap$: Subject<ReturnType<typeof convertToParamMap>>;

  function loadPage(fixture: ComponentFixture<PurchaseOrderDetail>, envelope: object) {
    fixture.detectChanges();
    paramMap$.next(convertToParamMap({ number: 'PO0001' }));
    http.expectOne('/purchaseorders/PO0001').flush(envelope);
    http.expectOne('/customers').flush(CUSTOMERS);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    paramMap$ = new Subject();
    await TestBed.configureTestingModule({
      imports: [PurchaseOrderDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([], withDisabledInitialNavigation()),
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$ } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  it('shows a back link to the Purchase Orders list on the loaded and not-found states', () => {
    const loaded = TestBed.createComponent(PurchaseOrderDetail);
    const loadedRoot = loadPage(loaded, DETAIL_ENVELOPE);
    const backLink = loadedRoot.querySelector('a[data-testid="back-to-list"]') as HTMLAnchorElement;
    expect(backLink.getAttribute('href')).toEqual('/purchase-orders');
    expect(backLink.textContent).toContain('Back to Purchase Orders');
    loaded.destroy();

    const notFound = TestBed.createComponent(PurchaseOrderDetail);
    notFound.detectChanges();
    paramMap$.next(convertToParamMap({ number: 'PO0001' }));
    http
      .expectOne('/purchaseorders/PO0001')
      .flush(
        { success: false, errors: ["Purchase order with number 'PO0001' not found."] },
        { status: 404, statusText: 'Not Found' },
      );
    notFound.detectChanges();
    const notFoundRoot = notFound.nativeElement as HTMLElement;
    const backLinkInNotFound = notFoundRoot.querySelector(
      'a[data-testid="back-to-list"]',
    ) as HTMLAnchorElement;
    expect(backLinkInNotFound).toBeTruthy();
    expect(backLinkInNotFound.getAttribute('href')).toEqual('/purchase-orders');
    notFound.destroy();

    http.verify();
  });

  it('shows the status badge, External Reference, Customer name and created date', () => {
    const fixture = TestBed.createComponent(PurchaseOrderDetail);
    fixture.detectChanges();
    paramMap$.next(convertToParamMap({ number: 'PO0001' }));
    http.expectOne('/purchaseorders/PO0001').flush(DETAIL_ENVELOPE);
    http.expectOne('/customers').flush([
      { id: 3, name: 'Acme' },
      { id: 1, name: 'Globex' },
    ]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="status-badge"]')?.textContent?.trim()).toEqual(
      'Pending',
    );
    expect(root.querySelector('[data-testid="external-ref"]')?.textContent?.trim()).toEqual(
      'REF-A',
    );
    expect(root.querySelector('[data-testid="customer-name"]')?.textContent?.trim()).toEqual(
      'Acme',
    );
    expect(root.querySelector('[data-testid="created-date"]')?.textContent).toContain(
      'Nov 24, 2026',
    );

    http.verify();
  });

  it('shows the Line Items table with quantities, prices and line totals', () => {
    const fixture = TestBed.createComponent(PurchaseOrderDetail);
    fixture.detectChanges();
    paramMap$.next(convertToParamMap({ number: 'PO0001' }));
    http.expectOne('/purchaseorders/PO0001').flush(DETAIL_ENVELOPE);
    http.expectOne('/customers').flush([{ id: 3, name: 'Acme' }]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const rows = Array.from(root.querySelectorAll('tbody tr'));
    expect(rows.length).toEqual(2);
    const cells = (row: Element) =>
      Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim());
    expect(cells(rows[0])).toEqual(['SKU-1', 'Widget', '2', '25.00', '50.00']);
    expect(cells(rows[1])).toEqual(['SKU-2', 'Gadget', '1', '99.50', '99.50']);

    expect(root.querySelector('[data-testid="subtotal"]')?.textContent?.trim()).toEqual('149.50');
    expect(root.querySelector('[data-testid="tax-amount"]')?.textContent?.trim()).toEqual('22.43');
    expect(root.querySelector('[data-testid="total"]')?.textContent?.trim()).toEqual('171.93');

    http.verify();
  });

  it('shows a not-found message when the PO Number does not exist', () => {
    const fixture = TestBed.createComponent(PurchaseOrderDetail);
    fixture.detectChanges();
    paramMap$.next(convertToParamMap({ number: 'PO0001' }));
    http
      .expectOne('/purchaseorders/PO0001')
      .flush(
        { success: false, errors: ["Purchase order with number 'PO0001' not found."] },
        { status: 404, statusText: 'Not Found' },
      );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const message = root.querySelector('[data-testid="not-found"]');
    expect(message).toBeTruthy();
    expect(message!.textContent).toContain('PO0001');

    http.verify();
  });

  it('shows a failure message with the API errors when the Purchase Order could not be loaded', () => {
    const fixture = TestBed.createComponent(PurchaseOrderDetail);
    fixture.detectChanges();
    paramMap$.next(convertToParamMap({ number: 'PO0001' }));
    http
      .expectOne('/purchaseorders/PO0001')
      .flush(
        { success: false, errors: ['Something went wrong on the server.'] },
        { status: 500, statusText: 'Server Error' },
      );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const message = root.querySelector('[data-testid="load-failure"]');
    expect(message).toBeTruthy();

    http.verify();
  });

  it('falls back to an empty Customer name when the Customers endpoint fails', () => {
    const fixture = TestBed.createComponent(PurchaseOrderDetail);
    fixture.detectChanges();
    paramMap$.next(convertToParamMap({ number: 'PO0001' }));
    http.expectOne('/purchaseorders/PO0001').flush(DETAIL_ENVELOPE);
    http
      .expectOne('/customers')
      .flush({ success: false }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="customer-name"]')?.textContent?.trim()).toEqual('');
    expect(root.querySelector('[data-testid="status-badge"]')?.textContent?.trim()).toEqual(
      'Pending',
    );

    http.verify();
  });

  it('discards an in-flight load when the PO Number changes', () => {
    const fixture = TestBed.createComponent(PurchaseOrderDetail);
    fixture.detectChanges();
    paramMap$.next(convertToParamMap({ number: 'PO0001' }));
    const stale = http.expectOne('/purchaseorders/PO0001');
    paramMap$.next(convertToParamMap({ number: 'PO0002' }));
    http.expectOne('/purchaseorders/PO0002').flush({
      ...DETAIL_ENVELOPE,
      purchaseOrder: { ...DETAIL_ENVELOPE.purchaseOrder, number: 'PO0002' },
    });
    http.expectOne('/customers').flush([{ id: 3, name: 'Acme' }]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('h1')?.textContent?.trim()).toEqual('PO0002');
    expect(stale.cancelled).toBe(true);

    http.verify();
  });

  it('offers all statuses except the current one, with Update disabled until a selection', () => {
    const fixture = TestBed.createComponent(PurchaseOrderDetail);
    const root = loadPage(fixture, DETAIL_ENVELOPE);

    const select = root.querySelector('select[data-testid="status-select"]')! as HTMLSelectElement;
    const names = Array.from(select.querySelectorAll('option'))
      .map((option) => option.textContent?.trim())
      .filter((name) => name !== 'Change status...');
    expect(names).toEqual(['Confirmed', 'Shipped', 'Fulfilled', 'Cancelled']);

    const button = root.querySelector('button[data-testid="status-update"]')! as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    http.verify();
  });

  it('sends the integer status in the PATCH body and refreshes the page after a successful change', () => {
    const fixture = TestBed.createComponent(PurchaseOrderDetail);
    const root = loadPage(fixture, DETAIL_ENVELOPE);

    const select = root.querySelector('select[data-testid="status-select"]')! as HTMLSelectElement;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const button = root.querySelector('button[data-testid="status-update"]')! as HTMLButtonElement;
    button.click();

    const patch = http.expectOne('/purchaseorders/PO0001/status');
    expect(patch.request.method).toEqual('PATCH');
    expect(patch.request.body).toEqual({ status: 2 });
    patch.flush({ success: true });
    http.expectOne('/purchaseorders/PO0001').flush(detailWithStatus(2));
    http.expectOne('/customers').flush(CUSTOMERS);
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="status-badge"]')?.textContent?.trim()).toEqual(
      'Shipped',
    );
    const refreshed = root.querySelector(
      'select[data-testid="status-select"]',
    )! as HTMLSelectElement;
    const names = Array.from(refreshed.querySelectorAll('option'))
      .map((option) => option.textContent?.trim())
      .filter((name) => name !== 'Change status...');
    expect(names).toEqual(['Pending', 'Confirmed', 'Fulfilled', 'Cancelled']);

    http.verify();
  });

  it('shows the API 400 message inline when the transition is rejected', () => {
    const fixture = TestBed.createComponent(PurchaseOrderDetail);
    const root = loadPage(fixture, DETAIL_ENVELOPE);

    const select = root.querySelector('select[data-testid="status-select"]')! as HTMLSelectElement;
    select.value = '3';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    (root.querySelector('button[data-testid="status-update"]')! as HTMLButtonElement).click();

    http
      .expectOne('/purchaseorders/PO0001/status')
      .flush(
        { success: false, errors: ['Cannot change status from Pending to Fulfilled.'] },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();

    const message = root.querySelector('[data-testid="status-update-error"]');
    expect(message?.textContent).toContain('Cannot change status from Pending to Fulfilled.');
    expect(root.querySelector('[data-testid="status-badge"]')?.textContent?.trim()).toEqual(
      'Pending',
    );

    http.verify();
  });

  it('hides the status control for a Terminal Status, showing the badge only', () => {
    for (const [status, name] of [
      [3, 'Fulfilled'],
      [4, 'Cancelled'],
    ] as const) {
      const fixture = TestBed.createComponent(PurchaseOrderDetail);
      const root = loadPage(fixture, detailWithStatus(status));

      expect(root.querySelector('[data-testid="status-select"]')).toBeNull();
      expect(root.querySelector('[data-testid="status-update"]')).toBeNull();
      expect(root.querySelector('[data-testid="status-badge"]')?.textContent?.trim()).toEqual(name);

      http.verify();
      fixture.destroy();
    }
  });
});
