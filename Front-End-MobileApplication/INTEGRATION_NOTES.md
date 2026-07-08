# IntelliSales Mobile — Backend Integration Notes

Updated: 2026-07-08 — after executing the "Flutter Mobile App - Backend
Alignment Plan" (Phases 0–9). The tested Module 12 backend contract is the
single source of truth; the backend itself was **not modified**.

> ⚠️ The backend was **not reachable on this machine** during this pass
> (`http://localhost:5000/api/v1/health` timed out), so verification here is
> `dart format` + `flutter analyze` + `flutter test` (all passing). The
> real-device/real-backend checks in §7 still need to be run once the
> backend is up.

## 1. Base URL / runtime configuration (no source edits needed)

The base URL is a compile-time define with safe defaults
(`lib/config/api_config.dart`):

```
# Android emulator (default if not passed)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api/v1

# Physical phone on the same Wi-Fi (backend must run with HOST=0.0.0.0)
flutter run --dart-define=API_BASE_URL=http://<BACKEND_LAPTOP_LAN_IP>:5000/api/v1

# Explicit demo mode (local sample data allowed on failure, with a banner)
flutter run --dart-define=DEMO_MODE=true
```

Defaults when nothing is passed: Android → `http://10.0.2.2:5000/api/v1`,
iOS simulator / desktop / web → `http://localhost:5000/api/v1`.
No personal LAN IPs are committed.

Platform networking for local HTTP (development only):
- Android: `android:usesCleartextTraffic="true"` in the **debug/profile**
  manifests only (`android/app/src/debug|profile/AndroidManifest.xml`).
  Release keeps the platform default (cleartext blocked).
- iOS: minimal ATS exception `NSAllowsLocalNetworking` in `Info.plist`
  (local-network hosts only; ATS stays on for the internet).

## 2. Demo mode vs integration mode (no silent fallback)

`ApiConfig.demoMode` (from `--dart-define=DEMO_MODE=true`, **off by
default**) is the only gate for local sample data:

- **Integration mode (default):** every API failure shows a visible
  error + Retry state (`lib/widgets/error_retry_view.dart`) or an error
  snackbar. No screen substitutes sample data, the dashboard shows no
  invented numbers, add-customer failures show the real error (no fake
  "added successfully"), and a saved invoice's PDF comes from the server
  only (no local regeneration on failure).
- **Demo mode:** sample data may appear, always with the
  "Server unreachable — showing demo data" banner.

## 3. Contract wiring (what parses what)

| Operation | Extraction |
|---|---|
| POST /auth/login, /auth/refresh-token | `data.user`, `data.accessToken`, `data.refreshToken` |
| GET /auth/me | `data.user` |
| List customers/products/invoices | top-level `data` list + `pagination` + `count` (`PagedResult`) |
| Customer create/get | `data.customer` |
| Invoice create/confirm/archive/mark-sent/payment | `data.invoice` |
| GET /price-lists/customer-type/:type | `data.priceList` → `priceList.items` |
| Visit create/complete/cancel | `data.visit` |
| GET /dashboard/summary | `data.summary` with the exact documented groups/fields |
| Recommendations | `data.recommendations` |
| Invoice PDF | `application/pdf` bytes; JSON error otherwise |

Typed extractors (`ApiResponseExtractors` in `lib/services/api_client.dart`)
throw descriptive contract errors instead of unsafe casts, and are unit
tested (`test/api_extractors_test.dart`, `test/models_from_api_test.dart`).

## 4. Auth/session behavior

- Rotated `accessToken` **and** `refreshToken` (plus returned `user`) are
  saved together on refresh; a single-flight lock prevents parallel
  refreshes from concurrent 401s.
- Logout is triggered only when the server actually rejects the refresh
  token; a network failure during refresh does **not** drop the session.
- Startup: local session restore + non-blocking `GET /auth/me`
  verification.
- "Remember me" is real: unchecked → session lives in memory only and dies
  with the app (`SecureStorageService.setPersistent`).
- "Forgot password" / "Contact Admin" open a contact-admin dialog (no
  backend endpoint exists; no dead links).

## 5. Search, filters, pagination

- Customers: debounced (≥2 chars, ~350 ms) server-side
  `GET /customers?search=...`; stale responses are ignored; no client-side
  assignment filtering (backend scopes by role). Full query params
  supported in `CustomerService.list`.
- Invoices: server-side search + `invoiceStatus`/`paymentStatus` filter
  params behind the existing chips; full query params in
  `InvoiceService.list`.
- `Pagination`/`PagedResult` models exist; screens currently load page 1
  (infinite scroll can be added later without contract changes).

## 6. Voice invoices (no external service, no secrets)

`lib/config/api_keys.dart` was **deleted** along with the direct Groq call.
> 🔑 The previous Groq key looked real — **rotate it at console.groq.com**;
> deleting the file does not revoke the key.

Flow now: on-device `speech_to_text` → local Arabic parser
(`VoiceInvoiceService.parseItems`) matched against **backend catalog
products** (customer-type price list when known) → items carry valid
`productId` + quantity → invoice created with `source: VOICE_TEXT` and the
raw `voiceText`. Unmatched phrases are reported to the user and never
auto-added; ambiguous matches are rejected (user confirms via manual
entry). Parser is unit tested (`test/voice_parser_test.dart`).

## 7. Testing still needed against the running backend

- Login with each seed account (`rep@intellisales.com` / `Password123!` …)
  and role smoke tests.
- Full rep flow: login → customer search → recommendations → product
  selection → draft → confirm → server PDF → visit create/complete →
  dashboard → logout.
- Failure matrix: offline, wrong base URL, 400 validation, 401 refresh,
  invalid refresh (must return to login), 403, 404, PDF JSON error.
- Confirm assumed enum values/shapes: `invoiceStatus`/`paymentStatus`
  display mapping (`Invoice.fromApi`), `Customer.status` casing, visit
  outcome mapping (`VisitOutcomeApi`: effective→ORDER_PLACED,
  notEffective→NO_INTEREST; notCompleted → **cancel** endpoint), and the
  `priceList.items` item shape (`Product.fromPriceListItem` reads
  `item.product` + `item.price` defensively).
- Android emulator + at least one physical phone (not run here: no
  emulator/backend available on this machine during this pass).

## 8. Known remaining gaps (intentional, need backend/team decisions)

- **Weekly visit schedule** (`ActivityScreen` day strip) has **no backend
  endpoint** in the Module 12 contract — it stays local sample data.
  Recording an outcome now resolves the customer via backend search
  (`GET /customers?search=<trade center name>`) and, when matched, creates
  the visit then completes/cancels it per the contract; when no backend
  customer matches, the user is told explicitly that the outcome was saved
  locally only.
- **"Sales Target" card** on the dashboard is cosmetic and labeled
  "(Demo)" — no backend field exists.
- `/dashboard/recent-activity` is not called; recent cards use
  `summary.recent.invoices` per the plan.
- Role-restricted actions: the rep UI only exposes list/create/confirm/PDF;
  mark-sent/payment/archive service methods exist but no rep-facing UI
  triggers them (accountant-only actions are not exposed).
