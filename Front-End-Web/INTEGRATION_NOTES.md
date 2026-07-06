# Integration Notes — Web Frontend

Status of backend integration against the Module 12 API contract (`/api/v1`). This file tracks what is real vs. mock so nobody confuses the two.

## Base URL

Default: `http://localhost:5000/api/v1` (see `static/js/api/config.js`).

To point at a different backend (another machine, a different port), set `window.INTELLISALES_API_BASE_URL` before `main.js`/`loginPage.js` load, e.g. add before the `<script type="module">` tag in `index.html`/`dashboard.html`:

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

## Wired to the real backend now

- **Auth**: `static/js/api/authService.js` + `apiClient.js` + `tokenStorage.js`.
  - Login: `POST /auth/login` (`static/js/auth/loginPage.js`). Role selector removed from the login form — the backend returns `user.role`, mapped to the dashboard's internal role key via `static/js/api/roleMap.js`.
  - Session guard: `main.js` requires a stored access token before rendering the dashboard, and calls `GET /auth/me` once after first paint to validate the session in the background.
  - Token refresh: `apiClient.js` retries a `401` once via `POST /auth/refresh-token`, then logs out and redirects to login if that fails too.
  - Logout: `POST /auth/logout` (best-effort) then clears local tokens.
- **Customers**: `static/js/api/services/customersService.js` — `customersPage.js` lists via `GET /customers` (paginated), add/edit/delete go through `POST/PATCH/DELETE /customers/:id`. Fields: `name, contactName, phone, email, address, notes, assignedSalesRep, customerType (Retail/Wholesale/KeyAccount), paymentType (Cash/Credit), status`.
- **Products**: `static/js/api/services/productsService.js` — `inventoryPage.js` (nav label "Product", internal entity key stays `inventory`) lists via `GET /products`, CRUD via `POST/PATCH/DELETE /products/:id`. Fields: `name, productCode, barcode, category, brand, description, unit (PIECE/BOX/KG/LITER/METER/PACK), basePrice, currency, taxRate, status`.
- **Price Lists**: `static/js/api/services/priceListsService.js` — `pricelistsPage.js`/`pricelistDetailPage.js` list/CRUD via `GET/POST/PATCH/DELETE /price-lists/:id`. The backend has **no separate line-item endpoint** — `items[]` (`productId, price, currency`) live inline on the price list resource, so adding/editing/removing one item is a read-modify-write against the parent list's `items` array (see `addPriceListItem`/`updatePriceListItem`/`removePriceListItem`). Item identity in the UI is its **array index within the currently-fetched list**, not a stable id — the contract doesn't document one.
- **Users**: `static/js/api/services/usersService.js` — `usersPage.js` lists via `GET /users` (COMPANY_ADMIN only route), CRUD via `POST/PATCH/DELETE /users`, password reset via `PATCH /users/:id/password`. Role `<select>` submits real backend enum values (`COMPANY_ADMIN`, `SALES_MANAGER`, etc.) directly.
- **Invoices**: `static/js/api/services/invoicesService.js` — `invoicesPage.js`/`invoiceDetailPage.js` list/CRUD via `GET/POST/PATCH/DELETE /invoices/:id`, plus `confirm`/`archive`/`mark-sent`/`payment` action endpoints and `GET /invoices/:id/pdf` (opened via blob URL in a new tab). The create/edit form is a real line-item builder (customer picker, due date, discount type/value, notes, product+quantity rows) — the backend calculates `subtotal/discountAmount/taxAmount/totalAmount` server-side, the payload never sends amounts. **Simplification**: the item builder has **6 fixed rows** (matching the same static-optional-row pattern already used by the Visits weekly-schedule builder) rather than a dynamic add/remove list, so an invoice can have at most 6 line items through this UI right now. Record Payment reuses the entity-modal plumbing as a pseudo-entity (`payment`) rather than a bespoke dialog.
- **Dashboard**: `static/js/api/services/dashboardService.js` — `overviewPage.js` fetches `GET /dashboard/summary`, `/dashboard/sales-reps`, `/dashboard/recent-activity?limit=10` in parallel. **Simplification**: the PDF only documents the summary's top-level groups (`customers, products, invoices, visits, recent`), not exact field names inside each, so the KPI tiles read every field defensively (`summary?.customers?.total ?? "—"`) — verify the actual field names against a real response and tighten this once confirmed. `mockDataService.js` (the old mock KPI source) was deleted, it had no other callers.
- **Recommendations**: `static/js/api/services/recommendationsService.js` — new `recommendationsPage.js` (nav entry, sales-facing roles only, same as Visits). Not a full customer-detail page with invoice/balance/visit tabs — just a customer picker + "Get Recommendations" button that fetches `GET /recommendations/customers/:customerId/products?limit=5&includeHistory=true` on demand and renders cards from `data.recommendations`.
- **Visits**: `static/js/api/services/visitsService.js` — `visitsPage.js`/`visitDetailPage.js` list/CRUD via `GET/POST/PATCH /visits/:id`, plus `confirm`/`complete`/`cancel` action endpoints (`PATCH /visits/:id/confirm|complete|cancel`). The **old weekly-schedule builder** (week → day-of-week rows → region + trade center + estimated time) and the never-wired daily-visits page were **removed entirely** and replaced with the real per-customer model: create/edit form is customer picker (from `listCustomers`) + `visitDate, purpose, location, notes`. Complete reuses the entity-modal plumbing as a pseudo-entity (`visitComplete`) with `outcome, nextAction, nextVisitDate`, exactly like Record Payment for invoices. **Simplifications**: `salesRep` is **backend-assigned to the logged-in user** (no rep picker — the `/users` list is COMPANY_ADMIN-only), and `purpose`/`outcome` are **free-text inputs** because the contract doesn't document their enum values (tighten to `<select>` once known).

All list pages are **async** (`renderRoute()` in `main.js` shows a loading state, then the real page or a friendly error/403 panel via `static/js/dashboard/components/asyncState.js`) with real Prev/Next pagination wired to `response.pagination` (except Recommendations, which is on-demand rather than a paginated list). Search stays **client-side** over the currently-loaded page (existing `.table-filter` wiring) — the contract doesn't confirm backend search query params, so this avoids guessing. Add/edit modals show a loading state while pre-fetching the record (and dropdown options like products/customers), and surface `err.message` (+ field-level `errors[]` if present) inline on failure instead of closing.

## Known, accepted limitation

`dataStore.js` still keeps a mock `users` array (plus `getUserName`, `userSelectOptions`) purely so the **not-yet-migrated** pages (Sales, Regions — and their "created by"/"assigned" dropdowns) keep working. A real backend user won't show up in those dropdowns until those pages are migrated too. `dataStore.customers`, `.inventoryAlerts`, `.invoices`, `.invoiceItems`, `.priceLists`, `.priceListItems`, `.visitSchedules`, `.visitLines`, `.dailyVisits` and all their mutate functions (plus the now-dead `getRegionName`/`regionSelectOptions` helpers) were fully deleted once Customers/Products/Price Lists/Invoices/Visits moved to the real backend — confirmed nothing else referenced them. `nextInvoiceNumber()` was renamed to `nextSaleInvoiceNumber()` and rescoped to the (still-mock, unrelated) Sales entity, since it used to read the now-deleted `dataStore.invoices`.

## Still mock data (`static/js/dashboard/state/dataStore.js`)

- Sales, Top Reps — no backend equivalent, kept as local-only tools.
- Regions, Reports — **no corresponding backend endpoint at all** in the Module 12 contract. Decide whether to drop them or keep them as local-only tools.

## TODO (next sessions)

1. Decide fate of Regions / Reports / Sales-TopReps pages (no backend equivalent).
2. Verify the actual `dashboard/summary` response shape against a real backend and tighten `overviewPage.js`'s defensive field reads.
3. Confirm the Visits contract details against a real backend: the create/complete payload shapes, the `purpose`/`outcome` enum values (currently free-text), and the list/detail snapshot field names (`customerSnapshot?.name`, `salesRepSnapshot?.name`) — tighten once verified.
4. Consider a real dynamic add/remove line-item builder for invoices if the 6-row cap becomes limiting.
5. Once Sales is migrated (if ever), retire the mock `dataStore.users` cross-reference array.

## Not tested end-to-end

No backend was reachable while writing this integration, so **none** of the above (auth, customers, products, price lists, users, invoices, dashboard, recommendations, visits) has been exercised against a real server — all of it was written strictly to the documented contract. Test it against a running backend before relying on it, paying particular attention to: the invoice line-item payload shape, the `payment`/`confirm`/`mark-sent` endpoints' exact request/response bodies, the dashboard summary field names, and the visits `confirm`/`complete`/`cancel` request/response bodies plus the `purpose`/`outcome` enum values.
