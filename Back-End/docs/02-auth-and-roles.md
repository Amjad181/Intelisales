# Auth And Roles Guide

All protected routes use JWT Bearer authentication.

```text
Authorization: Bearer <accessToken>
```

## Login

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "admin@intellisales.com",
  "password": "Password123!"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f000000000000000000001",
      "name": "Company Admin",
      "email": "admin@intellisales.com",
      "role": "COMPANY_ADMIN",
      "status": "ACTIVE"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

Frontend apps should store the access token and attach it to protected requests. Store tokens according to frontend team security practice.

## Refresh Token

```http
POST /api/v1/auth/refresh-token
```

Call this when an access token expires.

```json
{
  "refreshToken": "<refreshToken>"
}
```

Successful response returns a new `accessToken`, `refreshToken`, and safe `user` object.

## Logout

```http
POST /api/v1/auth/logout
```

Requires the current access token. The backend increments the refresh token version so old refresh tokens become invalid.

## Current User

```http
GET /api/v1/auth/me
```

Returns the safe user object for the current token.

## Roles

| Role | Main Use |
| --- | --- |
| COMPANY_ADMIN | Full local demo administration |
| SALES_MANAGER | Sales management and most operations |
| SALES_SUPERVISOR | Sales supervision and most operations |
| SALES_REPRESENTATIVE | Mobile sales workflow for assigned customers |
| ACCOUNTANT | Read financial/customer data and update payments |

## Seed Demo Users

All demo users use `Password123!`.

| Email | Role |
| --- | --- |
| `admin@intellisales.com` | COMPANY_ADMIN |
| `manager@intellisales.com` | SALES_MANAGER |
| `supervisor@intellisales.com` | SALES_SUPERVISOR |
| `rep@intellisales.com` | SALES_REPRESENTATIVE |
| `accountant@intellisales.com` | ACCOUNTANT |

## Role Access Summary

| Module | Admin | Manager | Supervisor | Sales Rep | Accountant |
| --- | --- | --- | --- | --- | --- |
| Auth self routes | Yes | Yes | Yes | Yes | Yes |
| Users management | Yes | No | No | No | No |
| Customers | Manage all | Manage all | Manage all | Assigned customers only | Read all |
| Products | Manage | Manage | Manage | Read active | Read active |
| Price lists | Manage | Manage | Manage | Read active | Read active |
| Invoices | Read/create/edit/confirm/archive | Read/create/edit/confirm/archive | Read/create/edit/confirm/archive | Own create/edit/confirm/read | Read |
| Invoice PDF | Read allowed invoices | Read allowed invoices | Read allowed invoices | Own invoice scope | Read allowed invoices |
| Payments | Update/mark sent | Update/mark sent | No | No | Update/mark sent |
| Customer balance | Read all | Read all | Read all | Assigned customers only | Read all |
| Visits | Manage all | Manage all | Manage all | Own assigned workflow | Read |
| Dashboard | Global | Global | Global | Own scope | Global read-only |
| Recommendations | Any customer | Any customer | Any customer | Assigned customers only | Any customer |

Public responses must never expose `password`, `passwordHash`, `refreshTokenVersion`, `__v`, raw token internals, stack traces, or raw `_id` when `id` is already used.
