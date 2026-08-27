# TokTickIT Zen Green UI Specification & Checklist

## 1. Purpose

This document defines the UI requirements for the TokTickIT Requester MVP in Lab 2.

The UI supports:

- Development Requester selection
- Ticket creation
- Ticket listing
- Search, filtering, sorting, and pagination
- Ticket detail viewing
- Attachment upload
- Attachment download
- Attachment soft removal
- Validation and error states
- Responsive layout
- Development Requester context for Lab 2 testing

Lab 2 does not implement real authentication. The selected Development Requester is a temporary testing context and must not be presented as a real login or authenticated identity.

---

## 2. Color Tokens & Typography

| Token | Value | Usage |
|---|---|---|
| Primary Green | `#006B3C` | Header, primary buttons, brand accents |
| Secondary Green | `#0B7A46` | Active states, hover, focus |
| Pale Green | `#EAF6EF` | Selected items, highlighted sections |
| Page Background | `#F5F7F6` | Main page background |
| Surface | `#FFFFFF` | Cards, forms, workspace |
| Text Primary | `#24272A` | Main text |
| Text Secondary | `#5F6863` | Supporting text |
| Read-only Field | `#F0F4F2` | Non-editable fields |
| Error | `#B42318` | Error text, borders, validation |
| Border | `#D5DDD8` | Input/card borders |

### Typography

- Use a clean sans-serif font.
- Page titles should be large and bold.
- Section titles should be medium/bold.
- Body text should use regular weight.
- Labels should use medium weight.
- Helper and error text should be smaller than body text.
- Do not rely on color alone to communicate status.

---

## 3. Layout & Responsive Rules

| Viewport | Layout |
|---|---|
| Desktop >= 992px | Centered workspace, max-width 1280px |
| Tablet 768-991px | 2-column layout where appropriate |
| Mobile < 768px | 1-column stacked layout |

### General Rules

- No horizontal scrolling on mobile.
- Forms should use the available width.
- Primary actions must remain easy to reach.
- Tables should convert to cards on mobile.
- Buttons should have sufficient touch area.
- Long text such as ticket descriptions must wrap naturally.
- Attachment filenames must not overflow the screen.

---

## 4. Global UI Components

### 4.1 Header

The header should contain:

- TokTickIT branding
- Current Development Requester
- Navigation to:
  - My Tickets
  - Create Ticket
- Development Mode indicator

Example:

```text
TokTickIT
Requester: Alice Smith
[Development Mode]
```

The UI must make it clear that the selected requester is a testing context, not authentication.

### 4.2 Development Mode Indicator

Display:

`Development Mode - Authentication coming in Lab 3`

Do not use wording such as:

`Logged in as Alice`

because Lab 2 does not implement authentication.

### 4.3 Loading State

For API operations:

- Display a loading indicator while waiting.
- Disable the relevant action while submitting.
- Prevent duplicate submissions.

Examples:

- Loading Requesters...
- Loading Tickets...
- Creating Ticket...
- Uploading...
- Removing...

### 4.4 Error State

API errors should be displayed using user-friendly messages.

Do not display:

- Stack traces
- Database errors
- File paths
- Internal IDs
- Server implementation details

Field validation errors should appear directly below the related field.

---

## 5. Development Requester Selection Screen

### 5.1 Purpose

Allows the user to select a seeded Development Requester for Lab 2 testing.

### 5.2 Components

- Page title
- Information/warning card
- Requester dropdown
- Continue button
- Development Mode badge

### 5.3 Information Message

This is for testing only and is not a login screen.

### 5.4 Requester Dropdown

Data source:

`GET /api/v1/requesters/active`

Only active Requesters should appear.

Example:

> Select Development Requester  
> Alice Smith  
> Bob Smith

### 5.5 Continue Button

- Disabled when no requester is selected.
- Enabled after a valid requester is selected.

When clicked:

1. Store `selectedRequesterId`.
2. Continue to the requester workspace.

### 5.6 Error State

If requester loading fails:

> Unable to load Requesters. Please try again.

---

## 6. Create Ticket Screen

### 6.1 Page Structure

```text
Create Ticket

Ticket Information
--------------------------------

Ticket No.
Auto-generated after submit

Created Date
Current Date

Category *
[ Select Category ]

Related System *
[ Select Related System ]

Requested Priority *
[ LOW ] [ MEDIUM ] [ HIGH ]

Summary *
[________________________________]

Description *
[________________________________]
[________________________________]

Attachments
--------------------------------

[ Drag & Drop files here ]
or
[ Choose Files ]

Allowed: JPG, JPEG, PNG, WEBP, PDF
Maximum: 5 MiB (5,242,880 bytes) per file
Maximum: 5 active attachments

[Cancel] [Create Ticket]
```

### 6.2 Ticket Number

The Ticket Number is read-only.

Before submission:

`Auto-generated after submit`

After successful creation:

`TKT-2026-000001`

The UI must not allow the user to manually enter or edit the Ticket Number.

### 6.3 Category

Data source:

`GET /api/v1/categories`

Only active Categories should be selectable. Required field.

### 6.4 Related System

Data source:

`GET /api/v1/related-systems`

Only active Related Systems should be selectable. Required field.

### 6.5 Requested Priority

Options:

- LOW
- MEDIUM
- HIGH

Required field. Use radio buttons or selectable badges.

### 6.6 Summary

Required.

Rules:

- Minimum 5 characters
- Maximum 150 characters
- Leading and trailing whitespace are trimmed

Display character counter: `0 / 150`

### 6.7 Description

Required.

Rules:

- Minimum 10 characters
- Maximum 2,000 characters
- Leading and trailing whitespace are trimmed

Display character counter: `0 / 2000`

---

## 7. Attachment UI

### 7.1 Upload Area

Display a drag-and-drop area:

`Drag & Drop files here` or `[Choose Files]`

- Allowed: JPG, JPEG, PNG, WEBP, PDF
- Maximum 5 MiB per file
- Maximum 5 active attachments

#### Client-side Validation

The UI should provide immediate feedback for:

- Unsupported file type
- File larger than 5 MiB
- Missing file
- More than 5 active attachments

Backend validation remains authoritative.

### 7.2 Attachment List

After selecting files, display:

| File Name | Size | Status | Action |
|---|---|---|---|
| error.png | 245 KB | Ready | Remove |

The UI must not expose `filePath`.

### 7.3 Attachment Upload Flow

Ticket creation and attachment upload are separate API operations.

Flow:

1. User fills in ticket information.
2. User submits the ticket.
3. Backend creates the ticket.
4. Backend returns the Ticket ID.
5. UI uploads selected attachments using the created Ticket ID.
6. UI displays the final Ticket Detail.

If attachment upload fails after ticket creation:

> Ticket created successfully, but one or more attachments could not be uploaded.

The ticket must remain saved.

---

## 8. Create Ticket Validation

### Summary

If summary contains fewer than 5 characters:

> Summary must be between 5 and 150 characters.

*(Exactly 5 characters is valid.)*

### Description

If description contains fewer than 10 characters:

> Description must be between 10 and 2,000 characters.

### Required Field

Example:

> Summary is required.

The error must appear directly below the field.

### Invalid Reference

If Category, Related System, or Requester is invalid:

> One or more selected values are invalid.

---

## 9. Create Ticket Success

After successful ticket creation:

Display:

> Ticket created successfully.

Show:

- Ticket Number
- Current Status
- Summary
- Requester
- Category
- Related System
- Requested Priority

Example:

> Ticket created successfully.  
> TKT-2026-000001  
> Status: NEW

After creation and attachment processing, navigate to **Ticket Detail**.

---

## 10. My Tickets Screen

### 10.1 Page Structure

```text
My Tickets

[ Search tickets... ]

[Category ▼] [Priority ▼] [Status ▼] [Sort ▼]

[Clear Filters]

------------------------------------------------

Ticket No | Created | Summary | Category |
Priority | Status | Last Updated

------------------------------------------------

< Previous   1   2   3   Next >
```

---

## 11. Search

Search field:

`Search tickets...`

Searches across:

- Ticket Number
- Summary
- Description

Rules:

- Case-insensitive
- Partial matching
- Maximum 100 characters

Example search query: `email`

---

## 12. Filters

### Category
Category options are loaded from: `GET /api/v1/categories`  
Only active Categories should be available for selection.

Existing tickets may still reference inactive Categories.
Inactive Categories must not prevent those existing tickets from appearing
in My Tickets or Ticket Detail.

### Priority
Options:

- All
- LOW
- MEDIUM
- HIGH

### Status
Lab 2 supports:

- NEW

### Clear Filters
The Clear Filters button resets Search, Category, Priority, Status, and Page, then reloads the default ticket list.

---

## 13. Sorting

Supported UI options:

| UI Label | API Value |
|---|---|
| Newest first | `createdAt_desc` |
| Oldest first | `createdAt_asc` |
| High to Low | `priority_desc` |
| Low to High | `priority_asc` |
| Ticket No A to Z | `ticketNo_asc` |
| Ticket No Z to A | `ticketNo_desc` |

Default sorting: `createdAt_desc`

---

## 14. Pagination

Default settings:

- Page = 1
- Limit = 10

Allowed page sizes: 10, 20, 50

- If there are no results: `No tickets found.`
- If filters produce no results: `No tickets match your current filters.`

A valid empty result must not be displayed as an error.

---

## 15. Ticket List Status & Priority Badges

Use badges for status and priority.

- Status: **NEW**
- Priority: **LOW**, **MEDIUM**, **HIGH**

Badges must contain readable text and must not rely on color alone.

---

## 16. Ticket Detail Screen

### Purpose
Displays complete information for a ticket owned by the selected Development Requester.

### Page Structure

```text
Ticket Detail

TKT-2026-000001
Status: NEW

Requester
Alice Smith

Category
Software

Related System
Email

Requested Priority
HIGH

Created
25 Aug 2026

Last Updated
25 Aug 2026

Summary
Unable to access the company email

Description
I cannot access my company email account
since this morning.

Attachments
--------------------------------

error-screenshot.png
245 KB
image/png
Uploaded 25 Aug 2026

[Download] [Remove]

[Back to My Tickets]
```

---

## 17. Ticket Detail API Mapping

Endpoint:

`GET /api/v1/tickets/:id?requesterId={requesterId}`

The UI must send the currently selected `requesterId`. The backend performs the ownership check.

---

## 18. Ticket Detail Ownership

If the ticket belongs to another Requester:

> You do not have permission to access this ticket.

Do not display ticket information when ownership verification fails.

If the ticket does not exist:

> Ticket not found.

---

## 19. Attachment Detail UI

### 19.1 Active Attachment

Display:

- Filename
- File size
- MIME type
- Uploaded date
- Download button
- Remove button

Example:

> error-screenshot.png  
> 245 KB · image/png  
> Uploaded Aug 25, 2026  
> `[Download]` `[Remove]`

### 19.2 Soft-Removed Attachment

Metadata remains visible.

Display:

> error-screenshot.png  
> Status: Removed  
> Removed: Aug 25, 2026  
> Reason: Uploaded the wrong screenshot.

For a removed attachment:

- Download must be disabled or hidden.
- Preview must be disabled or hidden.
- Metadata remains visible.

---

## 20. Download Attachment

Endpoint:

`GET /api/v1/attachments/:id/download?requesterId={requesterId}`

The Download button is available only for active attachments.

When downloading:

- Send the current `requesterId`.
- Browser should download the file using the returned filename.

If the attachment has been removed:

> This attachment is no longer available for download.

If the attachment cannot be downloaded:

> Unable to download the attachment. Please try again.

---

## 21. Remove Attachment

When the user clicks Remove, display a confirmation dialog.

Example:

```text
Remove attachment?

The attachment will no longer be available
for download. Its metadata will remain
in the ticket history.

Removal reason *
[________________________________]

[Cancel] [Remove Attachment]
```

### 21.1 Removal Reason

Rules:

- Required
- Must be a string
- Cannot contain only whitespace
- Leading and trailing whitespace are trimmed
- Minimum 3 characters after trimming
- Maximum 255 characters after trimming

### 21.2 Remove Attachment API

Endpoint:

`DELETE /api/v1/attachments/:id?requesterId={requesterId}`

Request body:

```json
{
  "removalReason": "Uploaded the wrong screenshot."
}
```

The UI sends `requesterId` as a query parameter and `removalReason` as JSON request body.

---

## 22. Remove Attachment Success

After successful removal:

- Update the attachment state.
- Keep the attachment metadata visible.
- Display the removed status.
- Disable or hide Download.
- Disable or hide Preview.

Display:

> Attachment removed successfully.

---

## 23. Attachment Error States

- **Unsupported File Type:** `This file type is not supported.`
- **File Too Large:** `File size must not exceed 5 MiB (5,242,880 bytes).`
- **Maximum Active Attachments:** `This ticket already has the maximum number of active attachments.`
- **Upload Failure:** `Unable to upload the attachment. Please try again.`
- **Download Failure:** `Unable to download the attachment. Please try again.`
- **Attachment Not Found:** `Attachment not found.`
- **Already Removed:** `This attachment has already been removed.`
- **Remove Failure:** `Unable to remove the attachment. Please try again.`

---

## 24. Requester Context

The UI maintains `selectedRequesterId`.  
The API uses `requesterId`.

Mapping:

| UI | API |
|---|---|
| `selectedRequesterId` | `requesterId` |

The selected requester must be used consistently for requester-scoped operations.

---

## 25. API to UI Mapping

| UI Operation | API Endpoint | Method |
|---|---|---|
| Load active Requesters | `/api/v1/requesters/active` | `GET` |
| Load active Categories | `/api/v1/categories` | `GET` |
| Load active Related Systems | `/api/v1/related-systems` | `GET` |
| Create Ticket | `/api/v1/tickets` | `POST` |
| Load My Tickets | `/api/v1/tickets` | `GET` |
| Get Ticket Detail | `/api/v1/tickets/:id` | `GET` |
| Upload Attachment | `/api/v1/tickets/:id/attachments` | `POST` |
| Download Attachment | `/api/v1/attachments/:id/download` | `GET` |
| Remove Attachment | `/api/v1/attachments/:id` | `DELETE` |

---

## 26. Responsive UI

### Desktop >= 992px

- **My Tickets:** Use a data table (`Ticket No | Created | Summary | Category | Priority | Status | Last Updated`).
- **Ticket Detail:** A 2-column layout may be used for ticket information and attachment information.

### Tablet 768-991px

- Use 2-column layout where appropriate.
- Form fields expand to available width.
- Reduce table columns if necessary.
- Keep all important actions accessible.

### Mobile < 768px

**My Tickets:** Should use cards instead of a table.

Example Card:

```text
TKT-2026-000001
Unable to access company email

Software
HIGH
NEW

Created: 25 Aug 2026
Updated: 25 Aug 2026

[View Detail]
```

**Create Ticket:**

- Stack all fields vertically.
- Dropzone uses full width.
- Buttons use full width where appropriate.

**Ticket Detail:**

- Stack ticket information vertically.
- Stack attachment information vertically.
- Stack attachment actions when necessary.

*No horizontal scrolling is allowed.*

---

## 27. Accessibility

- **Required Fields:** Required fields must display `*`. The label must also communicate that the field is required.
- **Validation:** Error messages must appear directly below the related field.
- **Focus:** Keyboard focus must have a visible focus ring using Secondary Green.
- **Contrast:** Text and interactive elements must meet WCAG 2.1 AA contrast requirements.
- **Color:** Do not communicate Error, Priority, or Status using color alone. Always include readable text.

---

## 28. UI State Checklist

Every major screen should support the following states:

- Loading
- Success
- Empty
- Validation Error
- API Error
- Disabled
- Permission/Ownership Error where applicable

### Development Requester Selection
- [ ] Loading
- [ ] Requester list loaded
- [ ] No active Requesters
- [ ] API error
- [ ] Continue disabled
- [ ] Continue enabled

### Create Ticket
- [ ] Initial form
- [ ] Loading reference data
- [ ] Validation error
- [ ] Submitting
- [ ] Ticket created
- [ ] Attachment selected
- [ ] Attachment uploading
- [ ] Attachment upload failed
- [ ] Success

### My Tickets
- [ ] Loading
- [ ] Has tickets
- [ ] Empty
- [ ] No search results
- [ ] Filtered results
- [ ] Pagination
- [ ] Invalid query
- [ ] API failure

### Ticket Detail
- [ ] Loading
- [ ] Loaded
- [ ] Ticket not found
- [ ] Forbidden
- [ ] Active attachment
- [ ] Attachment download
- [ ] Attachment removed
- [ ] Remove confirmation
- [ ] Remove success
- [ ] Attachment error

---

## 29. Visual Inspection Checklist

### Layout
- [ ] Workspace is centered on desktop.
- [ ] Maximum workspace width is 1280px.
- [ ] No horizontal scrollbar on mobile.
- [ ] Forms stack correctly on mobile.
- [ ] Tables convert to cards on mobile.
- [ ] Attachment filenames do not overflow.

### Visual
- [ ] Green design tokens are used consistently.
- [ ] Primary actions use Primary Green.
- [ ] Read-only fields are visually distinct.
- [ ] Status badges are readable.
- [ ] Priority badges are readable.
- [ ] Cards have consistent spacing.
- [ ] Error states use Error color.
- [ ] Required fields display `*`.
- [ ] Focus indicators are visible.

### Interaction
- [ ] Buttons have hover states.
- [ ] Buttons have disabled states.
- [ ] Keyboard focus is visible.
- [ ] Loading state prevents duplicate submissions.
- [ ] Confirmation appears before attachment removal.
- [ ] Removed attachments cannot be downloaded.
- [ ] Removed attachment metadata remains visible.

### API/UI Consistency
- [ ] UI sends the correct `requesterId`.
- [ ] Active Requesters are loaded from the API.
- [ ] Active Categories are loaded from the API.
- [ ] Active Related Systems are loaded from the API.
- [ ] Ticket list is requester-scoped.
- [ ] Ticket Detail verifies ownership through the API.
- [ ] Attachment upload uses the created Ticket ID.
- [ ] Removed attachments cannot be downloaded.
- [ ] Removed attachment metadata remains visible.
- [ ] Maximum 5 active attachments is enforced.
- [ ] File size limit is 5 MiB.
- [ ] Allowed file types match the API specification.
- [ ] Search supports Ticket Number, Summary, and Description.
- [ ] Search is case-insensitive.
- [ ] Pagination uses supported limits: 10, 20, 50.
- [ ] Sorting values match the API specification.

---

## 30. Artifact Screenshots

Store screenshots under:

`artifacts/lab-02/screenshots/`

Recommended structure:

```text
artifacts/lab-02/screenshots/
├── requester-selection/
├── create-ticket/
├── my-tickets/
└── ticket-detail/
```

- **Requester Selection:** Normal state, Loading state, Error state
- **Create Ticket:** Empty form, Validation error, Filled form, Attachment selected, Upload state, Success
- **My Tickets:** Ticket list, Search, Filter, Sort, Empty state, Pagination, Mobile card view
- **Ticket Detail:** Normal ticket, Active attachment, Remove attachment dialog, Soft-removed attachment, Ownership/Forbidden state

---

## 31. Lab 2 Scope Boundary

The UI must not implement real authentication in Lab 2. Do not implement:

- Password login
- JWT authentication
- Session authentication
- Real role-based authorization
- Authenticated identity

The Development Requester is only a testing context. Authentication will be introduced in Lab 3.

In Lab 3, the requester identity will be obtained from:

`Authorization: Bearer <JWT_TOKEN>`

The existing requester-scoped UI behavior can remain while the source of the requester identity changes from `selectedRequesterId` to the authenticated identity.