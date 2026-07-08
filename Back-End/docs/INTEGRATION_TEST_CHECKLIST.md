# Integration Test Checklist

Use this checklist after pulling the completed backend handoff into `Back-End/` and before web/mobile demo recording.

## Local Backend Setup

- [ ] MongoDB is running locally.
- [ ] `Back-End/.env` exists locally and is not committed.
- [ ] `.env.example` contains the same variable names as `.env`.
- [ ] Dependencies install from `Back-End/package-lock.json`.
- [ ] `npm test` passes from `Back-End`.
- [ ] `npm run seed:users` passes.
- [ ] `npm run seed:products` passes.
- [ ] `npm run seed:price-lists` passes.
- [ ] `npm run dev` starts the backend.
- [ ] `GET /api/v1/health` returns `200`.
- [ ] `GET /api/v1/health/db` returns `200` when MongoDB is connected.

## Postman Handoff

- [ ] Import `Back-End/postman/IntelliSales_Final_API_Postman_Collection.json`.
- [ ] Import `Back-End/postman/IntelliSales_Local_Environment.json`.
- [ ] Select environment `IntelliSales - Local API Environment`.
- [ ] Run the health folder.
- [ ] Run all role login requests.
- [ ] Confirm tokens are saved into environment variables.
- [ ] Run the full demo flow folder in order.
- [ ] PDF request returns `Content-Type: application/pdf`.
- [ ] JSON error requests return `success: false` and `message`.
- [ ] No response exposes `password`, `passwordHash`, `refreshTokenVersion`, or `__v`.

## Web Frontend Smoke Tests

- [ ] Web app uses `http://localhost:5000/api/v1` on same laptop.
- [ ] Login works for admin and sales rep.
- [ ] Bearer token is attached to protected requests.
- [ ] Dashboard summary loads.
- [ ] Users management page loads for admin.
- [ ] Customers list and customer detail load.
- [ ] Product list and price list screens load.
- [ ] Draft invoice can be created from active customer and active price-list product.
- [ ] Draft invoice can be confirmed.
- [ ] Invoice PDF opens or downloads.
- [ ] Accountant can mark invoice sent and update payment.
- [ ] Customer balance displays.
- [ ] Visits can be listed and completed.
- [ ] Recommendations load from customer detail.
- [ ] Validation errors show `message` and field-level `errors[]` where present.
- [ ] 401 redirects or refreshes token.
- [ ] 403 shows a permission message.

## Flutter Mobile Smoke Tests

- [ ] Android emulator uses `http://10.0.2.2:5000/api/v1`.
- [ ] Physical phone uses `http://<BACKEND_LAPTOP_LAN_IP>:5000/api/v1`.
- [ ] Backend runs with `HOST=0.0.0.0` for physical devices.
- [ ] Sales rep login works.
- [ ] `/auth/me` loads current user.
- [ ] Assigned customers load with `GET /customers`.
- [ ] Customer detail loads.
- [ ] Recommendations load for an assigned customer.
- [ ] Sales rep cannot access another rep's customer.
- [ ] Product selector uses `productCode`, `name`, `unit`, `price`, and `currency`.
- [ ] Draft invoice can be created.
- [ ] Invoice can be confirmed.
- [ ] PDF bytes can be opened or shared.
- [ ] Visit can be created and completed.
- [ ] Token refresh or login redirect works after 401.

## Role And Permission Checks

- [ ] Admin can manage users.
- [ ] Manager and supervisor cannot manage users.
- [ ] Admin, manager, and supervisor can manage customers/products/price lists.
- [ ] Sales rep can only access assigned customers.
- [ ] Accountant can read customers and invoices.
- [ ] Accountant can update payments and mark sent.
- [ ] Sales rep cannot update payments.
- [ ] Sales rep cannot access `/dashboard/sales-reps`.
- [ ] Sales rep cannot request recommendations for another rep's customer.

## Git Safety Checks

- [ ] `git status` shows only intended `Back-End` and approved root documentation changes.
- [ ] No `Front-End-Web` files changed.
- [ ] No `Front-End-MobileApplication` files changed.
- [ ] No `.env` file is staged.
- [ ] No `node_modules` files are staged.
- [ ] No generated invoice PDFs are staged.
- [ ] No logs, coverage, temp files, access tokens, refresh tokens, passwords, or API secrets are staged.
- [ ] `git diff --check` passes.
- [ ] Direct push to `main` is used only when allowed by the repository.
- [ ] If direct push is blocked, use `backend/module-12-handoff` and open a pull request.
- [ ] Never force-push.

## Known Current Scope

- Backend Modules 1-12 are complete and tested.
- Module 13 final integration cleanup is pending.
- Swagger UI and `/api-docs` are not implemented.
- Frontend apps are maintained in their own folders and are not modified by this backend handoff.
