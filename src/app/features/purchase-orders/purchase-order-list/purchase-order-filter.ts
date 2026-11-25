import type { PurchaseOrderListItem } from '../data-access/purchaseorder-service';

function zeroNormalizeRun(run: string): string {
  const stripped = run.replace(/^0+/, '');
  return stripped === '' ? run : stripped;
}

function zeroNormalize(value: string): string {
  return value.replace(/\d+/g, zeroNormalizeRun);
}

function containsTerm(field: string, term: string): boolean {
  const lowerField = field.toLowerCase();
  const lowerTerm = term.toLowerCase();
  if (lowerField.includes(lowerTerm)) {
    return true;
  }
  return zeroNormalize(lowerField).includes(zeroNormalize(lowerTerm));
}

export function filterPurchaseOrders(
  orders: PurchaseOrderListItem[],
  term: string,
): PurchaseOrderListItem[] {
  const query = term.trim();
  if (query === '') {
    return orders;
  }
  return orders.filter(
    (order) => containsTerm(order.number, query) || containsTerm(order.externalRef, query),
  );
}
