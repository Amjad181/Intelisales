# Demo Flow Guide

This is a suggested script for a final video or live demo.

## Before The Demo

1. Start MongoDB.
2. Create `.env` from `.env.example`.
3. Install dependencies:

```bash
npm install
```

4. Seed demo data:

```bash
npm run seed:users
npm run seed:products
npm run seed:price-lists
```

5. Start the backend:

```bash
npm run dev
```

6. Import the final Postman collection and environment from `postman/`.

## Suggested Demo Script

1. Call `GET /health` and `GET /health/db`.
2. Login as admin.
3. Show `GET /dashboard/summary`.
4. Review users with `GET /users`.
5. Create or review customers.
6. Create or review products.
7. Create or review price lists by `customerType`.
8. Login as sales representative.
9. List assigned customers with `GET /customers`.
10. Get product recommendations for an assigned customer.
11. Create a draft invoice with `POST /invoices`.
12. Confirm the invoice with `PATCH /invoices/:id/confirm`.
13. Download the invoice PDF with `GET /invoices/:id/pdf`.
14. Create a visit with `POST /visits`.
15. Complete the visit with `PATCH /visits/:id/complete`.
16. Login as accountant or admin.
17. Mark the invoice sent with `PATCH /invoices/:id/mark-sent`.
18. Update payment with `PATCH /invoices/:id/payment`.
19. Check customer balance with `GET /customers/:id/balance`.
20. Return to `GET /dashboard/summary`.

## Negative Checks

- Call a protected route without token and expect `401`.
- Call a management route as sales rep and expect `403`.
- Request recommendations for another rep's customer as sales rep and expect `403`.
- Send an invalid id and expect `400` validation error.

## Demo Notes

- Keep MongoDB and backend terminal visible when useful.
- Restart `npm run dev` after code changes.
- Use unique names in create requests if rerunning the demo.
- Empty recommendations are valid if no active price list or active product is available.
