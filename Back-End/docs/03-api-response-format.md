# API Response Format

The backend uses one JSON envelope for all JSON responses.

## Single Item Or Action Success

```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "customer": {
      "id": "65f000000000000000000001"
    }
  }
}
```

Common nested payload names:

- Auth: `data.user`, `data.accessToken`, `data.refreshToken`
- Users: `data.user`
- Customers: `data.customer`
- Products: `data.product`
- Price lists: `data.priceList`
- Invoices and payments: `data.invoice`
- Visits: `data.visit`
- Dashboard summary: `data.summary`
- Recommendations: `data.customer`, `data.strategy`, `data.recommendations`, `data.meta`

## Paginated List Success

```json
{
  "success": true,
  "message": "Customers fetched successfully",
  "count": 10,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  },
  "data": []
}
```

For paginated list endpoints, `data` is the array. Use `count` for returned item count and `pagination.total` for total matching documents.

## Non-Paginated List Success

```json
{
  "success": true,
  "message": "Sales representative dashboard fetched successfully",
  "count": 3,
  "data": {
    "salesReps": []
  }
}
```

Some non-paginated endpoints include `count` with a named array inside `data`.

## Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "path": "email",
      "message": "Invalid email address"
    }
  ]
}
```

## Auth And Permission Errors

Unauthorized:

```json
{
  "success": false,
  "message": "Authentication required"
}
```

Forbidden:

```json
{
  "success": false,
  "message": "Forbidden"
}
```

## PDF Route Exception

Successful invoice PDF requests return binary PDF content:

```http
Content-Type: application/pdf
```

PDF route errors still use the JSON error wrapper.

## Frontend Parsing Rules

- Check `success` first.
- Show `message` for toast/snackbar feedback.
- For list pages, read the top-level `data` array and `pagination`.
- For single resources, read the nested object under `data`.
- Never depend on `_id`, `__v`, password fields, refresh token versions, or stack traces.
