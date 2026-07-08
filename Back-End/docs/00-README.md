# IntelliSales API Documentation

This folder is the frontend handoff package for the IntelliSales backend. It documents the local REST API that the web frontend and Flutter mobile app can use for the current MVP.

## Backend Overview

- Backend: Node.js 20 + Express.js
- Database: MongoDB + Mongoose
- Auth: JWT access tokens and refresh tokens
- API style: REST API
- Testing: Jest + Supertest
- Current deployment target: local development only

Base API URL:

```text
http://localhost:5000/api/v1
```

## Documentation Index

| File | Purpose |
| --- | --- |
| [01-local-setup.md](01-local-setup.md) | Run the backend locally and connect from web/mobile devices |
| [02-auth-and-roles.md](02-auth-and-roles.md) | Login, tokens, seed users, and role access |
| [03-api-response-format.md](03-api-response-format.md) | Unified JSON response format and PDF exception |
| [04-web-frontend-api-guide.md](04-web-frontend-api-guide.md) | Practical guide for the web frontend team |
| [05-flutter-mobile-api-guide.md](05-flutter-mobile-api-guide.md) | Practical guide for the Flutter/mobile team |
| [06-demo-flow-guide.md](06-demo-flow-guide.md) | Step-by-step final demo script |
| [07-endpoints-reference.md](07-endpoints-reference.md) | Complete current endpoint reference |
| [08-error-handling-guide.md](08-error-handling-guide.md) | HTTP status codes and frontend error handling |
| [09-postman-guide.md](09-postman-guide.md) | Import and run the final Postman handoff collection |
| [10-frontend-field-mapping.md](10-frontend-field-mapping.md) | Form/table field mapping for frontend screens |
| [11-module-status.md](11-module-status.md) | Module completion status and pending next module |

## Quick Start For Frontend Colleagues

1. Install Node.js 20+, npm, MongoDB, and Postman.
2. Create `.env` from `.env.example`.
3. Run `npm install`.
4. Start MongoDB locally.
5. Run seed scripts:

```bash
npm run seed:users
npm run seed:products
npm run seed:price-lists
```

6. Start the backend:

```bash
npm run dev
```

7. Open `http://localhost:5000/api/v1/health`.
8. Import the Postman files from [../postman](../postman).

## Demo Seed Users

All demo users use this password:

```text
Password123!
```

| Email | Role |
| --- | --- |
| `admin@intellisales.com` | COMPANY_ADMIN |
| `manager@intellisales.com` | SALES_MANAGER |
| `supervisor@intellisales.com` | SALES_SUPERVISOR |
| `rep@intellisales.com` | SALES_REPRESENTATIVE |
| `accountant@intellisales.com` | ACCOUNTANT |

## Current Module Note

Module 12 is documentation and final Postman handoff only. It does not add backend behavior. Module 13 final integration cleanup is still pending.
