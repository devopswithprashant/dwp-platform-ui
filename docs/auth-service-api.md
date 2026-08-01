# Auth Service API

## Base URL
`http://localhost:8081`

## POST /api/v1/auth/register
Registers a new user.

Request:
```json
{
  "username":"prashant",
  "email":"prashant@example.com",
  "password":"Password@123"
}
```

Success: **201 Created**

Errors:
- AUTH-001 Username already exists
- AUTH-002 Email already exists

---

## POST /api/v1/auth/login

Request:
```json
{
  "identifier":"prashant",
  "password":"Password@123"
}
```

Success: **200 OK**

Returns JWT access token.

---

## GET /api/v1/auth/me

Header:
`Authorization: Bearer <access_token>`

Returns authenticated user profile.

Success: **200 OK**

Unauthorized:
- Missing token -> 401
- Invalid token -> 401
