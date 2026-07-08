# Endpoints Reference

Base URL:

```text
http://localhost:5000/api/v1
```

Protected routes require:

```text
Authorization: Bearer <accessToken>
```

The paths below match the current Express route files.

## Health

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | No | App health |
| GET | `/health/db` | No | MongoDB connection health |

## Auth

| Method | Path | Roles | Body/Query |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | `email`, `password` |
| POST | `/auth/refresh-token` | Public | `refreshToken` |
| POST | `/auth/logout` | Authenticated | None |
| GET | `/auth/me` | Authenticated | None |
| GET | `/auth/protected-test` | Authenticated | None |
| GET | `/auth/admin-test` | COMPANY_ADMIN | None |

## Users

All user management routes require `COMPANY_ADMIN`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/users` | List users with pagination, search, filters, sorting |
| POST | `/users` | Create user |
| GET | `/users/:id` | Get user |
| PATCH | `/users/:id` | Update user |
| PATCH | `/users/:id/password` | Reset password |
| DELETE | `/users/:id` | Soft deactivate user |

Useful query params: `page`, `limit`, `search`, `role`, `status`, `sortBy`, `sortOrder`.

## Customers

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/customers` | All roles | List customers; sales reps see assigned customers |
| POST | `/customers` | Admin, manager, supervisor, sales rep | Create customer |
| GET | `/customers/:id` | All roles | Get customer; sales reps assigned only |
| PATCH | `/customers/:id` | Admin, manager, supervisor, assigned sales rep | Update customer |
| PATCH | `/customers/:id/assign` | Admin, manager, supervisor | Assign sales rep |
| DELETE | `/customers/:id` | Admin, manager, supervisor | Soft deactivate customer |
| GET | `/customers/:id/invoices` | All roles | List customer invoices |
| GET | `/customers/:id/balance` | All roles | Customer unpaid confirmed balance |
| GET | `/customers/:id/visits` | All roles | List customer visits |

Customer fields include `name`, `contactName`, `phone`, `email`, `address`, `notes`, `assignedSalesRep`, `customerType`, `paymentType`, and `status`.

## Products

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/products` | All roles | List products; sales reps/accountants see active only |
| POST | `/products` | Admin, manager, supervisor | Create product |
| GET | `/products/price-list` | All roles | Active product selector list |
| GET | `/products/:id` | All roles | Get product |
| PATCH | `/products/:id` | Admin, manager, supervisor | Update product |
| PATCH | `/products/:id/price` | Admin, manager, supervisor | Update product price fields |
| DELETE | `/products/:id` | Admin, manager, supervisor | Soft deactivate product |

Product create supports `sku` or `productCode`. Responses include both.

## Price Lists

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/price-lists` | All roles | List price lists; sales reps/accountants read active only |
| POST | `/price-lists` | Admin, manager, supervisor | Create price list |
| GET | `/price-lists/customer-type/:customerType` | All roles | Get active price list for `Retail`, `Wholesale`, or `KeyAccount` |
| GET | `/price-lists/:id` | All roles | Get price list |
| PATCH | `/price-lists/:id` | Admin, manager, supervisor | Update price list |
| DELETE | `/price-lists/:id` | Admin, manager, supervisor | Soft deactivate price list |

Price list item fields: `productId`, `price`, `currency`.

## Invoices

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/invoices` | All roles | List invoices; sales reps see own scope |
| POST | `/invoices` | Admin, manager, supervisor, sales rep | Create draft invoice |
| GET | `/invoices/:id` | All roles | Get invoice |
| PATCH | `/invoices/:id` | Admin, manager, supervisor, sales rep | Edit draft invoice |
| PATCH | `/invoices/:id/confirm` | Admin, manager, supervisor, sales rep | Confirm draft invoice |
| PATCH | `/invoices/:id/archive` | Admin, manager, supervisor | Archive invoice |
| GET | `/invoices/:id/pdf` | All roles | Download invoice PDF |
| PATCH | `/invoices/:id/payment` | Admin, manager, accountant | Update cash payment |
| PATCH | `/invoices/:id/mark-sent` | Admin, manager, accountant | Mark invoice sent |

Create draft body:

```json
{
  "customerId": "65f000000000000000000001",
  "items": [
    {
      "productId": "66f000000000000000000001",
      "quantity": 2
    }
  ],
  "discountType": "NONE",
  "discountValue": 0,
  "source": "MANUAL",
  "notes": "Demo invoice"
}
```

## Visits

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/visits` | All roles | List visits; sales reps see own visits |
| POST | `/visits` | Admin, manager, supervisor, sales rep | Create visit |
| GET | `/visits/:id` | All roles | Get visit |
| PATCH | `/visits/:id` | Admin, manager, supervisor, sales rep | Update planned visit |
| PATCH | `/visits/:id/complete` | Admin, manager, supervisor, sales rep | Complete visit |
| PATCH | `/visits/:id/cancel` | Admin, manager, supervisor, sales rep | Cancel visit |

## Dashboard

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/dashboard/summary` | All roles | Role-aware dashboard summary |
| GET | `/dashboard/sales-reps` | Admin, manager, supervisor | Sales representative summaries |
| GET | `/dashboard/recent-activity` | All roles | Recent invoices/visits activity |

`/dashboard/recent-activity` supports `limit`, default `10`, max `50`.

## Recommendations

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/recommendations/customers/:customerId/products` | All roles | Product recommendations for one customer |

Query params:

- `limit`: default `5`, min `1`, max `20`
- `includeHistory`: default `true`; set `false` to force customer-type price-list fallback

Sales reps can use this route only for assigned customers.

## Example Success

```json
{
  "success": true,
  "message": "Product recommendations fetched successfully",
  "data": {
    "customer": {
      "id": "65f000000000000000000001",
      "name": "Retail Market",
      "customerType": "Retail"
    },
    "strategy": "CUSTOMER_TYPE_PRICE_LIST",
    "recommendations": [],
    "meta": {
      "limit": 5,
      "customerType": "Retail"
    }
  }
}
```

## Example Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```
