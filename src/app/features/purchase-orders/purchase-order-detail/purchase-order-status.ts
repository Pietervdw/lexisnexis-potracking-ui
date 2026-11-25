export const PURCHASE_ORDER_STATUSES: readonly {
  value: number;
  name: string;
  terminal?: boolean;
}[] = [
  { value: 0, name: 'Pending' },
  { value: 1, name: 'Confirmed' },
  { value: 2, name: 'Shipped' },
  { value: 3, name: 'Fulfilled', terminal: true },
  { value: 4, name: 'Cancelled', terminal: true },
];

const STATUS_NAMES = PURCHASE_ORDER_STATUSES.map((status) => status.name);

const BADGE_CLASSES: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-violet-100 text-violet-800',
  Fulfilled: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export function purchaseOrderStatusName(status: number | undefined): string {
  return status === undefined ? '' : (STATUS_NAMES[status] ?? '');
}

export function purchaseOrderStatusBadgeClass(status: number | undefined): string {
  const name = purchaseOrderStatusName(status);
  return name === '' ? 'bg-gray-100 text-gray-700' : BADGE_CLASSES[name];
}

export function isTerminalPurchaseOrderStatus(status: number | undefined): boolean {
  return PURCHASE_ORDER_STATUSES.find((entry) => entry.value === status)?.terminal ?? false;
}
