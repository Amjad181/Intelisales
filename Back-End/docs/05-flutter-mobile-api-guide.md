# Flutter Mobile API Guide

The primary mobile workflow is for `SALES_REPRESENTATIVE` users.

## Base URLs

| Target | Base URL |
| --- | --- |
| Android emulator on same computer | `http://10.0.2.2:5000/api/v1` |
| iOS simulator on same Mac | `http://localhost:5000/api/v1` |
| Physical phone on same Wi-Fi | `http://<BACKEND_LAPTOP_LAN_IP>:5000/api/v1` |

For physical phones, the backend must run with `HOST=0.0.0.0`, and the phone must be on the same Wi-Fi network.

## Mobile Auth Flow

1. Login with `POST /auth/login`.
2. Store tokens securely according to the Flutter team practice.
3. Send `Authorization: Bearer <accessToken>` on protected requests.
4. If a request returns `401`, call `POST /auth/refresh-token`.
5. Call `POST /auth/logout` when the user signs out.

## Sales Representative Flow

1. `GET /auth/me`
2. `GET /customers` to list assigned customers.
3. `GET /customers/:id` to show customer detail.
4. `GET /recommendations/customers/:customerId/products` for suggested products.
5. `GET /price-lists/customer-type/:customerType` or `GET /products/price-list` to populate product selectors.
6. `POST /invoices` to create a draft invoice.
7. `PATCH /invoices/:id/confirm` to confirm it.
8. `GET /invoices/:id/pdf` to open/share the PDF.
9. `POST /visits` to create a visit.
10. `PATCH /visits/:id/complete` to complete a visit.

Sales representatives can access only assigned customers and their own sales workflow data.

## Invoice PDF In Flutter

Request PDF bytes from:

```http
GET /api/v1/invoices/:id/pdf
```

Use the mobile team's PDF/share package to open or share the bytes. Errors still return JSON.

## Voice Note

Voice processing is not a backend module. The mobile app may convert voice to text offline or in the frontend and then send supported text fields such as `voiceText` with `source: "VOICE_TEXT"` for invoices.

## Common Error Handling

| Status | Mobile Handling |
| --- | --- |
| 400 | Show validation message and field errors |
| 401 | Refresh token or return to login |
| 403 | Show "not allowed" message |
| 404 | Show missing item state |
| 500 | Show generic retry message |

Use `response.message` for user feedback when the response is JSON.

## Mobile Field Notes

- Customer list cards: `name`, `contactName`, `phone`, `customerType`, `paymentType`, `status`.
- Product selector: `productCode`, `name`, `unit`, `price`, `currency`.
- Recommendations: `product.name`, `product.productCode`, `product.unit`, `price`, `currency`, `reason`.
- Invoice draft item input: `productId`, `quantity`.
- Visit form: `customer`, `visitDate`, `purpose`, `notes`, `location`.
