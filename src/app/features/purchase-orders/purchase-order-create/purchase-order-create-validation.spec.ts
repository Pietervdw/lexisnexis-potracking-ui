import {
  PURCHASE_ORDER_MESSAGES,
  validatePurchaseOrderDraft,
} from './purchase-order-create-validation';
import type { PurchaseOrderDraft } from './purchase-order-create-validation';

function draft(overrides?: Partial<PurchaseOrderDraft>): PurchaseOrderDraft {
  return {
    externalRef: 'REF-A',
    customerId: '2',
    lines: [{ sku: 'SKU-1', productName: 'Widget', quantity: '2', unitPrice: '25' }],
    ...overrides,
  };
}

describe('validatePurchaseOrderDraft', () => {
  it('accepts a complete form: every rule null', () => {
    expect(validatePurchaseOrderDraft(draft())).toEqual({
      externalRef: null,
      customerId: null,
      noLines: null,
      lineErrors: [{ sku: null, productName: null, quantity: null, unitPrice: null }],
    });
  });

  it('requires an External Reference, trimmed', () => {
    expect(validatePurchaseOrderDraft(draft({ externalRef: '' })).externalRef).toBe(
      PURCHASE_ORDER_MESSAGES.externalRefRequired,
    );
    expect(validatePurchaseOrderDraft(draft({ externalRef: '   ' })).externalRef).toBe(
      PURCHASE_ORDER_MESSAGES.externalRefRequired,
    );
  });

  it('requires a Customer to be selected', () => {
    expect(validatePurchaseOrderDraft(draft({ customerId: '' })).customerId).toBe(
      PURCHASE_ORDER_MESSAGES.customerRequired,
    );
  });

  it('requires each Line Item SKU and Product Name, trimmed', () => {
    const result = validatePurchaseOrderDraft(
      draft({ lines: [{ sku: '   ', productName: '', quantity: '1', unitPrice: '0' }] }),
    );
    expect(result.lineErrors[0].sku).toBe(PURCHASE_ORDER_MESSAGES.skuRequired);
    expect(result.lineErrors[0].productName).toBe(PURCHASE_ORDER_MESSAGES.productNameRequired);
  });

  it('requires Quantity greater than zero', () => {
    expect(
      validatePurchaseOrderDraft(
        draft({ lines: [{ sku: 'A', productName: 'B', quantity: '0', unitPrice: '1' }] }),
      ).lineErrors[0].quantity,
    ).toBe(PURCHASE_ORDER_MESSAGES.quantityInvalid);
    expect(
      validatePurchaseOrderDraft(
        draft({ lines: [{ sku: 'A', productName: 'B', quantity: '-3', unitPrice: '1' }] }),
      ).lineErrors[0].quantity,
    ).toBe(PURCHASE_ORDER_MESSAGES.quantityInvalid);
  });

  it('requires Quantity to be a number', () => {
    expect(
      validatePurchaseOrderDraft(
        draft({ lines: [{ sku: 'A', productName: 'B', quantity: 'two', unitPrice: '1' }] }),
      ).lineErrors[0].quantity,
    ).toBe(PURCHASE_ORDER_MESSAGES.quantityNotANumber);
    expect(
      validatePurchaseOrderDraft(
        draft({ lines: [{ sku: 'A', productName: 'B', quantity: '2.5', unitPrice: '1' }] }),
      ).lineErrors[0].quantity,
    ).toBeNull();
  });

  it('requires Unit Price zero or more', () => {
    expect(
      validatePurchaseOrderDraft(
        draft({ lines: [{ sku: 'A', productName: 'B', quantity: '1', unitPrice: '-1' }] }),
      ).lineErrors[0].unitPrice,
    ).toBe(PURCHASE_ORDER_MESSAGES.unitPriceInvalid);
  });

  it('requires Unit Price to be a number', () => {
    expect(
      validatePurchaseOrderDraft(
        draft({ lines: [{ sku: 'A', productName: 'B', quantity: '1', unitPrice: '' }] }),
      ).lineErrors[0].unitPrice,
    ).toBe(PURCHASE_ORDER_MESSAGES.unitPriceNotANumber);
    expect(
      validatePurchaseOrderDraft(
        draft({ lines: [{ sku: 'A', productName: 'B', quantity: '1', unitPrice: '0' }] }),
      ).lineErrors[0].unitPrice,
    ).toBeNull();
  });

  it('requires at least one Line Item', () => {
    expect(validatePurchaseOrderDraft(draft({ lines: [] })).noLines).toBe(true);
    expect(validatePurchaseOrderDraft(draft()).noLines).toBeNull();
  });
});
