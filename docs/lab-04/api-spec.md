# Lab 4 API Specification: TokTickIT REST API Contract

## 1. Overview & Conventions

This document defines the canonical REST API specification for TokTickIT Lab 4.

Lab 4 adds operational Work Execution (**Actions Taken**), complete **Ticket Status Lifecycle & Resolution Workflow**, and **Role-Tailored Dashboards** with authoritative backend metrics calculation.

### 1.1 Base URL & Routing
All primary API endpoints are mounted under:
```
/api/v1
```
In alignment with the established project routing architecture (`server/src/app.ts`), where `/api/v1/tickets`, `/api/v1/attachments`, `/api/v1/auth`, `/api/v1/staff`, and `/api/v1/admin` serve as canonical routes, while legacy `/api/` routing aliases continue to be preserved for backward compatibility. New Lab 4 endpoints strictly follow this established convention.

### 1.2 Authentication & Headers
All requests to protected endpoints must include the standard Bearer token header:
```http
Authorization: Bearer <jwt_token>
```
The token payload contains `sub` (User ID), `role` (`REQUESTER`, `IT_STAFF`, `ADMIN`), and `mustChangePassword`.

### 1.3 Standard JSON Response Envelopes

#### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation message"
}
```

#### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable description of error",
    "details": {}
  }
}
```

---

## 2. Actions Taken Endpoints

### 2.1 Get Actions Taken for a Ticket
Retrieve all Actions Taken entries recorded under a ticket, chronologically sorted by `actionDate ASC`.

- **Method**: `GET`
- **Path**: `/api/v1/tickets/:id/actions-taken`
- **Authorized Roles**:
  - `REQUESTER`: Permitted ONLY if the ticket is owned by the authenticated Requester. (Returns `403 FORBIDDEN` if accessing another user's ticket).
  - `IT_STAFF`: Permitted for all accessible tickets.
  - `ADMIN`: Permitted for all accessible tickets.

#### Request Headers
```http
Authorization: Bearer <jwt_token>
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "ticketId": "tkt-cuid-001",
    "ticketNumber": "TKT-2026-00034",
    "actionsTaken": [
      {
        "id": "act-cuid-101",
        "ticketId": "tkt-cuid-001",
        "actionDate": "2026-05-12T10:30:00.000Z",
        "actionDescription": "Ran hardware battery diagnostics via Dell Command suite.",
        "result": "Battery cell failure detected (health at 32%).",
        "performedBy": {
          "id": "usr-staff-01",
          "name": "Michael Scott",
          "email": "michael.staff@toktickit.com",
          "role": "IT_STAFF"
        },
        "followUpRequired": true,
        "followUpNote": "Ordered replacement OEM battery from procurement vendor.",
        "attachmentNotes": "battery_diagnostic_log.txt",
        "createdAt": "2026-05-12T10:35:00.000Z",
        "updatedAt": "2026-05-12T10:35:00.000Z"
      }
    ]
  }
}
```

#### Error Responses
- `401 Unauthorized` (`UNAUTHORIZED`): Missing or invalid Bearer token.
- `403 Forbidden` (`FORBIDDEN`): Authenticated Requester does not own this ticket.
- `404 Not Found` (`TICKET_NOT_FOUND`): Specified ticket does not exist.

---

### 2.2 Create Action Taken
Record a new operational action under a ticket.

- **Method**: `POST`
- **Path**: `/api/v1/tickets/:id/actions-taken`
- **Authorized Roles**: `IT_STAFF`, `ADMIN` (Requesters return `403 FORBIDDEN`).
- **Audit Rule**: The `performedBy` attribute is automatically bound to the authenticated user from the Bearer token. Clients cannot supply an arbitrary performer.

#### Request Body
```json
{
  "actionDate": "2026-05-13T14:15:00.000Z",
  "actionDescription": "Replaced battery pack and restored CMOS configuration.",
  "result": "Diagnostic passed. Battery health 100%.",
  "followUpRequired": true,
  "followUpNote": "Advised user to calibrate battery with one full charge cycle.",
  "attachmentNotes": "serial_number_sticker.jpg",
  "expectedTicketUpdatedAt": "2026-05-12T10:35:00.000Z"
}
```

#### Field Specifications:
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `actionDate` | ISO DateTime | Optional | Timestamp of work execution (defaults to server `now()`) |
| `actionDescription` | String | Yes | Non-empty description of work performed (min 1 char) |
| `result` | String | Yes | Non-empty description of outcome (min 1 char) |
| `followUpRequired` | Boolean | Optional | Defaults to `false` |
| `followUpNote` | String | Conditional| **Mandatory** non-empty string when `followUpRequired = true` |
| `attachmentNotes` | String | Optional | Description of relevant attachments or files |
| `expectedTicketUpdatedAt` | ISO DateTime | **Required** | Resource timestamp for optimistic locking against concurrent ticket modifications (BR-17) |

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "act-cuid-102",
    "ticketId": "tkt-cuid-001",
    "actionDate": "2026-05-13T14:15:00.000Z",
    "actionDescription": "Replaced battery pack and restored CMOS configuration.",
    "result": "Diagnostic passed. Battery health 100%.",
    "performedBy": {
      "id": "usr-staff-02",
      "name": "Sarah Connor",
      "email": "sarah.staff@toktickit.com",
      "role": "IT_STAFF"
    },
    "followUpRequired": true,
    "followUpNote": "Advised user to calibrate battery with one full charge cycle.",
    "attachmentNotes": "serial_number_sticker.jpg",
    "createdAt": "2026-05-13T14:20:00.000Z",
    "updatedAt": "2026-05-13T14:20:00.000Z"
  },
  "message": "Action Taken successfully recorded"
}
```

#### Error Responses
- `400 Bad Request` (`FOLLOWUP_NOTE_REQUIRED`): `followUpRequired` is `true`, but `followUpNote` is empty or missing.
- `400 Bad Request` (`INACTIVE_ACTOR_REJECTED`): The authenticated user performing the operation is marked `isActive: false`.
- `400 Bad Request` (`TICKET_LOCKED`): Ticket status is `CLOSED` or `CANCELLED`.
- `401 Unauthorized` (`UNAUTHORIZED`): Missing or invalid Bearer token.
- `403 Forbidden` (`FORBIDDEN`): User role is `REQUESTER`.
- `404 Not Found` (`TICKET_NOT_FOUND`): Ticket does not exist.
- `409 Conflict` (`STALE_UPDATE_CONFLICT`): Ticket was modified by another user concurrently.

---

### 2.3 Update Action Taken
Modify details of an existing Action Taken record.

- **Method**: `PATCH`
- **Path**: `/api/v1/tickets/:id/actions-taken/:actionId`
- **Authorized Roles**: `IT_STAFF`, `ADMIN` (Requesters return `403 FORBIDDEN`).
- **Audit Invariant**: `performedBy` remains bound to the original author and cannot be altered.

#### Request Body Fields:
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `actionDescription` | String | Optional | Updated description of work |
| `result` | String | Optional | Updated outcome description |
| `followUpRequired` | Boolean | Optional | Updated follow-up flag |
| `followUpNote` | String? | Conditional | Mandatory non-empty string when `followUpRequired = true` |
| `attachmentNotes` | String? | Optional | Updated attachment references |
| `expectedUpdatedAt` | ISO DateTime | **Required** | Resource timestamp for optimistic locking against stale updates (BR-17) |

```json
{
  "actionDescription": "Updated description with vendor ticket #88412",
  "result": "Parts arrived and installed.",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "invoice_88412.pdf",
  "expectedUpdatedAt": "2026-05-13T14:20:00.000Z"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "act-cuid-102",
    "ticketId": "tkt-cuid-001",
    "actionDate": "2026-05-13T14:15:00.000Z",
    "actionDescription": "Updated description with vendor ticket #88412",
    "result": "Parts arrived and installed.",
    "performedBy": {
      "id": "usr-staff-02",
      "name": "Sarah Connor",
      "email": "sarah.staff@toktickit.com",
      "role": "IT_STAFF"
    },
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "invoice_88412.pdf",
    "createdAt": "2026-05-13T14:20:00.000Z",
    "updatedAt": "2026-05-13T15:00:00.000Z"
  },
  "message": "Action Taken successfully updated"
}
```

#### Error Responses
- `400 Bad Request` (`FOLLOWUP_NOTE_REQUIRED`): Updated `followUpRequired` to `true` without providing a note.
- `400 Bad Request` (`INACTIVE_ACTOR_REJECTED`): The authenticated user performing the update is marked `isActive: false`.
- `400 Bad Request` (`TICKET_LOCKED`): Ticket status is `CLOSED` or `CANCELLED`.
- `401 Unauthorized` (`UNAUTHORIZED`): Missing or invalid Bearer token.
- `403 Forbidden` (`FORBIDDEN`): User role is `REQUESTER` (Requesters cannot update Actions Taken).
- `404 Not Found` (`TICKET_NOT_FOUND`): Specified ticket does not exist.
- `404 Not Found` (`ACTION_NOT_FOUND`): Specified Action Taken ID does not exist under this ticket.
- `409 Conflict` (`STALE_UPDATE_CONFLICT`): Action Taken record was modified since `expectedUpdatedAt`.

---

## 3. Ticket Status & Resolution Workflow Endpoints

### 3.1 Update Ticket Status (Workflow Transition)
Transition a ticket to an allowed next state according to the Status Transition Matrix.

- **Method**: `PATCH`
- **Path**: `/api/v1/tickets/:id/status`
- **Authorized Roles**: `IT_STAFF`, `ADMIN` (Requesters return `403 FORBIDDEN`).

#### Request Body Fields:
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `status` | String | **Required** | Target status from permitted transition matrix |
| `expectedUpdatedAt` | ISO DateTime | **Required** | Resource timestamp for optimistic locking against stale ticket updates (BR-17) |

```json
{
  "status": "RESOLVED",
  "expectedUpdatedAt": "2026-05-13T15:00:00.000Z"
}
```

#### Valid Transitions Matrix Enforced:
- `NEW` $\rightarrow$ `OPEN`, `CANCELLED`
- `OPEN` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
- `IN_PROGRESS` $\rightarrow$ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
- `WAITING_FOR_REQUESTER` $\rightarrow$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
- `RESOLVED` $\rightarrow$ `CLOSED`, `REOPENED`
- `REOPENED` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
- `CLOSED` $\rightarrow$ No transitions allowed (terminal)
- `CANCELLED` $\rightarrow$ No transitions allowed (terminal)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "tkt-cuid-001",
    "ticketNumber": "TKT-2026-00034",
    "previousStatus": "IN_PROGRESS",
    "status": "RESOLVED",
    "updatedAt": "2026-05-14T09:00:00.000Z"
  },
  "message": "Ticket status successfully transitioned to RESOLVED"
}
```

#### Error Responses
- `400 Bad Request` (`INVALID_STATUS_TRANSITION`): Attempting an illegal jump (e.g. `NEW` $\rightarrow$ `RESOLVED`).
- `400 Bad Request` (`TICKET_LOCKED`): Attempting to modify a `CLOSED` or `CANCELLED` ticket.
- `401 Unauthorized` (`UNAUTHORIZED`): Missing or invalid Bearer token.
- `403 Forbidden` (`FORBIDDEN`): Non-staff user attempting status transition.
- `404 Not Found` (`TICKET_NOT_FOUND`): Ticket does not exist.
- `409 Conflict` (`STALE_UPDATE_CONFLICT`): Ticket `updatedAt` is newer than `expectedUpdatedAt`.

---

### 3.2 Advisory Resolution Indicator
Allows the owning Requester to signal that the issue appears resolved.

- **Method**: `POST`
- **Path**: `/api/v1/tickets/:id/resolve-indicator`
- **Authorized Roles**: `REQUESTER` (Must own the ticket).
- **Behavior**: Sets `isResolvedByUser: true`. **Crucially, formal status is NOT changed to `RESOLVED`**.

#### Request Body Fields:
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `expectedUpdatedAt` | ISO DateTime | **Required** | Resource timestamp for optimistic locking against stale ticket updates (BR-17) |

```json
{
  "expectedUpdatedAt": "2026-05-13T16:00:00.000Z"
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "tkt-cuid-001",
    "ticketNumber": "TKT-2026-00034",
    "status": "IN_PROGRESS",
    "isResolvedByUser": true,
    "updatedAt": "2026-05-13T16:30:00.000Z"
  },
  "message": "Resolution indication recorded. IT Staff will review and finalize the ticket."
}
```

#### Error Responses
- `400 Bad Request` (`VALIDATION_ERROR`): Missing `expectedUpdatedAt`.
- `401 Unauthorized` (`UNAUTHORIZED`): Missing or invalid Bearer token.
- `403 Forbidden` (`FORBIDDEN`): Authenticated user does not own this ticket.
- `404 Not Found` (`TICKET_NOT_FOUND`): Ticket does not exist.
- `409 Conflict` (`STALE_UPDATE_CONFLICT`): Ticket `updatedAt` is newer than `expectedUpdatedAt`.

---

## 4. Role Dashboard Endpoints

### 4.1 Requester Dashboard
Retrieve summary metrics, recent tickets, and recently resolved tickets scoped strictly to the authenticated Requester.

- **Method**: `GET`
- **Path**: `/api/v1/dashboard/requester`
- **Authorized Roles**: `REQUESTER`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "requesterName": "Jennifer Anderson",
    "metrics": {
      "openTickets": 3,
      "waitingForRequester": 1,
      "resolved": 5,
      "closed": 12
    },
    "recentTickets": [
      {
        "id": "tkt-001234",
        "ticketNumber": "TKT-2026-001234",
        "title": "Laptop battery drains quickly",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "updatedAt": "2026-05-12T09:14:00.000Z"
      },
      {
        "id": "tkt-001213",
        "ticketNumber": "TKT-2026-001213",
        "title": "Need new secondary monitor",
        "status": "WAITING_FOR_REQUESTER",
        "priority": "MEDIUM",
        "updatedAt": "2026-05-11T16:20:00.000Z"
      }
    ],
    "recentlyResolvedTickets": [
      {
        "id": "tkt-001222",
        "ticketNumber": "TKT-2026-001222",
        "title": "Request software access for Figma",
        "status": "RESOLVED",
        "priority": "MEDIUM",
        "updatedAt": "2026-05-11T14:30:00.000Z"
      }
    ],
    "drillDownPaths": {
      "openTickets": "/my-tickets?status=open_all",
      "waitingForRequester": "/my-tickets?status=WAITING_FOR_REQUESTER",
      "resolved": "/my-tickets?status=RESOLVED",
      "closed": "/my-tickets?status=CLOSED"
    }
  }
}
```

---

### 4.2 IT Staff & Administrator Dashboard
Retrieve operational queue metrics, status breakdowns, and recent queue activity calculated authoritatively by the backend.

- **Method**: `GET`
- **Path**: `/api/v1/dashboard/staff`
- **Authorized Roles**: `IT_STAFF`, `ADMIN` (Requesters return `403 FORBIDDEN`).

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "staffName": "Michael Scott",
    "role": "IT_STAFF",
    "metrics": {
      "newCount": 14,
      "openCount": 23,
      "inProgressCount": 18,
      "waitingForRequesterCount": 7,
      "myAssignedCount": 16,
      "unassignedCount": 8,
      "urgentCount": 3,
      "highCount": 12
    },
    "byStatus": {
      "NEW": 14,
      "OPEN": 23,
      "IN_PROGRESS": 18,
      "WAITING_FOR_REQUESTER": 7,
      "RESOLVED": 31,
      "CLOSED": 84,
      "REOPENED": 2,
      "CANCELLED": 5
    },
    "recentTickets": [
      {
        "id": "tkt-cuid-00034",
        "ticketNumber": "TKT-2026-00034",
        "title": "Laptop battery drains quickly",
        "status": "IN_PROGRESS",
        "priority": "URGENT",
        "owner": {
          "id": "usr-staff-01",
          "name": "Michael Scott"
        },
        "updatedAt": "2026-05-12T09:14:00.000Z"
      }
    ],
    "userStats": null,
    "drillDownPaths": {
      "newCount": "/staff/tickets?status=NEW",
      "openCount": "/staff/tickets?status=OPEN",
      "inProgressCount": "/staff/tickets?status=IN_PROGRESS",
      "waitingForRequesterCount": "/staff/tickets?status=WAITING_FOR_REQUESTER",
      "myAssignedCount": "/staff/tickets?ownership=assigned_to_me",
      "unassignedCount": "/staff/tickets?ownership=unassigned",
      "urgentCount": "/staff/tickets?priority=URGENT",
      "highCount": "/staff/tickets?priority=HIGH"
    }
  }
}
```

*(Note for Administrators: When invoked by a user with `role: ADMIN`, the `userStats` object is populated with `{ "activeUsers": 48, "activeStaff": 6, "activeAdmins": 2 }`).*

---

## 5. Implementation Error Codes Catalog

| Error Code | HTTP Status | Context / Trigger Condition |
| :--- | :---: | :--- |
| `UNAUTHORIZED` | 401 | Missing, malformed, or expired Bearer token |
| `SESSION_REVOKED` | 401 | Bearer token has been invalidated via logout |
| `FORBIDDEN` | 403 | User role is not permitted to perform operation |
| `PASSWORD_CHANGE_REQUIRED` | 403 | User must complete first-login password change before proceeding |
| `TICKET_NOT_FOUND` | 404 | Ticket with given ID does not exist |
| `ACTION_NOT_FOUND` | 404 | Action Taken with given ID does not exist under ticket |
| `FOLLOWUP_NOTE_REQUIRED` | 400 | `followUpRequired` is true but `followUpNote` is empty or missing |
| `INACTIVE_ACTOR_REJECTED` | 400 | Authenticated user attempting Action Taken operation is marked `isActive: false` |
| `INVALID_STATUS_TRANSITION` | 400 | Requested status transition violates the transition matrix |
| `TICKET_LOCKED` | 400 | Cannot add actions or transition status on `CLOSED` or `CANCELLED` ticket |
| `STALE_UPDATE_CONFLICT` | 409 | Resource timestamp mismatch; concurrent update detected |
| `VALIDATION_ERROR` | 400 | Missing required body fields or string length violations |
