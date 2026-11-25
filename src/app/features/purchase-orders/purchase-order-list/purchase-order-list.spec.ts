import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { PurchaseOrderList } from './purchase-order-list';

@Component({ selector: 'purchase-order-detail-stub', template: '' })
class PurchaseOrderDetailStub {}

@Component({ selector: 'purchase-order-create-stub', template: '' })
class PurchaseOrderCreateStub {}

const RESPONSE = {
  success: true,
  purchaseOrders: [
    { number: 'PO0012', externalRef: 'EXT126', customerName: 'Acme', total: 150.5 },
    { number: 'PO0034', externalRef: 'INV-9', customerName: 'Globex', total: 99 },
    { number: 'PO0007', externalRef: 'EXT007', customerName: 'Initech', total: 42.75 },
  ],
};

describe('PurchaseOrderList', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseOrderList],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(
          [
            { path: 'purchase-orders/new', component: PurchaseOrderCreateStub },
            { path: 'purchase-orders/:number', component: PurchaseOrderDetailStub },
          ],
          withDisabledInitialNavigation(),
        ),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  it('filters the rows as the user types', () => {
    const fixture = TestBed.createComponent(PurchaseOrderList);
    fixture.detectChanges();
    http.expectOne('/purchaseorders').flush(RESPONSE);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const numbers = () =>
      Array.from(root.querySelectorAll('tbody tr td:first-child')).map((td) =>
        td.textContent?.trim(),
      );

    const input = root.querySelector<HTMLInputElement>('[data-testid="search-input"]');
    expect(input).toBeTruthy();
    input!.value = '12';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(numbers()).toEqual(['PO0012']);

    input!.value = '   ';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(numbers()).toEqual(['PO0034', 'PO0012', 'PO0007']);

    input!.value = 'ext';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(numbers()).toEqual(['PO0012', 'PO0007']);

    http.verify();
  });

  it('shows a no-results message when nothing matches the search', () => {
    const fixture = TestBed.createComponent(PurchaseOrderList);
    fixture.detectChanges();
    http.expectOne('/purchaseorders').flush(RESPONSE);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const input = root.querySelector<HTMLInputElement>('[data-testid="search-input"]');
    expect(root.querySelector('[data-testid="no-results"]')).toBeNull();

    input!.value = 'zzz';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(root.querySelectorAll('tbody tr').length).toBe(0);
    const message = root.querySelector('[data-testid="no-results"]');
    expect(message).toBeTruthy();
    expect(message!.textContent).toContain('zzz');
  });

  it('navigates to the create form when the New Purchase Order button is clicked', async () => {
    const fixture = TestBed.createComponent(PurchaseOrderList);
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    http.expectOne('/purchaseorders').flush(RESPONSE);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLElement>('[data-testid="new-purchase-order"]')!.click();
    await fixture.whenStable();
    expect(router.url).toEqual('/purchase-orders/new');
    http.verify();
  });

  it('navigates to the detail page when a row is clicked', async () => {
    const fixture = TestBed.createComponent(PurchaseOrderList);
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    http.expectOne('/purchaseorders').flush(RESPONSE);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const row = Array.from(root.querySelectorAll('tbody tr')).find((candidate) =>
      candidate.textContent?.includes('PO0012'),
    ) as HTMLElement;
    row.click();
    await fixture.whenStable();

    expect(router.url).toEqual('/purchase-orders/PO0012');
    http.verify();
  });
});
