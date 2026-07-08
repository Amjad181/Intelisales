# IntelliSales Mobile (Flutter)

Field-sales companion app for the IntelliSales Module 12 backend
(Arabic/English, sales-representative workflows: customers, invoices,
voice-assisted invoice entry, visits, dashboard).

## Running against the backend

The API base URL is a compile-time define — no source edits needed:

```
# Android emulator (this is also the default)
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api/v1

# Physical phone on the same Wi-Fi (backend must run with HOST=0.0.0.0)
flutter run --dart-define=API_BASE_URL=http://<BACKEND_LAPTOP_LAN_IP>:5000/api/v1
```

Defaults when `API_BASE_URL` is not passed: Android → `10.0.2.2:5000`,
iOS simulator / desktop / web → `localhost:5000`.

### Demo mode (explicit, off by default)

```
flutter run --dart-define=DEMO_MODE=true
```

Only in demo mode may screens fall back to local sample data when the
backend fails — always with a visible "showing demo data" banner. In the
default integration mode, failures show error/retry states instead.

## Checks

```
dart format --set-exit-if-changed .
flutter analyze
flutter test
```

See `INTEGRATION_NOTES.md` for the full backend-contract wiring, session
behavior, remaining gaps, and the real-backend test checklist.
