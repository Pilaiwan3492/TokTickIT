# Lab 2 API Specification: TokTickIT Requester MVP

## 1. Purpose

This document defines the REST API contract for the TokTickIT Requester MVP in Lab 2.

The API supports:

- Development Requester selection
- Active Category and Related System lookup
- Ticket creation
- Requester-scoped ticket listing
- Search, filtering, sorting, and pagination
- Ticket detail retrieval
- Attachment upload
- Attachment metadata retrieval through Ticket Detail
- Attachment download
- Attachment soft removal
- Backend ownership enforcement
- Validation and safe error handling

Lab 2 does not implement real authentication. It does not use passwords, sessions, tokens, authenticated identities, or real role-based authorization.

The selected Development Requester is a temporary testing context used to simulate requester-specific behavior and multi-requester ownership until real authentication is introduced in Lab 3.

Client-side state retention and UI workflow requirements for BR-14 and BR-20 through BR-25 are defined and managed by the UI Specification.

---

## 2. API Conventions

### 2.1 Base URL

All endpoints use:

`/api/v1`

Example:

`GET /api/v1/tickets`

### 2.2 Content Types

JSON requests:

`Content-Type: application/json`

Attachment upload:

`Content-Type: multipart/form-data`

### 2.3 Response Format

Successful single-resource responses:

```json
{
  "data": {}
}
```

Successful list responses:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message"
  }
}
```

The API must not expose stack traces, database errors, filesystem paths, or other internal implementation details.

---

## 3. Development Requester Context

### 3.1 Context

Lab 2 does not use real authentication.

The Development Requester Selection screen is a testing mechanism that allows the user to select one seeded Development Requester before using the ticket screens. The selected Requester becomes the current requester context for creating tickets, viewing My Tickets, opening Ticket Detail, and managing attachments.

The selected Requester is not an authenticated identity and must not be treated as a security credential.

The client maintains the selected Development Requester using:

`selectedRequesterId`

The value may be stored in LocalStorage or client memory.

### 3.2 Requester ID

For Lab 2, requester-scoped API operations receive the selected Development Requester context using:

`requesterId`

The `requesterId` represents the currently selected Development Requester for testing purposes. It does not represent an authenticated user identity.

Because Lab 2 does not implement authentication, the backend trusts the requesterId supplied by the client as the current Development Requester context. This value is used only for testing requester-scoped behavior and must not be treated as an authenticated identity, security credential, or authorization token.

The client-side key `selectedRequesterId` is mapped to the API field/query parameter `requesterId` when making requester-scoped API requests.

### 3.3 Requester Context by Endpoint

The selected `requesterId` must be provided as follows:

| Operation | Endpoint | Requester Context |
|---|---|---|
| Create Ticket | `POST /api/v1/tickets` | Request body |
| List My Tickets | `GET /api/v1/tickets` | Query parameter |
| Get Ticket Detail | `GET /api/v1/tickets/:id` | Query parameter |
| Upload Attachment | `POST /api/v1/tickets/:id/attachments` | Query parameter |
| Download Attachment | `GET /api/v1/attachments/:id/download` | Query parameter |
| Remove Attachment | `DELETE /api/v1/attachments/:id` | Query parameter |

For all requester-scoped endpoints, requesterId must be a valid positive integer identifying an existing active Development Requester.

If requesterId is missing, invalid, does not exist, or identifies an inactive Development Requester, the API must return:

400 Bad Request

```json
{
  "error": {
    "code": "INVALID_REFERENCE",
    "message": "The selected Requester is invalid."
  }
}
```

Example:

`GET /api/v1/tickets/550e8400-e29b-41d4-a716-446655440000?requesterId=1`

---

## 4. HTTP Status Codes

| Status | Usage |
|---|---|
| 200 OK | Successful retrieval or operation |
| 201 Created | Resource successfully created |
| 400 Bad Request | Invalid request body or query parameters |
| 403 Forbidden | Requester does not own the requested resource |
| 404 Not Found | Requested resource does not exist |
| 409 Conflict | Request conflicts with current resource state |
| 413 Payload Too Large | Uploaded file exceeds 5 MB |
| 415 Unsupported Media Type | File type is not permitted |
| 500 Internal Server Error | Unexpected server-side failure |

---

## 5. Reference Data APIs

### 5.1 Get Active Requesters

Endpoint:
`GET /api/v1/requesters/active`

Purpose:
Returns Requesters available for the Development Requester Selector.
Only Requesters where `isActive = true` may be returned.

Response (200 OK):

```json
{
  "data": [
    {
      "id": 1,
      "name": "Alice Smith",
      "email": "alice@example.com"
    },
    {
      "id": 2,
      "name": "Bob Smith",
      "email": "bob@example.com"
    }
  ]
}
```

Empty Result (200 OK):

```json
{
  "data": []
}
```

Error (500 Internal Server Error):

```json
{
  "error": {
    "code": "REQUESTER_LIST_FAILED",
    "message": "Unable to load Requesters."
  }
}
```

---

## 6. Category API

### 6.1 Get Active Categories

Endpoint:
`GET /api/v1/categories`

Purpose:
Returns active Categories available when creating a ticket.
Only Categories where `isActive = true` may be returned.

Response (200 OK):

```json
{
  "data": [
    {
      "id": 1,
      "name": "Hardware"
    },
    {
      "id": 2,
      "name": "Software"
    }
  ]
}
```

Error (500 Internal Server Error):

```json
{
  "error": {
    "code": "CATEGORY_LIST_FAILED",
    "message": "Unable to load Categories."
  }
}
```

---

## 7. Related System API

### 7.1 Get Active Related Systems

Endpoint:
`GET /api/v1/related-systems`

Purpose:
Returns active Related Systems available when creating a ticket.
Only Related Systems where `isActive = true` may be returned.

Response (200 OK):

```json
{
  "data": [
    {
      "id": 1,
      "name": "Email"
    },
    {
      "id": 2,
      "name": "Network"
    }
  ]
}
```

Error (500 Internal Server Error):

```json
{
  "error": {
    "code": "RELATED_SYSTEM_LIST_FAILED",
    "message": "Unable to load Related Systems."
  }
}
```

---

## 8. Ticket API

### 8.1 Create Ticket

Endpoint:
`POST /api/v1/tickets`

Purpose:
Creates a new ticket for the selected Development Requester.
Ticket creation and attachment upload are separate operations.

Request (`Content-Type: application/json`):

```json
{
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 3,
  "summary": "Unable to access the company email",
  "description": "I cannot access my company email account since this morning.",
  "requestedPriority": "HIGH"
}
```

Request Fields:

| Field | Type | Required | Rules |
|---|---|---|---|
| requesterId | Integer | Yes | Must be a positive integer identifying an existing active Development Requester |
| categoryId | Integer | Yes | Must reference an active Category |
| relatedSystemId | Integer | Yes | Must reference an active Related System |
| summary | String | Yes | 5–150 characters after trimming leading/trailing whitespace |
| description | String | Yes | 10–2,000 characters after trimming leading/trailing whitespace |
| requestedPriority | Enum | Yes | LOW, MEDIUM, HIGH |

Backend Validation:
The backend must validate:
- Required fields
- Data types
- Summary length
- Description length
- Requested Priority
- Requester existence
- Requester must be active
- Category existence and active status
- Related System existence and active status
- Trim leading and trailing whitespace before validating length

Successful Response (201 Created):

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ticketNo": "TKT-2026-000001",
    "requesterId": 1,
    "categoryId": 2,
    "relatedSystemId": 3,
    "summary": "Unable to access the company email",
    "description": "I cannot access my company email account since this morning.",
    "requestedPriority": "HIGH",
    "itPriority": null,
    "currentStatus": "NEW",
    "createdAt": "2026-08-25T00:00:00.000Z",
    "updatedAt": "2026-08-25T00:00:00.000Z"
  }
}
```

Ticket Number:
The backend generates the official Ticket Number.
Format: `TKT-YYYY-XXXXXX`
The Ticket Number must be unique.

Initial Status:
Every newly created ticket must have `currentStatus = NEW`.

Validation Error (400 Bad Request):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": {
      "summary": "Summary must be between 5 and 150 characters.",
      "description": "Description must be between 10 and 2,000 characters."
    }
  }
}
```

Invalid Reference Data (400 Bad Request):

```json
{
  "error": {
    "code": "INVALID_REFERENCE",
    "message": "One or more selected values are invalid."
  }
}
```

Conflict (409 Conflict):

```json
{
  "error": {
    "code": "TICKET_CREATION_CONFLICT",
    "message": "The ticket could not be created because of a concurrent or conflicting operation."
  }
}
```

Server Error (500 Internal Server Error):

```json
{
  "error": {
    "code": "TICKET_CREATION_FAILED",
    "message": "Unable to create the ticket. Please try again."
  }
}
```

---

## 9. Ticket List API

### 9.1 Get My Tickets

Endpoint:
`GET /api/v1/tickets`

Purpose:
Returns only tickets belonging to the selected Development Requester.

Query Parameters:

| Parameter | Type | Required | Description |
|---|---|---|---|
| requesterId | Integer | Yes | Positive integer identifying an existing active Development Requester |
| search | String | No | Keyword search, maximum 100 characters |
| categoryId | Integer | No | Filter by Category |
| priority | Enum | No | LOW, MEDIUM, HIGH |
| status | Enum | No | NEW only in Lab 2 |
| page | Integer | No | Page number |
| limit | Integer | No | Number of records per page |
| sort | String | No | Supported sorting option |

### Search

The `search` parameter performs a case-insensitive keyword search across:

- `ticketNo`
- `summary`
- `description`

When provided, `search` must be a string with a maximum length of 100 characters. An invalid value must return 400 Bad Request.

Example:

`GET /api/v1/tickets?requesterId=1&search=email`

### Filtering

The API supports the following optional filters:

- `categoryId`
- `priority`
- `status`

Multiple filters may be combined.

Example:

`GET /api/v1/tickets?requesterId=1&categoryId=2&priority=HIGH&status=NEW`

### Pagination

- `page` must be a positive integer.
- Default `page = 1`.
- Allowed `limit` values are `10`, `20`, and `50`.
- Default `limit = 10`.
- The backend must reject unsupported `limit` values.
- If `page` is greater than `totalPages`, the API returns `200 OK` with an empty `data` array and the corresponding pagination metadata.

Query parameter validation:
- requesterId must be a valid positive integer.
- requesterId must identify an existing active Development Requester.
- categoryId must be a positive integer when provided and must reference an existing Category.
- Inactive Category records may still be referenced by existing tickets; therefore, categoryId filtering does not require the referenced Category to be active.
- page must be a positive integer.
- limit must be one of 10, 20, or 50.
- priority must be LOW, MEDIUM, or HIGH when provided.
- status must be NEW in Lab 2 when provided.
- sort must be one of the supported sorting values.

Example:

`GET /api/v1/tickets?requesterId=1&page=1&limit=10`

### Sorting

The API supports the following `sort` values:

- `createdAt_desc`
- `createdAt_asc`
- `priority_desc`
- `priority_asc`
- `ticketNo_asc`
- `ticketNo_desc`

Default sort: `createdAt_desc`

Secondary sort: `id_desc`

Sorting must be deterministic.

Example:

`GET /api/v1/tickets?requesterId=1&sort=createdAt_desc`

### Requester Ownership

The backend must apply the Requester ownership condition before applying search, filtering, sorting, and pagination.

Only tickets where `ticket.requesterId = requesterId` may be returned.

Because Lab 2 does not implement authentication, requesterId is a client-supplied Development Requester testing context.

The backend must use requesterId to scope the ticket list, but this behavior must not be treated as real authentication or security isolation between Requesters.

Successful Response (200 OK):

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "ticketNo": "TKT-2026-000001",
      "category": {
        "id": 2,
        "name": "Software"
      },
      "relatedSystem": {
        "id": 3,
        "name": "Email"
      },
      "summary": "Unable to access the company email",
      "requestedPriority": "HIGH",
      "currentStatus": "NEW",
      "createdAt": "2026-08-25T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Empty Result (200 OK):

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Invalid Query (400 Bad Request):

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "One or more query parameters are invalid."
  }
}
```

Invalid Requester (400 Bad Request):

```json
{
  "error": {
    "code": "INVALID_REFERENCE",
    "message": "The selected Requester is invalid."
  }
}
```

Server Error (500 Internal Server Error):

```json
{
  "error": {
    "code": "TICKET_LIST_FAILED",
    "message": "Unable to load tickets."
  }
}
```

---

## 10. Ticket Detail API

### 10.1 Get Ticket Detail

Endpoint:

`GET /api/v1/tickets/:id?requesterId={requesterId}`

Purpose:
Returns detailed information for a ticket owned by the selected Development Requester.

Path Parameter:

| Parameter | Type | Required |
|---|---|---|
| id | UUID | Yes |

Path Parameter Validation:

- id must be a valid UUID.
- If id is not a valid UUID, the API must return 400 Bad Request.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ticket ID must be a valid UUID."
  }
}
```

Query Parameter:

| Parameter | Type | Required | Description |
|---|---|---|---|
| requesterId | Integer | Yes | Selected Development Requester |

Ownership Rule:
- The backend must verify that the ticket belongs to the selected Development Requester before returning any ticket data.
- Only tickets where `ticket.requesterId = requesterId` may be accessed.
- If the ticket belongs to another Requester, return `403 Forbidden`.

Invalid Requester (400 Bad Request):

```json
{
  "error": {
    "code": "INVALID_REFERENCE",
    "message": "The selected Requester is invalid."
  }
}
```

Attachments Rules:
- **Active attachments:** `removedAt` and `removalReason` are `null`. The attachment may be downloaded through the Download Attachment API.
- **Soft-removed attachments:** `removedAt` contains the removal timestamp and `removalReason` contains the recorded removal reason. The attachment metadata remains visible, but the attachment must not be downloadable or previewable.

Successful Response (200 OK):

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ticketNo": "TKT-2026-000001",
    "requesterId": 1,
    "category": {
      "id": 2,
      "name": "Software"
    },
    "relatedSystem": {
      "id": 3,
      "name": "Email"
    },
    "summary": "Unable to access the company email",
    "description": "I cannot access my company email account since this morning.",
    "requestedPriority": "HIGH",
    "itPriority": null,
    "currentStatus": "NEW",
    "createdAt": "2026-08-25T00:00:00.000Z",
    "updatedAt": "2026-08-25T00:00:00.000Z",
    "attachments": [
      {
        "id": "650e8400-e29b-41d4-a716-446655440001",
        "fileName": "error-screenshot.png",
        "fileSize": 245678,
        "mimeType": "image/png",
        "uploadedAt": "2026-08-25T00:01:00.000Z",
        "removedAt": null,
        "removalReason": null
      }
    ]
  }
}
```

Ownership Violation (403 Forbidden):

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this ticket."
  }
}
```

Not Found (404 Not Found):

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "Ticket not found."
  }
}
```

Server Error (500 Internal Server Error):

```json
{
  "error": {
    "code": "TICKET_DETAIL_FAILED",
    "message": "Unable to load ticket details."
  }
}
```

---

## 11. Attachment API

### 11.1 Upload Attachment

Endpoint:
`POST /api/v1/tickets/:id/attachments?requesterId={requesterId}`

Purpose:
Adds an attachment to an existing ticket owned by the selected Requester.

Path Parameter:

| Parameter | Type | Required |
|---|---|---|
| id | UUID | Yes |

Path Parameter Validation:

- id must be a valid UUID.
- If id is not a valid UUID, the API must return 400 Bad Request.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ticket ID must be a valid UUID."
  }
}
```

Query Parameter:

| Parameter | Type | Required |
|---|---|---|
| requesterId | Integer | Yes |

Request:
`Content-Type: multipart/form-data`
Form field: `file=<selected file>`

Attachment filename handling:
- `fileName` is the original filename after sanitization.
- `filePath` is the internal storage path and must not be exposed in API responses.

Filename sanitization must prevent path traversal and path separator characters.

The sanitized fileName must not contain:
- /
- \
- ../
- ..\

The client-provided filename must never be used directly as the physical storage path or storage filename. The backend must generate or control the internal storage path.

Allowed File Types:
JPG, JPEG, PNG, WEBP, PDF

Allowed MIME Types:

| File Extension | MIME Type |
|---|---|
| .jpg | image/jpeg |
| .jpeg | image/jpeg |
| .png | image/png |
| .webp | image/webp |
| .pdf | application/pdf |

Maximum File Size:
5 MiB (5,242,880 bytes) per file.

Maximum Active Attachments:
- Maximum 5 active attachments per ticket.
- Soft-removed attachments do not count toward this limit.

Validation:
The backend must validate:
- Ticket existence
- Ticket ownership
- File presence
- File extension and MIME type (The backend must validate both the file extension and MIME type. The file must use an allowed extension and a matching allowed MIME type.)
- File size
- Active attachment count
- Safe filename handling

Missing File (400 Bad Request):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Attachment file is required."
  }
}
```

Ticket Not Found (404 Not Found):

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "Ticket not found."
  }
}
```

Invalid Requester (400 Bad Request):

```json
{
  "error": {
    "code": "INVALID_REFERENCE",
    "message": "The selected Requester is invalid."
  }
}
```

Successful Response (201 Created):

```json
{
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "ticketId": "550e8400-e29b-41d4-a716-446655440000",
    "fileName": "error-screenshot.png",
    "fileSize": 245678,
    "mimeType": "image/png",
    "uploadedAt": "2026-08-25T00:01:00.000Z",
    "removedAt": null,
    "removalReason": null
  }
}
```

Unsupported File Type (415 Unsupported Media Type):

```json
{
  "error": {
    "code": "UNSUPPORTED_FILE_TYPE",
    "message": "This file type is not supported."
  }
}
```

File Too Large (413 Payload Too Large):

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size must not exceed 5 MiB (5,242,880 bytes)."
  }
}
```

Attachment Limit Reached (409 Conflict):

```json
{
  "error": {
    "code": "ATTACHMENT_LIMIT_REACHED",
    "message": "This ticket already has the maximum number of active attachments."
  }
}
```

Ownership Violation (403 Forbidden):

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to modify attachments for this ticket."
  }
}
```

Upload Failure (500 Internal Server Error):

```json
{
  "error": {
    "code": "ATTACHMENT_UPLOAD_FAILED",
    "message": "Unable to upload the attachment. Please try again."
  }
}
```

> Note: If attachment upload fails after ticket creation, the ticket remains saved.

---

### 11.2 Download Attachment

Endpoint:

`GET /api/v1/attachments/:id/download?requesterId={requesterId}`

Purpose:
Downloads an active attachment belonging to a ticket owned by the selected Requester.

Path Parameter:

| Parameter | Type | Required |
|---|---|---|
| id | UUID | Yes |

Path Parameter Validation:

- id must be a valid UUID.
- If id is not a valid UUID, the API must return 400 Bad Request.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Attachment ID must be a valid UUID."
  }
}
```

Query Parameter:

| Parameter | Type | Required | Description |
|---|---|---|---|
| requesterId | Integer | Yes | Selected Development Requester |

Backend Checks:
Before returning the file, the backend must verify:
- Attachment exists.
- Parent ticket exists.
- Parent ticket belongs to the selected Requester.
- Attachment has not been soft-removed.
- File is available.

Access Rules:
- If the attachment does not exist, return 404 ATTACHMENT_NOT_FOUND.
- If the attachment exists but its parent ticket belongs to another Requester, return 403 FORBIDDEN.
- If the attachment belongs to the selected Requester but has been soft-removed, return 404 ATTACHMENT_NOT_AVAILABLE.
- If the attachment record exists and is active, but the file is missing from storage, return 500 ATTACHMENT_STORAGE_ERROR.
- If the attachment is active and the file is available, return 200 OK with the file.

Successful Response (200 OK):

```http
Content-Type: image/png
Content-Disposition: attachment; filename="error-screenshot.png"
```

Removed Attachment (404 Not Found):

```json
{
  "error": {
    "code": "ATTACHMENT_NOT_AVAILABLE",
    "message": "This attachment is no longer available for download."
  }
}
```

Ownership Violation (403 Forbidden):

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this attachment."
  }
}
```

Attachment Not Found (404 Not Found):

```json
{
  "error": {
    "code": "ATTACHMENT_NOT_FOUND",
    "message": "Attachment not found."
  }
}
```

Attachment Storage Error (500 Internal Server Error):

```json
{
  "error": {
    "code": "ATTACHMENT_STORAGE_ERROR",
    "message": "The attachment file is unavailable. Please try again later."
  }
}
```

Download Failure (500 Internal Server Error):

```json
{
  "error": {
    "code": "ATTACHMENT_DOWNLOAD_FAILED",
    "message": "Unable to download the attachment. Please try again."
  }
}
```

---

### 11.3 Remove Attachment

Endpoint:

`DELETE /api/v1/attachments/:id?requesterId={requesterId}`

Purpose:
Soft-removes an attachment while retaining its metadata.
The Attachment database record must not be physically deleted.

Path Parameter:

| Parameter | Type | Required |
|---|---|---|
| id | UUID | Yes |

Path Parameter Validation:

- id must be a valid UUID.
- If id is not a valid UUID, the API must return 400 Bad Request.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Attachment ID must be a valid UUID."
  }
}
```

Query Parameter:

| Parameter | Type | Required | Description |
|---|---|---|---|
| requesterId | Integer | Yes | Selected Development Requester |

Request (`Content-Type: application/json`):

```json
{
  "removalReason": "Uploaded the wrong screenshot."
}
```

The requesterId is provided as a query parameter. The removalReason is provided in the JSON request body.

Validation:
- `removalReason` is required.
- `removalReason` must be a string.
- Whitespace-only values are invalid.
- Leading and trailing whitespace must be trimmed before validating removalReason.
- The trimmed value must contain 3-255 characters.
- The trimmed value must be stored as the removalReason.

Successful Response (200 OK):

```json
{
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440001",
    "removedAt": "2026-08-25T00:05:00.000Z",
    "removalReason": "Uploaded the wrong screenshot."
  }
}
```

Missing Removal Reason (400 Bad Request):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Removal reason is required.",
    "fields": {
      "removalReason": "Removal reason is required."
    }
  }
}
```

Ownership Violation (403 Forbidden):

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to remove this attachment."
  }
}
```

Attachment Not Found (404 Not Found):

```json
{
  "error": {
    "code": "ATTACHMENT_NOT_FOUND",
    "message": "Attachment not found."
  }
}
```

Already Removed (409 Conflict):

```json
{
  "error": {
    "code": "ATTACHMENT_ALREADY_REMOVED",
    "message": "This attachment has already been removed."
  }
}
```

Remove Failure (500 Internal Server Error):

```json
{
  "error": {
    "code": "ATTACHMENT_REMOVE_FAILED",
    "message": "Unable to remove the attachment. Please try again."
  }
}
```

---

## 12. Attachment Lifecycle & Rules

### 12.1 Active vs Removed Attachments

- Active attachments (`removedAt = null`) count toward the 5-file limit per ticket and are available for download.
- Soft-removed attachments (`removedAt != null`) do not count toward the active limit and cannot be downloaded.
- Attachment metadata is retained for audit trail purposes. Removed attachments must not be downloadable or previewable through the API.

### 12.2 Upload Limits

- Allowed Formats: JPG, JPEG, PNG, WEBP, PDF
- File Size Limit: Maximum 5 MiB (5,242,880 bytes) per file
- Active Limit: Maximum 5 active attachments per ticket

---

## 13. Validation Rules Summary

| Resource | Field | Constraint / Rule |
|---|---|---|
| Ticket | requesterId | Required, Must identify an existing Development Requester |
| Ticket | summary | Required, 5–150 characters |
| Ticket | description | Required, 10–2,000 characters |
| Ticket | requestedPriority | Required, Enum: LOW, MEDIUM, HIGH |
| Ticket | categoryId | Required, Must exist and be active |
| Ticket | relatedSystemId | Required, Must exist and be active |
| Attachment | file | Required, Max 5 MiB (5,242,880 bytes), allowed extension and matching MIME type |
| Attachment | removalReason | Required string for soft removal, 3-255 characters after trimming, whitespace-only values invalid |
| Ticket List Query | page | Optional, Positive integer, Default: 1 |
| Ticket List Query | limit | Optional, Must be 10, 20, or 50, Default: 10 |
| Ticket List Query | search | Optional, String, Maximum 100 characters |
| Ticket List Query | priority | Optional, Enum: LOW, MEDIUM, HIGH |
| Ticket List Query | status | Optional, Must be NEW in Lab 2 |
| Ticket List Query | sort | Optional, Must be one of the supported sorting values |
| Ticket List Query | categoryId | Optional, Positive integer, must reference an existing Category |

---

## 14. Security & Ownership Rules

### 14.1 Requester Context Enforcement

- The backend must apply requester-scoped filtering using the requesterId provided by the client for ticket and attachment operations.
- For ticket detail and attachment operations, the backend must verify that the resource belongs to the supplied requesterId.
- Direct object reference attempts on resources that belong to a different requesterId must return 403 Forbidden.
- Because Lab 2 does not implement authentication, requesterId is a Development Requester testing context and must not be treated as a security credential or authenticated identity.
- These checks provide requester-scoped behavior for Lab 2 testing only. Real authentication and authorization will be introduced in Lab 3 using the authenticated identity from the JWT.
- Error messages must not leak internal resource identifiers or infrastructure details.

---

## 15. Pagination & Search Behavior

### 15.1 Query Standard

- Default `page`: 1
- Default `limit`: 10 (Allowed limit values: 10, 20, 50)
- Default `sort`: `createdAt_desc`
- Deterministic secondary sort: `id_desc`

### 15.2 Search Scope

- Keyword search applies to `ticketNo`, `summary`, and `description`.
- Case-insensitive partial matches must be supported.

---

## 16. Error Code Summary

| Error Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 Bad Request | Payload fails schema or field-level validation rules |
| `INVALID_QUERY` | 400 Bad Request | Query parameters are invalid or out of range |
| `INVALID_REFERENCE` | 400 Bad Request | One or more referenced resources do not exist or are inactive |
| `FORBIDDEN` | 403 Forbidden | Requester does not own the requested resource |
| `TICKET_NOT_FOUND` | 404 Not Found | Ticket ID does not exist |
| `ATTACHMENT_NOT_FOUND` | 404 Not Found | Attachment ID does not exist |
| `ATTACHMENT_NOT_AVAILABLE` | 404 Not Found | Attachment has been soft-removed |
| `TICKET_CREATION_CONFLICT` | 409 Conflict | Concurrent or conflicting operation during ticket creation |
| `ATTACHMENT_LIMIT_REACHED` | 409 Conflict | Ticket already has 5 active attachments |
| `ATTACHMENT_ALREADY_REMOVED` | 409 Conflict | Attachment was previously soft-removed |
| `FILE_TOO_LARGE` | 413 Payload Too Large | Attachment exceeds 5 MiB (5,242,880 bytes) limit |
| `UNSUPPORTED_FILE_TYPE` | 415 Unsupported Media Type | Attachment MIME type is not allowed |
| `ATTACHMENT_STORAGE_ERROR` | 500 Internal Server Error | Attachment record exists but the file is missing from storage |
| `REQUESTER_LIST_FAILED` | 500 Internal Server Error | Database failure retrieving Requesters |
| `CATEGORY_LIST_FAILED` | 500 Internal Server Error | Database failure retrieving Categories |
| `RELATED_SYSTEM_LIST_FAILED` | 500 Internal Server Error | Database failure retrieving Related Systems |
| `TICKET_CREATION_FAILED` | 500 Internal Server Error | Database failure creating ticket |
| `TICKET_LIST_FAILED` | 500 Internal Server Error | Database failure retrieving ticket list |
| `TICKET_DETAIL_FAILED` | 500 Internal Server Error | Unexpected failure retrieving ticket detail |
| `ATTACHMENT_UPLOAD_FAILED` | 500 Internal Server Error | File storage or database upload failure |
| `ATTACHMENT_DOWNLOAD_FAILED` | 500 Internal Server Error | Unexpected failure while downloading an attachment |
| `ATTACHMENT_REMOVE_FAILED` | 500 Internal Server Error | Database or storage failure while removing an attachment |

---

## 17. Endpoint Summary

| HTTP Method | Endpoint Path | Description | Expected Status |
|---|---|---|---|
| `GET` | `/api/v1/requesters/active` | Fetch active requesters for selector | 200 OK |
| `GET` | `/api/v1/categories` | Fetch active ticket categories | 200 OK |
| `GET` | `/api/v1/related-systems` | Fetch active related systems | 200 OK |
| `POST` | `/api/v1/tickets` | Create a new ticket | 201 Created |
| `GET` | `/api/v1/tickets` | Get ticket list (requester-scoped) | 200 OK |
| `GET` | `/api/v1/tickets/:id` | Get ticket detail | 200 OK |
| `POST` | `/api/v1/tickets/:id/attachments` | Upload attachment | 201 Created |
| `GET` | `/api/v1/attachments/:id/download` | Download attachment file | 200 OK |
| `DELETE` | `/api/v1/attachments/:id` | Soft-remove attachment | 200 OK |

---

## 18. Data Models

### 18.1 Ticket Entity

```json
{
  "id": "UUID (v4)",
  "ticketNo": "String (TKT-YYYY-XXXXXX)",
  "requesterId": "Integer",
  "categoryId": "Integer",
  "relatedSystemId": "Integer",
  "summary": "String (5-150 chars)",
  "description": "String (10-2000 chars)",
  "requestedPriority": "Enum (LOW, MEDIUM, HIGH)",
  "itPriority": "Enum (LOW, MEDIUM, HIGH, CRITICAL) | null",
  "currentStatus": "Enum (NEW, IN_PROGRESS, RESOLVED, CLOSED)",
  "createdAt": "ISO 8601 Timestamp",
  "updatedAt": "ISO 8601 Timestamp"
}
```

Lab 2 creates tickets with NEW status only.
Status transitions are outside Lab 2 scope.
`itPriority` is read-only in Lab 2 and is not accepted in ticket creation requests.
For tickets created in Lab 2, `itPriority` must initially be `null`.

### 18.2 Attachment Database Entity

```json
{
  "id": "UUID (v4)",
  "ticketId": "UUID (v4)",
  "fileName": "Original filename after sanitization (String)",
  "fileSize": "Integer (bytes)",
  "filePath": "String",
  "mimeType": "String",
  "uploadedAt": "ISO 8601 Timestamp",
  "removedAt": "ISO 8601 Timestamp | null",
  "removalReason": "String | null"
}
```

`fileName` stores the original filename after sanitization. `filePath` is an internal backend storage path and must not be exposed in API responses.

---

## 19. Sorting Options

Supported values for `sort` query parameter in `GET /api/v1/tickets`:

| Parameter Value | Sorting Behavior |
|---|---|
| `createdAt_desc` | Creation date descending (Newest first) — **Default** |
| `createdAt_asc` | Creation date ascending (Oldest first) |
| `priority_desc` | Priority descending (HIGH -> MEDIUM -> LOW) |
| `priority_asc` | Priority ascending (LOW -> MEDIUM -> HIGH) |
| `ticketNo_desc` | Ticket number descending |
| `ticketNo_asc` | Ticket number ascending |

The secondary `id_desc` sort must be applied when records have equal values for the primary sort field.

---

## 20. Testing Guidelines & Edge Cases

- **Empty State:** Test ticket listing with a newly created Requester who has 0 tickets; expected response is `200 OK` with `"data": []`.

- **Boundary Validation:** Test `summary` at exactly 4 chars (should fail 400) and 5 chars (should pass 201).

- **Requester Scope and Ownership Test:** Try fetching a ticket owned by `requesterId=1` through the Ticket Detail API while passing `requesterId=2`. Also try downloading or removing an attachment belonging to a ticket owned by `requesterId=1` while passing `requesterId=2`. These resource access attempts must return `403 Forbidden`. For the ticket list API, create tickets for multiple Requesters and verify that each request returns only tickets whose `ticket.requesterId` matches the supplied requesterId.

- **Soft Removal Verification:** Verify that after `DELETE /api/v1/attachments/:id`, attachment metadata remains accessible through `GET /api/v1/tickets/:id`, while the download endpoint returns `404 Not Found`.

- **Attachment Size Boundary:** Test an attachment larger than 5 MiB, meaning greater than 5,242,880 bytes, and verify that the API returns `413 Payload Too Large`.

- **Attachment Count Limit:** Verify that a ticket can contain at most 5 active attachments. Attempt to upload a 6th active attachment and verify that the API returns `409 Conflict`. After one attachment is soft-removed, verify that another attachment can be uploaded.

- **Invalid Query Parameters:** Test invalid `page`, unsupported `limit`, invalid `priority`, invalid `status`, and unsupported `sort` values. Each invalid query must return `400 Bad Request`.

- **Requester Isolation:** Create tickets for two different Requesters. Request the ticket list using each `requesterId` and verify that each Requester receives only their own tickets.

- **Whitespace Trimming:** Test ticket creation with leading and trailing whitespace in summary and description. The backend must trim the values before validation and store the trimmed values.

- **Invalid Reference Validation:** Test ticket creation with a non-existing or inactive Category, non-existing or inactive Related System, and invalid or inactive Requester. Each invalid reference must return 400 INVALID_REFERENCE.

- **Invalid UUID Validation:** Test Ticket Detail and Attachment endpoints using invalid UUID path parameters. The API must return 400 VALIDATION_ERROR with the appropriate UUID validation message.

- **Inactive Requester Validation:** Test requester-scoped endpoints using a requesterId that exists but has `isActive = false`. The API must return 400 INVALID_REFERENCE.

- **Filename Sanitization:** Test attachment upload using filenames containing path traversal sequences or path separators, such as `../file.png` or `..\file.png`. The backend must sanitize the filename and must not use the client-provided filename as the physical storage path.

- **Category Filtering:** Create tickets under multiple Categories and verify that `categoryId` filtering returns only tickets matching the requested Category while maintaining requester ownership scope.

## 21. API Traceability

The following table maps the API capabilities to their Acceptance Criteria and planned automated tests.

| API Capability | Endpoint | Acceptance Criteria | Planned Test |
|---|---|---|---|
| Active Requesters | `GET /api/v1/requesters/active` | Requester selection loads active Requesters only | `server/tests/lab-02/requesters.api.test.ts` |
| Active Categories | `GET /api/v1/categories` | Category lookup returns active Categories | `server/tests/lab-02/categories.api.test.ts` |
| Active Related Systems | `GET /api/v1/related-systems` | Related System lookup returns active Related Systems | `server/tests/lab-02/related-systems.api.test.ts` |
| Create Ticket | `POST /api/v1/tickets` | Valid Ticket is created for selected Requester | `server/tests/lab-02/create-ticket.api.test.ts` |
| My Tickets | `GET /api/v1/tickets` | Only selected Requester's Tickets are returned | `server/tests/lab-02/my-tickets.api.test.ts` |
| Ticket Detail | `GET /api/v1/tickets/:id` | Requester can access only owned Ticket | `server/tests/lab-02/ticket-detail.api.test.ts` |
| Upload Attachment | `POST /api/v1/tickets/:id/attachments` | Valid Attachment can be uploaded within defined limits | `server/tests/lab-02/attachments.api.test.ts` |
| Attachment Metadata | `GET /api/v1/tickets/:id` | Ticket Detail includes Attachment metadata | `server/tests/lab-02/ticket-detail.api.test.ts` |
| Download Attachment | `GET /api/v1/attachments/:id/download` | Owned active Attachment can be downloaded | `server/tests/lab-02/attachments.api.test.ts` |
| Remove Attachment | `DELETE /api/v1/attachments/:id` | Owned Attachment can be soft-removed | `server/tests/lab-02/attachments.api.test.ts` |

---

## 22. Transition Plan to Lab 3 (Authentication)

- In **Lab 2**, requester context is passed explicitly via query params (`requesterId`) or request body. This requesterId is a testing context and is not an authenticated identity.
- In Lab 3, authentication will be introduced using the standard HTTP header: `Authorization: Bearer <JWT_TOKEN>`
- The backend will extract the authenticated requesterId from the JWT payload instead of trusting requesterId supplied by the client.
- The requesterId parameters used in Lab 2 will no longer be used as the source of authenticated identity in Lab 3.
- The existing requester-scoped ownership checks can be retained while changing the source of requester identity from the request parameter/body to the authenticated JWT.