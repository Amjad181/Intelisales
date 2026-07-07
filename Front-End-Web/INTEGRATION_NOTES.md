# Integration Notes — Web Frontend

Status of backend integration against the tested Module 12 API contract (`/api/v1`). This file tracks what is real vs. local-demo so nobody confuses the two.

> **July 2026 alignment pass.** The frontend was aligned to the immutable, tested backend contract (183 Jest / 135 Postman passing). No backend routes were invented or changed. See "Changed in this pass" below.

## Base URL

Default: `http://localhost:5000/api/v1` (see `static/js/api/config.js`).

To point at a different backend (another machine, a different port), set `window.INTELLISALES_API_BASE_URL` **before** `main.js`/`loginPage.js` load, e.g. add before the `<script type="module">` tag in `index.html`/`dashboard.html`:

```html
<script>window.INTELLISALES_API_BASE_URL = "http://192.168.1.20:5000/api/v1";</script>
```

## Seed accounts (from the backend team)

```
admin@intellisales.com / Password123!
manager@intellisales.com / Password123!
supervisor@intellisales.com / Password123!
rep@intellisales.com / Password123!
accountant@intellisales.com / Password123!
```

## Response extraction contract (`static/js/api/extractors.js`)

Every service now parses the success envelope through shared helpers so a contract mismatch fails loudly instead of silently rendering `undefined`/em dashes:

| Helper | Returns |
| --- | --- |
| `getDataArray(res)` | `res.data` (list rows are directly the array) |
| `getPagination(res)` | `res.pagination` |
| `getCount(res)` | `res.count` |
| `getList(res)` | `{ items, pagination, count }` |
| `getEntity(res, key)` | `res.data[key]` — throws a `ContractError` if the key is absent |

Exact per-operation extraction (matches the contract map):

- Login → `data.user` / `data.accessToken` / `data.refreshToken`
- `GET /auth/me` → `data.user`
- List endpoints → `data` (array) + `pagination` + `count`
- Customer single/action → `data.customer`; Product → `data.product`; Price list single/action/customer-type → `data.priceList`; User → `data.user`; Invoice → `data.invoice`; Visit → `data.visit`
- Dashboard → `data.summary` / `data.salesReps` / `data.activity`
- Recommendations → `data` (`recommendations` + `customer`/`strategy`/`meta`)

## Wired to the real backend now

- **Auth**: `static/js/api/authService.js` + `apiClient.js` + `tokenStorage.js`.
  - Login: `POST /auth/login`. No role selector — the backend's `user.role` is mapped to the dashboard's internal role key via `roleMap.js`.
  - Session guard: `main.js` requires a stored access token, then calls `GET /auth/me` after first paint (reads `data.user`, updates the cached user).
  - Token refresh: `apiClient.js` retries a `401` once via `POST /auth/refresh-token`, saving **both** rotated tokens (and the user if returned); on failure it clears tokens and returns to `index.html`.
  - Logout: `POST /auth/logout` (best-effort) then clears local tokens.
- **Customers**: `customersService.js` — list/CRUD via `GET/POST/PATCH/DELETE /customers/:id`. Assignment is a **dedicated action** (`PATCH /customers/:id/assign`, `assignedSalesRep`); a normal update no longer includes `assignedSalesRep`, so that field was removed from the add/edit form. The list shows the backend snapshot (`assignedSalesRepSnapshot?.name`) when present.
- **Products**: `productsService.js` — list/CRUD via `GET/POST/PATCH/DELETE /products/:id` (DELETE = soft deactivate). Product **selectors** (invoice builder, price-list items, detail name map) use the dedicated `GET /products/price-list` route.
- **Price Lists**: `priceListsService.js` — list/CRUD via `/price-lists/:id`. Items live inline on the resource (`items[].productId/price/currency`); add/edit/remove is a read-modify-write against the parent's `items`. Customer-type lookup (`getPriceListByCustomerType`) returns a **single** `data.priceList`, not an array.
- **Users**: `usersService.js` — `GET /users` (COMPANY_ADMIN only), CRUD via `/users`, password reset via `PATCH /users/:id/password`. Role `<select>` submits real backend enum values.
- **Invoices**: `invoicesService.js` — list/CRUD via `GET/POST/PATCH /invoices/:id` (**no DELETE — archived** via `PATCH /invoices/:id/archive`), plus `confirm`/`mark-sent`/`payment` actions and `GET /invoices/:id/pdf` (blob → new tab). Create/edit sends only `customerId`, `items[{productId, quantity}]`, `discountType/value`, `dueDate`, `source`, `notes` — **never** totals or item prices; the backend calculates them. **Role-gated UI**: Mark-Sent and Record-Payment buttons are hidden for roles that can't use them (admin/manager/accountant only) and guarded in the handlers; backend 403 still enforced. Item builder is 6 fixed rows (a **frontend-only** cap, not a backend limit).
- **Dashboard**: `dashboardService.js` — `overviewPage.js` fetches `GET /dashboard/summary` first (primary), then `/dashboard/sales-reps` and `/dashboard/recent-activity?limit=10` via `Promise.allSettled` so one failure doesn't blank the page. Sales-reps performance is **only requested for admin/manager/supervisor** (it 403s for others). KPI tiles read the nested summary groups (`summary.customers.total`, etc.).
- **Recommendations**: `recommendationsService.js` — customer picker + on-demand `GET /recommendations/customers/:id/products`, renders `data.recommendations`.
- **Visits**: `visitsService.js` — list/CRUD via `GET/POST/PATCH /visits/:id`, plus **`complete`** (with outcome) and **`cancel`** (with optional notes) actions. **There is no confirm route** — `confirmVisit` and its UI were removed entirely. The create/update body uses the contract's **`customer`** field (not `customerId`); rendering tolerates both a populated `customer` object and the snapshot. The Complete form's **outcome is a `<select>`** of the fixed backend enum (`ORDER_PLACED`, `PAYMENT_COLLECTED`, `FOLLOW_UP_NEEDED`, `NO_INTEREST`, `CUSTOMER_UNAVAILABLE`, `OTHER`). Cancel prompts for optional notes.

## Server-side search, filters, pagination

- **Search is now server-side** for Customers, Products, Inventory, Price Lists, Users, Invoices, and Visits. Typing calls `GET /...?search=` with a ~350 ms debounce, starts after 2 characters (empty resets), resets to page 1, ignores stale responses, and preserves the box's focus/caret across the re-render (`renderSearchInput` in `asyncState.js`; debounce/handler in `main.js`).
- **Pagination** renders from `response.pagination` (Prev/Next disabled at bounds); the active search term is preserved across pages.
- Every list service **accepts the full documented filter set** (e.g. customers: `status/customerType/paymentType/assignedSalesRep/city/sortBy/sortOrder`; invoices: `invoiceStatus/paymentStatus/customerId/createdBy/dateFrom/dateTo/...`; visits: `status/outcome/customer/salesRep/dateFrom/dateTo/...`) via `buildQueryString`, which drops empty values. Only the **search** box is wired in the UI so far — see "Deferred".
- The two local-demo pages (Sales, Regions) keep their old **client-side** `.table-filter` row hiding; they are not backend-connected.

## Local Demo Only (no Module 12 backend endpoint)

`Sales`, `Regions`, and `Reports` have no backend contract and now show a visible **"Local demo only"** banner (`renderDemoBanner`) so their sample data is never mistaken for live data. `dataStore.js` still holds the mock arrays these pages (and the Regions "created by" dropdown) rely on. The overview "Top Sales Reps" panel is **not** mock — it renders real `data.salesReps`.

## Changed in this pass (summary)

- Added `extractors.js`; every service returns the exact nested entity / list shape.
- Fixed `refreshCurrentUser` → `data.user`; refresh now saves both rotated tokens + user.
- Removed the invalid `PATCH /visits/:id/confirm` call and all its UI; `cancelVisit` accepts optional notes.
- Visit outcome is now the fixed enum `<select>`.
- Dashboard reads `summary/salesReps/activity` and is resilient + role-gated.
- Server-side debounced search across all backend list pages.
- Product selectors use `/products/price-list`; price-list customer-type lookup returns a single entity.
- Customer `assignedSalesRep` removed from the normal update form.
- Role-gated invoice mark-sent/payment UI.
- Local-demo banners on Sales/Regions/Reports.

## Deferred / open verification items

Test each against a running backend and tighten:

1. **Not tested end-to-end** — no backend was reachable while writing this; everything was written strictly to the documented contract. Exercise all five seed roles before relying on it.
2. **Dashboard summary field names** — the KPI reads (`summary.customers.total`, etc.) follow the field map but weren't verified against a real response.
3. **Filter UIs** — services accept all documented filters, but only the search box is wired. Status/type/date-range filter controls are deferred (no existing controls to preserve; adding them is a follow-up).
4. **Customer balance UI** — `getCustomerBalance(id)` (`GET /customers/:id/balance`) exists in `customersService.js` and nothing recalculates balance client-side, but no screen displays it yet; the response payload's exact shape is undocumented, so the UI is deferred until verified.
6. **Visit `purpose`** — still a free-text input (the contract doesn't document a purpose enum); tighten to a `<select>` if/when one is confirmed.
7. Retire the mock `dataStore.users`/Sales/Regions cross-references once/if those pages are migrated.
