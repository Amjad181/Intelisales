# IntelliSales Web — Test Cases

Manual test cases for the web frontend **integrated against the tested Module 12 backend** (`/api/v1`). Updated in the July 2026 alignment pass to match the real contract (see `INTEGRATION_NOTES.md`).

## Test Setup

- Browsers: Chrome / Edge / Firefox.
- **A running Module 12 backend is required** at `http://localhost:5000/api/v1` (or override via `window.INTELLISALES_API_BASE_URL`).
- Seed accounts (all `Password123!`): `admin@`, `manager@`, `supervisor@`, `rep@`, `accountant@` `intellisales.com`.
- Start page: `index.html`.
- Keep DevTools open: the **Console must stay clean** and the **Network tab** should show every data call hitting `/api/v1` through the central client.

---

## 1. Authentication, Session & Roles

### TC-001: Login (real backend)
- Enter a seed email/password → submit.
- Expected: `POST /auth/login`; on success redirect to the dashboard; access + refresh tokens stored. No role selector is shown.

### TC-002: Invalid credentials surface the backend message
- Submit a wrong password.
- Expected: the error banner shows the backend `message`; no redirect.

### TC-003: `/auth/me` validates the session
- After login, watch the Network tab.
- Expected: one `GET /auth/me` after first paint; the cached user is read from `data.user` (no console error).

### TC-004: Token refresh on 401
- Let the access token expire (or simulate a 401), then trigger any data call.
- Expected: one `POST /auth/refresh-token`; both rotated tokens saved; original request retried once.

### TC-005: Invalid refresh returns to login
- Corrupt/clear the refresh token, then trigger a 401.
- Expected: tokens cleared, redirect to `index.html`.

### TC-006: Role-specific navigation (all five roles)
- Log in as each seed role.
- Expected: sidebar shows only that role's allowed routes; no unauthorized nav appears. Every role lands on a valid Overview.

### TC-007: Role-gated invoice actions
- Open an invoice detail as **sales rep**.
- Expected: **Mark Sent** and **Record Payment** buttons are hidden. As **admin/manager/accountant** they are visible. Backend 403 is still handled gracefully if forced.

### TC-008: Logout
- Click logout.
- Expected: `POST /auth/logout` (best-effort) then local state cleared and redirect to login, regardless of network outcome.

---

## 2. Lists, Server-Side Search & Pagination

### TC-009: Customer search hits the backend
- Type a partial customer name.
- Expected: `GET /customers?search=...` fires (~350 ms debounce, after 2 chars); table shows only backend-authorized matches — **not** a client filter of the current page. Search box keeps focus.

### TC-010: Invoice search by number and customer
- Search an invoice number, then a customer name.
- Expected: `GET /invoices?search=...` returns matches across the whole dataset, not just the loaded page.

### TC-011: Pagination preserves filters
- With a search active, click Next/Prev.
- Expected: page changes via `response.pagination`; Prev/Next disable at bounds; the search term persists.

### TC-012: Empty search resets
- Clear the search box.
- Expected: list reloads unfiltered, page resets to 1.

---

## 3. Customers / Products / Price Lists / Users

### TC-013: Create / edit customer
- Add then edit a customer.
- Expected: `POST` / `PATCH /customers/:id`; response `data.customer` renders; validation errors keep the modal open with field-level messages. The form has **no** assigned-sales-rep field.

### TC-014: Deactivate customer & product
- Delete a customer; archive/delete a product.
- Expected: `DELETE /customers/:id`; product `DELETE` performs a soft deactivate (status reflects it on reload).

### TC-015: Product selector uses the price-list route
- Open the invoice or price-item modal.
- Expected: product options load via `GET /products/price-list`.

### TC-016: Price list CRUD + inline items
- Create a price list; add/edit/remove an item.
- Expected: item changes are a read-modify-write on the parent `items[]`; archive keeps the record (status `Archived`), never deletes.

### TC-017: Users (admin only)
- As admin, create/edit a user and reset a password.
- Expected: `GET/POST/PATCH /users`; password via `PATCH /users/:id/password`; role select submits backend enum values. Non-admins can't reach the page.

---

## 4. Invoices, Payments & PDF

### TC-018: Create draft (no totals sent)
- New invoice: pick customer, due date, discount, line items (product + qty).
- Expected: payload contains `customerId`, `items[{productId, quantity}]`, `discountType/value`, `dueDate`, `source`, `notes` — **no** amounts. Backend-calculated totals appear on the detail page.

### TC-019: Full lifecycle
- Draft → Edit → Confirm → open PDF → Mark Sent → partial Payment → full Payment.
- Expected: `/confirm`, `/mark-sent`, `/payment` actions succeed; `paidAmount` is cumulative; remaining updates. **No DELETE** is ever called.

### TC-020: Archive (not delete)
- Archive an invoice.
- Expected: `PATCH /invoices/:id/archive`; status becomes `Archived`; the invoice is not removed.

### TC-021: PDF binary + JSON error
- Open the PDF for a valid invoice, then for one that errors.
- Expected: valid → blob opens in a new tab; error → the JSON `message` is shown, not a broken tab.

---

## 5. Visits, Dashboard & Recommendations

### TC-022: Visit create / edit
- Create then edit a visit (customer, date, purpose, location, notes).
- Expected: `POST` / `PATCH /visits/:id`; `data.visit` renders.

### TC-023: Visit lifecycle — no confirm route
- On a visit detail, verify the action buttons.
- Expected: only **Edit**, **Complete**, **Cancel** — there is **no Confirm** button and **no** request to `/visits/:id/confirm` anywhere.

### TC-024: Complete with outcome enum
- Complete a visit.
- Expected: Outcome is a `<select>` of `ORDER_PLACED / PAYMENT_COLLECTED / FOLLOW_UP_NEEDED / NO_INTEREST / CUSTOMER_UNAVAILABLE / OTHER`; `PATCH /visits/:id/complete` sends the chosen value.

### TC-025: Cancel with optional notes
- Cancel a visit; leave the notes prompt blank once, fill it once.
- Expected: `PATCH /visits/:id/cancel`; body includes `notes` only when provided.

### TC-026: Dashboard shows real values
- Open Overview as admin.
- Expected: KPI cards show real numbers from `data.summary` (no em dashes from wrong nesting); Top Reps from `data.salesReps`; Recent Activity from `data.activity`.

### TC-027: Dashboard resilience & role gating
- Open Overview as **sales rep** / **accountant**.
- Expected: sales-reps performance is **not requested** (no 403 blanking the page); the rest of the dashboard still renders.

### TC-028: Recommendations
- As a sales-facing role, pick an assigned customer → Get Recommendations.
- Expected: `GET /recommendations/customers/:id/products`; cards from `data.recommendations`; empty result shows a "no data" message (no fabricated items).

---

## 6. Local-Demo & Error Handling

### TC-029: Local-demo banners
- Open Sales, Regions, Reports.
- Expected: each shows a visible **"Local demo only"** banner; no backend calls for these pages.

### TC-030: No mock fallback on API failure
- Stop the backend, then open a backend-connected list.
- Expected: a clear error/retry panel — **never** silent mock data.

### TC-031: Network conditions matrix
- Exercise: backend offline, expired access token, invalid refresh token, validation `400`, forbidden `403`, missing `404`, PDF error JSON.
- Expected: each shows an appropriate message/state; console stays clean.

### TC-032: Validation errors keep modals open
- Submit a form with values the backend rejects.
- Expected: modal stays open; banner shows `message`; `errors[]` map to field-level messages.

---

## 7. Localization & Routing

### TC-033: Language switch (EN/AR)
- Toggle locale on login and dashboard.
- Expected: strings switch; RTL applies in Arabic; new strings (outcome enum, demo banner, cancel prompt) are translated both ways.

### TC-034: Hash routing & fallback
- Set the hash to `#invoice/<id>`, reload; then set an unsupported hash.
- Expected: detail route renders; unsupported hash falls back to a valid page.

---

## 8. Full End-to-End Flow

### TC-035: Golden path
- Login → customer → product/price list → draft invoice → confirm → PDF → payment/balance → visit → dashboard → recommendations → logout, per relevant role.
- Expected: every step uses `/api/v1` through the central client; no P0/P1 issue from the alignment plan remains; console clean.

---

## Notes

- These are manual cases; they can be automated later.
- The app has no build step — it's static ES modules loaded by the browser.
- Deferred items (see `INTEGRATION_NOTES.md`): visit create field-name verification, dashboard field-name verification, filter UIs beyond search, customer-balance UI.
