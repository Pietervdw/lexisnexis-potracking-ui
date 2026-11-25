# Purchase Order Tracking

Angular UI that lists, creates, and tracks Purchase Orders against the POTracking API. Vocabulary mirrors the API's domain model.

## Language

**Purchase Order**:
An order for a set of products, belonging to one Customer. Identified by its PO Number.
_Avoid_: order, invoice

**PO Number**:
The system-generated sequential identifier of a Purchase Order, e.g. PO0001. Assigned at creation, immutable.
_Avoid_: PO ID, order number, ID

**External Reference**:
The reference the Customer uses for the Purchase Order in their own system. Unique, case-insensitively.
_Avoid_: customer reference, ref

**Customer**:
The organization a Purchase Order belongs to. The only counterparty in this domain; there is no separate supplier or vendor.
_Avoid_: supplier, vendor, client, buyer

**Line Item**:
A single product on a Purchase Order: SKU, product name, quantity, and unit price.
_Avoid_: line, item, product line

**Status**:
The lifecycle state of a Purchase Order: Pending, Confirmed, Shipped, Fulfilled, or Cancelled.
_Avoid_: state

**Terminal Status**:
Fulfilled or Cancelled. A Purchase Order in a terminal status never changes status again.
_Avoid_: final status, closed
