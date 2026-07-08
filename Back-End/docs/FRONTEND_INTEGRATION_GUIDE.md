# Frontend Integration Guide

This guide is for the IntelliSales web frontend and Flutter mobile teams. It is based on the implemented backend routes in `src/app.js` and `src/modules/*/*.routes.js`.

## Base URLs

| Client | Base URL |
| --- | --- |
| Web app on same laptop | `http://localhost:5000/api/v1` |
| Web app on another laptop, same Wi-Fi | `http://<BACKEND_LAPTOP_LAN_IP>:5000/api/v1` |
| Flutter Android emulator | `http://10.0.2.2:5000/api/v1` |
| Flutter iOS simulator on same Mac | `http://localhost:5000/api/v1` |
| Physical Android/iPhone on same Wi-Fi | `http://<BACKEND_LAPTOP_LAN_IP>:5000/api/v1` |

For LAN or physical phone testing, run the backend with `HOST=0.0.0.0`.

## Auth Flow

1. Login with `POST /auth/login`.
2. Store `data.accessToken` and `data.refreshToken`.
3. Send protected requests with:

```text
Authorization: Bearer <accessToken>
```

4. If a request returns `401`, call `POST /auth/refresh-token` with the refresh token.
5. On logout, call `POST /auth/logout` and clear frontend token state.

Seed demo users all use `Password123!`.

| Email | Role |
| --- | --- |
| `admin@intellisales.com` | COMPANY_ADMIN |
| `manager@intellisales.com` | SALES_MANAGER |
| `supervisor@intellisales.com` | SALES_SUPERVISOR |
| `rep@intellisales.com` | SALES_REPRESENTATIVE |
| `accountant@intellisales.com` | ACCOUNTANT |

## Unified JSON Response Rules

Single action/resource:

```json
{
  "success": true,
  "message": "Clear message",
  "data": {
    "customer": {}
  }
}
```

Paginated list:

```json
{
  "success": true,
  "message": "Items fetched successfully",
  "count": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  },
  "data": []
}
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

Successful invoice PDF responses are `application/pdf`, not JSON. PDF errors still use the JSON error wrapper.

## Implemented Endpoint Groups

All paths below are relative to `/api/v1`.

### Health

- `GET /health`
- `GET /health/db`

### Auth

- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /auth/protected-test`
- `GET /auth/admin-test`

### Users

Admin only.

- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `PATCH /users/:id/password`
- `DELETE /users/:id`

### Customers

- `GET /customers`
- `POST /customers`
- `GET /customers/:id`
- `PATCH /customers/:id`
- `PATCH /customers/:id/assign`
- `DELETE /customers/:id`
- `GET /customers/:id/invoices`
- `GET /customers/:id/balance`
- `GET /customers/:id/visits`

Sales representatives can access assigned customers only. Accountants can read customers but cannot modify them.

### Products

- `GET /products`
- `POST /products`
- `GET /products/price-list`
- `GET /products/:id`
- `PATCH /products/:id`
- `PATCH /products/:id/price`
- `DELETE /products/:id`

Product create supports `sku` or `productCode`. Responses include both. Default currency is `SYP`.

### Price Lists

- `GET /price-lists`
- `POST /price-lists`
- `GET /price-lists/customer-type/:customerType`
- `GET /price-lists/:id`
- `PATCH /price-lists/:id`
- `DELETE /price-lists/:id`

`customerType` values are `Retail`, `Wholesale`, and `KeyAccount`.

### Invoices

- `GET /invoices`
- `POST /invoices`
- `GET /invoices/:id`
- `PATCH /invoices/:id`
- `PATCH /invoices/:id/confirm`
- `PATCH /invoices/:id/archive`
- `GET /invoices/:id/pdf`
- `PATCH /invoices/:id/payment`
- `PATCH /invoices/:id/mark-sent`

Draft invoices use active customer-type price lists. Confirmed and archived invoices cannot be edited.

### Visits

- `GET /visits`
- `POST /visits`
- `GET /visits/:id`
- `PATCH /visits/:id`
- `PATCH /visits/:id/complete`
- `PATCH /visits/:id/cancel`

### Dashboard

- `GET /dashboard/summary`
- `GET /dashboard/sales-reps`
- `GET /dashboard/recent-activity`

`/dashboard/sales-reps` is for company admin, sales manager, and sales supervisor only.

### Recommendations

- `GET /recommendations/customers/:customerId/products`

Query:

- `limit`: default `5`, max `20`
- `includeHistory`: default `true`

Sales representatives can request recommendations only for assigned customers.

## Recommended Web Screens

| Screen | APIs |
| --- | --- |
| Login | `POST /auth/login` |
| Dashboard | `GET /dashboard/summary`, `GET /dashboard/sales-reps`, `GET /dashboard/recent-activity` |
| Users admin | `/users` routes |
| Customers | `/customers` routes |
| Products | `/products` and `/price-lists` routes |
| Invoices | `/invoices` routes and PDF |
| Payments | `/invoices/:id/payment`, `/invoices/:id/mark-sent`, `/customers/:id/balance` |
| Visits | `/visits` routes |
| Recommendations | `/recommendations/customers/:customerId/products` |

## Recommended Mobile Sales Rep Flow

1. `POST /auth/login`
2. `GET /auth/me`
3. `GET /customers`
4. `GET /customers/:id`
5. `GET /recommendations/customers/:customerId/products`
6. `GET /price-lists/customer-type/:customerType`
7. `POST /invoices`
8. `PATCH /invoices/:id/confirm`
9. `GET /invoices/:id/pdf`
10. `POST /visits`
11. `PATCH /visits/:id/complete`

Voice processing is not implemented in the backend. If the mobile app converts voice to text, send the text in supported fields such as invoice `voiceText` with `source: "VOICE_TEXT"`.

## Security Notes

Frontend code must not rely on or expose:

- `password`
- `passwordHash`
- `refreshTokenVersion`
- `__v`
- raw token internals
- `.env` secrets

Use `response.message` for user feedback and `errors[]` for field-level validation messages when present.
