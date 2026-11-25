export interface PurchaseOrderLineDraft {
  sku: string;
  productName: string;
  quantity: string;
  unitPrice: string;
}

export interface PurchaseOrderDraft {
  externalRef: string;
  customerId: string;
  lines: PurchaseOrderLineDraft[];
}

export interface LineItemErrors {
  sku: string | null;
  productName: string | null;
  quantity: string | null;
  unitPrice: string | null;
}

export type LineField = keyof PurchaseOrderLineDraft;

export interface PurchaseOrderFormErrors {
  externalRef: string | null;
  customerId: string | null;
  noLines: boolean | null;
  lineErrors: LineItemErrors[];
}

export const PURCHASE_ORDER_MESSAGES = {
  externalRefRequired: 'External reference is required.',
  customerRequired: 'Select a customer.',
  noLinesRequired: 'At least one Line Item is required.',
  skuRequired: 'SKU is required.',
  productNameRequired: 'Product name is required.',
  quantityInvalid: 'Quantity must be greater than 0.',
  quantityNotANumber: 'Quantity must be a number.',
  unitPriceInvalid: 'Unit price cannot be less than 0.',
  unitPriceNotANumber: 'Unit price must be a number.',
};

export function validatePurchaseOrderDraft(draft: PurchaseOrderDraft): PurchaseOrderFormErrors {
  const lineErrors = draft.lines.map((line) => ({
    sku: isBlank(line.sku) ? PURCHASE_ORDER_MESSAGES.skuRequired : null,
    productName: isBlank(line.productName) ? PURCHASE_ORDER_MESSAGES.productNameRequired : null,
    quantity: quantityError(line.quantity),
    unitPrice: unitPriceError(line.unitPrice),
  }));

  return {
    externalRef: isBlank(draft.externalRef) ? PURCHASE_ORDER_MESSAGES.externalRefRequired : null,
    customerId: isBlank(draft.customerId) ? PURCHASE_ORDER_MESSAGES.customerRequired : null,
    noLines: draft.lines.length === 0 ? true : null,
    lineErrors,
  };
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function quantityError(value: string): string | null {
  if (isBlank(value)) return PURCHASE_ORDER_MESSAGES.quantityNotANumber;
  const quantity = Number(value);
  if (Number.isNaN(quantity)) return PURCHASE_ORDER_MESSAGES.quantityNotANumber;
  return quantity <= 0 ? PURCHASE_ORDER_MESSAGES.quantityInvalid : null;
}

function unitPriceError(value: string): string | null {
  if (isBlank(value)) return PURCHASE_ORDER_MESSAGES.unitPriceNotANumber;
  const unitPrice = Number(value);
  if (Number.isNaN(unitPrice)) return PURCHASE_ORDER_MESSAGES.unitPriceNotANumber;
  return unitPrice < 0 ? PURCHASE_ORDER_MESSAGES.unitPriceInvalid : null;
}
