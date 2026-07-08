# Postman Guide

The final handoff Postman files are in [../postman](../postman).

Required files:

- `IntelliSales_Final_API_Postman_Collection.json`
- `IntelliSales_Local_Environment.json`

## Import

1. Open Postman.
2. Import `postman/IntelliSales_Final_API_Postman_Collection.json`.
3. Import `postman/IntelliSales_Local_Environment.json`.
4. Select environment `IntelliSales - Local API Environment`.

## Before Running

Start MongoDB, seed data, and run the backend:

```bash
npm run seed:users
npm run seed:products
npm run seed:price-lists
npm run dev
```

After code changes, stop the backend with `Ctrl+C` and restart `npm run dev`.

## Environment Variables

The environment includes:

- `baseUrl`
- Seed demo emails
- `seedPassword`
- Access tokens for each role
- Demo ids created during collection runs

Auth requests store role tokens automatically. Create requests store created ids for later requests where practical.

## Collection Folders

- `00 - Health`
- `01 - Auth and Tokens`
- `02 - Users Management`
- `03 - Customers`
- `04 - Products`
- `05 - Price Lists`
- `06 - Invoices Core`
- `07 - Invoice PDF`
- `08 - Payments and Customer Balance`
- `09 - Visits`
- `10 - Dashboard`
- `11 - Recommendations`
- `12 - Full Demo Flow`

## Test Expectations

- JSON success requests check status, `success: true`, `message`, and data shape.
- JSON error requests check status, `success: false`, and `message`.
- List requests check that `data` is an array and that pagination exists where expected.
- PDF success checks status `200` and `Content-Type: application/pdf`.
- Sensitive fields are checked where practical.

The collection avoids brittle assertions against exact totals because local data may vary after manual testing.
