import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withDisabledInitialNavigation } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { PurchaseOrderCreate } from './purchase-order-create';

@Component({ selector: 'purchase-order-list-stub', template: '' })
class PurchaseOrderListStub {}

const CUSTOMERS_RESPONSE = [
  { id: 1, name: 'Acme' },
  { id: 2, name: 'Globex' },
];

describe('PurchaseOrderCreate', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseOrderCreate],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(
          [
            { path: 'purchase-orders', component: PurchaseOrderListStub },
            { path: 'purchase-orders/:number', component: PurchaseOrderCreate },
          ],
          withDisabledInitialNavigation(),
        ),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  it('renders the form with customers loaded from the Customers service', () => {
    const fixture = TestBed.createComponent(PurchaseOrderCreate);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/customers`).flush(CUSTOMERS_RESPONSE);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="external-ref-input"]')).toBeTruthy();
    const select = root.querySelector<HTMLSelectElement>('[data-testid="customer-select"]');
    expect(select).toBeTruthy();
    const options = Array.from(select!.querySelectorAll('option')).map((option) => ({
      value: option.value,
      text: option.textContent?.trim(),
    }));
    expect(options).toContainEqual({ value: '1', text: 'Acme' });
    expect(options).toContainEqual({ value: '2', text: 'Globex' });

    const rows = root.querySelectorAll('[data-testid="line-row"]');
    expect(rows.length).toBe(1);
  });

  it('adds and removes Line Item rows, keeping one at the minimum', () => {
    const fixture = TestBed.createComponent(PurchaseOrderCreate);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/customers`).flush(CUSTOMERS_RESPONSE);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const rowCount = () => root.querySelectorAll('[data-testid="line-row"]').length;

    root.querySelector<HTMLButtonElement>('[data-testid="add-line"]')!.click();
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('[data-testid="add-line"]')!.click();
    fixture.detectChanges();
    expect(rowCount()).toBe(3);

    root.querySelectorAll<HTMLButtonElement>('[data-testid="remove-line"]')[2]!.click();
    fixture.detectChanges();
    expect(rowCount()).toBe(2);

    root.querySelectorAll<HTMLButtonElement>('[data-testid="remove-line"]')[0]!.click();
    fixture.detectChanges();
    expect(rowCount()).toBe(1);
    expect(root.querySelector('[data-testid="remove-line"]')!.hasAttribute('disabled')).toBe(true);
  });

  it('shows inline validation errors and blocks the API call when submitting an empty form', () => {
    const fixture = TestBed.createComponent(PurchaseOrderCreate);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/customers`).flush(CUSTOMERS_RESPONSE);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLButtonElement>('[data-testid="submit-button"]')!.click();
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="external-ref-error"]')?.textContent).toContain(
      'External reference is required.',
    );
    expect(root.querySelector('[data-testid="customer-error"]')?.textContent).toContain(
      'Select a customer.',
    );
    expect(root.querySelector('[data-testid="sku-error"]')?.textContent).toContain(
      'SKU is required.',
    );
    expect(root.querySelector('[data-testid="product-name-error"]')?.textContent).toContain(
      'Product name is required.',
    );
    expect(root.querySelector('[data-testid="quantity-error"]')?.textContent).toContain(
      'Quantity must be a number.',
    );
    expect(root.querySelector('[data-testid="unit-price-error"]')?.textContent).toContain(
      'Unit price must be a number.',
    );

    http.verify();
  });

  it('posts the valid form and navigates to the new Purchase Order detail page', async () => {
    const fixture = TestBed.createComponent(PurchaseOrderCreate);
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/customers`).flush(CUSTOMERS_RESPONSE);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    setFieldValue(root, '[data-testid="external-ref-input"]', 'EXT-100');
    const select = root.querySelector<HTMLSelectElement>('[data-testid="customer-select"]')!;
    select.value = '2';
    select.dispatchEvent(new Event('change'));

    const row = root.querySelector<HTMLElement>('[data-testid="line-row"]')!;
    const lineInputs = Array.from(row.querySelectorAll<HTMLInputElement>('td input'));
    setFieldValue(root, 'input', 'SKU-1', lineInputs[0]);
    setFieldValue(root, 'input', 'Widget', lineInputs[1]);
    setFieldValue(root, 'input', '2', lineInputs[2]);
    setFieldValue(root, 'input', '9.5', lineInputs[3]);

    root.querySelector<HTMLButtonElement>('[data-testid="submit-button"]')!.click();
    fixture.detectChanges();

    const request = http.expectOne(`${environment.apiUrl}/purchaseorders`);
    expect(request.request.method).toEqual('POST');
    expect(request.request.body).toEqual({
      customerId: 2,
      externalRef: 'EXT-100',
      lines: [{ sku: 'SKU-1', productName: 'Widget', quantity: 2, unitPrice: 9.5 }],
    });
    request.flush({
      success: true,
      purchaseOrder: { number: 'PO0007', externalRef: 'EXT-100' },
    });
    await fixture.whenStable();
    expect(router.url).toEqual('/purchase-orders/PO0007');
  });

  it('returns to the Purchase Orders list when the Cancel button is clicked', async () => {
    const fixture = TestBed.createComponent(PurchaseOrderCreate);
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/customers`).flush(CUSTOMERS_RESPONSE);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    root.querySelector<HTMLAnchorElement>('[data-testid="cancel-button"]')!.click();
    await fixture.whenStable();

    expect(router.url).toEqual('/purchase-orders');
  });

  it('shows the API messages inline when the create is rejected with a custom envelope', () => {
    const fixture = TestBed.createComponent(PurchaseOrderCreate);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/customers`).flush(CUSTOMERS_RESPONSE);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    root.querySelector<HTMLButtonElement>('[data-testid="submit-button"]')!.click();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/purchaseorders`).flush(
      {
        success: false,
        errors: ["An order with external reference 'EXT-100' already exists."],
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    const banner = root.querySelector('[data-testid="api-errors"]');
    expect(banner?.textContent).toContain(
      "An order with external reference 'EXT-100' already exists.",
    );
  });

  it('shows the flattened field messages inline when the create is rejected with ValidationProblemDetails', () => {
    const fixture = TestBed.createComponent(PurchaseOrderCreate);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/customers`).flush(CUSTOMERS_RESPONSE);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    fillValidForm(root);
    root.querySelector<HTMLButtonElement>('[data-testid="submit-button"]')!.click();
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/purchaseorders`).flush(
      {
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: { 'Lines[0].UnitPrice': ['Unit price cannot be less than 0.'] },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(root.querySelector('[data-testid="api-errors"]')?.textContent).toContain(
      'Unit price cannot be less than 0.',
    );
  });
});

function fillValidForm(root: HTMLElement): void {
  setFieldValue(root, '[data-testid="external-ref-input"]', 'EXT-100');
  const select = root.querySelector<HTMLSelectElement>('[data-testid="customer-select"]')!;
  select.value = '1';
  select.dispatchEvent(new Event('change'));
  const row = root.querySelector<HTMLElement>('[data-testid="line-row"]')!;
  const lineInputs = Array.from(row.querySelectorAll<HTMLInputElement>('td input'));
  setFieldValue(root, 'input', 'SKU-1', lineInputs[0]);
  setFieldValue(root, 'input', 'Widget', lineInputs[1]);
  setFieldValue(root, 'input', '2', lineInputs[2]);
  setFieldValue(root, 'input', '9.5', lineInputs[3]);
}

function setFieldValue(
  root: HTMLElement,
  selector: string,
  value: string,
  element?: HTMLInputElement,
): void {
  const input = element ?? (root.querySelector<HTMLInputElement>(selector) as HTMLInputElement);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}
