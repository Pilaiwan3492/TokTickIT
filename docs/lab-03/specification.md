# Lab 3 Sprint Engineering Specification: TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens

## 1. Sprint Goal
Deliver secure authentication, session management, and server-side role-based authorization across three distinct roles (Requester, IT Staff, and Administrator) for TokTickIT, introducing operational IT Staff Ticket Queue and Detail workflows with Public Comments and role-restricted Internal Notes, a minimalist Administrator User Management screen with account safety rules, and maintaining full backward-compatible Requester ticket capabilities migrated from Lab 2 under the Zen Green design system.

## 2. Stakeholder Request Interpretation
The temporary Development Requester selector served its purpose during early development, but the system now requires real users, authentication, and role boundaries. Administrators need a minimalist User Management screen to view, search, filter, create accounts, assign a single permitted role, update basic account info, activate/deactivate accounts, and set initial passwords with mandatory first-login password changes. Requesters must continue using all ticket features developed in Lab 2 using their authenticated identity, with the ability to participate in Public Comments and indicate when a problem appears resolved without formally closing tickets. IT Staff need a dedicated Ticket Queue to locate and prioritize work, open Ticket Detail, claim or reassign ownership, adjust IT Priority, transition ticket statuses through an approved workflow, communicate publicly with Requesters, and record private Internal Notes. All screens and APIs must be protected on the server side using the Zen Green design language.

## 3. Scope

### Included
- **Authentication & Session Lifecycle**: Email/password authentication, password hashing with bcrypt, canonical JWT Bearer token management, server-side logout invalidation via token revocation, current-user retrieval (`/api/v1/auth/me`), and logout.
- **Mandatory First-Login Password Change**: Immediate password change enforcement for accounts provisioned with initial passwords, blocking normal application entry until completed.
- **Role-Based Authorization**: Server-side enforcement for three roles: `Requester`, `IT Staff`, and `Administrator`.
- **Requester Identity Migration & Regression**: Evolution of Lab 2 Development Requesters into authenticated User entities; removal of the client-side selector while preserving 100% of Lab 2 ticket and attachment operations.
- **Public Comments**: Append-only communication visible to Requesters, IT Staff, and Administrators.
- **Requester Resolution Indication**: "Problem Appears Resolved" flag allowing Requesters to signal issue resolution without formally changing status to Resolved or Closed.
- **IT Staff Ticket Queue**: Searchable, filterable, sortable, and paginated queue for active IT tickets with status and priority badges.
- **IT Staff Ticket Operations**: Claiming and reassigning ticket ownership, independent IT Priority assignment, and workflow status transitions according to the approved transition matrix.
- **Internal Notes**: Append-only operational notes strictly restricted to IT Staff and Administrators.
- **Minimalist Administrator User Management**: Single-screen user list, search by name/email, role filtering, user creation with one role, basic editing, activation toggling, and initial password reset.
- **Administrator Safety Guards**: Prevention of duplicate emails, prevention of self-deactivation, and prevention of removing/deactivating the last active Administrator.
- **Database Schema Evolution & Idempotent Seeding**: PostgreSQL and Prisma migration preserving existing Lab 2 data with comprehensive seed datasets.
- **Zen Green UI Extensions**: Consistent design tokens, cards, badges, buttons, form controls, responsive breakpoints (desktop, tablet, mobile), and robust feedback states.

### Explicitly Excluded
- Email invitations, password-reset emails, multi-factor authentication (MFA), social login, and SSO.
- Self-registration and Requester-created accounts.
- "Actions Taken" by IT Staff (deferred to Lab 4).
- Formal SLA calculations, escalation rules, and automated notification services.
- Dashboards and KPI analytics beyond simple queue counters.
- Multi-tenant organizations, departments, customer administration, and profile photo uploads.
- Multiple roles assigned to a single user.
- User deletion, bulk user operations, import/export, and account-history/audit screens.
- Account locking, lockout duration counters, and administrator unlock workflows.
- Advanced user-list features such as mandatory pagination or multi-column sorting on the Admin user screen.

## 4. Functional Requirements

### 4.1 Authentication & Account Security
- **FR-01**: The system shall authenticate active users using a valid email address and password.
- **FR-02**: The system shall reject login attempts for inactive accounts with a distinct safe error code (`ACCOUNT_INACTIVE`) without exposing unnecessary account metadata.
- **FR-03**: The system shall enforce mandatory password change upon first login for any user marked with an initial password, prohibiting access to standard application views and APIs until updated.
- **FR-04**: The system shall provide an endpoint to retrieve the current authenticated user's profile and role.
- **FR-05**: The system shall provide an endpoint to invalidate the authenticated session and revoke the current active token on the server (`POST /api/v1/auth/logout`), rejecting any subsequent requests using that revoked token with HTTP 401 `SESSION_REVOKED`.
- **FR-06**: The application shell shall present navigation links and user identity badges corresponding strictly to the authenticated user's assigned role, removing the Lab 2 Development Requester selector.

### 4.2 Requester Workflows & Regression
- **FR-07**: The system shall enforce that all Lab 2 ticket and attachment operations (create ticket, my tickets, ticket detail, file upload, file download, soft removal) derive requester identity exclusively from the authenticated session.
- **FR-08**: The system shall allow Requesters to post and inspect Public Comments on tickets they own.
- **FR-09**: The system shall allow Requesters to indicate that a reported issue appears resolved on their owned tickets.

### 4.3 IT Staff Operations
- **FR-10**: The system shall provide IT Staff with a shared Ticket Queue displaying Ticket Number, Created Date, Summary, Category, Requested Priority, IT Priority, Status, and Owner.
- **FR-11**: The system shall allow IT Staff to search the queue (by ticket number or summary), filter by status, priority, and ownership (All / Unassigned / Assigned to Me), sort columns, and navigate through paginated results.
- **FR-12**: The system shall allow IT Staff to open Ticket Detail from the queue to review full ticket data, attachments, public comments, and internal notes.
- **FR-13**: The system shall allow IT Staff to claim unassigned tickets or reassign ownership to any active IT Staff or Administrator.
- **FR-14**: The system shall allow IT Staff to update IT Priority independently of Requested Priority.
- **FR-15**: The system shall allow IT Staff to transition ticket status strictly according to the approved status transition matrix.
- **FR-16**: The system shall allow IT Staff to create and view append-only Internal Notes on any ticket.
- **FR-17**: The system shall allow IT Staff to post Public Comments to communicate directly with the Requester.

### 4.4 Administrator User Management
- **FR-18**: The system shall allow Administrators to view a list of all users showing Name, Email, Role, Status, and an Edit action.
- **FR-19**: The system shall allow Administrators to search users by name or email and filter by role.
- **FR-20**: The system shall allow Administrators to create new user accounts specifying Name, Email, one permitted role, activation state, and an initial password.
- **FR-21**: The system shall allow Administrators to edit a user's Name, Email, Role, and Activation state.
- **FR-22**: The system shall allow Administrators to reset/set a new initial password for any user, flagging the user to require a password change on next login.
- **FR-23**: The system shall enforce Administrator safety guards: preventing duplicate emails, preventing self-deactivation, and preventing deactivation or role change of the last active Administrator.

### 4.5 Required Roles & Authorization Matrix

The table below defines the authoritative Authorization Matrix for all operations in TokTickIT Lab 3. Every protected operation must be enforced by server-side middleware; hiding or disabling frontend controls provides user guidance, not security enforcement.

| Operation / Protected Action | Requester | IT Staff | Administrator | Enforcement & Security Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Authenticate / Login** | ✅ | ✅ | ✅ | Active accounts only (`isActive: true`) |
| **Mandatory Password Change** | ✅ | ✅ | ✅ | Permitted when `mustChangePassword: true` |
| **Create Own Ticket** | ✅ | ❌ | ❌ | Server assigns `requesterId` from session |
| **View Own Ticket & Attachments** | ✅ Own Only | ❌ | ❌ | Returns 403/404 for other Requesters |
| **Upload / Remove Own Attachments** | ✅ Own Only | ❌ | ❌ | Ownership verified against parent ticket |
| **Mark "Problem Appears Resolved"** | ✅ Own Only | ❌ | ❌ | Sets `isRequesterResolved`; does not alter status |
| **View Public Comments** | ✅ Own Only | ✅ All | ✅ All | Shared communication on tickets |
| **Post Public Comments** | ✅ Own Only | ✅ All | ✅ All | Append-only; author set from session |
| **View Internal Notes** | ❌ (403 Forbidden) | ✅ | ✅ | Strictly blocked for Requesters; no data leak |
| **Create Internal Notes** | ❌ (403 Forbidden) | ✅ | ✅ | Append-only operational notes |
| **View IT Staff Ticket Queue** | ❌ (403 Forbidden) | ✅ | ✅ | Shared operational queue with search/filter |
| **View Full Staff Ticket Detail** | ❌ (403 Forbidden) | ✅ | ✅ | Operational view with internal notes |
| **Claim / Reassign Ticket Owner** | ❌ (403 Forbidden) | ✅ | ✅ | Target owner must be active IT Staff or Admin |
| **Update IT Priority** | ❌ (403 Forbidden) | ✅ | ✅ | Independent from Requested Priority |
| **Transition Ticket Status** | ❌ (403 Forbidden) | ✅ | ✅ | Must strictly follow Status Transition Matrix |
| **User Management: View / Search Users** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | Non-admins rejected with HTTP 403 |
| **User Management: Create User** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | Sets 1 role + initial password |
| **User Management: Edit User** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | Updates name, email, role, active status |
| **User Management: Reset Initial Password** | ❌ (403 Forbidden) | ❌ (403 Forbidden) | ✅ | Sets new password + `mustChangePassword = true` |
| **Safety Guard: Deactivate Self** | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked by BR-21) | Administrator cannot deactivate own account |
| **Safety Guard: Deactivate Last Admin** | ❌ (Blocked) | ❌ (Blocked) | ❌ (Blocked by BR-22) | System must retain $\ge 1$ active Administrator |

> [!NOTE]
> **Administrator Permission Justification**: In Lab 3, Administrator and IT Staff responsibilities are conceptually separate (IT Staff manage tickets, Administrators manage accounts). As specified in Handout Section 4.3, an Administrator does not automatically have IT Staff ticket permissions unless explicitly defined by the approved authorization matrix. In TokTickIT Lab 3, this Authorization Matrix explicitly authorizes Administrators to perform IT Staff ticket operations (Queue, Detail, Assignment, Priority, Status, Comments, Notes) in addition to User Management, allowing Administrators to act as supervisory IT staff when needed.

---

## 5. Business Rules

### Authentication & Roles
- **BR-01**: Only an active user (`isActive: true`) with valid credentials may authenticate. If credentials are correct but the account is inactive (`isActive: false`), the API returns HTTP 401 with code `ACCOUNT_INACTIVE`. If email or password is invalid, the API returns HTTP 401 with code `INVALID_CREDENTIALS`. Neither error exposes whether an email address exists in the system.
- **BR-02**: A user marked as requiring a password change (`mustChangePassword: true`) cannot enter the normal application or invoke operational APIs until a new valid password meeting policy is saved.
- **BR-03**: The authenticated user identity established on the server, not a client-supplied `requesterId`, determines ownership and authorization for all Requester operations.
- **BR-04**: Each user has exactly one permitted role: `REQUESTER`, `IT_STAFF`, or `ADMINISTRATOR`. Multiple roles per user are prohibited.
- **BR-05**: Passwords must be hashed using a cryptographically secure algorithm (bcrypt with salt rounds $\ge 10$) before storage. Passwords must never be stored, logged, or returned in plaintext.
- **BR-06**: Passwords must be at least 8 characters long and include uppercase, lowercase, and a number or special character. When changing password, the new password cannot match the current initial password.

### Comments & Notes
- **BR-07**: Public Comments are visible to the Ticket Requester, IT Staff, and Administrators. Internal Notes are strictly visible and manageable only by IT Staff and Administrators.
- **BR-08**: Both Public Comments and Internal Notes are append-only. Editing and deletion are strictly excluded.
- **BR-09**: Each Comment and Note records its author (`userId`) and creation timestamp (`createdAt`) from the backend. Author identity cannot be overridden by client input.
- **BR-10**: Content for Comments and Notes cannot be empty or whitespace-only, and must be between 1 and 2,000 characters.

### Requester Permissions & Problem Resolution
- **BR-11**: A Requester may indicate that their problem appears resolved (`isRequesterResolved: true`), but cannot formally transition ticket status to `Resolved` or `Closed`. Formal resolution is reserved for IT Staff and Administrators.
- **BR-12**: Requesters can only view, search, and manage tickets and attachments they own. Access attempts to other users' tickets or attachments must be rejected with HTTP 403 (or 404 for missing resource simulation).

### Ticket Ownership, Priority & Workflow
- **BR-13**: Each ticket may have zero or one primary Ticket Owner (`ownerId`), who must be an active IT Staff or Administrator. Newly created tickets are unassigned (`ownerId: null`).
- **BR-14**: Requested Priority remains the original value submitted by the Requester. IT Priority initially copies Requested Priority at ticket creation time and may subsequently be altered only by IT Staff or Administrators.
- **BR-15**: The required Ticket statuses are: `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, and `Cancelled`.
- **BR-16**: Permitted status transitions must conform strictly to the following matrix:
  - `New` $\rightarrow$ `Open`, `Cancelled`
  - `Open` $\rightarrow$ `In Progress`, `Waiting for Requester`, `Cancelled`
  - `In Progress` $\rightarrow$ `Waiting for Requester`, `Resolved`, `Cancelled`
  - `Waiting for Requester` $\rightarrow$ `In Progress`, `Resolved`, `Cancelled`
  - `Resolved` $\rightarrow$ `Closed`, `Reopened`
  - `Reopened` $\rightarrow$ `In Progress`, `Cancelled`
  - `Closed` $\rightarrow$ Terminal (no transitions permitted)
  - `Cancelled` $\rightarrow$ Terminal (no transitions permitted)
- **BR-17**: Only active IT Staff and Administrators may execute status transitions.
- **BR-18**: "Actions Taken by IT Staff" verification before resolution is deferred to Lab 4; resolution in Lab 3 requires only an active IT Staff or Administrator actor.

### Administrator User Management & Safety Rules
- **BR-19**: User deletion is prohibited; user deactivation (`isActive: false`) must be used exclusively to revoke system access.
- **BR-20**: Email addresses must be globally unique across all users (case-insensitive). Duplicate email creation or modification must be rejected with HTTP 409 Conflict.
- **BR-21**: An Administrator is prohibited from deactivating their own account (`self-deactivation prevention`).
- **BR-22**: The system must prohibit deactivating or reassigning the role of the last active Administrator in the system (`last active administrator protection`).
- **BR-23**: When an Administrator provisions an initial password or issues a password reset, `mustChangePassword` must be set to `true`.
- **BR-24**: Direct API access by non-Administrators to `/api/admin/*` endpoints must return HTTP 403 Forbidden.
- **BR-25**: Direct API access by Requesters to `/api/tickets/:id/notes` endpoints must return HTTP 403 Forbidden without leaking whether notes exist.

### Login Attempts, Account Security & Server-Side Invalidation
- **BR-26**: Failed login attempts return safe generic errors (`INVALID_CREDENTIALS`). The system does not maintain persistent failed-login counters or execute account-lockout durations. Advanced account recovery, approval, and unlock workflows are explicitly excluded from Lab 3. The frontend disables the login submit button during in-flight requests to prevent accidental duplicate submissions.
- **BR-27**: When an account is deactivated (`isActive: false`), active tokens associated with that user are rejected upon subsequent API verification, and future login attempts are rejected with `ACCOUNT_INACTIVE`.
- **BR-28**: **Server-Side Logout Invalidation**: Each issued JWT contains a unique token identifier (`jti`). When a user invokes `POST /api/v1/auth/logout`, the server records the `jti` in a server-side revoked token registry (active until the token's original expiration time `exp`). Any subsequent request presenting a revoked `jti` is rejected by server middleware with HTTP 401 and error code `SESSION_REVOKED`. The client simultaneously purges the token from local storage.

---

## 6. UI Specification Summary
The UI adheres strictly to the Zen Green design system established in Lab 2. All screens are responsive and verified on Desktop ($\ge 1280\text{px}$), Tablet ($768\text{px} - 1024\text{px}$), and Mobile ($375\text{px} - 480\text{px}$).
- **Application Shell**: Displays brand logo, active user full name, role badge, role-specific navigation items, and a Logout action. The temporary Development Requester selector is removed.
- **Login Screen**: Minimalist authentication card featuring email and password inputs, show/hide password toggle, loading spinner on submit, and safe failure messages. Distinguishes `INVALID_CREDENTIALS` (Invalid email or password) and `ACCOUNT_INACTIVE` (Account inactive notice).
- **Mandatory Password Change Screen**: Rendered immediately upon login for users with `mustChangePassword: true`. Normal navigation is suppressed until the user enters their temporary password, sets a valid new password, and confirms it.
- **IT Staff Ticket Queue**: Table view on desktop showing Ticket Number, Created Date, Summary, Category, Requested Priority, IT Priority, Current Status, and Owner. Transforms into responsive stacked cards on mobile. Includes search input, filter dropdowns (Status, Priority, Ownership), sorting controls, and pagination bar.
- **IT Staff Ticket Detail**: Header with back button, ticket metadata grid, operational controls (Owner assignment, IT Priority dropdown, Status transition selector), attachments list, and clearly distinguished tabbed sections for Public Comments and Internal Notes.
- **Administrator User Management**: Simple, professional user table showing Name, Email, Role, Status, and Edit action. Header includes user count, search box, role filter, and "+ Create User" button. Create/Edit drawer or modal handles account details, activation toggle, and initial password assignment.
- Detailed component states, spacing tokens, colors, and responsive rules are detailed in `docs/lab-03/ui-spec.md`.

---

## 7. Data Changes & Migration

### 7.1 Schema Additions & Modifications
- **User Model**:
  - `id`: String (UUID / CUID, Primary Key)
  - `email`: String (Unique, Indexed)
  - `name`: String
  - `passwordHash`: String
  - `role`: Role Enum (`REQUESTER`, `IT_STAFF`, `ADMIN`)
  - `isActive`: Boolean (Default: true, Indexed)
  - `mustChangePassword`: Boolean (Default: false)
  - `tokenVersion`: Int (Default: 0, for bulk invalidation on deactivation/password change)
  - `createdAt`: DateTime (Default: now())
  - `updatedAt`: DateTime (Updated automatically)
- **Ticket Model Extensions**:
  - `ownerId`: String (Nullable, Foreign Key $\rightarrow$ User.id, Indexed)
  - `itPriority`: Priority Enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`, Nullable)
  - `status`: Updated TicketStatus Enum (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`)
  - `isRequesterResolved`: Boolean (Default: false)
- **Comment Model (Public)**:
  - `id`: String (Primary Key)
  - `ticketId`: String (Foreign Key $\rightarrow$ Ticket.id, Indexed)
  - `authorId`: String (Foreign Key $\rightarrow$ User.id)
  - `content`: Text (1 - 2,000 characters)
  - `createdAt`: DateTime (Default: now())
- **InternalNote Model**:
  - `id`: String (Primary Key)
  - `ticketId`: String (Foreign Key $\rightarrow$ Ticket.id, Indexed)
  - `authorId`: String (Foreign Key $\rightarrow$ User.id)
  - `content`: Text (1 - 2,000 characters)
  - `createdAt`: DateTime (Default: now())

### 7.2 Migration Strategy: Development Requester to User Model

Lab 3 requires migrating all Development Requester entities into the authenticated `User` model without breaking existing tickets or attachment associations. The migration strategy executes through the following concrete steps:

1. **Preserve Legacy Identifiers**:
   When migrating existing Development Requesters (e.g. Alice, Bob, Charlie, David, Eve), their existing primary key `id` values are preserved directly as `User.id`.
2. **Preserve Foreign Key Integrity**:
   Because `User.id` reuses the existing legacy `requesterId`, all existing `Ticket.requesterId` foreign keys remain valid without any orphaned references or database integrity constraint violations.
3. **Deterministic ID Mapping (Fallback)**:
   If any legacy database record uses an incompatible identifier type during migration, an explicit transactional migration script maps `legacy_requester_id` $\rightarrow$ `new_user_uuid` and updates all corresponding `Ticket.requesterId` values within a single atomic Prisma transaction.
4. **Provision Initial Credentials**:
   Each migrated Requester user is provisioned with:
   - `role`: `REQUESTER`
   - `passwordHash`: Bcrypt hash of a standardized initial temporary password (e.g., `InitialPass123!`)
   - `mustChangePassword`: `true` (enforcing password change on first login per BR-02)
   - `isActive`: Preserves original requester `isActive` state (e.g., active for Alice/Bob/Charlie/David, inactive for Eve).
5. **Idempotent Seed & Migration Execution**:
   The migration and seed script uses Prisma `upsert` matching on unique `email` or `id`. For existing users who have already logged in and updated their password (`mustChangePassword: false`), repeated seed/migration runs will **not** reset their password hash or alter ticket ownership.
6. **Removal of Client-Side Selector State**:
   The `RequesterContext` and LocalStorage key `selectedRequesterId` from Lab 2 are deprecated and removed. All client requests now supply the canonical Bearer token, and the backend resolves requester identity via authenticated token extraction.
7. **Verification & Regression Checks**:
   Post-migration verification scripts assert:
   - Total ticket count before migration equals total ticket count after migration.
   - Every ticket's `requesterId` points to an existing `User` record with `role: REQUESTER`.
   - Existing attachments remain associated with their original tickets.

### 7.3 Seed Data Requirements
- **Requesters**: At least 4 active Requesters and 1 inactive Requester.
- **IT Staff**: At least 3 active IT Staff and 1 inactive IT Staff.
- **Administrators**: At least 1 active Administrator.
- **Tickets**: Realistic tickets distributed across Requesters, statuses, priorities, and assigned/unassigned states.
- **Comments & Notes**: Realistic sample Public Comments and role-restricted Internal Notes.
- **Idempotency**: All seed operations use `upsert` and are safe to run repeatedly.

---

## 8. API Contract Summary
The REST API contract is fully documented in `docs/lab-03/api-spec.md`. Key endpoint groups include:
- **Authentication**:
  - `POST /api/v1/auth/login`: Authenticate with email/password; returns token and user profile. Distinguishes `INVALID_CREDENTIALS` and `ACCOUNT_INACTIVE`.
  - `POST /api/v1/auth/logout`: Server-side invalidation of session token.
  - `GET /api/v1/auth/me`: Retrieve current authenticated user profile and permissions.
  - `POST /api/v1/auth/change-password`: Change password (required for initial password flow).
- **Requester Continuation**:
  - All Lab 2 endpoints (`GET /api/v1/tickets`, `POST /api/v1/tickets`, `GET /api/v1/tickets/:id`, `/attachments`) derive requester identity from the session Bearer token.
  - `POST /api/v1/tickets/:id/resolve-indicator`: Toggle requester resolution flag.
- **IT Staff Queue & Operations**:
  - `GET /api/v1/staff/tickets`: Retrieve queue with `search`, `status`, `priority`, `owner`, `sortBy`, `sortOrder`, `page`, and `pageSize`.
  - `GET /api/v1/staff/tickets/:id`: Retrieve ticket detail with internal notes and operational fields.
  - `PATCH /api/v1/staff/tickets/:id/assignment`: Claim or reassign ownership.
  - `PATCH /api/v1/staff/tickets/:id/priority`: Update IT Priority.
  - `PATCH /api/v1/staff/tickets/:id/status`: Update status through permitted transition matrix.
- **Comments & Notes**:
  - `GET /api/v1/tickets/:id/comments` & `POST /api/v1/tickets/:id/comments`: Public Comments.
  - `GET /api/v1/tickets/:id/notes` & `POST /api/v1/tickets/:id/notes`: Internal Notes (IT Staff and Admin only).
- **Administrator User Management**:
  - `GET /api/v1/admin/users`: List users with search and role filters.
  - `POST /api/v1/admin/users`: Create user with initial password.
  - `PATCH /api/v1/admin/users/:id`: Edit user profile and active status.
  - `POST /api/v1/admin/users/:id/reset-password`: Set new initial password.

---

## 9. Acceptance Criteria

- **AC-01**: Given an active user with valid credentials, when the user logs in, then the backend establishes authenticated access and returns the permitted user identity and role.
- **AC-02**: Given a user who must change their initial password, when login succeeds, then normal application screens remain unavailable until a valid new password is saved.
- **AC-03**: Given an authenticated Requester, when the client supplies another `requesterId`, then the backend still applies the authenticated identity and does not return another Requester's data.
- **AC-04**: Given a Requester account, when an Internal Note endpoint is requested, then the operation is rejected with HTTP 403 Forbidden without exposing note content.
- **AC-05**: Given an inactive user account, when attempting to authenticate, then the system rejects access with HTTP 401 and code `ACCOUNT_INACTIVE`.
- **AC-06**: Given invalid login credentials, when the user submits the login form, then the system rejects access with HTTP 401 and code `INVALID_CREDENTIALS`.
- **AC-07**: Given an authenticated user, when the user clicks Logout, then the backend registers the token's `jti` as revoked, and any subsequent requests presenting that token are rejected with HTTP 401 `SESSION_REVOKED`.
- **AC-08**: Given an authenticated user, when accessing the application, then the navigation shell displays only routes and actions permitted for their specific role according to the Authorization Matrix.
- **AC-09**: Given an authenticated Requester, when creating a ticket, then the ticket is saved with initial status `New`, `itPriority` matching `requestedPriority`, and `ownerId` set to `null`.
- **AC-10**: Given an authenticated Requester, when viewing My Tickets, then only tickets owned by the current authenticated user are returned.
- **AC-11**: Given a Requester viewing their owned ticket, when posting a non-empty Public Comment, then the comment is recorded with their author ID and timestamp, and appears in the public feed.
- **AC-12**: Given a Requester viewing their owned ticket, when clicking "Problem Appears Resolved", then the ticket records the resolution indication without formally setting status to `Resolved` or `Closed`.
- **AC-13**: Given an active IT Staff user, when loading the Ticket Queue, then all active tickets across all Requesters are displayed with status, priority, and ownership badges.
- **AC-14**: Given an IT Staff user querying the queue, when applying search keywords, status filters, priority filters, or ownership filters, then the queue returns matching tickets with accurate pagination metadata.
- **AC-15**: Given an unassigned ticket, when an IT Staff user clicks "Claim Ticket", then the ticket owner is updated to the current IT Staff user.
- **AC-16**: Given an open ticket, when an IT Staff user selects another active IT Staff member as owner, then the ticket ownership is successfully reassigned.
- **AC-17**: Given an IT Staff user viewing Ticket Detail, when changing IT Priority, then IT Priority updates independently while Requested Priority remains unchanged.
- **AC-18**: Given an IT Staff user, when selecting a valid status transition from the transition matrix, then the ticket status updates successfully.
- **AC-19**: Given an IT Staff user, when attempting an invalid status transition (e.g., `New` directly to `Resolved`), then the system rejects the operation with HTTP 400 Bad Request.
- **AC-20**: Given an IT Staff or Administrator user, when creating an Internal Note, then the note is persisted and displayed only within the Internal Notes tab.
- **AC-21**: Given an Administrator, when loading User Management, then all users are listed with Name, Email, Role, Status, and Edit action.
- **AC-22**: Given an Administrator, when submitting the Create User form with valid details and initial password, then the user is created with `mustChangePassword = true`.
- **AC-23**: Given an Administrator, when creating or updating a user with an email already in use, then the system rejects the operation with HTTP 409 Conflict.
- **AC-24**: Given an Administrator, when attempting to deactivate their own account, then the operation is blocked with a clear safety validation error.
- **AC-25**: Given an Administrator, when attempting to deactivate or reassign the role of the system's last active Administrator, then the operation is blocked with a safety error.

---

## 10. Definition of Done

### Product Completion
- [ ] All approved Lab 3 scope is implemented and verified.
- [ ] All business rules BR-01 through BR-28 are implemented and verified.
- [ ] All acceptance criteria AC-01 through AC-25 have corresponding passing tests.
- [ ] Authentication, session management, and password change flow are fully functional.
- [ ] Server-side role authorization guards strictly enforce the Authorization Matrix.
- [ ] Server-side logout invalidation (`POST /api/v1/auth/logout`) revokes active tokens.
- [ ] Requester regression verified: all Lab 2 capabilities work using authenticated identity.
- [ ] Public Comments and Internal Notes function correctly with strict role visibility.
- [ ] IT Staff Ticket Queue supports search, filtering, sorting, and pagination.
- [ ] IT Staff Ticket Detail supports ownership claim/reassign, IT Priority, and status transitions.
- [ ] Administrator User Management supports user list, search/filter, create, edit, active toggle, and password reset.
- [ ] Administrator safety rules (self-deactivation, last admin, duplicate email) are enforced.
- [ ] Unit, API, UI component, and E2E test suites pass with zero failures.
- [ ] Database schema and idempotent seed scripts conform to specification.
- [ ] Responsive UI verified on Desktop, Tablet, and Mobile across all screens.

### Course Delivery
- [ ] GitHub Issues are tracked on the Kanban board with clear Acceptance Criteria.
- [ ] Feature branches follow the `feature/<issue>-<slug>` convention.
- [ ] Pull requests are opened to `lab3-staging`, reviewed, and approved.
- [ ] `docs/lab-03/specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md` are committed before implementation.
- [ ] Peer review record is completed in `docs/lab-03/reviewer.md`.
- [ ] AI prompt log and reflection are documented in `docs/lab-03/ai-use.md`.
- [ ] Release PR merged from `lab3-staging` to `main`.
- [ ] Final 9-part PDF report compiled and verified against course rubric.

---

## 11. Assumptions and Decisions

- **Canonical Authentication Mechanism**: Signed JSON Web Token (JWT) transmitted via HTTP header:
  ```
  Authorization: Bearer <jwt_token>
  ```
  - **Algorithm**: HMAC-SHA256 (HS256) signed using server-side secret `JWT_SECRET` (minimum 32 characters, never committed to source control).
  - **Token Payload**: `{ jti: string (UUID), sub: userId, email: string, name: string, role: Role, mustChangePassword: boolean, iat: number, exp: number }`.
  - **Token Expiration**: 8 hours from issuance. Refresh tokens and sliding sessions are explicitly excluded from Lab 3 scope; upon expiration, users are prompted to log in again.
  - **Client Token Storage**: Managed in client-side React `AuthContext` (in memory), with persistence to `localStorage` under key `toktickit_auth_token` to maintain authentication state across browser page refreshes in local lab environments.
  - **Server-Side Logout Invalidation**: Calling `POST /api/v1/auth/logout` records the token's unique identifier (`jti`) into a server-side token revocation registry until its expiration timestamp (`exp`). Even if a token is copied or stolen, it is rendered immediately invalid upon logout, rejecting any subsequent API access with `401 Unauthorized` (`SESSION_REVOKED`). The client simultaneously clears `toktickit_auth_token` from `localStorage` and resets `AuthContext`.
  - **Token Security Guardrails**: Because JWT tokens are held in client storage, the application enforces strict security practices:
    1. Tokens are never displayed in any UI view or rendered into the DOM.
    2. Tokens are never printed in console logs or backend debug output.
    3. Tokens are never transmitted to external third-party endpoints or untrusted services.
    4. Authentication secrets (`JWT_SECRET`) are strictly maintained in `.env` and excluded via `.gitignore`.
    5. Server error responses never leak tokens, secret keys, or database stack traces.
  - **CSRF Consideration**: Because Bearer tokens are stored in application memory/localStorage and explicitly dispatched by client fetch headers rather than automatically attached by web browsers (as with cookies), standard Cross-Site Request Forgery (CSRF) vulnerabilities are eliminated by architectural design.
- **Login Attempt Policy**: Failed login attempts return safe generic errors (`INVALID_CREDENTIALS`). The system does not maintain persistent failed-login counters or execute account-lockout durations. Advanced account recovery, approval, and unlock workflows are explicitly excluded from Lab 3.
- **Requester Identity Source**: Backend middleware extracts `user.id` and verifies `role` from the authenticated token, discarding any client-supplied `requesterId`.
- **Append-Only Architecture**: Public comments and internal notes cannot be updated or soft-removed in Lab 3 to ensure audit trail integrity.
- **Separate Models for Comments vs Notes**: Implemented with clear role separation to avoid any possibility of internal notes leaking to Requesters.
- **Admin Safety Protection**: Database query counts active Administrators prior to deactivation or role modification to ensure at least one active Administrator remains.
