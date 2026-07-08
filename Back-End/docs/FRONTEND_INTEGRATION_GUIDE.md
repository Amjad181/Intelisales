# Frontend Integration Guide

This is the authoritative web and Flutter integration guide for the IntelliSales backend currently in `Back-End/`.

This document was cross-checked against `src/app.js`, every `src/modules/*/*.routes.js` file, the controller response keys, the Zod validators, the Jest/Supertest tests, and `postman/IntelliSales_Final_API_Postman_Collection.json`. When older prompts or informal notes disagree with this file, use the running backend code and tests as the source of truth.

## Current Backend Contract

- Backend scope: Modules 1-12 only.
- Runtime: Node.js 20+, Express.js, MongoDB, Mongoose.
- API style: REST JSON API under `/api/v1`.
- Authentication: JWT access token plus refresh token.
- Main local base URL: `http://localhost:5000/api/v1`.
- Android emulator base URL: `http://10.0.2.2:5000/api/v1`.
- Physical phone base URL: `http://<BACKEND_LAPTOP_LAN_IP>:5000/api/v1`.
- Physical devices require `HOST=0.0.0.0` in `.env`.
- Successful invoice PDF responses return binary `application/pdf`; PDF errors still return JSON.
- Swagger UI and `/api-docs` are not implemented.
- Module 13 final frontend integration cleanup is not part of this handoff.

## Setup For Frontend Testing

From `Back-End/`:

```bash
npm install
copy .env.example .env
npm run seed:users
npm run seed:products
npm run seed:price-lists
npm run dev
```

Use these safe local environment values:

```env
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
MONGO_URI=mongodb://127.0.0.1:27017/intellisales
JWT_ACCESS_SECRET=change_this_access_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
```

Do not commit `.env`. Seeded demo users all use `Password123!`.

| Email | Role |
| --- | --- |
| `admin@intellisales.com` | `COMPANY_ADMIN` |
| `manager@intellisales.com` | `SALES_MANAGER` |
| `supervisor@intellisales.com` | `SALES_SUPERVISOR` |
| `rep@intellisales.com` | `SALES_REPRESENTATIVE` |
| `accountant@intellisales.com` | `ACCOUNTANT` |

## Authentication Lifecycle

1. Login with `POST /auth/login`.
2. Store `data.accessToken`, `data.refreshToken`, and `data.user`.
3. Send protected requests with `Authorization: Bearer <accessToken>`.
4. If a protected request returns `401`, call `POST /auth/refresh-token` with the refresh token.
5. Replace both stored tokens from the refresh response.
6. If refresh also returns `401`, clear tokens and send the user to login.
7. If a request returns `403`, the user is authenticated but the role or ownership rule forbids the action.
8. Logout with `POST /auth/logout`, then clear local token state.

Frontend code must never expose or depend on `password`, `passwordHash`, `refreshTokenVersion`, `__v`, raw JWT internals, or `.env` secrets.

## Unified Response Envelopes

Single-resource or action success:

```json
{
  "success": true,
  "message": "Customer retrieved successfully",
  "data": {
    "customer": {
      "id": "65f000000000000000000001",
      "name": "Retail Market"
    }
  }
}
```

Create success uses HTTP `201` and the same wrapper.

Paginated list success:

```json
{
  "success": true,
  "message": "Customers fetched successfully",
  "count": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  },
  "data": []
}
```

Validation or application error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

Database health disconnected response is a normal JSON error with `data`:

```json
{
  "success": false,
  "message": "Database connection is not healthy",
  "data": {
    "database": "disconnected",
    "readyState": 0
  }
}
```

Successful PDF response:

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: inline; filename="IntelliSales-INV-2026-00001.pdf"
```

## Common Rules

- IDs are MongoDB ObjectId strings with 24 hex characters.
- Dates are ISO strings, for example `2030-02-01T10:00:00.000Z`.
- Paginated endpoints use `page` and `limit`; most `limit` values max at `100`.
- Sortable list endpoints use `sortBy` and `sortOrder=asc|desc`.
- Currency uses 3-letter uppercase codes. Current default product and price-list currency is `SYP`.
- Customer types are `Retail`, `Wholesale`, and `KeyAccount`.
- Customer payment types are `Cash` and `Credit`.
- Product `productCode` is an alias for `sku`; responses include both.
- List endpoints return arrays directly in top-level `data`, not nested inside `data.items`.
- 401 means missing/invalid/expired token. 403 means role or ownership denied.

## Role Matrix

| Area | COMPANY_ADMIN | SALES_MANAGER | SALES_SUPERVISOR | SALES_REPRESENTATIVE | ACCOUNTANT |
| --- | --- | --- | --- | --- | --- |
| Health | Read | Read | Read | Read | Read |
| Auth profile | Own | Own | Own | Own | Own |
| Users | Manage | No | No | No | No |
| Customers | Manage | Manage | Manage | Assigned/basic create/update | Read |
| Products | Manage | Manage | Manage | Read active | Read active |
| Price lists | Manage | Manage | Manage | Read active | Read active |
| Invoices | Create/edit/confirm/archive | Create/edit/confirm/archive | Create/edit/confirm/archive | Own assigned customers only | Read |
| Invoice PDF | Read allowed invoices | Read allowed invoices | Read allowed invoices | Own assigned customers only | Read |
| Payments | Update/mark sent | Update/mark sent | No | No | Update/mark sent |
| Balance | Read | Read | Read | Assigned customers only | Read |
| Visits | Manage | Manage | Manage | Own assigned customers only | Read |
| Dashboard summary/recent | Read | Read | Read | Own scope | Financial scope |
| Dashboard sales reps | Read | Read | Read | No | No |
| Recommendations | Read | Read | Read | Assigned customers only | Read |

## Endpoint Catalog

All paths are relative to `/api/v1`. "All auth roles" means any active seeded role with a valid bearer token.

### Health

| Method | Path | Roles | Query | Body | Success | Data key | Common errors | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/health` | Public | None | None | 200 | `data.status`, `data.environment` | None expected | `GET /health` returns `{"success":true,"data":{"status":"ok"}}` |
| GET | `/health/db` | Public | None | None | 200 or 503 | `data.database`, `data.readyState` | 503 when MongoDB disconnected | `GET /health/db` returns connected or disconnected status |

### Auth

| Method | Path | Roles | Query | Body | Success | Data key | Common errors | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/auth/login` | Public | None | `email`, `password` | 200 | `data.user`, `data.accessToken`, `data.refreshToken` | 400 validation, 401 invalid credentials, 403 inactive user | `POST /auth/login` with admin credentials returns user and tokens |
| POST | `/auth/refresh-token` | Public | None | `refreshToken` | 200 | `data.user`, `data.accessToken`, `data.refreshToken` | 400 validation, 401 invalid refresh token, 403 inactive user | `POST /auth/refresh-token` returns rotated tokens and safe user |
| POST | `/auth/logout` | All auth roles | None | None | 200 | `data` is `null` | 401 invalid/missing token | `POST /auth/logout` invalidates future use of the current refresh token version |
| GET | `/auth/me` | All auth roles | None | None | 200 | `data.user` | 401 invalid/missing token | `GET /auth/me` returns the current safe user |
| GET | `/auth/protected-test` | All auth roles | None | None | 200 | `data.user` | 401 invalid/missing token | `GET /auth/protected-test` confirms bearer auth |
| GET | `/auth/admin-test` | COMPANY_ADMIN | None | None | 200 | `data.user` | 401, 403 | `GET /auth/admin-test` with admin token succeeds |

### Users

All users endpoints require `COMPANY_ADMIN`.

| Method | Path | Roles | Query | Body | Success | Data key | Common errors | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/users` | COMPANY_ADMIN | `page`, `limit`, `search`, `role`, `status`, `sortBy`, `sortOrder` | None | 200 | top-level `data[]` | 401, 403, 400 validation | `GET /users?role=SALES_REPRESENTATIVE` returns paginated users |
| POST | `/users` | COMPANY_ADMIN | None | `name`, `email`, `password`, `role`, optional `status` | 201 | `data.user` | 400 validation, 409 email exists | `POST /users` creates a safe user response |
| GET | `/users/:id` | COMPANY_ADMIN | None | None | 200 | `data.user` | 400 bad ObjectId, 404 | `GET /users/<id>` returns one user |
| PATCH | `/users/:id` | COMPANY_ADMIN | None | optional `name`, `email`, `role`, `status` | 200 | `data.user` | 400 validation/self-role guard, 404, 409 | `PATCH /users/<id>` updates admin-controlled fields |
| PATCH | `/users/:id/password` | COMPANY_ADMIN | None | `password` | 200 | `data.user` | 400 validation, 404 | `PATCH /users/<id>/password` resets password |
| DELETE | `/users/:id` | COMPANY_ADMIN | None | None | 200 | `data.user` | 400 self-deactivate guard, 404 | `DELETE /users/<id>` soft deactivates the user |

### Customers

Sales representatives are ownership-limited to assigned customers. They may update only basic fields on assigned customers: `contactName`, `phone`, `email`, `address`, and `notes`.

| Method | Path | Roles | Query | Body | Success | Data key | Common errors | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/customers` | All auth roles | `page`, `limit`, `search`, `status`, `customerType`, `paymentType`, `assignedSalesRep`, `city`, `sortBy`, `sortOrder` | None | 200 | top-level `data[]` | 401, 403, 400 | `GET /customers?customerType=Retail` returns visible customers |
| POST | `/customers` | Admin, manager, supervisor, sales rep | None | `name`, optional contact/address/type/payment/status/assigned rep | 201 | `data.customer` | 400 validation, 403 ownership/role | `POST /customers` creates a customer |
| GET | `/customers/:id` | All auth roles | None | None | 200 | `data.customer` | 400, 403, 404 | `GET /customers/<id>` returns one visible customer |
| PATCH | `/customers/:id` | Admin, manager, supervisor, sales rep | None | editable customer fields | 200 | `data.customer` | 400, 403, 404 | `PATCH /customers/<id>` updates allowed fields |
| PATCH | `/customers/:id/assign` | Admin, manager, supervisor | None | `assignedSalesRep` | 200 | `data.customer` | 400, 403, 404 | `PATCH /customers/<id>/assign` reassigns to an active sales rep |
| DELETE | `/customers/:id` | Admin, manager, supervisor | None | None | 200 | `data.customer` | 400, 403, 404 | `DELETE /customers/<id>` soft deactivates |
| GET | `/customers/:id/invoices` | All auth roles | invoice list query except `customerId` | None | 200 | top-level `data[]` | 400, 403, 404 | `GET /customers/<id>/invoices` returns customer invoices |
| GET | `/customers/:id/balance` | All auth roles | None | None | 200 | `data.customer`, `data.balance`, `data.invoices` | 400, 403, 404 | `GET /customers/<id>/balance` returns unpaid balance summary |
| GET | `/customers/:id/visits` | All auth roles | `page`, `limit`, `status`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder` | None | 200 | top-level `data[]` | 400, 403, 404 | `GET /customers/<id>/visits` returns customer visits |

### Products

Managers can manage products. Sales reps and accountants can read active products only.

| Method | Path | Roles | Query | Body | Success | Data key | Common errors | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/products` | All auth roles | `page`, `limit`, `search`, `status`, `category`, `brand`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder` | None | 200 | top-level `data[]` | 400, 401, 403 | `GET /products?search=paper` returns products |
| POST | `/products` | Admin, manager, supervisor | None | `name`, `sku` or `productCode`, `basePrice`, optional metadata | 201 | `data.product` | 400, 403, 409 SKU exists | `POST /products` creates product and returns `productCode` |
| GET | `/products/price-list` | All auth roles | `page`, `limit`, `search`, `category` | None | 200 | top-level `data[]` | 400, 401, 403 | `GET /products/price-list` returns active product price items |
| GET | `/products/:id` | All auth roles | None | None | 200 | `data.product` | 400, 403, 404 | `GET /products/<id>` returns one product |
| PATCH | `/products/:id` | Admin, manager, supervisor | None | optional product fields | 200 | `data.product` | 400, 403, 404, 409 | `PATCH /products/<id>` updates product |
| PATCH | `/products/:id/price` | Admin, manager, supervisor | None | `basePrice`, optional `currency`, `taxRate` | 200 | `data.product` | 400, 403, 404 | `PATCH /products/<id>/price` updates price fields |
| DELETE | `/products/:id` | Admin, manager, supervisor | None | None | 200 | `data.product` | 400, 403, 404 | `DELETE /products/<id>` soft deactivates |

### Price Lists

Price lists connect `customerType` to invoice prices. Read-only roles see active lists.

| Method | Path | Roles | Query | Body | Success | Data key | Common errors | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/price-lists` | All auth roles | `page`, `limit`, `customerType`, `status`, `search`, `sortBy`, `sortOrder` | None | 200 | top-level `data[]` | 400, 401, 403 | `GET /price-lists?customerType=Retail` returns visible price lists |
| POST | `/price-lists` | Admin, manager, supervisor | None | `name`, `customerType`, optional `description`, `status`, `items[]` | 201 | `data.priceList` | 400, 403, 404 product not found | `POST /price-lists` creates a list |
| GET | `/price-lists/customer-type/:customerType` | All auth roles | None | None | 200 | `data.priceList` | 400 invalid type, 404 | `GET /price-lists/customer-type/Retail` returns active list with product fields |
| GET | `/price-lists/:id` | All auth roles | None | None | 200 | `data.priceList` | 400, 403, 404 | `GET /price-lists/<id>` returns one list |
| PATCH | `/price-lists/:id` | Admin, manager, supervisor | None | optional name/type/status/items | 200 | `data.priceList` | 400, 403, 404 | `PATCH /price-lists/<id>` updates list |
| DELETE | `/price-lists/:id` | Admin, manager, supervisor | None | None | 200 | `data.priceList` | 400, 403, 404 | `DELETE /price-lists/<id>` soft deactivates |

Active customer-type lookup item fields are snapshot-friendly: `productId`, `productCode`, `productName`, `price`, `currency`, `basePrice`, and `unit` when available. Inactive products are excluded from active lookup results.

### Invoices, PDF, Payments, And Balance

Draft invoices are priced from the active customer-type price list. Confirming generates an `INV-YYYY-00001` style invoice number. Confirmed and archived invoices cannot be edited. Sales reps are limited to invoices for assigned customers they created/own.

| Method | Path | Roles | Query | Body | Success | Data key | Common errors | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/invoices` | All auth roles | `page`, `limit`, `search`, `invoiceStatus`, `paymentStatus`, `customerId`, `createdBy`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder` | None | 200 | top-level `data[]` | 400, 401, 403 | `GET /invoices?invoiceStatus=DRAFT` returns visible invoices |
| POST | `/invoices` | Admin, manager, supervisor, sales rep | None | `customerId`, `items[]`, discount fields, optional due/source/voice/notes | 201 | `data.invoice` | 400 pricing/discount/currency, 403, 404 | `POST /invoices` creates a draft invoice |
| GET | `/invoices/:id` | All auth roles | None | None | 200 | `data.invoice` | 400, 403, 404 | `GET /invoices/<id>` returns one invoice |
| PATCH | `/invoices/:id` | Admin, manager, supervisor, sales rep | None | optional `items`, discount fields, `dueDate`, `source`, `voiceText`, `notes` | 200 | `data.invoice` | 400 only draft/pricing, 403, 404 | `PATCH /invoices/<id>` edits a draft |
| PATCH | `/invoices/:id/confirm` | Admin, manager, supervisor, sales rep | None | None | 200 | `data.invoice` | 400 only draft, 403, 404 | `PATCH /invoices/<id>/confirm` confirms and numbers invoice |
| PATCH | `/invoices/:id/archive` | Admin, manager, supervisor | None | None | 200 | `data.invoice` | 400 already archived, 403, 404 | `PATCH /invoices/<id>/archive` archives invoice |
| GET | `/invoices/:id/pdf` | All auth roles | None | None | 200 | binary PDF | 400, 401, 403, 404 as JSON | `GET /invoices/<id>/pdf` downloads inline PDF |
| PATCH | `/invoices/:id/payment` | Admin, manager, accountant | None | `paidAmount`, `paymentMethod`=`Cash` | 200 | `data.invoice` | 400 draft/archived/overpay, 403, 404 | `PATCH /invoices/<id>/payment` updates cash payment |
| PATCH | `/invoices/:id/mark-sent` | Admin, manager, accountant | None | None | 200 | `data.invoice` | 400 draft/archived/paid, 403, 404 | `PATCH /invoices/<id>/mark-sent` sets payment status to `SENT` |

Create invoice example:

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
  "notes": "Frontend draft"
}
```

Payment example:

```json
{
  "paidAmount": 1000,
  "paymentMethod": "Cash"
}
```

### Visits

Visits start as `PLANNED`, then become `COMPLETED` or `CANCELLED`. Only planned visits can be changed.

| Method | Path | Roles | Query | Body | Success | Data key | Common errors | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/visits` | All auth roles | `page`, `limit`, `status`, `outcome`, `customer`, `salesRep`, `dateFrom`, `dateTo`, `search`, `sortBy`, `sortOrder` | None | 200 | top-level `data[]` | 400, 401, 403 | `GET /visits?status=PLANNED` returns visible visits |
| POST | `/visits` | Admin, manager, supervisor, sales rep | None | `customer`, optional `salesRep`, `visitDate`, purpose/notes/location | 201 | `data.visit` | 400 date/customer, 403, 404 | `POST /visits` creates planned visit |
| GET | `/visits/:id` | All auth roles | None | None | 200 | `data.visit` | 400, 403, 404 | `GET /visits/<id>` returns one visit |
| PATCH | `/visits/:id` | Admin, manager, supervisor, sales rep | None | optional planned visit fields | 200 | `data.visit` | 400 only planned, 403, 404 | `PATCH /visits/<id>` updates planned visit |
| PATCH | `/visits/:id/complete` | Admin, manager, supervisor, sales rep | None | `outcome`, optional notes/next action/date | 200 | `data.visit` | 400 only planned, 403, 404 | `PATCH /visits/<id>/complete` completes visit |
| PATCH | `/visits/:id/cancel` | Admin, manager, supervisor, sales rep | None | optional `notes` | 200 | `data.visit` | 400 only planned, 403, 404 | `PATCH /visits/<id>/cancel` cancels visit |

Create visit example:

```json
{
  "customer": "65f000000000000000000001",
  "visitDate": "2030-02-01T10:00:00.000Z",
  "purpose": "Discuss new order",
  "location": {
    "city": "Damascus"
  }
}
```

### Dashboard

| Method | Path | Roles | Query | Body | Success | Data key | Common errors | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/dashboard/summary` | All auth roles | None | None | 200 | `data.summary` | 401, 403 | `GET /dashboard/summary` returns role-aware totals |
| GET | `/dashboard/sales-reps` | Admin, manager, supervisor | None | None | 200 | `data.salesReps`, top-level `count` | 401, 403 | `GET /dashboard/sales-reps` returns sales rep summaries |
| GET | `/dashboard/recent-activity` | All auth roles | `limit` max 50 | None | 200 | `data.activity` | 400, 401, 403 | `GET /dashboard/recent-activity?limit=5` returns invoices/visits activity |

### Recommendations

| Method | Path | Roles | Query | Body | Success | Data key | Common errors | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/recommendations/customers/:customerId/products` | All auth roles | `limit` 1-20, `includeHistory` true/false | None | 200 | `data.customer`, `data.strategy`, `data.recommendations`, `data.meta` | 400, 403, 404 | `GET /recommendations/customers/<id>/products?limit=5` returns recommendations or an empty list |

Possible strategies are `PURCHASE_HISTORY`, `CUSTOMER_TYPE_PRICE_LIST`, and `NO_AVAILABLE_RECOMMENDATIONS`.

## Business Workflows

### Invoice Workflow

1. Select a customer from `GET /customers`.
2. Read customer type from `customer.customerType`.
3. Load prices with `GET /price-lists/customer-type/:customerType`.
4. Create draft invoice with `POST /invoices`.
5. Edit draft with `PATCH /invoices/:id` if needed.
6. Confirm with `PATCH /invoices/:id/confirm`.
7. Download PDF with `GET /invoices/:id/pdf`.
8. Accountant/admin/manager can mark sent with `PATCH /invoices/:id/mark-sent`.
9. Accountant/admin/manager can update cash payment with `PATCH /invoices/:id/payment`.
10. Read customer balance with `GET /customers/:id/balance`.
11. Admin/manager/supervisor can archive with `PATCH /invoices/:id/archive`.

Prohibited transitions:

- Confirmed and archived invoices cannot be edited.
- Draft invoices cannot receive payment updates or mark-sent.
- Archived invoices cannot receive payment updates or mark-sent.
- Fully paid invoices cannot be marked as sent.
- Sales reps cannot apply discounts above 5 percent.
- Mixed item currencies are rejected.

### Visit Workflow

1. Create a planned visit with `POST /visits`.
2. List visits with `GET /visits` or customer visits with `GET /customers/:id/visits`.
3. Update only while planned with `PATCH /visits/:id`.
4. Complete with `PATCH /visits/:id/complete`, including an outcome.
5. Or cancel with `PATCH /visits/:id/cancel`.

Completed and cancelled visits cannot be updated again.

## JavaScript Web Examples

```js
const API_BASE_URL = 'http://localhost:5000/api/v1';

async function login(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  localStorage.setItem('accessToken', body.data.accessToken);
  localStorage.setItem('refreshToken', body.data.refreshToken);
  return body.data.user;
}

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('accessToken');
  let res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    const refresh = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
    });
    const refreshBody = await refresh.json();
    if (!refresh.ok) throw refreshBody;
    localStorage.setItem('accessToken', refreshBody.data.accessToken);
    localStorage.setItem('refreshToken', refreshBody.data.refreshToken);
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${refreshBody.data.accessToken}`,
        ...(options.headers || {}),
      },
    });
  }

  if (path.endsWith('/pdf') && res.ok) return res.blob();
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}

async function loadCustomers(page = 1) {
  const body = await apiFetch(`/customers?page=${page}&limit=10`);
  return {
    customers: body.data,
    pagination: body.pagination,
  };
}
```

## Flutter/Dart Examples

```dart
const apiBaseUrl = 'http://10.0.2.2:5000/api/v1';

Future<Map<String, dynamic>> login(String email, String password) async {
  final response = await http.post(
    Uri.parse('$apiBaseUrl/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'email': email, 'password': password}),
  );
  final body = jsonDecode(response.body) as Map<String, dynamic>;
  if (response.statusCode >= 400) throw body;
  return body['data'] as Map<String, dynamic>;
}

Future<Map<String, dynamic>> getJson(String path, String accessToken) async {
  final response = await http.get(
    Uri.parse('$apiBaseUrl$path'),
    headers: {'Authorization': 'Bearer $accessToken'},
  );
  final body = jsonDecode(response.body) as Map<String, dynamic>;
  if (response.statusCode >= 400) throw body;
  return body;
}

Future<Uint8List> downloadPdf(String invoiceId, String accessToken) async {
  final response = await http.get(
    Uri.parse('$apiBaseUrl/invoices/$invoiceId/pdf'),
    headers: {'Authorization': 'Bearer $accessToken'},
  );
  if (response.statusCode >= 400) {
    throw jsonDecode(utf8.decode(response.bodyBytes));
  }
  return response.bodyBytes;
}
```

For physical phones, replace `10.0.2.2` with the laptop LAN IP and confirm Windows firewall allows port `5000`.

## Field Mapping Notes

- Show `id`, never raw `_id`.
- User display fields: `name`, `email`, `role`, `status`.
- Customer display fields: `name`, `contactName`, `phone`, `email`, `address`, `customerType`, `paymentType`, `status`, `assignedSalesRep`.
- Product display fields: `name`, `sku`, `productCode`, `category`, `brand`, `unit`, `basePrice`, `currency`, `taxRate`, `status`.
- Invoice totals include `subtotal`, `discountAmount`, `taxAmount`, `totalAmount`, `paidAmount`, and `remainingAmount`.
- Invoice item snapshots include product code/name, quantity, unit price, discount/tax amounts, currency, and line total.
- Visit display fields include `customer`, `salesRep`, `visitDate`, `status`, `outcome`, `purpose`, `notes`, `nextAction`, and `location`.

## Postman Handoff

Import:

- `postman/IntelliSales_Final_API_Postman_Collection.json`
- `postman/IntelliSales_Local_Environment.json`

Run after:

```bash
npm run seed:users
npm run seed:products
npm run seed:price-lists
npm run dev
```

The historical final Postman baseline in the handoff prompt is 135 passing Postman tests. If Newman is not installed, run the collection manually in Postman.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `401 Unauthorized` | Missing/expired bearer token, refresh token failed, user inactive |
| `403 Forbidden` | Role denied or sales rep ownership rule failed |
| `400 Validation failed` | Inspect `errors[]` field names and messages |
| `404 Not found` | Bad ObjectId, inactive/hidden record, or route typo |
| Android emulator cannot connect | Use `http://10.0.2.2:5000/api/v1`, not `localhost` |
| Physical phone cannot connect | Use laptop LAN IP, `HOST=0.0.0.0`, same Wi-Fi, firewall allows port 5000 |
| PDF JSON parse fails | PDF success is binary; parse JSON only on non-2xx responses |
| Empty recommendations | `NO_AVAILABLE_RECOMMENDATIONS` is valid when no active price list/products exist |

## Integration Issue Report Template

```text
Screen:
Role and email:
Endpoint:
Method:
Base URL used:
Request headers:
Request query/body:
Expected result:
Actual HTTP status:
Actual response body:
Steps to reproduce:
Screenshot or console log:
```

## Verified Mismatches And Clarifications

- Direct code route for password reset is `PATCH /users/:id/password`.
- Customer balance route is `GET /customers/:id/balance`.
- Invoice payment route is `PATCH /invoices/:id/payment`.
- Invoice sent route is `PATCH /invoices/:id/mark-sent`.
- Product price-list selector route is `GET /products/price-list`; customer-type price lists are under `/price-lists`.
- There is no Swagger UI, no `/api-docs`, no online payment gateway, no inventory module, and no Module 13 feature in this backend handoff.
