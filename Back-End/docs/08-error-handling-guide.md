# Error Handling Guide

All JSON errors use the unified wrapper:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

`errors` is included for validation details when available.

## Common Status Codes

| Status | Meaning | Frontend Handling |
| --- | --- | --- |
| 200 | Success | Read `data` |
| 201 | Created | Read `data` and store created id if needed |
| 400 | Bad request or validation failure | Show `message`; map `errors[]` to form fields |
| 401 | Missing/invalid token | Refresh token or redirect to login |
| 403 | Authenticated but not allowed | Show permission message |
| 404 | Resource or route not found | Show missing state |
| 409 | Conflict such as duplicate email/SKU | Show conflict message |
| 500 | Server error | Show generic retry message |

## Examples

Validation:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "path": "body.email",
      "message": "Invalid email address"
    }
  ]
}
```

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

Not found:

```json
{
  "success": false,
  "message": "Customer not found"
}
```

## PDF Errors

Successful invoice PDF responses are binary `application/pdf`. If the PDF route fails, the error response is JSON with the same error wrapper.

## Security Notes

Responses must not expose:

- `password`
- `passwordHash`
- `refreshTokenVersion`
- `__v`
- raw token internals
- stack traces
- raw `_id` when `id` is already available
