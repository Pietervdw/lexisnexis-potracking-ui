import type { PurchaseOrderListItem } from '../data-access/purchaseorder-service';
import { filterPurchaseOrders } from './purchase-order-filter';

function order(number: string, externalRef: string): PurchaseOrderListItem {
  return { number, externalRef, customerName: 'Acme', total: 100 };
}

describe('filterPurchaseOrders', () => {
  const orders = [order('PO0012', 'EXT126'), order('PO0034', 'INV-9'), order('PO0007', 'EXT007')];

  it('selects Purchase Orders whose PO Number or External Reference contains the term, case-insensitively', () => {
    expect(filterPurchaseOrders(orders, 'ext126')).toEqual([order('PO0012', 'EXT126')]);
    expect(filterPurchaseOrders(orders, 'po0007')).toEqual([order('PO0007', 'EXT007')]);
  });

  it('tolerates leading zeros: "12" finds PO0012 and "0012" finds PO12', () => {
    const padded = [order('PO0012', 'A'), order('PO12', 'B'), order('PO0034', 'C')];
    expect(filterPurchaseOrders(padded, '12')).toEqual([order('PO0012', 'A'), order('PO12', 'B')]);
    expect(filterPurchaseOrders(padded, '0012')).toEqual([
      order('PO0012', 'A'),
      order('PO12', 'B'),
    ]);
  });

  it('shows all Purchase Orders when the term is blank', () => {
    expect(filterPurchaseOrders(orders, '')).toEqual(orders);
    expect(filterPurchaseOrders(orders, '   ')).toEqual(orders);
  });
});
