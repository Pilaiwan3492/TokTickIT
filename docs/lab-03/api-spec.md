# Lab 3 API Specification: TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens

## 1. Purpose

This document defines the authoritative REST API contract for TokTickIT Lab 3.

Lab 3 replaces the temporary Development Requester selector with real authentication, session management, and server-side role-based authorization across three roles:
- **Requester**: Authenticated users who create and manage their own tickets, attachments, and public comments.
- **IT Staff**: Support staff who manage tickets in the shared IT queue, claim/reassign tickets, set IT Priority, update workflow status, post public comments, and record internal notes.
- **Administrator**: System administrators who manage user accounts, assign roles, activate/deactivate users, and issue initial passwords under strict safety rules. As defined in the approved Authorization Matrix (`docs/lab-03/specification.md`), Administrators are also authorized to perform IT Staff ticket operations.

---

## 2. API Conventions & Authentication Decision

### 2.1 Base URL
All endpoints are versioned under:
```
/api/v1
```
(For backward compatibility with Lab 2 clients, `/api/` routing aliases also resolve directly to `/api/v1/`).

### 2.2 Canonical Authentication Architecture
- **Mechanism**: JSON Web Token (JWT) transmitted via the standard HTTP `Authorization` header:
  ```
  Authorization: Bearer <jwt_token>
  ```
- **Signing Algorithm**: HMAC-SHA256 (HS256) signed using a server-side secret (`JWT_SECRET`, minimum 32 characters, never exposed to client code or committed to git).
- **Token Payload**:
  ```json
  {
    "jti": "550e8400-e29b-41d4-a716-446655440000",
    "sub": "usr-uuid-001",
    "email": "user@toktickit.com",
    "name": "Jennifer Anderson",
    "role": "REQUESTER",
    "mustChangePassword": false,
    "iat": 1789234800,
    "exp": 1789263600
  }
  ```
- **Token Lifecycle & Expiration**: 8 hours from issuance. Refresh tokens and sliding sessions are explicitly excluded in Lab 3. When a token expires, the client receives `401 Unauthorized` (`SESSION_EXPIRED`) and redirects to `/login`.
- **Client Storage**: Managed in client-side React `AuthContext` with persistence to `localStorage` (`toktickit_auth_token`) to preserve session across page refreshes during local testing.
- **Server-Side Logout Invalidation**:
  When `POST /api/v1/auth/logout` is invoked, the server validates the Bearer token, extracts the unique token identifier (`jti`), and registers it into a server-side revoked token store with TTL matching the token's remaining lifetime. Any subsequent request presenting a revoked `jti` is immediately rejected by `requireAuth` middleware with `401 Unauthorized` (`code: "SESSION_REVOKED"`). The client simultaneously purges the token from `localStorage`.
- **Token Security Guardrails**:
  1. Tokens are never exposed in UI markup, rendered into the DOM, or displayed to end users.
  2. Tokens are never logged to console or included in server access logs.
  3. Tokens are never transmitted to third-party endpoints or untrusted external origins.
  4. Authentication secrets (`JWT_SECRET`) are strictly maintained in `.env` and kept out of version control.
  5. Server error responses never leak tokens or cryptographic material.
- **CSRF Defense**: Because Bearer tokens are stored in application memory/localStorage and explicitly injected into request headers rather than automatically attached by web browsers (unlike cookies), Cross-Site Request Forgery (CSRF) is prevented by architecture.

### 2.3 Middleware Guards & Enforcement
- **Authentication Guard (`requireAuth`)**: Unauthenticated requests to protected endpoints return `401 Unauthorized`. Verifies token signature, expiration, active account status, and asserts that `jti` has not been revoked.
- **Authorization Guard (`requireRole([...])`)**: Authenticated requests lacking the required role per the Authorization Matrix return `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`).
- **First-Login Gating (`requirePasswordChanged`)**: If the user has `mustChangePassword: true`, all operational endpoints return `403 Forbidden` with error code `PASSWORD_CHANGE_REQUIRED`, allowing access exclusively to `/api/v1/auth/change-password` and `/api/v1/auth/me`.

### 2.4 Standard Response Format
Single resource response:
```json
{
  "data": {}
}
```

Collection response with pagination:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Standard error response:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description of error.",
    "details": []
  }
}
```

---

## 3. Authentication Endpoints

### 3.1 Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "user@toktickit.com",
  "password": "Password123!"
}
```
- **Response 200 OK**:
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-uuid-001",
      "email": "user@toktickit.com",
      "name": "Jennifer Anderson",
      "role": "REQUESTER",
      "isActive": true,
      "mustChangePassword": false
    }
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing email or password (`code: "VALIDATION_ERROR"`).
  - `401 Unauthorized` (Invalid credentials):
    ```json
    {
      "error": {
        "code": "INVALID_CREDENTIALS",
        "message": "Invalid email or password. Please try again."
      }
    }
    ```
  - `401 Unauthorized` (Inactive account):
    ```json
    {
      "error": {
        "code": "ACCOUNT_INACTIVE",
        "message": "Your account is currently inactive. Please contact an administrator."
      }
    }
    ```
  *(Note: Neither error exposes whether an email address exists in the system).*

### 3.2 Logout (Server-Side Invalidation)
- **Endpoint**: `POST /api/v1/auth/logout`
- **Access**: Authenticated
- **Headers**:
  ```
  Authorization: Bearer <jwt_token>
  ```
- **Behavior**:
  Extracts `jti` from Bearer token, stores it in server-side revoked tokens registry, and invalidates the session. Any subsequent request with this token will be rejected with `401 Unauthorized` (`SESSION_REVOKED`).
- **Response 200 OK**:
```json
{
  "data": {
    "message": "Logged out successfully. Token invalidated on server."
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Missing, invalid, or already revoked token (`SESSION_REVOKED` / `SESSION_EXPIRED`).

### 3.3 Current User Profile
- **Endpoint**: `GET /api/v1/auth/me`
- **Access**: Authenticated
- **Response 200 OK**:
```json
{
  "data": {
    "id": "usr-uuid-001",
    "email": "user@toktickit.com",
    "name": "Jennifer Anderson",
    "role": "REQUESTER",
    "isActive": true,
    "mustChangePassword": false
  }
}
```

### 3.4 Change Password (Mandatory / Self-Service)
- **Endpoint**: `POST /api/v1/auth/change-password`
- **Access**: Authenticated (Permitted even when `mustChangePassword: true`)
- **Request Body**:
```json
{
  "currentPassword": "TempPassword123!",
  "newPassword": "NewSecurePassword456!",
  "confirmPassword": "NewSecurePassword456!"
}
```
- **Validation**:
  - `newPassword` must be $\ge 8$ characters with uppercase, lowercase, and digit/symbol.
  - `newPassword` must equal `confirmPassword`.
  - `newPassword` cannot equal `currentPassword`.
- **Response 200 OK**:
```json
{
  "data": {
    "message": "Password changed successfully.",
    "user": {
      "id": "usr-uuid-001",
      "email": "user@toktickit.com",
      "name": "Jennifer Anderson",
      "role": "REQUESTER",
      "isActive": true,
      "mustChangePassword": false
    }
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Password complexity failure or confirmation mismatch.
  - `401 Unauthorized`: Current password incorrect.

---

## 4. Requester Ticket Continuation & Regression

All Lab 2 endpoints derive Requester identity directly from the authenticated session token (BR-03). Client-supplied `requesterId` headers or parameters are ignored.

### 4.1 List My Tickets
- **Endpoint**: `GET /api/v1/tickets`
- **Access**: Requester only (scoped to owned tickets)
- **Query Parameters**: `search`, `category`, `status`, `priority`, `sortBy`, `sortOrder`, `page`, `pageSize`.
- **Response 200 OK**: Paginated list of tickets owned by the authenticated requester.

### 4.2 Create Ticket
- **Endpoint**: `POST /api/v1/tickets`
- **Access**: Requester
- **Request Body**:
```json
{
  "categoryId": "cat-hardware",
  "relatedSystemId": "sys-laptop",
  "summary": "Laptop battery draining quickly",
  "description": "Battery depletes in 30 minutes after update.",
  "requestedPriority": "MEDIUM"
}
```
- **Behavior**:
  - `requesterId` set to authenticated user's ID.
  - `status` initialized to `NEW`.
  - `itPriority` initialized to copy `requestedPriority`.
  - `ownerId` initialized to `null`.
- **Response 201 Created**: Returns created ticket entity with generated `ticketNo`.

### 4.3 Ticket Detail (Requester View)
- **Endpoint**: `GET /api/v1/tickets/:id`
- **Access**: Requester (Ticket owner only; 403/404 if accessed by other Requesters).
- **Response 200 OK**: Ticket details with category, related system, attachments, and public comments. Does **not** include internal notes.

### 4.4 Mark Problem Appears Resolved
- **Endpoint**: `POST /api/v1/tickets/:id/resolve-indicator`
- **Access**: Requester (Ticket owner only)
- **Request Body**:
```json
{
  "isRequesterResolved": true
}
```
- **Behavior**: Sets `isRequesterResolved: true`. Does **not** change formal `status` to `RESOLVED` or `CLOSED` (BR-05, BR-11).
- **Response 200 OK**:
```json
{
  "data": {
    "ticketId": "tkt-uuid-001",
    "isRequesterResolved": true,
    "message": "Problem resolution indicated successfully."
  }
}
```

### 4.5 Attachment Operations
- `POST /api/v1/tickets/:id/attachments` (Upload: max 5 files, 5MB, JPG/PNG/WEBP/PDF)
- `GET /api/v1/tickets/:id/attachments/:attachmentId/download` (Download active file)
- `DELETE /api/v1/tickets/:id/attachments/:attachmentId` (Soft removal with reason)
*All attachment operations verify requester ownership of parent ticket.*

---

## 5. Comments & Internal Notes Endpoints

### 5.1 Public Comments
- **Retrieve**: `GET /api/v1/tickets/:id/comments`
  - **Access**: Requester (owner only), IT Staff, Administrator.
  - **Response 200 OK**:
  ```json
  {
    "data": [
      {
        "id": "cmt-001",
        "ticketId": "tkt-001",
        "content": "Thank you for the update. Please let me know if you need any additional info.",
        "author": {
          "id": "usr-001",
          "name": "Jennifer Anderson",
          "role": "REQUESTER"
        },
        "createdAt": "2026-09-13T08:30:00.000Z"
      }
    ]
  }
  ```
- **Create**: `POST /api/v1/tickets/:id/comments`
  - **Access**: Requester (owner only), IT Staff, Administrator.
  - **Request Body**:
  ```json
  {
    "content": "We have ordered a replacement battery for your laptop."
  }
  ```
  - **Response 201 Created**: Returns created comment entity.

### 5.2 Internal Notes
- **Retrieve**: `GET /api/v1/tickets/:id/notes`
  - **Access**: IT Staff, Administrator only. (Requesters receive `403 Forbidden` without revealing note presence).
  - **Response 200 OK**:
  ```json
  {
    "data": [
      {
        "id": "note-001",
        "ticketId": "tkt-001",
        "content": "Battery diagnostic showed cycle count 1,200. Covered under enterprise warranty.",
        "author": {
          "id": "usr-002",
          "name": "Michael Brown",
          "role": "IT_STAFF"
        },
        "createdAt": "2026-09-13T09:00:00.000Z"
      }
    ]
  }
  ```
- **Create**: `POST /api/v1/tickets/:id/notes`
  - **Access**: IT Staff, Administrator only.
  - **Request Body**:
  ```json
  {
    "content": "Vendor contacted, RMA #98231 approved."
  }
  ```
  - **Response 201 Created**: Returns created note entity.

---

## 6. IT Staff Ticket Operations Endpoints

### 6.1 IT Staff Ticket Queue
- **Endpoint**: `GET /api/v1/staff/tickets`
- **Access**: IT Staff, Administrator
- **Query Parameters**:
  - `search`: String (matches ticketNo, summary, or requester name)
  - `status`: String (comma-separated statuses e.g. `NEW,OPEN,IN_PROGRESS`)
  - `priority`: String (matches `itPriority` or `requestedPriority`)
  - `ownership`: Enum: `ALL` (default), `UNASSIGNED`, `ASSIGNED_TO_ME`
  - `sortBy`: `ticketNo`, `createdAt`, `summary`, `itPriority`, `status`, `owner` (default: `createdAt`)
  - `sortOrder`: `asc`, `desc` (default: `desc`, with secondary deterministic sort by `id` desc)
  - `page`: Integer ($\ge 1$, default: 1)
  - `pageSize`: Integer (1–100, default: 10)
- **Response 200 OK**:
```json
{
  "data": [
    {
      "id": "tkt-uuid-001",
      "ticketNo": "TKT-2026-001234",
      "summary": "Laptop battery drains quickly",
      "category": { "id": "cat-01", "name": "Hardware" },
      "requestedPriority": "MEDIUM",
      "itPriority": "MEDIUM",
      "status": "IN_PROGRESS",
      "isRequesterResolved": false,
      "requester": { "id": "usr-001", "name": "Jennifer Anderson", "email": "jennifer@toktickit.com" },
      "owner": { "id": "usr-002", "name": "Michael Brown", "role": "IT_STAFF" },
      "createdAt": "2026-09-13T08:00:00.000Z",
      "updatedAt": "2026-09-13T09:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 67,
    "totalPages": 7,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 6.2 IT Staff Ticket Detail
- **Endpoint**: `GET /api/v1/staff/tickets/:id`
- **Access**: IT Staff, Administrator
- **Response 200 OK**: Complete ticket details including requester info, category, related system, attachments, public comments, and internal notes.

### 6.3 Claim or Reassign Ticket Ownership
- **Endpoint**: `PATCH /api/v1/staff/tickets/:id/assignment`
- **Access**: IT Staff, Administrator
- **Request Body**:
```json
{
  "ownerId": "usr-002"
}
```
*(Passing `ownerId: "me"` claims the ticket for the authenticated caller. Passing `null` unassigns the ticket).*
- **Validation**:
  - Assigned user must be active and have role `IT_STAFF` or `ADMIN`.
- **Response 200 OK**: Returns updated ticket with new owner details.

### 6.4 Update IT Priority
- **Endpoint**: `PATCH /api/v1/staff/tickets/:id/priority`
- **Access**: IT Staff, Administrator
- **Request Body**:
```json
{
  "itPriority": "HIGH"
}
```
- **Validation**: Must be valid Priority enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- **Response 200 OK**: Returns updated ticket showing modified `itPriority` while `requestedPriority` remains intact.

### 6.5 Transition Ticket Status
- **Endpoint**: `PATCH /api/v1/staff/tickets/:id/status`
- **Access**: IT Staff, Administrator
- **Request Body**:
```json
{
  "status": "IN_PROGRESS"
}
```
- **Validation**:
  - Transition must strictly conform to the Transition Matrix (BR-16).
  - Transitioning to invalid status returns `400 Bad Request` with code `INVALID_STATUS_TRANSITION`.
- **Response 200 OK**: Returns updated ticket with new status.

---

## 7. Administrator User Management Endpoints

### 7.1 List Users
- **Endpoint**: `GET /api/v1/admin/users`
- **Access**: Administrator only (Non-admins receive `403 Forbidden`)
- **Query Parameters**:
  - `search`: String (matches name or email)
  - `role`: Enum: `REQUESTER`, `IT_STAFF`, `ADMIN`
- **Response 200 OK**:
```json
{
  "data": [
    {
      "id": "usr-001",
      "name": "Jennifer Anderson",
      "email": "jennifer@toktickit.com",
      "role": "REQUESTER",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-08-01T10:00:00.000Z"
    },
    {
      "id": "usr-002",
      "name": "Michael Brown",
      "email": "michael@toktickit.com",
      "role": "IT_STAFF",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-08-01T10:00:00.000Z"
    }
  ]
}
```

### 7.2 Create User
- **Endpoint**: `POST /api/v1/admin/users`
- **Access**: Administrator only
- **Request Body**:
```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "IT_STAFF",
  "isActive": true,
  "initialPassword": "InitialPassword123!"
}
```
- **Validation & Business Rules**:
  - Email must be valid and unique (BR-20). If duplicate, returns `409 Conflict`.
  - Role must be one of `REQUESTER`, `IT_STAFF`, `ADMIN` (BR-04).
  - `initialPassword` must satisfy password policy (BR-06) and is hashed before storage.
  - Automatically flags `mustChangePassword: true` (BR-23).
- **Response 201 Created**: Returns created user (excluding password hash).

### 7.3 Edit User
- **Endpoint**: `PATCH /api/v1/admin/users/:id`
- **Access**: Administrator only
- **Request Body**:
```json
{
  "name": "Alex Thompson",
  "email": "alex.t@toktickit.com",
  "role": "IT_STAFF",
  "isActive": false
}
```
- **Safety Validations**:
  - Duplicate email check returns `409 Conflict`.
  - **Self-deactivation guard**: Administrator cannot set `isActive: false` on their own ID (BR-21). Returns `400 Bad Request` (`CANNOT_DEACTIVATE_SELF`).
  - **Last active admin guard**: Administrator cannot deactivate or change role of the last active Administrator (BR-22). Returns `400 Bad Request` (`LAST_ACTIVE_ADMIN_PROTECTED`).
- **Response 200 OK**: Returns updated user entity.

### 7.4 Reset / Issue New Initial Password
- **Endpoint**: `POST /api/v1/admin/users/:id/reset-password`
- **Access**: Administrator only
- **Request Body**:
```json
{
  "newInitialPassword": "NewTempPassword123!"
}
```
- **Behavior**: Hashes new password, sets `mustChangePassword: true`.
- **Response 200 OK**:
```json
{
  "data": {
    "message": "Initial password reset successfully. User must change password upon next login."
  }
}
```

---

## 8. Safe Errors & Status Codes Reference

| HTTP Status | Error Code | Safe Error Message | Scenario |
| :--- | :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_ERROR` | `"Validation error occurred."` | Missing required fields, invalid lengths, or malformed data. |
| `400 Bad Request` | `INVALID_STATUS_TRANSITION` | `"Status transition not permitted from current status."` | Status change violates transition matrix (BR-16). |
| `400 Bad Request` | `CANNOT_DEACTIVATE_SELF` | `"You cannot deactivate your own administrator account."` | Administrator attempting self-deactivation (BR-21). |
| `400 Bad Request` | `LAST_ACTIVE_ADMIN_PROTECTED` | `"System must have at least one active administrator."` | Attempting to deactivate or reassign last active admin (BR-22). |
| `401 Unauthorized` | `INVALID_CREDENTIALS` | `"Invalid email or password. Please try again."` | Invalid email or incorrect password. |
| `401 Unauthorized` | `ACCOUNT_INACTIVE` | `"Your account is currently inactive. Please contact an administrator."` | Valid credentials supplied for inactive account (`isActive: false`). |
| `401 Unauthorized` | `SESSION_EXPIRED` | `"Your session has expired. Please sign in again."` | Token signature is valid but expiration timestamp (`exp`) has passed. |
| `401 Unauthorized` | `SESSION_INVALID` | `"Authentication token is invalid or corrupted."` | Forged token, invalid signature, corrupted payload, or signed with wrong secret. |
| `401 Unauthorized` | `SESSION_REVOKED` | `"Your session has been revoked. Please sign in again."` | Request presenting a token revoked via server-side logout or deactivation. |
| `403 Forbidden` | `PASSWORD_CHANGE_REQUIRED` | `"You must change your password before continuing."` | User with `mustChangePassword: true` invoking business APIs. |
| `403 Forbidden` | `INSUFFICIENT_PERMISSIONS` | `"You do not have permission to perform this action."` | Role mismatch or requester accessing staff/admin endpoints. |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | `"The requested resource was not found."` | Ticket, user, or attachment not found (or cross-requester protection). |
| `409 Conflict` | `DUPLICATE_EMAIL` | `"An account with this email address already exists."` | Email uniqueness violation during create/edit (BR-20). |
| `500 Internal Server Error` | `SERVER_ERROR` | `"An unexpected error occurred. Please try again later."` | Unhandled server error (no internal stack trace leaked). |
