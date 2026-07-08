# Frontend Field Mapping

Use these tables for form and table planning.

## Auth

| Field | Required | Notes |
| --- | --- | --- |
| `email` | Yes | Login email |
| `password` | Yes | Login password |
| `accessToken` | Response | Bearer token for protected requests |
| `refreshToken` | Response | Use to refresh access |

## User

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | Display name |
| `email` | Yes | Unique email |
| `password` | Create/reset | Never shown in responses |
| `role` | Yes | `COMPANY_ADMIN`, `SALES_MANAGER`, `SALES_SUPERVISOR`, `SALES_REPRESENTATIVE`, `ACCOUNTANT` |
| `status` | Optional | `ACTIVE`, `INACTIVE` |

## Customer

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | Customer/shop name |
| `contactName` | Optional | Contact person |
| `phone` | Optional | Phone number |
| `email` | Optional | Lowercased by backend |
| `address` | Optional | Object with line/city/state/country fields |
| `notes` | Optional | Internal notes |
| `assignedSalesRep` | Optional/admin | User id |
| `customerType` | Optional | `Retail`, `Wholesale`, `KeyAccount`; default `Retail` |
| `paymentType` | Optional | `Cash`, `Credit`; default `Cash` |
| `status` | Optional | `ACTIVE`, `INACTIVE` |

## Product

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | Product name |
| `sku` | Yes if `productCode` absent | Unique code |
| `productCode` | Alias | Same value as `sku` in responses |
| `barcode` | Optional | Barcode string |
| `category` | Optional | Product category |
| `brand` | Optional | Brand |
| `description` | Optional | Long text |
| `unit` | Optional | `PIECE`, `BOX`, `KG`, `LITER`, `METER`, `PACK` |
| `basePrice` | Yes | Number >= 0 |
| `currency` | Optional | Defaults to `SYP` |
| `taxRate` | Optional | 0-100 |
| `status` | Optional | `ACTIVE`, `INACTIVE` |

## Price List

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | Price list name |
| `customerType` | Yes | `Retail`, `Wholesale`, `KeyAccount` |
| `description` | Optional | Text |
| `status` | Optional | `ACTIVE`, `INACTIVE` |
| `items[].productId` | Yes | Product id |
| `items[].price` | Yes | Price >= 0 |
| `items[].currency` | Optional | Defaults to `SYP` |

## Invoice

| Field | Required | Notes |
| --- | --- | --- |
| `customerId` | Yes | Active customer |
| `items[].productId` | Yes | Active product in active customer-type price list |
| `items[].quantity` | Yes | Number > 0 |
| `discountType` | Optional | `NONE`, `AMOUNT`, `PERCENTAGE` |
| `discountValue` | Optional | Number >= 0 |
| `dueDate` | Optional | ISO date |
| `source` | Optional | `MANUAL`, `VOICE_TEXT` |
| `voiceText` | Optional | Text from frontend voice conversion |
| `notes` | Optional | Text |

Response invoice fields include `invoiceNumber`, `invoiceStatus`, `paymentStatus`, `subtotal`, `discountAmount`, `taxAmount`, `totalAmount`, `paidAmount`, `remainingAmount`, `currency`, item snapshots, and customer snapshot.

## Payment

| Field | Required | Notes |
| --- | --- | --- |
| `paidAmount` | Yes | Cumulative paid amount |
| `paymentMethod` | Optional | Currently `Cash` |

## Visit

| Field | Required | Notes |
| --- | --- | --- |
| `customer` | Yes | Customer id |
| `salesRep` | Management only | Sales representative id |
| `visitDate` | Yes | ISO date |
| `purpose` | Optional | Visit purpose |
| `notes` | Optional | Text |
| `location` | Optional | Object |
| `outcome` | Complete | `NONE`, `ORDER_PLACED`, `PAYMENT_COLLECTED`, `FOLLOW_UP_NEEDED`, `NO_INTEREST`, `CUSTOMER_UNAVAILABLE`, `OTHER` |
| `nextAction` | Optional | Follow-up text |
| `nextVisitDate` | Optional | ISO date |

## Dashboard

Use `data.summary` for dashboard cards. Important groups: `customers`, `products`, `invoices`, `visits`, and `recent`.

## Recommendations

| Field | Notes |
| --- | --- |
| `customer` | Safe customer summary |
| `strategy` | `PURCHASE_HISTORY`, `CUSTOMER_TYPE_PRICE_LIST`, `NO_AVAILABLE_RECOMMENDATIONS` |
| `recommendations[].product.name` | Product display name |
| `recommendations[].product.productCode` | Product code for UI |
| `recommendations[].product.unit` | Unit label |
| `recommendations[].price` | Current price-list price |
| `recommendations[].currency` | Usually `SYP` |
| `recommendations[].reason` | Human-readable recommendation reason |
| `recommendations[].history` | Present for purchase-history results |
