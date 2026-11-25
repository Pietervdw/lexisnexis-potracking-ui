const STATUS_NAMES = ['Pending', 'Confirmed', 'Shipped', 'Fulfilled', 'Cancelled'] as const;

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
