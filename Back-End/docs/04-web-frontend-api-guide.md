# Web Frontend API Guide

Use this guide for a React/Vite/Next-style web frontend that connects to the local IntelliSales backend.

## Base URL

Store the API base URL in a frontend environment variable.

```text
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

When connecting to a backend on another laptop:

```text
VITE_API_BASE_URL=http://<BACKEND_LAPTOP_LAN_IP>:5000/api/v1
```

## Auth Flow

1. `POST /auth/login`.
2. Store `accessToken` and `refreshToken` according to frontend security practice.
3. Attach `Authorization: Bearer <accessToken>` to protected requests.
4. On `401`, call `POST /auth/refresh-token`.
5. On logout, call `POST /auth/logout` and clear local token state.

## Suggested Web Screens

| Screen | Main APIs |
| --- | --- |
| Login | `POST /auth/login` |
| Dashboard | `GET /dashboard/summary`, `GET /dashboard/sales-reps`, `GET /dashboard/recent-activity` |
| Admin users | `GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `PATCH /users/:id/password`, `DELETE /users/:id` |
| Customers | `GET /customers`, `POST /customers`, `GET /customers/:id`, `PATCH /customers/:id`, `PATCH /customers/:id/assign`, `DELETE /customers/:id` |
| Products | `GET /products`, `POST /products`, `PATCH /products/:id`, `PATCH /products/:id/price`, `DELETE /products/:id` |
| Price lists | `GET /price-lists`, `POST /price-lists`, `GET /price-lists/customer-type/:customerType` |
| Invoices | `GET /invoices`, `POST /invoices`, `PATCH /invoices/:id`, `PATCH /invoices/:id/confirm`, `PATCH /invoices/:id/archive` |
| PDF | `GET /invoices/:id/pdf` |
| Payments | `PATCH /invoices/:id/mark-sent`, `PATCH /invoices/:id/payment`, `GET /customers/:id/balance` |
| Visits | `GET /visits`, `POST /visits`, `PATCH /visits/:id/complete`, `PATCH /visits/:id/cancel` |
| Recommendations | `GET /recommendations/customers/:customerId/products` |

## Tables And Pagination

Use paginated list endpoints for tables:

- `GET /users?page=1&limit=10`
- `GET /customers?page=1&limit=10`
- `GET /products?page=1&limit=10`
- `GET /price-lists?page=1&limit=10`
- `GET /invoices?page=1&limit=10`
- `GET /visits?page=1&limit=10`

Read rows from `response.data` and pagination controls from `response.pagination`.

## Invoice PDF

For web, open the PDF in a new tab or download it as a blob:

```http
GET /api/v1/invoices/:id/pdf
Authorization: Bearer <accessToken>
```

Successful response is `application/pdf`, not JSON.

## Error Handling

- Show `response.message` in toast/snackbar messages.
- For form validation, map `errors[]` to field-level messages when present.
- Treat `401` as unauthenticated and refresh or redirect to login.
- Treat `403` as logged in but not allowed.
- Treat `404` as missing resource or route.

## Field Notes

- Customers include `customerType` and `paymentType`.
- Products expose both `sku` and `productCode`; they are the same current code value.
- Product and invoice currency default is `SYP`.
- Voice processing is not a backend feature. If the frontend converts voice to text, send text in invoice `voiceText` and `source: "VOICE_TEXT"` where supported.
