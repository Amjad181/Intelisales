# IntelliSales Backend

## Short Project Description

IntelliSales Backend is the local REST API backend for the IntelliSales sales and distribution management project. The web frontend and Flutter mobile app will connect to this backend as the API modules are completed.

This repository currently includes Modules 1, 2, 3, 4, 5, 5.1, 6, 7, 8, 9, 10, 11, and 12.

## Current Scope

### Module 1: Backend Foundation

- Node.js and Express project setup
- Project folder structure
- Environment configuration
- MongoDB connection setup with Mongoose
- Health check route
- Database health check route
- Centralized not-found and error handling
- Basic Jest and Supertest tests

### Module 2: Authentication + JWT + RBAC + Seed Users

- User model
- Login with bcrypt password comparison
- JWT access token and refresh token
- Protected routes
- Role-based access control
- Seed users for all required roles
- Auth tests with Jest and Supertest

### Module 3: Users Management / Admin User APIs

- Admin-only user management routes
- List users with pagination, search, filters, and sorting
- Get one user by id
- Create users
- Update user profile/admin fields
- Reset user password
- Soft deactivate users
- Safe user responses that hide password and internal fields
- Users management tests with Jest and Supertest

Modules 2 and 3 do not include customers, products, price lists, invoices, payments, visits, dashboard, reports, PDF generation, recommendations, inventory, or forgot password.

### Module 4: Customers Management APIs

- Customer model and REST APIs
- List customers with pagination, search, filters, and sorting
- Get one customer by id
- Create customers
- Update customer details
- Assign or reassign customers to active sales representatives
- Soft deactivate customers
- Role-based customer access for admin, manager, supervisor, sales representative, and accountant users
- Sales representatives only see and update assigned customers
- Safe customer responses that do not expose sensitive populated user fields
- Customers management tests with Jest and Supertest

Module 4 does not include products, price lists, invoices, payments, visits, dashboard, reports, PDF generation, recommendations, or frontend apps.

### Module 5: Products / Simple Price List APIs

- Product model and REST APIs
- List products with pagination, search, filters, price range, and sorting
- Get one product by id
- Create products
- Update product details
- Update product price fields
- Soft deactivate products
- Simple active-product price list endpoint for web/mobile product selectors
- Separate customer-type price list APIs for Retail, Wholesale, and KeyAccount pricing
- Role-based product access for admin, manager, supervisor, sales representative, and accountant users
- Sales representatives and accountants only see active products and cannot modify products
- Safe product responses that do not expose sensitive populated user fields
- Product seed script with demo products
- Price-list seed script for Retail, Wholesale, and KeyAccount lists
- Products tests with Jest and Supertest

Module 5 does not include invoices, invoice items, invoice confirmation, invoice PDFs, payments, visits, dashboard, recommendations, customer-specific pricing, or frontend apps.

### Module 5.1: API Response Standardization

- Shared success response format for single actions and paginated lists
- Shared error response format for validation and application errors
- Consistent `success`, `message`, and `data` fields on successful responses
- Consistent `count` and `pagination` fields on paginated list responses

### Module 6: Invoices Core and Confirmation Rules

- Draft invoice creation from customer and product selections
- Customer snapshot and product price snapshots stored on invoice items
- Product prices loaded from the active price list for `customer.customerType`
- Invoice totals, discount, tax, paid amount, and remaining amount calculation
- Draft invoice editing before confirmation
- Invoice confirmation with `INV-YYYY-00001` invoice number generation
- Confirmed and archived invoices cannot be edited
- Invoice archiving by supervisor-level roles and higher
- Customer invoice listing
- Invoices tests with Jest and Supertest

Module 6 does not include payment updates, mark-sent logic, visits, dashboard, recommendations, or frontend apps.

### Module 7: Invoice PDF Generation

- Invoice PDF generator using `pdfkit`
- Controlled PDF route under authenticated invoice APIs
- Draft invoice PDF preview with clear DRAFT marker
- Official PDF generation for confirmed and archived invoices
- Local PDF storage under `uploads/invoices`
- `pdfPath` and `pdfGeneratedAt` stored only for official PDFs
- Existing official PDF files reused when present
- Missing official PDF files regenerated safely
- PDF route errors keep the unified JSON error format
- Invoice PDF tests with Jest and Supertest

Module 7 itself covers PDF generation only. Payment update endpoints and customer balance are covered by Module 8.

### Module 8: Payment Update and Customer Balance

- Cash-only payment update endpoint for confirmed invoices
- Cumulative `paidAmount` updates with recalculated `remainingAmount`
- Payment status handling for `PENDING`, `SENT`, and `PAID`
- Mark confirmed unpaid invoices as sent
- Customer balance calculation from confirmed unpaid invoices
- Overdue balance and overdue invoice count derived from `dueDate`
- Role-based payment access for company admin, sales manager, and accountant
- Sales representatives can view balance only for assigned customers
- Payments and balance tests with Jest and Supertest

Module 8 does not include online payment gateways, payment history tables, refunds, visits, dashboard, recommendations, Swagger UI, or frontend apps.

### Module 9: Visits Management APIs

- Visit model for planned, completed, and cancelled customer visits
- Sales representative visit creation for assigned customers
- Management visit creation for active customers and active sales representatives
- Visit listing with pagination, filters, date range, search, and sorting
- Visit detail, update, complete, and cancel routes
- Customer-specific visit listing
- Role-based access for admin, manager, supervisor, sales representative, and accountant users
- Accountants can read visits but cannot modify them
- Safe visit responses that do not expose sensitive user fields
- Visits tests with Jest and Supertest

Module 9 does not include dashboard, recommendations, route optimization, maps integration, GPS tracking, calendar integration, push notifications, Swagger UI, or frontend apps.

### Module 10: Dashboard Summary APIs

- Role-aware dashboard summary endpoint
- Management dashboard totals for customers, products, invoices, payments, visits, and recent activity
- Accountant financial dashboard summary
- Sales representative personal dashboard summary limited to own/visible customers, invoices, and visits
- Sales representative performance summaries for management users
- Recent activity endpoint derived from invoices and visits
- Safe dashboard responses that do not expose sensitive user fields
- Dashboard tests with Jest and Supertest

Module 10 itself does not include recommendations, AI/ML analytics, route optimization, backend-generated charts/images, frontend apps, Swagger UI, exports, notifications, email sending, or background jobs.

### Module 11: Basic Product Recommendations APIs

- Rule-based product recommendations for customer detail screens
- Purchase-history recommendations from confirmed, non-archived invoice items
- Customer-type price-list fallback when no usable history exists
- Safe empty recommendation result when no active price list or active products exist
- Current product prices from the active customer-type price list
- Role-based access for admin, manager, supervisor, accountant, and sales representative users
- Sales representatives can get recommendations only for assigned customers
- Safe recommendation responses that do not expose invoices, passwords, token internals, or Mongoose internals
- Recommendations tests with Jest and Supertest

Module 11 is rule-based only. It does not include AI/ML, external APIs, background jobs, route optimization, inventory management, notifications, frontend apps, Swagger UI, API documentation files, or final integration cleanup.

### Module 12: API Documentation + Final Postman Handoff

- Markdown documentation package under `docs/`
- Local setup guide for backend, web frontend, and Flutter/mobile connection
- Auth, roles, unified response format, and error handling guides
- Complete endpoint reference matching the current Express routes
- Web frontend API guide
- Flutter/mobile API guide
- Demo flow guide for presentation/testing
- Frontend field mapping tables
- Module status document
- Final Postman collection and local environment under `postman/`

Module 12 is documentation and handoff only. It does not change backend behavior, schemas, seed data, route names, Swagger UI, frontend apps, or Module 13 final integration cleanup.

## Technology Stack

- Backend: Node.js 20+ and Express.js
- Database: MongoDB with Mongoose
- API style: REST API
- Authentication: JWT access token + refresh token
- Password hashing: bcrypt
- Payments: cash-only MVP payment updates
- Visits: simple planned/completed/cancelled visit tracking
- Dashboard: simple role-aware summary APIs
- Recommendations: simple rule-based product recommendations
- PDF generation: pdfkit
- Testing: Jest and Supertest
- Development mode: Local only for now

## Project Folder Structure

```text
intelli-sales-backend/
|-- src/
|   |-- app.js
|   |-- server.js
|   |-- config/
|   |   |-- env.js
|   |   `-- database.js
|   |-- middlewares/
|   |   |-- auth.middleware.js
|   |   |-- error.middleware.js
|   |   |-- notFound.middleware.js
|   |   |-- rbac.middleware.js
|   |   `-- validate.middleware.js
|   |-- models/
|   |   `-- User.js
|   |-- modules/
|   |   |-- auth/
|   |   |   |-- auth.controller.js
|   |   |   |-- auth.routes.js
|   |   |   |-- auth.service.js
|   |   |   `-- auth.validation.js
|   |   |-- customers/
|   |   |   |-- customer.controller.js
|   |   |   |-- customer.model.js
|   |   |   |-- customer.routes.js
|   |   |   |-- customer.service.js
|   |   |   `-- customer.validation.js
|   |   |-- dashboard/
|   |   |   |-- dashboard.controller.js
|   |   |   |-- dashboard.routes.js
|   |   |   |-- dashboard.service.js
|   |   |   `-- dashboard.validation.js
|   |   |-- products/
|   |   |   |-- product.controller.js
|   |   |   |-- product.model.js
|   |   |   |-- product.routes.js
|   |   |   |-- product.service.js
|   |   |   `-- product.validation.js
|   |   |-- priceLists/
|   |   |   |-- priceList.controller.js
|   |   |   |-- priceList.model.js
|   |   |   |-- priceList.routes.js
|   |   |   |-- priceList.service.js
|   |   |   `-- priceList.validation.js
|   |   |-- recommendations/
|   |   |   |-- recommendation.controller.js
|   |   |   |-- recommendation.routes.js
|   |   |   |-- recommendation.service.js
|   |   |   `-- recommendation.validation.js
|   |   |-- invoices/
|   |   |   |-- invoice.controller.js
|   |   |   |-- invoice.model.js
|   |   |   |-- invoicePdf.service.js
|   |   |   |-- invoice.routes.js
|   |   |   |-- invoice.service.js
|   |   |   `-- invoice.validation.js
|   |   |-- visits/
|   |   |   |-- visit.controller.js
|   |   |   |-- visit.model.js
|   |   |   |-- visit.routes.js
|   |   |   |-- visit.service.js
|   |   |   `-- visit.validation.js
|   |   `-- users/
|   |       |-- user.controller.js
|   |       |-- user.routes.js
|   |       |-- user.service.js
|   |       `-- user.validation.js
|   |-- seeds/
|   |   |-- seedPriceLists.js
|   |   |-- seedProducts.js
|   |   `-- seedUsers.js
|   `-- utils/
|       |-- apiResponse.js
|       |-- AppError.js
|       |-- asyncHandler.js
|       |-- formatCustomerResponse.js
|       |-- formatInvoiceResponse.js
|       |-- formatProductResponse.js
|       |-- formatUserResponse.js
|       |-- formatVisitResponse.js
|       |-- invoiceNumber.js
|       `-- pdfGenerator.js
|-- tests/
|   |-- auth.test.js
|   |-- customers.test.js
|   |-- dashboard.test.js
|   |-- health.test.js
|   |-- invoicePdf.test.js
|   |-- invoices.test.js
|   |-- payments.test.js
|   |-- priceLists.test.js
|   |-- products.test.js
|   |-- recommendations.test.js
|   |-- visits.test.js
|   `-- users.admin.test.js
|-- docs/
|   |-- 00-README.md
|   |-- 01-local-setup.md
|   |-- 02-auth-and-roles.md
|   |-- 03-api-response-format.md
|   |-- 04-web-frontend-api-guide.md
|   |-- 05-flutter-mobile-api-guide.md
|   |-- 06-demo-flow-guide.md
|   |-- 07-endpoints-reference.md
|   |-- 08-error-handling-guide.md
|   |-- 09-postman-guide.md
|   |-- 10-frontend-field-mapping.md
|   `-- 11-module-status.md
|-- postman/
|   |-- IntelliSales_Final_API_Postman_Collection.json
|   `-- IntelliSales_Local_Environment.json
|-- uploads/
|   `-- invoices/
|       `-- .gitkeep
|-- .env.example
|-- .gitignore
|-- package.json
`-- README.md
```

## Requirements Before Running

- Node.js 20+
- MongoDB installed and running locally
- npm

## Environment Variables

Create a local `.env` file from `.env.example`.

```bash
copy .env.example .env
```

Example `.env`:

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

Do not commit `.env`.

## Installation Steps

Install project dependencies:

```bash
npm install
```

## Seed Users

Make sure MongoDB is running locally, then seed users:

```bash
npm run seed:users
```

The seed script safely creates or updates one user for each role and does not create duplicate users when run multiple times.

## Test User Credentials

All seeded users use this password:

```text
Password123!
```

| Role | Email |
| --- | --- |
| COMPANY_ADMIN | admin@intellisales.com |
| SALES_MANAGER | manager@intellisales.com |
| SALES_SUPERVISOR | supervisor@intellisales.com |
| SALES_REPRESENTATIVE | rep@intellisales.com |
| ACCOUNTANT | accountant@intellisales.com |

## Seed Products

Make sure MongoDB is running locally, then seed demo products:

```bash
npm run seed:products
```

The product seed script creates or updates demo products by SKU and can be run multiple times safely.

## Seed Price Lists

Run product seeding first, then seed Retail, Wholesale, and KeyAccount price lists:

```bash
npm run seed:products
npm run seed:price-lists
```

The price-list seed script is idempotent by `customerType` and uses active seeded products.

## Running The Development Server

Make sure MongoDB is running locally, then start the backend:

```bash
npm run dev
```

The server listens on port `5000` by default.

## Running Tests

Run the test suite:

```bash
npm test
```

On Windows PowerShell, if `npm test` is blocked by execution policy, run:

```bash
npm.cmd test
```

## API Base URL

Local backend base URL:

```text
http://localhost:5000/api/v1
```

Later frontend/mobile base URLs:

- Web frontend on another laptop: `http://<LAPTOP_LOCAL_IP>:5000/api/v1`
- Flutter Android emulator: `http://10.0.2.2:5000/api/v1`
- Flutter iOS simulator on same Mac: `http://localhost:5000/api/v1`
- Physical phone on same Wi-Fi: `http://<LAPTOP_LOCAL_IP>:5000/api/v1`

## Module 12 Documentation Package

The Module 12 frontend handoff documentation starts here:

- [docs/FRONTEND_INTEGRATION_GUIDE.md](docs/FRONTEND_INTEGRATION_GUIDE.md)
- [docs/INTEGRATION_TEST_CHECKLIST.md](docs/INTEGRATION_TEST_CHECKLIST.md)
- [docs/00-README.md](docs/00-README.md)
- [docs/01-local-setup.md](docs/01-local-setup.md)
- [docs/02-auth-and-roles.md](docs/02-auth-and-roles.md)
- [docs/03-api-response-format.md](docs/03-api-response-format.md)
- [docs/04-web-frontend-api-guide.md](docs/04-web-frontend-api-guide.md)
- [docs/05-flutter-mobile-api-guide.md](docs/05-flutter-mobile-api-guide.md)
- [docs/06-demo-flow-guide.md](docs/06-demo-flow-guide.md)
- [docs/07-endpoints-reference.md](docs/07-endpoints-reference.md)
- [docs/08-error-handling-guide.md](docs/08-error-handling-guide.md)
- [docs/09-postman-guide.md](docs/09-postman-guide.md)
- [docs/10-frontend-field-mapping.md](docs/10-frontend-field-mapping.md)
- [docs/11-module-status.md](docs/11-module-status.md)

Final Postman handoff files:

- [postman/IntelliSales_Final_API_Postman_Collection.json](postman/IntelliSales_Final_API_Postman_Collection.json)
- [postman/IntelliSales_Local_Environment.json](postman/IntelliSales_Local_Environment.json)

Recommended local handoff setup:

```bash
npm install
npm run seed:users
npm run seed:products
npm run seed:price-lists
npm run dev
```

Current automated test command:

```bash
npm test
```

## Standard API Response Format

All API responses use one shared JSON envelope so the web frontend, Flutter mobile app, and Postman tests can read responses consistently.

### Single Item Or Action Success

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": "..."
    }
  }
}
```

Single-resource and action endpoints keep their module-specific payload names inside `data`, for example:

- Auth responses: `data.user`, `data.accessToken`, `data.refreshToken`
- User responses: `data.user`
- Customer responses: `data.customer`
- Product responses: `data.product`
- Price list responses: `data.priceList`
- Invoice and payment responses: `data.invoice`
- Customer balance responses: `data.customer`, `data.balance`, and `data.invoices`
- Visit action/detail responses: `data.visit`
- Dashboard summary responses: `data.summary`
- Dashboard sales representative responses: `data.salesReps`
- Dashboard recent activity responses: `data.activity`
- Recommendation responses: `data.customer`, `data.strategy`, `data.recommendations`, and `data.meta`

### Paginated List Success

```json
{
  "success": true,
  "message": "Products fetched successfully",
  "count": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  },
  "data": []
}
```

Paginated list endpoints always return the list directly as the `data` array, with `count` and `pagination` at the top level.

### Error Response

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

The `errors` array is included when detailed validation errors are available. Error responses never expose passwords, JWT secrets, refresh token versions, or raw internal user fields.

### PDF Route Exception

Successful invoice PDF responses return binary PDF content instead of a JSON success wrapper.

```http
Content-Type: application/pdf
Content-Disposition: inline; filename="IntelliSales-INV-2026-00001.pdf"
```

Errors from PDF routes still use the unified JSON error format.

## Module 1 Endpoints

### Health Check

```http
GET http://localhost:5000/api/v1/health
```

Expected JSON response:

```json
{
  "success": true,
  "message": "IntelliSales backend is healthy",
  "data": {
    "status": "ok",
    "environment": "development"
  }
}
```

### Database Health Check

```http
GET http://localhost:5000/api/v1/health/db
```

Expected response when MongoDB is connected:

```json
{
  "success": true,
  "message": "Database connection is healthy",
  "data": {
    "database": "connected",
    "readyState": 1
  }
}
```

Expected response when MongoDB is disconnected:

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

## Module 2 Auth Routes

Routes are mounted under:

```text
/api/v1/auth
```

| Method | Route | Access |
| --- | --- | --- |
| POST | `/login` | Public |
| POST | `/refresh-token` | Public |
| POST | `/logout` | Protected |
| GET | `/me` | Protected |
| GET | `/protected-test` | Protected |
| GET | `/admin-test` | COMPANY_ADMIN only |

## Module 3 Users Management Routes

Routes are mounted under:

```text
/api/v1/users
```

All users management routes require:

```text
Authorization: Bearer <COMPANY_ADMIN_ACCESS_TOKEN>
```

Only `COMPANY_ADMIN` can access these routes.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/users` | List users |
| GET | `/api/v1/users/:id` | Get one user |
| POST | `/api/v1/users` | Create user |
| PATCH | `/api/v1/users/:id` | Update user fields |
| PATCH | `/api/v1/users/:id/password` | Reset user password |
| DELETE | `/api/v1/users/:id` | Soft deactivate user |

### List Users Query Parameters

| Query | Description |
| --- | --- |
| `page` | Optional page number, default `1` |
| `limit` | Optional page size, default `10`, maximum `100` |
| `search` | Optional case-insensitive search by name or email |
| `role` | Optional role filter |
| `status` | Optional `ACTIVE` or `INACTIVE` filter |
| `sortBy` | Optional `createdAt`, `name`, `email`, `role`, or `status` |
| `sortOrder` | Optional `asc` or `desc`, default `desc` |

### Sample Create User Body

```json
{
  "name": "Demo Accountant",
  "email": "demo.accountant@intellisales.com",
  "password": "Password123!",
  "role": "ACCOUNTANT",
  "status": "ACTIVE"
}
```

### Sample Update User Body

```json
{
  "name": "Updated Demo Accountant",
  "email": "updated.accountant@intellisales.com",
  "role": "ACCOUNTANT",
  "status": "ACTIVE"
}
```

User responses hide `password`, `refreshTokenVersion`, `__v`, raw `_id`, and token data.

## Module 4 Customers Management Routes

Routes are mounted under:

```text
/api/v1/customers
```

All customer routes require:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/customers` | List customers |
| GET | `/api/v1/customers/:id` | Get one customer |
| POST | `/api/v1/customers` | Create customer |
| PATCH | `/api/v1/customers/:id` | Update customer fields |
| PATCH | `/api/v1/customers/:id/assign` | Assign or reassign customer |
| DELETE | `/api/v1/customers/:id` | Soft deactivate customer |

### Customer Role Access

| Role | Access |
| --- | --- |
| COMPANY_ADMIN | List/get/create/update/assign/deactivate any customer |
| SALES_MANAGER | List/get/create/update/assign/deactivate any customer |
| SALES_SUPERVISOR | List/get/create/update/assign/deactivate any customer |
| SALES_REPRESENTATIVE | List/get only assigned customers, create customers assigned to self, update basic fields for assigned customers |
| ACCOUNTANT | List/get customers only |

Sales representatives cannot change `assignedSalesRep` or `status`, cannot access unassigned customers, and cannot deactivate customers. Accountants cannot create, update, assign, or deactivate customers.

### Customer Schema Summary

| Field | Notes |
| --- | --- |
| `name` | Required, max 120 characters |
| `contactName` | Optional, max 120 characters |
| `phone` | Optional |
| `email` | Optional, valid email when provided |
| `address` | Optional object with `line1`, `line2`, `city`, `state`, `postalCode`, `country` |
| `notes` | Optional, max 1000 characters |
| `assignedSalesRep` | Optional user id, must be an active `SALES_REPRESENTATIVE` when assigned by admin/manager/supervisor |
| `customerType` | `Retail`, `Wholesale`, or `KeyAccount`; defaults to `Retail` |
| `paymentType` | `Cash` or `Credit`; defaults to `Cash` |
| `status` | `ACTIVE` or `INACTIVE`, defaults to `ACTIVE` |
| `createdBy` | Current user when available |
| `updatedBy` | Current user when available |

Customer responses include safe user references when populated and do not expose `password`, `refreshTokenVersion`, `__v`, raw `_id`, or token data.

### List Customers Query Parameters

| Query | Description |
| --- | --- |
| `page` | Optional page number, default `1` |
| `limit` | Optional page size, default `10`, maximum `100` |
| `search` | Optional case-insensitive search by name, contact name, email, phone, or city |
| `status` | Optional `ACTIVE` or `INACTIVE` filter |
| `customerType` | Optional `Retail`, `Wholesale`, or `KeyAccount` filter |
| `paymentType` | Optional `Cash` or `Credit` filter |
| `assignedSalesRep` | Optional sales rep id filter for admin/manager/supervisor/accountant users |
| `city` | Optional city filter |
| `sortBy` | Optional `createdAt`, `name`, `email`, `city`, `status`, `customerType`, or `paymentType` |
| `sortOrder` | Optional `asc` or `desc`, default `desc` |

Sales representatives always receive only their assigned customers, even if they send another `assignedSalesRep` query value.

### Sample Create Customer Body

Admin, manager, and supervisor users may include `assignedSalesRep` and `status`:

```json
{
  "name": "Alpha Market",
  "contactName": "Alaa Customer",
  "phone": "+963900000000",
  "email": "alpha@example.com",
  "address": {
    "line1": "Main Street",
    "city": "Damascus",
    "country": "Syria"
  },
  "notes": "Demo customer",
  "assignedSalesRep": "64f000000000000000000002",
  "customerType": "Retail",
  "paymentType": "Cash",
  "status": "ACTIVE"
}
```

Sales representatives can create customers, but the backend forces `assignedSalesRep` to the current sales representative and forces `status` to `ACTIVE`.

### Sample Update Customer Body

Admin, manager, and supervisor users can update:

```json
{
  "name": "Updated Alpha Market",
  "contactName": "Updated Contact",
  "phone": "+963911111111",
  "email": "updated.alpha@example.com",
  "address": {
    "city": "Aleppo",
    "country": "Syria"
  },
  "notes": "Updated notes",
  "customerType": "Wholesale",
  "paymentType": "Credit",
  "status": "ACTIVE"
}
```

Sales representatives can update only `contactName`, `phone`, `email`, `address`, and `notes` for assigned customers.

### Sample Assign Customer Body

```json
{
  "assignedSalesRep": "64f000000000000000000002"
}
```

Deletes are soft deactivations. `DELETE /api/v1/customers/:id` sets `status` to `INACTIVE` and keeps the MongoDB document.

## Module 5 Products / Simple Price List Routes

Routes are mounted under:

```text
/api/v1/products
```

All product routes require:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/products` | List products |
| GET | `/api/v1/products/price-list` | List active products as simple price-list items |
| GET | `/api/v1/products/:id` | Get one product |
| POST | `/api/v1/products` | Create product |
| PATCH | `/api/v1/products/:id` | Update product fields |
| PATCH | `/api/v1/products/:id/price` | Update product price fields |
| DELETE | `/api/v1/products/:id` | Soft deactivate product |

Important: `/api/v1/products/price-list` is registered before `/api/v1/products/:id`.

### Product Role Access

| Role | Access |
| --- | --- |
| COMPANY_ADMIN | List/get/create/update/price-update/deactivate products, view price list |
| SALES_MANAGER | List/get/create/update/price-update/deactivate products, view price list |
| SALES_SUPERVISOR | List/get/create/update/price-update/deactivate products, view price list |
| SALES_REPRESENTATIVE | List/get active products only, view price list |
| ACCOUNTANT | List/get active products only, view price list |

Sales representatives and accountants cannot create, update, price-update, or deactivate products. They should not see inactive products.

### Product Schema Summary

| Field | Notes |
| --- | --- |
| `name` | Required, max 150 characters |
| `sku` | Required, unique, normalized uppercase, max 80 characters |
| `productCode` | Response alias for `sku`; accepted in create/update if `sku` is not provided |
| `barcode` | Optional |
| `category` | Optional, max 100 characters |
| `brand` | Optional, max 100 characters |
| `description` | Optional, max 1000 characters |
| `unit` | `PIECE`, `BOX`, `KG`, `LITER`, `METER`, or `PACK`; defaults to `PIECE` |
| `basePrice` | Required number, minimum `0` |
| `currency` | 3-letter code, normalized uppercase, defaults to `SYP` |
| `taxRate` | Number from `0` to `100`, defaults to `0` |
| `status` | `ACTIVE` or `INACTIVE`, defaults to `ACTIVE` |
| `createdBy` | Current user when available |
| `updatedBy` | Current user when available |

Product responses include safe user references when populated and do not expose `password`, `refreshTokenVersion`, `__v`, raw `_id`, or token data.

`sku` remains supported for Module 5 compatibility. `productCode` is exposed as the same value so the invoice module can later store product snapshots with `productCode`.

### List Products Query Parameters

| Query | Description |
| --- | --- |
| `page` | Optional page number, default `1` |
| `limit` | Optional page size, default `10`, maximum `100` |
| `search` | Optional case-insensitive search by name, SKU, barcode, category, or brand |
| `status` | Optional `ACTIVE` or `INACTIVE`; inactive filtering is only useful for management roles |
| `category` | Optional category filter |
| `brand` | Optional brand filter |
| `minPrice` | Optional minimum base price |
| `maxPrice` | Optional maximum base price |
| `sortBy` | Optional `createdAt`, `name`, `sku`, `category`, `brand`, `basePrice`, or `status` |
| `sortOrder` | Optional `asc` or `desc`, default `desc` |

### Price List Endpoint

```http
GET /api/v1/products/price-list
```

This endpoint returns only active products in a lightweight shape for web/mobile product selectors and the future invoice module. It uses `basePrice` as `price` in Module 5.

Supported query parameters:

| Query | Description |
| --- | --- |
| `page` | Optional page number, default `1` |
| `limit` | Optional page size, default `50`, maximum `200` |
| `search` | Optional search by name, SKU, barcode, category, or brand |
| `category` | Optional category filter |

Example price-list item:

```json
{
  "id": "66f000000000000000000001",
  "name": "Office Printer Paper",
  "sku": "PAPER-A4-001",
  "productCode": "PAPER-A4-001",
  "category": "Office Supplies",
  "unit": "PACK",
  "price": 65000,
  "currency": "SYP",
  "taxRate": 0,
  "status": "ACTIVE"
}
```

### Sample Create Product Body

```json
{
  "name": "Office Printer Paper",
  "sku": "paper-a4-001",
  "barcode": "100000000001",
  "category": "Office Supplies",
  "brand": "IntelliOffice",
  "description": "A4 white printer paper pack for office use.",
  "unit": "PACK",
  "basePrice": 65000,
  "currency": "SYP",
  "taxRate": 0,
  "status": "ACTIVE"
}
```

### Sample Update Product Body

```json
{
  "name": "Updated Office Printer Paper",
  "sku": "paper-a4-updated",
  "category": "Updated Supplies",
  "brand": "IntelliOffice",
  "description": "Updated description",
  "unit": "PACK",
  "basePrice": 72500,
  "currency": "SYP",
  "taxRate": 3,
  "status": "ACTIVE"
}
```

### Sample Price Update Body

```json
{
  "basePrice": 72500,
  "currency": "SYP",
  "taxRate": 3
}
```

Deletes are soft deactivations. `DELETE /api/v1/products/:id` sets `status` to `INACTIVE` and keeps the MongoDB document.

Frontend teams can use:

```http
GET /api/v1/products
GET /api/v1/products/price-list
GET /api/v1/products/:id
```

## Module 5 Price List Routes

Routes are mounted under:

```text
/api/v1/price-lists
```

All price-list routes require:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/price-lists` | List price lists |
| POST | `/api/v1/price-lists` | Create price list |
| GET | `/api/v1/price-lists/customer-type/:customerType` | Get active price list for `Retail`, `Wholesale`, or `KeyAccount` |
| GET | `/api/v1/price-lists/:id` | Get one price list |
| PATCH | `/api/v1/price-lists/:id` | Update price list |
| DELETE | `/api/v1/price-lists/:id` | Soft deactivate price list |

Management roles can create, update, and deactivate price lists. Sales representatives and accountants can read active price lists only.

### Price List Schema Summary

| Field | Notes |
| --- | --- |
| `name` | Required |
| `customerType` | Required: `Retail`, `Wholesale`, or `KeyAccount` |
| `description` | Optional |
| `status` | `ACTIVE` or `INACTIVE`, defaults to `ACTIVE` |
| `items[].productId` | Required product id |
| `items[].price` | Required number, minimum `0` |
| `items[].currency` | 3-letter code, defaults to `SYP` |

### Customer Type Pricing Flow For Invoices

Module 6 invoices use the active price list for the selected customer's `customerType`:

```text
customer.customerType -> GET /api/v1/price-lists/customer-type/:customerType -> selected item price -> invoice product snapshot
```

The customer-type lookup returns active price-list items with snapshot-friendly fields:

```json
{
  "productId": "66f000000000000000000001",
  "productCode": "PAPER-A4-001",
  "productName": "Office Printer Paper",
  "price": 65000,
  "currency": "SYP",
  "basePrice": 65000,
  "unit": "PACK"
}
```

Inactive products are excluded from the active customer-type price-list lookup when product status is available.

## Module 6 Invoices Core Routes

Routes are mounted under:

```text
/api/v1/invoices
```

All invoice routes require:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/invoices` | List invoices |
| POST | `/api/v1/invoices` | Create draft invoice |
| GET | `/api/v1/invoices/:id` | Get one invoice |
| PATCH | `/api/v1/invoices/:id` | Edit draft invoice |
| PATCH | `/api/v1/invoices/:id/confirm` | Confirm draft invoice |
| PATCH | `/api/v1/invoices/:id/archive` | Archive invoice |
| PATCH | `/api/v1/invoices/:id/payment` | Update confirmed invoice payment |
| PATCH | `/api/v1/invoices/:id/mark-sent` | Mark confirmed unpaid invoice as sent |
| GET | `/api/v1/customers/:id/invoices` | List invoices for one customer |
| GET | `/api/v1/customers/:id/balance` | Get customer balance |

### Core Invoice Role Access

| Role | Access |
| --- | --- |
| COMPANY_ADMIN | List/get/create/edit/confirm/archive all invoices |
| SALES_MANAGER | List/get/create/edit/confirm/archive all invoices |
| SALES_SUPERVISOR | List/get/create/edit/confirm/archive all invoices |
| SALES_REPRESENTATIVE | List/get/create/edit/confirm own invoices for assigned customers only |
| ACCOUNTANT | List/get all invoices only |

Sales representatives cannot create invoices for unassigned customers and cannot archive invoices. Accountants cannot create, edit, confirm, or archive invoices.

Payment update and mark-sent use the stricter Module 8 payment access table below.

### Invoice Flow

```text
Select customer -> customerType -> active price list -> product price snapshot -> DRAFT invoice -> CONFIRMED invoice number -> ARCHIVED if needed
```

- New invoices start with `invoiceStatus: DRAFT`.
- Draft invoices can be edited.
- Confirming a draft invoice generates `invoiceNumber` using `INV-YYYY-00001`.
- Confirmed invoices cannot be edited.
- Archived invoices cannot be edited.
- `paymentStatus` starts as `PENDING`.
- `paidAmount` starts as `0`.
- `remainingAmount` equals `totalAmount` when a draft invoice is created.
- Module 8 updates `paidAmount`, `remainingAmount`, and `paymentStatus` after invoice confirmation.

### Invoice Model Summary

| Field | Notes |
| --- | --- |
| `invoiceNumber` | Generated only on confirmation; format `INV-YYYY-00001` |
| `customerId` | Customer reference |
| `customerSnapshot` | Stored customer data at draft creation time |
| `items[]` | Stored product snapshots with price-list unit price |
| `items[].lineDiscountAmount` | Proportional invoice-level discount allocated to the item |
| `items[].lineTaxableAmount` | Item subtotal after allocated discount |
| `subtotal` | Sum of item subtotals |
| `discountType` | `NONE`, `AMOUNT`, or `PERCENTAGE` |
| `discountValue` | Requested discount value |
| `discountAmount` | Calculated discount amount |
| `taxableAmount` | `subtotal - discountAmount`, never below `0` |
| `taxRate` | Invoice default tax rate, currently `8` |
| `taxAmount` | Calculated tax amount |
| `totalAmount` | `taxableAmount + taxAmount` |
| `paidAmount` | Cumulative total paid so far; defaults to `0` |
| `remainingAmount` | `totalAmount - paidAmount`; defaults to `totalAmount` |
| `currency` | Defaults to `SYP` |
| `invoiceStatus` | `DRAFT`, `CONFIRMED`, or `ARCHIVED` |
| `paymentStatus` | `PENDING`, `SENT`, or `PAID` |
| `paymentMethod` | Cash-only MVP value: `Cash` |
| `sentAt` | Set when a confirmed unpaid invoice is marked as sent |
| `source` | `MANUAL` or `VOICE_TEXT` |
| `createdBy`, `updatedBy`, `confirmedBy`, `archivedBy` | Safe user reference or id |

### Invoice Item Snapshot

The frontend sends only the product id and quantity:

```json
{
  "productId": "66f000000000000000000001",
  "quantity": 2
}
```

The backend loads the active price list for the customer's `customerType`, finds the product price there, and stores snapshot fields:

```json
{
  "productId": "66f000000000000000000001",
  "productCode": "PAPER-A4-001",
  "productName": "Office Printer Paper",
  "quantity": 2,
  "unitPrice": 65000,
  "lineSubtotal": 130000,
  "lineDiscountAmount": 0,
  "lineTaxableAmount": 130000,
  "taxRate": 8,
  "taxAmount": 10400,
  "lineTotal": 140400,
  "currency": "SYP",
  "unit": "PACK"
}
```

When an invoice-level discount is applied, the backend allocates the discount proportionally across items. Each item `lineTotal` is calculated as `lineTaxableAmount + taxAmount`, so the sum of item `lineTotal` values matches `totalAmount` after rounding.

There is no silent fallback to `basePrice`. If the active customer-type price list or product price is missing, invoice creation returns a `400` error.

### List Invoices Query Parameters

| Query | Description |
| --- | --- |
| `page` | Optional page number, default `1` |
| `limit` | Optional page size, default `10`, maximum `100` |
| `search` | Optional search by invoice number, customer snapshot name, or notes |
| `invoiceStatus` | Optional `DRAFT`, `CONFIRMED`, or `ARCHIVED` |
| `paymentStatus` | Optional `PENDING`, `SENT`, or `PAID` |
| `customerId` | Optional customer id filter |
| `createdBy` | Optional creator id filter for all-invoice readers |
| `dateFrom` | Optional created-at start date |
| `dateTo` | Optional created-at end date |
| `sortBy` | Optional `createdAt`, `confirmedAt`, `invoiceNumber`, `totalAmount`, `invoiceStatus`, or `paymentStatus` |
| `sortOrder` | Optional `asc` or `desc`, default `desc` |

### Sample Create Draft Invoice Body

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
  "dueDate": "2026-07-30",
  "source": "MANUAL",
  "voiceText": "optional",
  "notes": "optional"
}
```

### Sample Confirm Invoice Response

```json
{
  "success": true,
  "message": "Invoice confirmed successfully",
  "data": {
    "invoice": {
      "id": "68f000000000000000000001",
      "invoiceNumber": "INV-2026-00001",
      "invoiceStatus": "CONFIRMED",
      "paymentStatus": "PENDING",
      "confirmedAt": "2026-06-27T00:00:00.000Z",
      "totalAmount": 140400,
      "remainingAmount": 140400
    }
  }
}
```

### Sample Archive Route

```http
PATCH /api/v1/invoices/68f000000000000000000001/archive
```

Payment updates, mark-sent logic, and customer balance are implemented in Module 8. Visits, dashboard, recommendations, and frontend apps are not part of Module 6.

## Module 7 Invoice PDF Generation

PDF generation is mounted under the existing invoice routes:

```http
GET /api/v1/invoices/:id/pdf
```

All PDF requests require:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

### PDF Route Table

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/invoices/:id/pdf` | Preview, generate, or download invoice PDF |

### PDF Access Rules

| Role | Access |
| --- | --- |
| COMPANY_ADMIN | Can access any invoice PDF |
| SALES_MANAGER | Can access any invoice PDF |
| SALES_SUPERVISOR | Can access any invoice PDF |
| ACCOUNTANT | Can access any invoice PDF |
| SALES_REPRESENTATIVE | Can access own/allowed invoice PDFs only |

Unauthenticated PDF requests return `401`. Sales representatives cannot access another representative's invoice PDF.

### PDF Behavior By Invoice Status

| Invoice Status | Behavior |
| --- | --- |
| `DRAFT` | Returns a temporary preview PDF with a clear DRAFT marker. Does not store `pdfPath`. |
| `CONFIRMED` | Generates official PDF if needed, stores `pdfPath` and `pdfGeneratedAt`, and returns the PDF. |
| `ARCHIVED` | Allows PDF download. Reuses or regenerates the official PDF safely. |

Successful PDF responses are binary:

```http
Content-Type: application/pdf
Content-Disposition: inline; filename="IntelliSales-INV-2026-00001.pdf"
```

Error responses from this route still use the standard JSON error shape.

### Local PDF Storage

Official generated PDFs are stored locally under:

```text
uploads/invoices
```

Generated `.pdf` files are ignored by Git. The folder stays in the repository through `uploads/invoices/.gitkeep`.

Official PDF files are generated only for confirmed or archived invoices. If `pdfPath` exists and the file still exists, the backend reuses that file. If `pdfPath` exists but the file is missing, the backend regenerates the PDF safely.

Draft PDFs are preview-only and are not saved as official invoice files.

Payment routes are implemented in Module 8 below. Visits, dashboard, recommendations, Swagger UI, and frontend apps are not part of Module 7.

## Module 8 Payment Update and Customer Balance

Module 8 completes the demo flow:

```text
Confirm invoice -> Generate PDF -> Update payment -> Check customer balance
```

All Module 8 routes require:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

### Payment Route Table

| Method | Route | Purpose |
| --- | --- | --- |
| PATCH | `/api/v1/invoices/:id/payment` | Update cumulative paid amount for a confirmed invoice |
| PATCH | `/api/v1/invoices/:id/mark-sent` | Mark a confirmed unpaid invoice as sent |
| GET | `/api/v1/customers/:id/balance` | Calculate current customer balance |

### Module 8 Role Access

| Role | Update Payment | Mark Sent | Customer Balance |
| --- | --- | --- | --- |
| COMPANY_ADMIN | Yes | Yes | Any customer |
| SALES_MANAGER | Yes | Yes | Any customer |
| SALES_SUPERVISOR | No | No | Any customer |
| ACCOUNTANT | Yes | Yes | Any customer |
| SALES_REPRESENTATIVE | No | No | Assigned customers only |

### Payment Business Rules

- Payment method is Cash only.
- `paidAmount` is the cumulative total paid so far, not an added transaction amount.
- Only confirmed invoices can receive payment updates.
- Archived invoices cannot receive payment updates.
- `paidAmount` must be greater than or equal to `0`.
- `paidAmount` cannot exceed `totalAmount`.
- `remainingAmount` is recalculated as `totalAmount - paidAmount`.
- Full payment sets `paymentStatus` to `PAID`.
- Partial payment keeps `paymentStatus` as `SENT` if it was already sent.
- Partial payment sets `paymentStatus` to `PENDING` when it was not already sent.
- No online payment gateway, refunds, or payment history table is included in this module.

### Update Payment Example

```http
PATCH /api/v1/invoices/68f000000000000000000001/payment
```

Body:

```json
{
  "paidAmount": 1000,
  "paymentMethod": "Cash"
}
```

Success response:

```json
{
  "success": true,
  "message": "Invoice payment updated successfully",
  "data": {
    "invoice": {
      "id": "68f000000000000000000001",
      "invoiceNumber": "INV-2026-00001",
      "invoiceStatus": "CONFIRMED",
      "paymentStatus": "PENDING",
      "paymentMethod": "Cash",
      "totalAmount": 5000,
      "paidAmount": 1000,
      "remainingAmount": 4000
    }
  }
}
```

### Mark Sent Example

```http
PATCH /api/v1/invoices/68f000000000000000000001/mark-sent
```

Success response:

```json
{
  "success": true,
  "message": "Invoice marked as sent successfully",
  "data": {
    "invoice": {
      "id": "68f000000000000000000001",
      "invoiceNumber": "INV-2026-00001",
      "invoiceStatus": "CONFIRMED",
      "paymentStatus": "SENT",
      "sentAt": "2026-06-27T00:00:00.000Z"
    }
  }
}
```

### Customer Balance Rules

- Balance is calculated from invoices where `invoiceStatus` is `CONFIRMED` and `remainingAmount > 0`.
- Draft invoices are excluded.
- Archived invoices are excluded.
- Fully paid invoices are excluded.
- `isOverdue` is calculated from `dueDate`, `paymentStatus`, and `remainingAmount`.
- If all unpaid confirmed invoices use one currency, `balance.currency` and `balance.totalBalance` are returned.
- If multiple currencies exist, `balancesByCurrency` is returned without pretending there is one combined currency total.

### Customer Balance Example

```http
GET /api/v1/customers/65f000000000000000000001/balance
```

Success response:

```json
{
  "success": true,
  "message": "Customer balance fetched successfully",
  "data": {
    "customer": {
      "id": "65f000000000000000000001",
      "name": "Retail Market",
      "customerType": "Retail"
    },
    "balance": {
      "currency": "SYP",
      "totalBalance": 5000,
      "invoiceCount": 2,
      "overdueBalance": 1000,
      "overdueInvoiceCount": 1,
      "balancesByCurrency": [
        {
          "currency": "SYP",
          "totalBalance": 5000,
          "invoiceCount": 2,
          "overdueBalance": 1000,
          "overdueInvoiceCount": 1
        }
      ]
    },
    "invoices": [
      {
        "id": "68f000000000000000000001",
        "invoiceNumber": "INV-2026-00001",
        "totalAmount": 7000,
        "paidAmount": 2000,
        "remainingAmount": 5000,
        "currency": "SYP",
        "paymentStatus": "PENDING",
        "dueDate": "2026-07-30T00:00:00.000Z",
        "isOverdue": false
      }
    ]
  }
}
```

Visits are implemented in Module 9 below. Dashboard, recommendations, Swagger UI, and frontend apps are not part of Module 8.

## Module 9 Visits Management APIs

Module 9 adds simple customer visit tracking for the sales representative/mobile demo flow:

```text
Sales rep logs in -> sees assigned customers -> creates planned visit -> completes visit with outcome -> management reviews visits
```

All visit routes require:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

### Visit Route Table

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/visits` | List visits |
| POST | `/api/v1/visits` | Create a planned visit |
| GET | `/api/v1/visits/:id` | Get one visit |
| PATCH | `/api/v1/visits/:id` | Update a planned visit |
| PATCH | `/api/v1/visits/:id/complete` | Complete a planned visit |
| PATCH | `/api/v1/visits/:id/cancel` | Cancel a planned visit |
| GET | `/api/v1/customers/:id/visits` | List visits for one customer |

### Visit Role Access

| Role | Access |
| --- | --- |
| COMPANY_ADMIN | List/get/create/update/complete/cancel all visits |
| SALES_MANAGER | List/get/create/update/complete/cancel all visits |
| SALES_SUPERVISOR | List/get/create/update/complete/cancel all visits |
| SALES_REPRESENTATIVE | List/get/update/complete/cancel own visits; create visits only for assigned customers |
| ACCOUNTANT | List/get visits only |

Sales representatives cannot create visits for another sales representative and cannot access visits belonging to another sales representative. Accountants are read-only.

### Visit Schema Summary

| Field | Notes |
| --- | --- |
| `customer` | Customer reference, required |
| `salesRep` | Sales representative user reference, required |
| `visitDate` | Required visit date |
| `status` | `PLANNED`, `COMPLETED`, or `CANCELLED` |
| `purpose` | Optional text, max 300 characters |
| `notes` | Optional text, max 2000 characters |
| `outcome` | Visit outcome enum, defaults to `NONE` |
| `nextAction` | Optional text, max 500 characters |
| `nextVisitDate` | Optional follow-up date |
| `location` | Optional `address`, `city`, `latitude`, and `longitude` |
| `createdBy`, `updatedBy` | Safe user reference or id |
| `completedAt` | Set when the visit is completed |
| `cancelledAt` | Set when the visit is cancelled |

### Visit Status And Outcome Enums

Statuses:

```text
PLANNED
COMPLETED
CANCELLED
```

Outcomes:

```text
NONE
ORDER_PLACED
PAYMENT_COLLECTED
FOLLOW_UP_NEEDED
NO_INTEREST
CUSTOMER_UNAVAILABLE
OTHER
```

The complete route requires one of the useful outcomes: `ORDER_PLACED`, `PAYMENT_COLLECTED`, `FOLLOW_UP_NEEDED`, `NO_INTEREST`, `CUSTOMER_UNAVAILABLE`, or `OTHER`.

### List Visits Query Parameters

| Query | Description |
| --- | --- |
| `page` | Optional page number, default `1` |
| `limit` | Optional page size, default `10`, maximum `100` |
| `status` | Optional `PLANNED`, `COMPLETED`, or `CANCELLED` |
| `outcome` | Optional visit outcome |
| `customer` | Optional customer id filter |
| `salesRep` | Optional sales representative id filter for all-visit readers |
| `dateFrom` | Optional visit date start |
| `dateTo` | Optional visit date end |
| `search` | Optional search by purpose, notes, customer name, contact, or phone |
| `sortBy` | Optional `visitDate`, `createdAt`, `status`, or `outcome` |
| `sortOrder` | Optional `asc` or `desc`, default `desc` |

### Sample Create Visit Body

```json
{
  "customer": "65f000000000000000000001",
  "salesRep": "64f000000000000000000002",
  "visitDate": "2030-02-01T10:00:00.000Z",
  "purpose": "Discuss new order",
  "notes": "Bring the latest price list",
  "nextAction": "Prepare offer",
  "nextVisitDate": "2030-02-08T10:00:00.000Z",
  "location": {
    "address": "Main Street",
    "city": "Damascus",
    "latitude": 33.5138,
    "longitude": 36.2765
  }
}
```

For sales representatives, the backend ignores any provided `salesRep` value and forces it to the logged-in sales representative. For admin, manager, and supervisor users, if `salesRep` is not provided, the backend uses the customer's assigned sales representative when available.

### Sample Complete Visit Body

```json
{
  "outcome": "FOLLOW_UP_NEEDED",
  "notes": "Customer requested another visit next week",
  "nextAction": "Send updated quotation",
  "nextVisitDate": "2030-02-08T10:00:00.000Z"
}
```

Success response:

```json
{
  "success": true,
  "message": "Visit completed successfully",
  "data": {
    "visit": {
      "id": "69f000000000000000000001",
      "customer": "65f000000000000000000001",
      "salesRep": "64f000000000000000000002",
      "status": "COMPLETED",
      "outcome": "FOLLOW_UP_NEEDED",
      "completedAt": "2026-06-27T00:00:00.000Z"
    }
  }
}
```

### Customer Visits Endpoint

```http
GET /api/v1/customers/65f000000000000000000001/visits
```

Admin, manager, supervisor, and accountant users can list visits for any customer. Sales representatives can list visits only for customers assigned to themselves.

Visits do not automatically create invoices or payments. Dashboard APIs are implemented in Module 10 below. Recommendations, route optimization, maps, GPS tracking, calendar integration, push notifications, Swagger UI, and frontend apps are not part of Module 9.

## Module 10 Dashboard Summary APIs

Module 10 adds read-only summary APIs for the web dashboard demo and a limited personal dashboard for sales representatives.

All dashboard routes require:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

### Dashboard Route Table

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/dashboard/summary` | Role-aware dashboard summary |
| GET | `/api/v1/dashboard/sales-reps` | Sales representative performance summary for management |
| GET | `/api/v1/dashboard/recent-activity` | Role-aware recent dashboard activity |

### Dashboard Role Access

| Role | Summary | Sales Reps | Recent Activity |
| --- | --- | --- | --- |
| COMPANY_ADMIN | Global | Yes | Global |
| SALES_MANAGER | Global | Yes | Global |
| SALES_SUPERVISOR | Global | Yes | Global |
| ACCOUNTANT | Financial/global read-only | No | Global read-only |
| SALES_REPRESENTATIVE | Own scope only | No | Own scope only |

Sales representatives see only assigned customers, visible invoices, own visits, and active product counts. They must not see other sales representatives' dashboard data.

### Dashboard Summary Shape

```json
{
  "success": true,
  "message": "Dashboard summary fetched successfully",
  "data": {
    "summary": {
      "scope": "ALL",
      "generatedAt": "2026-06-27T00:00:00.000Z",
      "customers": {
        "total": 0,
        "active": 0,
        "inactive": 0,
        "byType": {
          "Retail": 0,
          "Wholesale": 0,
          "KeyAccount": 0
        }
      },
      "products": {
        "total": 0,
        "active": 0,
        "inactive": 0
      },
      "invoices": {
        "total": 0,
        "draft": 0,
        "confirmed": 0,
        "archived": 0,
        "sent": 0,
        "paid": 0,
        "pending": 0,
        "totalAmount": 0,
        "paidAmount": 0,
        "remainingAmount": 0,
        "overdueAmount": 0,
        "currency": "SYP"
      },
      "visits": {
        "total": 0,
        "planned": 0,
        "completed": 0,
        "cancelled": 0,
        "upcoming": 0,
        "overdue": 0
      },
      "recent": {
        "invoices": [],
        "visits": []
      }
    }
  }
}
```

### Financial Total Rules

- `totalAmount` sums confirmed, non-archived invoices only.
- `paidAmount` sums confirmed, non-archived invoices only.
- `remainingAmount` sums confirmed, non-archived, unpaid invoices only.
- `overdueAmount` sums confirmed, non-archived, unpaid invoices whose `dueDate` is before the request time.
- Draft invoices are counted in status counts but not financial totals.
- Archived invoices are counted in status counts but not active financial totals.
- Paid invoices do not add to remaining balance.

### Sales Representative Dashboard Shape

```json
{
  "success": true,
  "message": "Sales representative dashboard fetched successfully",
  "count": 2,
  "data": {
    "salesReps": [
      {
        "id": "64f000000000000000000002",
        "name": "Sales Representative",
        "email": "rep@intellisales.com",
        "status": "ACTIVE",
        "assignedCustomers": 0,
        "invoiceCount": 0,
        "confirmedInvoiceCount": 0,
        "totalSalesAmount": 0,
        "paidAmount": 0,
        "remainingAmount": 0,
        "visitCount": 0,
        "completedVisitCount": 0
      }
    ]
  }
}
```

Only `COMPANY_ADMIN`, `SALES_MANAGER`, and `SALES_SUPERVISOR` can call this route.

### Recent Activity Shape

```json
{
  "success": true,
  "message": "Recent activity fetched successfully",
  "data": {
    "activity": [
      {
        "type": "INVOICE_CONFIRMED",
        "title": "Invoice INV-2026-00001 confirmed",
        "timestamp": "2026-06-27T00:00:00.000Z",
        "entityId": "68f000000000000000000001",
        "entityType": "invoice"
      }
    ]
  }
}
```

`GET /api/v1/dashboard/recent-activity` supports:

| Query | Description |
| --- | --- |
| `limit` | Optional activity limit, default `10`, maximum `50` |

Recent activity is derived from invoices and visits. Module 10 does not create a new activity collection.

Recommendations are implemented in Module 11 below. AI/ML analytics, route optimization, backend-generated charts, dashboard exports, notifications, email sending, background jobs, Swagger UI, and frontend apps are not part of Module 10.

## Module 11 Basic Product Recommendations APIs

Module 11 adds a simple, deterministic, rule-based product recommendation endpoint for the mobile sales representative customer detail flow.

All recommendation routes require:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

### Recommendation Route Table

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/recommendations/customers/:customerId/products` | Recommend products for one customer |

### Recommendation Query Parameters

| Query | Description |
| --- | --- |
| `limit` | Optional number, default `5`, minimum `1`, maximum `20` |
| `includeHistory` | Optional boolean-compatible value, default `true`; use `false` to skip purchase history and force price-list fallback |

### Recommendation Role Access

| Role | Access |
| --- | --- |
| COMPANY_ADMIN | Any active customer |
| SALES_MANAGER | Any active customer |
| SALES_SUPERVISOR | Any active customer |
| ACCOUNTANT | Any active customer, read-only |
| SALES_REPRESENTATIVE | Assigned active customers only |

Sales representatives receive `403` for customers assigned to another sales representative or for unassigned customers. Unknown customers return `404`. Inactive customers return `400` with `Customer is inactive`.

### Recommendation Strategies

| Strategy | When Used | Behavior |
| --- | --- | --- |
| `PURCHASE_HISTORY` | Customer has confirmed, non-archived invoice items that are still active and available in the current active customer-type price list | Scores previous products by purchase frequency and quantity, then returns the current price-list price |
| `CUSTOMER_TYPE_PRICE_LIST` | No usable confirmed purchase history exists, or `includeHistory=false` | Returns active products from the active price list for the customer's `customerType` |
| `NO_AVAILABLE_RECOMMENDATIONS` | No active price list exists or the active price list has no active products | Returns `200` with an empty `recommendations` array |

Only confirmed invoices are used for purchase history. Draft and archived invoices are ignored. Products must still be `ACTIVE`, and products must still exist in the active price list for the customer's `customerType`. Current recommendation prices come from the active price list, not old invoice snapshots.

### Purchase-History Example Response

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
    "strategy": "PURCHASE_HISTORY",
    "recommendations": [
      {
        "product": {
          "id": "66f000000000000000000001",
          "name": "Office Printer Paper",
          "productCode": "PAPER-A4-001",
          "sku": "PAPER-A4-001",
          "category": "Office Supplies",
          "brand": "IntelliBrand",
          "unit": "PACK",
          "status": "ACTIVE"
        },
        "price": 110,
        "currency": "SYP",
        "taxRate": 8,
        "score": 105,
        "reason": "Previously purchased by this customer",
        "history": {
          "timesPurchased": 2,
          "totalQuantityPurchased": 5,
          "lastPurchasedAt": "2026-06-20T10:00:00.000Z"
        }
      }
    ],
    "meta": {
      "limit": 5,
      "customerType": "Retail",
      "priceListId": "67f000000000000000000001",
      "source": "confirmed invoices + active price list"
    }
  }
}
```

### Customer-Type Fallback Example Response

```json
{
  "success": true,
  "message": "Product recommendations fetched successfully",
  "data": {
    "customer": {
      "id": "65f000000000000000000002",
      "name": "Wholesale Market",
      "customerType": "Wholesale"
    },
    "strategy": "CUSTOMER_TYPE_PRICE_LIST",
    "recommendations": [
      {
        "product": {
          "id": "66f000000000000000000002",
          "name": "Packing Tape",
          "productCode": "TAPE-PACK-001",
          "sku": "TAPE-PACK-001",
          "category": "Office Supplies",
          "brand": "IntelliBrand",
          "unit": "PACK",
          "status": "ACTIVE"
        },
        "price": 45,
        "currency": "SYP",
        "taxRate": 8,
        "score": 100,
        "reason": "Recommended from Wholesale price list"
      }
    ],
    "meta": {
      "limit": 5,
      "customerType": "Wholesale",
      "priceListId": "67f000000000000000000002",
      "source": "active customer type price list"
    }
  }
}
```

### Empty Recommendation Example Response

```json
{
  "success": true,
  "message": "No available product recommendations found",
  "data": {
    "customer": {
      "id": "65f000000000000000000004",
      "name": "Key Account Market",
      "customerType": "KeyAccount"
    },
    "strategy": "NO_AVAILABLE_RECOMMENDATIONS",
    "recommendations": [],
    "meta": {
      "limit": 5,
      "customerType": "KeyAccount",
      "source": "no active price list"
    }
  }
}
```

### Notes For Frontend And Mobile Colleagues

- Sales rep mobile app can call this endpoint from the customer detail screen.
- Use `recommendation.product.name`, `recommendation.product.productCode`, `recommendation.product.unit`, `recommendation.price`, `recommendation.currency`, and `recommendation.reason`.
- Empty `recommendations` is a valid `200` result. Show a friendly empty state.
- This module is rule-based only. It does not use AI/ML, external APIs, background jobs, or advanced analytics.

## Postman Testing Instructions

1. Create a Postman environment named `IntelliSales Local`.
2. Add a variable:

```text
baseUrl = http://localhost:5000/api/v1
```

### Health Routes

```http
GET {{baseUrl}}/health
GET {{baseUrl}}/health/db
GET {{baseUrl}}/does-not-exist
```

### Login

```http
POST {{baseUrl}}/auth/login
```

Body:

```json
{
  "email": "admin@intellisales.com",
  "password": "Password123!"
}
```

Copy `accessToken` from the response.

### Protected Requests

Use this header for protected routes:

```text
Authorization: Bearer <accessToken>
```

Example protected route:

```http
GET {{baseUrl}}/auth/me
```

Example admin-only route:

```http
GET {{baseUrl}}/auth/admin-test
```

### Users Management Requests

After logging in as `admin@intellisales.com`, use the admin access token:

```http
GET {{baseUrl}}/users
GET {{baseUrl}}/users?search=manager
GET {{baseUrl}}/users?role=SALES_REPRESENTATIVE
GET {{baseUrl}}/users/<userId>
POST {{baseUrl}}/users
PATCH {{baseUrl}}/users/<userId>
PATCH {{baseUrl}}/users/<userId>/password
DELETE {{baseUrl}}/users/<userId>
```

### Customers Management Requests

No Postman collection file is currently tracked beyond the placeholder. After Module 4 review, create a collection named `IntelliSales - Module 04 - Customers Management`.

Recommended Module 4 requests:

```http
POST {{baseUrl}}/auth/login
GET {{baseUrl}}/customers
GET {{baseUrl}}/customers?search=alpha
GET {{baseUrl}}/customers?status=ACTIVE
GET {{baseUrl}}/customers?assignedSalesRep=<salesRepUserId>
GET {{baseUrl}}/customers/<customerId>
GET {{baseUrl}}/customers/<customerId>/balance
GET {{baseUrl}}/customers/<customerId>/visits
POST {{baseUrl}}/customers
PATCH {{baseUrl}}/customers/<customerId>
PATCH {{baseUrl}}/customers/<customerId>/assign
DELETE {{baseUrl}}/customers/<customerId>
```

Also test:

```http
GET {{baseUrl}}/customers
```

without an `Authorization` header. It should return `401`.

Use separate login tokens for:

- `admin@intellisales.com`
- `rep@intellisales.com`
- `accountant@intellisales.com`

### Products / Simple Price List Requests

No Postman collection file is currently tracked beyond the placeholder. After Module 5 review, create a collection named `IntelliSales - Module 05 - Products Price List`.

Recommended Module 5 requests:

```http
POST {{baseUrl}}/auth/login
GET {{baseUrl}}/products
GET {{baseUrl}}/products?search=paper
GET {{baseUrl}}/products?status=INACTIVE
GET {{baseUrl}}/products?category=Hardware
GET {{baseUrl}}/products?minPrice=5&maxPrice=50
GET {{baseUrl}}/products/price-list
GET {{baseUrl}}/products/price-list?search=paper
GET {{baseUrl}}/products/<productId>
POST {{baseUrl}}/products
PATCH {{baseUrl}}/products/<productId>
PATCH {{baseUrl}}/products/<productId>/price
DELETE {{baseUrl}}/products/<productId>
GET {{baseUrl}}/price-lists
GET {{baseUrl}}/price-lists/customer-type/Retail
GET {{baseUrl}}/price-lists/customer-type/Wholesale
GET {{baseUrl}}/price-lists/customer-type/KeyAccount
POST {{baseUrl}}/price-lists
PATCH {{baseUrl}}/price-lists/<priceListId>
DELETE {{baseUrl}}/price-lists/<priceListId>
```

Also test:

```http
GET {{baseUrl}}/products
```

without an `Authorization` header. It should return `401`.

Use separate login tokens for:

- `admin@intellisales.com`
- `manager@intellisales.com`
- `supervisor@intellisales.com`
- `rep@intellisales.com`
- `accountant@intellisales.com`

### Invoices Core Requests

No Postman collection file is currently tracked beyond the placeholder. After Module 6 review, create a collection named `IntelliSales - Module 06 - Invoices Core`.

Recommended Module 6 requests:

```http
POST {{baseUrl}}/auth/login
GET {{baseUrl}}/invoices
GET {{baseUrl}}/invoices?invoiceStatus=DRAFT
GET {{baseUrl}}/invoices?paymentStatus=PENDING
GET {{baseUrl}}/invoices?customerId=<customerId>
POST {{baseUrl}}/invoices
GET {{baseUrl}}/invoices/<invoiceId>
PATCH {{baseUrl}}/invoices/<invoiceId>
PATCH {{baseUrl}}/invoices/<invoiceId>/confirm
PATCH {{baseUrl}}/invoices/<invoiceId>/archive
GET {{baseUrl}}/customers/<customerId>/invoices
```

Create draft invoice body:

```json
{
  "customerId": "<customerId>",
  "items": [
    {
      "productId": "<productId>",
      "quantity": 2
    }
  ],
  "discountType": "NONE",
  "discountValue": 0,
  "source": "MANUAL",
  "notes": "Postman draft invoice"
}
```

Also test:

```http
GET {{baseUrl}}/invoices
```

without an `Authorization` header. It should return `401`.

Use separate login tokens for:

- `admin@intellisales.com`
- `manager@intellisales.com`
- `supervisor@intellisales.com`
- `rep@intellisales.com`
- `accountant@intellisales.com`

### Invoice PDF Requests

No Postman collection file is currently tracked beyond the placeholder. After Module 7 review, create a collection named `IntelliSales - Module 07 - Invoice PDF Generation`.

Recommended Module 7 requests:

```http
POST {{baseUrl}}/auth/login
POST {{baseUrl}}/invoices
GET {{baseUrl}}/invoices/<draftInvoiceId>/pdf
PATCH {{baseUrl}}/invoices/<invoiceId>/confirm
GET {{baseUrl}}/invoices/<confirmedInvoiceId>/pdf
PATCH {{baseUrl}}/invoices/<invoiceId>/archive
GET {{baseUrl}}/invoices/<archivedInvoiceId>/pdf
```

In Postman, the PDF response should show:

```http
Content-Type: application/pdf
```

Also test:

```http
GET {{baseUrl}}/invoices/<invoiceId>/pdf
```

without an `Authorization` header. It should return `401` with the standard JSON error format.

### Payment And Balance Requests

No Postman collection file is currently tracked beyond the placeholder. After Module 8 review, create a collection named `IntelliSales - Module 08 - Payments And Balance`.

Recommended Module 8 requests:

```http
POST {{baseUrl}}/auth/login
PATCH {{baseUrl}}/invoices/<confirmedInvoiceId>/payment
PATCH {{baseUrl}}/invoices/<confirmedInvoiceId>/mark-sent
GET {{baseUrl}}/customers/<customerId>/balance
```

Update payment body:

```json
{
  "paidAmount": 1000,
  "paymentMethod": "Cash"
}
```

Also test:

```http
PATCH {{baseUrl}}/invoices/<confirmedInvoiceId>/payment
```

with `rep@intellisales.com` and `supervisor@intellisales.com`. Both should return `403`.

Also test:

```http
GET {{baseUrl}}/customers/<unassignedCustomerId>/balance
```

with `rep@intellisales.com`. It should return `403`.

### Visits Management Requests

No Postman collection file is currently tracked beyond the placeholder. After Module 9 review, create a collection named `IntelliSales - Module 09 - Visits Management`.

Recommended Module 9 requests:

```http
POST {{baseUrl}}/auth/login
GET {{baseUrl}}/visits
GET {{baseUrl}}/visits?status=PLANNED
GET {{baseUrl}}/visits?salesRep=<salesRepUserId>
GET {{baseUrl}}/visits?customer=<customerId>
POST {{baseUrl}}/visits
GET {{baseUrl}}/visits/<visitId>
PATCH {{baseUrl}}/visits/<visitId>
PATCH {{baseUrl}}/visits/<visitId>/complete
PATCH {{baseUrl}}/visits/<visitId>/cancel
GET {{baseUrl}}/customers/<customerId>/visits
```

Create visit body:

```json
{
  "customer": "<customerId>",
  "visitDate": "2030-02-01T10:00:00.000Z",
  "purpose": "Discuss new order",
  "notes": "Bring the latest price list",
  "location": {
    "city": "Damascus"
  }
}
```

Complete visit body:

```json
{
  "outcome": "FOLLOW_UP_NEEDED",
  "notes": "Customer requested another visit",
  "nextAction": "Send updated quotation"
}
```

Also test:

```http
POST {{baseUrl}}/visits
```

with `rep@intellisales.com` for an unassigned customer. It should return `403`.

Also test:

```http
PATCH {{baseUrl}}/visits/<visitId>
```

with `accountant@intellisales.com`. It should return `403`.

### Dashboard Requests

No Postman collection file is currently tracked beyond the placeholder. After Module 10 review, create a collection named `IntelliSales - Module 10 - Dashboard Summary`.

Recommended Module 10 requests:

```http
POST {{baseUrl}}/auth/login
GET {{baseUrl}}/dashboard/summary
GET {{baseUrl}}/dashboard/sales-reps
GET {{baseUrl}}/dashboard/recent-activity
GET {{baseUrl}}/dashboard/recent-activity?limit=5
```

Also test:

```http
GET {{baseUrl}}/dashboard/sales-reps
```

with `rep@intellisales.com` and `accountant@intellisales.com`. Both should return `403`.

Also test:

```http
GET {{baseUrl}}/dashboard/recent-activity?limit=0
```

It should return `400` with the standard validation error format.

### Product Recommendation Requests

No Postman collection file is currently tracked beyond the placeholder. After Module 11 review, create a collection named `IntelliSales - Module 11 - Product Recommendations`.

Recommended Module 11 requests:

```http
POST {{baseUrl}}/auth/login
GET {{baseUrl}}/recommendations/customers/<assignedCustomerId>/products
GET {{baseUrl}}/recommendations/customers/<assignedCustomerId>/products?limit=10
GET {{baseUrl}}/recommendations/customers/<assignedCustomerId>/products?includeHistory=false
GET {{baseUrl}}/recommendations/customers/<customerWithNoHistoryId>/products
GET {{baseUrl}}/recommendations/customers/<customerWithoutActivePriceListId>/products
```

Also test:

```http
GET {{baseUrl}}/recommendations/customers/<otherRepCustomerId>/products
```

with `rep@intellisales.com`. It should return `403`.

Also test:

```http
GET {{baseUrl}}/recommendations/customers/bad-id/products
GET {{baseUrl}}/recommendations/customers/<assignedCustomerId>/products?limit=21
```

Both should return `400` with the standard validation error format.

## Expected Results

- Server starts successfully
- MongoDB connects successfully
- Health check returns `200`
- Database health check returns `200` when MongoDB is connected
- Database health check returns `503` when MongoDB is disconnected
- Wrong route returns `404`
- Login returns user, access token, and refresh token
- Protected route without token returns `401`
- Admin-only route with non-admin user returns `403`
- Users management route without token returns `401`
- Users management route with non-admin token returns `403`
- Admin can list, create, update, reset password, and deactivate users
- User responses do not expose password or internal fields
- Admin, manager, and supervisor can manage customers
- Sales representative can create customers assigned to self
- Sales representative can only see assigned customers
- Accountant can read customers but cannot modify them
- Customer deletes are soft deactivations
- Customer responses do not expose sensitive populated user fields
- Admin, manager, and supervisor can manage products
- Sales representative and accountant can list active products and view the price list
- Sales representative and accountant cannot modify products
- Inactive products do not appear in read-only product lists or the price list
- Product deletes are soft deactivations
- Product responses do not expose sensitive populated user fields
- Customers include `customerType` and `paymentType`
- Product responses include both `sku` and `productCode`
- Product default currency is `SYP`
- Retail, Wholesale, and KeyAccount price lists can be seeded and read
- Sales representative and accountant can read active price lists but cannot modify them
- Draft invoices can be created from active customers and active products
- Invoice product prices come from the active customer-type price list
- Invoice responses store customer and product snapshots
- Draft invoices can be edited and totals are recalculated
- Confirming a draft invoice generates an `INV-YYYY-00001` invoice number
- Confirmed invoices cannot be edited
- Admin, manager, and supervisor can archive invoices
- Sales representative and accountant cannot archive invoices
- Sales representative can only list/get/edit/confirm own invoices
- Customer invoice listing is available at `/api/v1/customers/:id/invoices`
- Draft invoice PDF preview returns `application/pdf` and does not store official `pdfPath`
- Confirmed invoice PDF returns `application/pdf`, stores `pdfPath`, and writes a local file under `uploads/invoices`
- Existing official invoice PDF files are reused
- Missing official invoice PDF files are regenerated safely
- Archived invoice PDFs can be downloaded
- Unauthorized users cannot access invoice PDFs outside their scope
- PDF route errors use standard JSON error responses
- Company admin, sales manager, and accountant can update payment on confirmed invoices
- Sales supervisor and sales representative cannot update payment or mark invoices as sent
- Payment method is Cash only
- Partial payment updates `paidAmount` and `remainingAmount`
- Full payment sets `paymentStatus` to `PAID`
- Mark-sent sets `paymentStatus` to `SENT` for confirmed unpaid invoices
- Draft and archived invoices reject payment updates and mark-sent requests
- Customer balance sums confirmed unpaid invoices only
- Customer balance excludes draft, archived, and fully paid invoices
- Customer balance includes overdue balance and overdue invoice count
- Sales representative can view balance only for assigned customers
- Admin, manager, and supervisor can manage visits
- Sales representative can create visits only for assigned customers
- Sales representative can list and manage only own visits
- Accountant can list and get visits but cannot modify them
- Planned visits can be updated
- Completed and cancelled visits cannot be updated again
- Completing a visit sets `status`, `outcome`, and `completedAt`
- Cancelling a visit sets `status` and `cancelledAt`
- Customer visit listing is available at `/api/v1/customers/:id/visits`
- Visit responses do not expose sensitive populated user fields
- Dashboard summary is available at `/api/v1/dashboard/summary`
- Dashboard summary is role-aware for management, accountant, and sales representative users
- Sales representative dashboard summaries are available to admin, manager, and supervisor users
- Sales representative and accountant users cannot access `/api/v1/dashboard/sales-reps`
- Recent activity is available at `/api/v1/dashboard/recent-activity`
- Recent activity supports a bounded `limit` query parameter
- Dashboard responses do not expose sensitive user fields
- Product recommendations are available at `/api/v1/recommendations/customers/:customerId/products`
- Product recommendations use purchase history from confirmed invoices when available
- Product recommendations fall back to the active customer-type price list when no usable history exists
- Product recommendation prices come from the current active price list
- Draft and archived invoice items are not used for recommendation history
- Inactive products and products missing from the active price list are excluded from recommendations
- Sales representative users can get recommendations only for assigned customers
- Empty product recommendations return `200` with strategy `NO_AVAILABLE_RECOMMENDATIONS`
- Recommendation responses do not expose invoice documents or sensitive user fields
- Documentation handoff starts at `docs/00-README.md`
- Final Postman handoff files exist under `postman/`
- Success responses include `success`, `message`, and `data`
- Paginated list responses include `count`, `pagination`, and a top-level `data` array
- Error responses include `success: false`, `message`, and validation `errors` when available
- Tests pass

## Notes For Teammates

- Do not commit `.env`
- Do not commit `node_modules`
- Use `.env.example` as the environment reference
- Backend is local development only for now
- Passwords are hashed with bcrypt
- JWT secrets must stay in `.env`
- Web and Flutter apps can connect to the implemented backend APIs as modules are reviewed
- Invoice PDF generation, cash-only payment updates, simple visits management, dashboard summary APIs, and rule-based product recommendations are implemented
- Module 12 documentation and final Postman handoff files are implemented
- Online payment gateway, advanced analytics, dashboard exports, advanced route planning, GPS tracking, Module 13 final integration cleanup, and frontend apps are not part of Module 12

## Next Module Placeholder

The next module should be Module 13 final integration testing and cleanup, and it should start only after Module 12 is reviewed and all tests pass.
