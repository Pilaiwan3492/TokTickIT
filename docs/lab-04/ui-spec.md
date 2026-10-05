# Lab 4 UI Specification: TokTickIT Zen Green Design System

## 1. Purpose & Scope

This document defines the comprehensive UI/UX specification for TokTickIT Lab 4 under the **Zen Green Design System**.

Lab 4 introduces role-appropriate operational dashboards and ticket execution workflows:
1. **IT Staff Dashboard (`/dashboard`)**: Operational cockpit for IT Staff and Administrators, featuring metric cards, delta indicators, recent tickets table, and quick actions.
2. **Requester Dashboard (`/dashboard`)**: Streamlined summary for Requesters displaying personal ticket counts, recent tickets, and quick creation/search actions.
3. **Actions Taken on Ticket Detail**: Parent-child work execution logging interface under Ticket Detail, supporting create/edit modal workflows for IT Staff/Admin, and clean read-only presentation for Requesters.
4. **Ticket Workflow & Resolution Feedback**: Visual transition controls enforcing the 8-status matrix, advisory resolution alerts, and optimistic concurrency feedback.
5. **Multi-Viewport Responsiveness & Accessibility**: Consistent usability across Desktop ($\ge 1280\text{px}$), Tablet ($768\text{px} - 1024\text{px}$), and Mobile ($375\text{px} - 480\text{px}$).

---

## 2. Zen Green Design System Tokens

### 2.1 Color Palette

| Token Name | Hex Code | Purpose & Semantic Usage |
| :--- | :--- | :--- |
| **Primary Green** | `#006B3C` | Header bar, primary CTA buttons (`+ Create Ticket`, `Add Action Taken`), active navigation highlight |
| **Primary Green Hover** | `#00522E` | Hover/active states for primary buttons |
| **Secondary Green** | `#0B7A46` | Secondary links, card borders on focus, progress indicators |
| **Pale Green** | `#EAF6EF` | Accent card backgrounds, success alert tints, selected table row highlight |
| **Page Background** | `#F5F7F6` | Global page background canvas |
| **Surface (Card/Modal)**| `#FFFFFF` | Card surfaces, modal dialogues, input form backgrounds |
| **Text Primary** | `#24272A` | Primary headings, table text, body copy |
| **Text Secondary** | `#5F6863` | Subtitles, helper text, timestamps, metric card delta text |
| **Read-only Field** | `#F0F4F2` | Non-editable form inputs, disabled buttons |
| **Border Neutral** | `#D5DDD8` | Input outlines, table cell borders, card outlines |
| **Error / Destructive** | `#B42318` | Error alerts, danger badges, urgent priority |
| **Error Light** | `#FEE4E2` | Error banner background |
| **Warning / Amber** | `#F59E0B` | High priority badge, in-progress indicator, internal notes |
| **Warning Light** | `#FEF3C7` | Warning banner background, follow-up required badge background |
| **Info / Blue** | `#0284C7` | New status badge, informative system alerts |
| **Info Light** | `#E0F2FE` | Info alert background |

### 2.2 Status, Priority & Role Badges

#### Status Badges
- **NEW**: Soft Blue (`bg: #E0F2FE`, `text: #0369A1`, `border: #BAE6FD`)
- **OPEN**: Soft Emerald (`bg: #D1FAE5`, `text: #047857`, `border: #A7F3D0`)
- **IN_PROGRESS**: Amber (`bg: #FEF3C7`, `text: #B45309`, `border: #FDE68A`)
- **WAITING_FOR_REQUESTER**: Soft Purple (`bg: #F3E8FF`, `text: #6B21A8`, `border: #E9D5FF`)
- **RESOLVED**: Zen Green (`bg: #DCFCE7`, `text: #15803D`, `border: #BBF7D0`)
- **CLOSED**: Slate Gray (`bg: #F1F5F9`, `text: #475569`, `border: #E2E8F0`)
- **REOPENED**: Vivid Orange (`bg: #FFEDD5`, `text: #C2410C`, `border: #FED7AA`)
- **CANCELLED**: Soft Red (`bg: #FFE4E6`, `text: #BE123C`, `border: #FECDD3`)

#### Priority Badges
- **LOW**: Slate (`bg: #F1F5F9`, `text: #475569`)
- **MEDIUM**: Light Green (`bg: #EAF6EF`, `text: #0B7A46`)
- **HIGH**: Amber (`bg: #FEF3C7`, `text: #B45309`)
- **URGENT**: Crimson (`bg: #FEE2E2`, `text: #B91C1C`)

---

## 3. Screen Structures & Wireframes

### 3.1 IT Staff Dashboard (`/dashboard`)

#### Desktop Wireframe Layout
```text
+-------------------------------------------------------------------------------------------------------------+
| [Logo] TokTickIT      [Dashboard]  [Ticket Queue]  [User Mgmt*]                        [Michael (Staff) v]  |
+-------------------------------------------------------------------------------------------------------------+
| Welcome back, Michael!                                                                   [ Refresh Button ] |
| Here's what's happening with your queue today.                                                              |
|                                                                                                             |
| +-----------+ +-----------+ +-----------+ +-----------+ +---------------+ +---------------+                 |
| | New       | | Open      | | In Progress| | Waiting Req| | My Assigned  | | Unassigned    |                 |
| | 14        | | 23        | | 18        | | 7         | | 16            | | 8             |                 |
| | [View all>| | [View all>| | [View all>| | [View all>| | [View all >]  | | [View all >]  |                 |
| +-----------+ +-----------+ +-----------+ +-----------+ +---------------+ +---------------+                 |
|                                                                                                             |
| Attention Required:  [ 🔴 Urgent: 3 tickets > ]    [ 🟠 High Priority: 12 tickets > ]                       |
|                                                                                                             |
| +-----------------------------------------------------+  +------------------------------------------------+ |
| | Recent Queue Tickets                    [ View all ]|  | My Recent Actions Taken (Performed by You)    | |
| |-----------------------------------------------------|  |------------------------------------------------| |
| | TKT-2026-00034  Laptop battery drains  [In Progress]|  | May 13 14:15 | TKT-00034: Replaced battery pack| |
| | TKT-2026-00030  Printer shows offline  [Open       ]|  | May 12 10:30 | TKT-00030: Reset print spooler  | |
| | TKT-2026-00028  Outlook freezing       [In Progress]|  | May 11 09:00 | TKT-00028: Repaired PST archive | |
| | TKT-2026-00023  Phone not receiving    [Open       ]|  | May 10 16:20 | TKT-00023: Re-registered SIP    | |
| | TKT-2026-00019  VPN disconnects        [Resolved   ]|  | May 09 11:45 | TKT-00019: Reissued client cert | |
| +-----------------------------------------------------+  +------------------------------------------------+ |
|                                                          | Quick Actions                                  | |
|                                                          |  [ + Create Ticket                           ] | |
|                                                          |  [ Q Search Tickets                          ] | |
|                                                          |  [ > My Assigned Queue                       ] | |
|                                                          | +----------------------------------------------+ |
+-------------------------------------------------------------------------------------------------------------+
```

#### Key UI Components & Interactions:
1. **Primary Operational Metric Cards (6 Cards)**:
   - Each card displays a title label, large authoritative metric numeral, and accessible drill-down text link (`View all`) that navigates directly to `StaffTicketQueue` with pre-applied URL filter parameters:
     - `New` $\rightarrow$ `/staff/tickets?status=NEW`
     - `Open` $\rightarrow$ `/staff/tickets?status=OPEN`
     - `In Progress` $\rightarrow$ `/staff/tickets?status=IN_PROGRESS`
     - `Waiting for Requester` $\rightarrow$ `/staff/tickets?status=WAITING_FOR_REQUESTER`
     - `My Assigned` $\rightarrow$ `/staff/tickets?ownership=assigned_to_me`
     - `Unassigned` $\rightarrow$ `/staff/tickets?ownership=unassigned`
2. **Priority Attention Strip**:
   - Prominently displays clickable badges for urgent and high-priority tickets requiring immediate IT triage:
     - `Urgent Priority` $\rightarrow$ `/staff/tickets?priority=URGENT`
     - `High Priority` $\rightarrow$ `/staff/tickets?priority=HIGH`
3. **Recent Tickets List**:
   - Displays up to 5 most recently active tickets across the service desk.
   - Clicking a ticket row or ticket number navigates directly to `/staff/tickets/:id`.
4. **My Recent Actions Taken (Current-User Work Log)**:
   - Fulfills the requirement to demonstrate current-user Actions Taken directly on the IT Staff Dashboard.
   - Queries and displays up to 5 most recent Actions Taken entries where `performedById = currentUserId`, ordered by `actionDate DESC`.
   - Each item shows action timestamp, ticket number link, description excerpt, result, and follow-up indicator.
   - Clicking an action item navigates directly to `/staff/tickets/:ticketId#actions-taken`.
   - Empty state: When the current user has logged 0 actions, displays: *"You haven't recorded any actions taken yet. Open a ticket from your queue to log work."*
5. **Quick Actions**:
   - `Create Ticket`: opens ticket creation modal or page.
   - `Search Tickets`: jumps to Ticket Queue with search focus.
   - `My Queue`: navigates to `/staff/tickets?ownership=assigned_to_me`.
6. **Administrator Extras**:
   - For users with `role: ADMIN`, a concise secondary statistics card displays system accounts: `Total Active Users: X | Active Staff: Y | Active Admins: Z` with a direct link to `/admin/users`.

---

### 3.2 Requester Dashboard (`/dashboard`)

#### Desktop Wireframe Layout
```text
+-------------------------------------------------------------------------------------------------------------+
| [Logo] TokTickIT           [Dashboard]  [My Tickets]  [Create Ticket]                    [Jennifer (Req) v] |
+-------------------------------------------------------------------------------------------------------------+
| Welcome, Jennifer!                                                                                          |
| Here's the latest on your requests.                                                                         |
|                                                                                                             |
| +-------------------+ +-------------------+ +-------------------+ +-------------------+                     |
| | My Open Tickets   | | Waiting for Me    | | Resolved          | | Closed            |                     |
| | 3                 | | 1                 | | 5                 | | 12                |                     |
| | [ View all > ]    | | [ View all > ]    | | [ View all > ]    | | [ View all > ]    |                     |
| +-------------------+ +-------------------+ +-------------------+ +-------------------+                     |
|                                                                                                             |
| +-----------------------------------------------------+  +------------------------------------------------+ |
| | My Recent Tickets                       [ View all ]|  | Quick Actions                                  | |
| |-----------------------------------------------------|  |                                                | |
| | TKT-2026-001234  Laptop battery drains [In Progress]|  |  [ + Create Ticket                           ] | |
| | TKT-2026-001213  Need new monitor      [In Progress]|  |    Submit a new service desk request          | |
| | TKT-2026-001205  Email not arriving    [Waiting Req]|  |                                                | |
| |-----------------------------------------------------|  |  [ = View My Tickets                         ] | |
| | Recently Resolved Tickets (Max 5)       [ View all ]|  |    Track and review existing requests          | |
| |-----------------------------------------------------|  +------------------------------------------------+ |
| | TKT-2026-001222  Request Figma access  [Resolved   ]|                                                     |
| | TKT-2026-001198  Password reset req    [Resolved   ]|                                                     |
| +-----------------------------------------------------+                                                     |
+-------------------------------------------------------------------------------------------------------------+
```

#### Key UI Components & Interactions:
1. **Metric Cards (4 Cards)**:
   - `My Open Tickets`: Sum of tickets in `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER` $\rightarrow$ links to `/my-tickets?status=open_all`.
   - `Waiting for Me`: Count of tickets where status is `WAITING_FOR_REQUESTER` requiring Requester feedback $\rightarrow$ links to `/my-tickets?status=WAITING_FOR_REQUESTER`.
   - `Resolved`: Count of tickets formally marked `RESOLVED` by IT Staff $\rightarrow$ links to `/my-tickets?status=RESOLVED`.
   - `Closed`: Count of terminal `CLOSED` tickets $\rightarrow$ links to `/my-tickets?status=CLOSED`.
2. **Recent Tickets & Recently Resolved Panels**:
   - `My Recent Tickets`: Displays up to 5 most recently updated tickets owned by the requester with status badges and timestamps (`take: 5`).
   - `Recently Resolved Tickets`: Strictly limited to the top 5 most recently resolved tickets owned by the requester (`status = 'RESOLVED'`, ordered by `updatedAt DESC`, `take: 5`). Clicking any row navigates to `/my-tickets/:id`. The header link `View all` links to `/my-tickets?status=RESOLVED`. Empty state: Displays *"No recently resolved tickets"*.
3. **Empty State**:
   - If a requester has 0 tickets, displays an illustration with heading "No tickets submitted yet" and a prominent primary green button `[ + Create your first ticket ]`.

---

### 3.3 Actions Taken on Ticket Detail

The Actions Taken section is rendered directly below the main ticket information and tabbed communications (Public Comments & Internal Notes) in Ticket Detail.

#### IT Staff / Administrator View
```text
+-----------------------------------------------------------------------------------------+
| Actions Taken                                                   [ + Add Action Taken ] |
| Record actual operational work performed on this ticket.                                |
|-----------------------------------------------------------------------------------------|
| Action Date/Time  | Description             | Result       | Performed By | Follow-Up?  |
|-------------------|-------------------------|--------------|--------------|-------------|
| May 12, 10:30 AM  | Ran diagnostic script   | Battery dead | Alex (Staff) | Yes (Note)  |
|                   | Note: Replacement ordered from vendor      | [ Edit ]    |
|-------------------|-------------------------|--------------|--------------|-------------|
| May 13, 02:15 PM  | Replaced battery pack   | Diagnostic OK| Sarah (Staff)| No          |
|                   | Attachment Notes: battery_serial_label.jpg | [ Edit ]    |
+-----------------------------------------------------------------------------------------+
```

#### Requester View (Read-Only)
```text
+-----------------------------------------------------------------------------------------+
| Actions Taken (2)                                                                       |
| Operational progress updates recorded by the IT Support team.                           |
|-----------------------------------------------------------------------------------------|
| Date & Time       | Action Description      | Result       | Performed By | Status      |
|-------------------|-------------------------|--------------|--------------|-------------|
| May 12, 10:30 AM  | Ran diagnostic script   | Battery dead | Alex (Staff) | Follow-up   |
| May 13, 02:15 PM  | Replaced battery pack   | Diagnostic OK| Sarah (Staff)| Completed   |
+-----------------------------------------------------------------------------------------+
```
*(Notice: Requesters have zero edit or add buttons; the layout is cleanly styled for readability).*

---

### 3.4 Action Taken Modal Dialog (Create & Edit)

```text
+-----------------------------------------------------------------------+
| Add Action Taken                                                [ X ] |
+-----------------------------------------------------------------------+
| Performed By: Michael Scott (IT Staff)  [Auto-detected]               |
|                                                                       |
| Action Date & Time *                                                  |
| [ 2026-05-14T14:30                                                  ] |
|                                                                       |
| Action Description * (What work was performed?)                       |
| [ Replaced internal SSD and restored OS from standard corporate image ] |
|                                                                       |
| Result * (What was the outcome of this action?)                       |
| [ Laptop boots successfully in 12 seconds; all drivers verified     ] |
|                                                                       |
| [X] Follow-Up Required?                                               |
|                                                                       |
| Follow-Up Note * (Mandatory when follow-up is checked)                |
| [ Needs user to verify BitLocker PIN after first boot               ] |
|                                                                       |
| Attachment Notes (Optional: refer to uploaded files or serial labels) |
| [ See disk_health_report.pdf attached in attachments tab            ] |
|                                                                       |
| +-------------------------------------------------------------------+ |
| | [ Cancel ]                                [ Save Action Taken ]   | |
+-----------------------------------------------------------------------+
```

#### Dynamic Form Validation Behavior:
- When `Follow-Up Required?` is unchecked:
  - `Follow-Up Note` field is collapsed or marked optional.
- When `Follow-Up Required?` is checked:
  - `Follow-Up Note` dynamically gains an asterisk `*`, displays helper text *"Please describe the required follow-up step"*, and validates non-empty whitespace before allowing submission.
- Stale update detection:
  - If another user updated the ticket while the modal was open, saving displays an alert:  
    *⚠️ "This ticket has been updated by another user. Please refresh to load the latest state."*

---

### 3.5 Ticket Workflow & Resolution Feedback Controls

On the IT Staff Ticket Detail page, the Status Transition block enforces permitted transitions with non-color status cues:

1. **Advisory Resolution Notice**:
   If the requester clicked "Problem Appears Resolved", an advisory alert banner appears at the top of Ticket Detail:
   ```text
   +---------------------------------------------------------------------------------------+
   | ℹ️ Requester indicated that the problem appears resolved.                              |
   | Please review the Actions Taken and formally transition status to Resolved if satisfied.|
   +---------------------------------------------------------------------------------------+
   ```
2. **Transition Selector / Buttons**:
   - Only actions permitted by the current status are enabled.
   - Disallowed transitions are omitted or disabled with informative tooltips.
   - When a status transition is clicked:
     - Button enters loading spinner state (`Updating...`).
     - Upon HTTP 200, status badge updates with animated fade, and the timeline reflects the change.
     - If HTTP 409 `STALE_UPDATE_CONFLICT` occurs, an error modal prompts the user to reload without losing unsaved notes.

---

## 4. Interaction States

### 4.1 Loading States
- **Metric Cards**: Skeleton placeholder pulse animation (`bg-neutral-200`) while metrics API request is in-flight.
- **Recent Tickets**: 5-row skeleton table with shimmering placeholder bars.
- **Action Taken Submission**: Button text switches to `Saving...` with spinner icon; inputs become read-only during submission.

### 4.2 Empty States
- **Requester Dashboard (0 tickets)**:
  - Icon: Document outline.
  - Heading: *"You haven't submitted any tickets yet"*.
  - Subtext: *"Need assistance with hardware, software, or network access?"*.
  - Action: Green CTA button `[ Submit a Ticket ]`.
- **IT Staff Queue / Dashboard (0 tickets in category)**:
  - Icon: Checkmark shield.
  - Heading: *"All caught up! No tickets in this view"*.
- **Actions Taken (0 actions on ticket)**:
  - Staff: *"No actions recorded yet. Click 'Add Action Taken' to log work done on this ticket."*
  - Requester: *"No actions have been logged for this ticket yet."*

### 4.3 Safe Failure & Conflict States
- **Concurrency Conflict (HTTP 409)**:
  - Banner: Yellow/Amber warning alert with refresh button.
  - Text: *"The ticket state was modified by another user. Form input has been preserved. Please refresh to verify latest changes."*
- **Network / API Failure (HTTP 500 / Network Error)**:
  - Banner: Red error banner with retry button.
  - Text: *"Unable to complete request. Please check your network connection and try again."*
  - Form data remains populated; no user input is wiped.

---

## 5. Responsive Behavior & Breakpoints

| Breakpoint | Viewport Width | Dashboard Layout | Actions Taken Table | Navigation Bar |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop** | $\ge 1280\text{px}$ | 6 metric cards (3x2 or single responsive flex row); 2-column layout (Table + Quick Actions) | Full responsive data table with all columns visible | Full horizontal navbar with role badge and user dropdown |
| **Tablet** | $768\text{px} - 1024\text{px}$ | 2 or 3 metric cards per row; stacked 1-column layout | Table with horizontal scroll container or collapsed action notes | Hamburger menu or condensed navbar items |
| **Mobile** | $375\text{px} - 480\text{px}$ | 1 or 2 metric cards per row (stacked); full-width buttons | Responsive card-based layout (each action rendered as an individual card) | Collapsible drawer menu; zero horizontal page scroll |

> [!NOTE]
> **Fluid Intermediate Widths**: The layout must remain fully functional at intermediate widths (e.g. $481\text{px} - 767\text{px}$ and $1025\text{px} - 1279\text{px}$) between the named target viewports. The listed breakpoints are reference validation viewports, not exclusive supported widths.

---

## 6. Accessibility & Usability Requirements

- **Touch Targets**: All clickable buttons, modal close triggers, and table links MUST have minimum interactive bounding boxes of $\ge 44 \times 44\text{px}$.
- **Keyboard Navigation**:
  - Modal dialogue MUST trap focus when open; pressing `Escape` MUST close the modal.
  - All form controls MUST be reachable via `Tab` with visible focus rings (`outline: 2px solid #0B7A46`, `offset: 2px`).
- **Non-Color Status Cues**:
  - All status badges MUST combine visual color tokens with explicit text labels and semantic icons (e.g. checkmark for Resolved, clock for Waiting).
- **Screen Reader Support**:
  - The application MUST provide proper ARIA attributes: `role="dialog"`, `aria-labelledby`, `aria-describedby`, `aria-live="polite"` for dynamic error banners.
  - Meaningful `alt` text MUST be provided on all non-decorative icons and graphic assets.
- **Zero Horizontal Overflow**:
  - Viewports across all widths down to $375\text{px}$ MUST maintain `overflow-x: hidden` with zero horizontal page clipping or unwanted horizontal scrollbars.
