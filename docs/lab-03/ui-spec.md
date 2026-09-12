# Lab 3 UI Specification: TokTickIT Zen Green Design System

## 1. Purpose

This document defines the UI/UX specification for TokTickIT Lab 3.

Lab 3 evolves the user experience to support three distinct user roles (**Requester**, **IT Staff**, and **Administrator**), replacing the temporary Development Requester selector with:
- Dedicated **Login** and **Mandatory First-Login Password Change** screens.
- An updated **Application Shell** displaying the authenticated user's name, role badge, role-filtered navigation, and Logout action.
- **Public Comments** and **Problem Appears Resolved** workflow for Requesters.
- An **IT Staff Ticket Queue** with comprehensive search, filters, sorting, and pagination.
- An **IT Staff Ticket Detail** screen with operational controls (Ownership, IT Priority, Status transitions) and visually segregated tabs for Public Comments vs. Internal Notes.
- A **Minimalist Administrator User Management** interface for viewing, filtering, creating, editing, and managing account activation and initial passwords.
- Full responsiveness across Desktop ($\ge 1280\text{px}$), Tablet ($768\text{px} - 1024\text{px}$), and Mobile ($375\text{px} - 480\text{px}$).

---

## 2. Zen Green Design Tokens

### 2.1 Color Palette

| Token Name | Hex Code | Primary Usage |
| :--- | :--- | :--- |
| **Primary Green** | `#006B3C` | App header, primary CTA buttons, active tab indicators, brand accents |
| **Primary Green Hover** | `#00522E` | Hover and active state for primary green elements |
| **Secondary Green** | `#0B7A46` | Secondary actions, progress indicators, focused borders |
| **Pale Green** | `#EAF6EF` | Selected card backgrounds, success alerts, subtle table row highlighting |
| **Page Background** | `#F5F7F6` | Main canvas background |
| **Surface (Card/Modal)** | `#FFFFFF` | Card surfaces, modal dialogues, input backgrounds |
| **Text Primary** | `#24272A` | Primary headings, table text, label text |
| **Text Secondary** | `#5F6863` | Subtitles, helper text, timestamps, placeholder text |
| **Read-only Field** | `#F0F4F2` | Background for non-editable form inputs |
| **Border Neutral** | `#D5DDD8` | Input outlines, table row dividers, card borders |
| **Error / Critical** | `#B42318` | Error messages, danger buttons (Deactivate), urgent priority badges |
| **Error Light** | `#FEE4E2` | Error banner backgrounds, destructive button hover |
| **Warning** | `#F59E0B` | High priority badges, pending state indicators |
| **Warning Light** | `#FEF3C7` | Warning banner backgrounds |
| **Internal Note Accent** | `#854D0E` | Internal Notes tab border, icon, and background tint (`#FEFCE8`) |

### 2.2 Status, Priority & Role Badges

#### Status Badges
- **New**: Pale Blue (`#E0F2FE`, text `#0369A1`)
- **Open**: Pale Emerald (`#D1FAE5`, text `#047857`)
- **In Progress**: Soft Amber (`#FEF3C7`, text `#B45309`)
- **Waiting for Requester**: Soft Purple (`#F3E8FF`, text `#6B21A8`)
- **Resolved**: Zen Green (`#DCFCE7`, text `#15803D`)
- **Closed**: Slate Gray (`#F1F5F9`, text `#475569`)
- **Reopened**: Deep Orange (`#FFEDD5`, text `#C2410C`)
- **Cancelled**: Rose (`#FFE4E6`, text `#BE123C`)

#### Priority Badges
- **Low**: Slate (`#F1F5F9`, text `#475569`)
- **Medium**: Pale Green (`#EAF6EF`, text `#0B7A46`)
- **High**: Soft Amber (`#FEF3C7`, text `#B45309`)
- **Urgent**: Soft Red (`#FEE2E2`, text `#B91C1C`)

#### Role Badges
- **Requester**: Slate / Sky (`#E0F2FE`, text `#0369A1`)
- **IT Staff**: Zen Green (`#EAF6EF`, text `#006B3C`)
- **Administrator**: Deep Indigo (`#E0E7FF`, text `#3730A3`)

### 2.3 Typography & Spacing
- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.
- **Spacing Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px.
- **Border Radius**: 6px (buttons/inputs), 8px (cards), 12px (modals), 9999px (pills/badges).
- **Shadows**:
  - Small: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  - Medium (Cards): `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)`
  - Large (Modals): `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`

---

## 3. Application Shell & Navigation

### 3.1 Header Layout
- **Brand**: Logo icon + "TokTickIT" text (white, bold) linking to the role's default landing page.
- **Role Navigation (Filtered dynamically by role)**:
  - **Requester**: `My Tickets` | `+ Create Ticket`
  - **IT Staff**: `Ticket Queue` | `+ Create Ticket`
  - **Administrator**: `User Management`
- **User Profile Menu (Right side)**:
  - Circular avatar with user initials (e.g., "JA").
  - User full name + Role badge (e.g., `IT Staff`).
  - Dropdown menu with:
    - User email (muted display)
    - "Change Password" action
    - "Sign Out" button (clears session and redirects to `/login`).
- **Selector Removal**: The Lab 2 temporary Development Requester dropdown is completely removed from the navbar.

---

## 4. Screen Specifications

### 4.1 Screen 1: Login & Mandatory Password Change

#### Mode A: Sign In
- Centered card on canvas background (`#F5F7F6`).
- Brand header with TokTickIT logo.
- Form controls:
  - Email address input (type: `email`, autofocus, required).
  - Password input (type: `password`, toggle visibility button, required).
  - "Sign In" button (Primary Green, displays loading spinner when authenticating).
- Validation & Safe Failure:
  - Inline message on invalid credentials: `"Invalid email or password. Please try again."` (Safe message; does not disclose user existence).
  - Inactive account feedback: `"Your account is currently inactive. Please contact an administrator."`

#### Mode B: Mandatory Password Change
- Rendered when user has `mustChangePassword: true`.
- Header: "Change Your Password" with subtitle "You must change your password to continue."
- Controls:
  - Current (temporary) password input.
  - New password input with real-time checklist:
    - At least 8 characters
    - Include uppercase and lowercase letters
    - Include a number and a special character
  - Confirm new password input.
  - "Continue" button (disabled until all requirements are met).
- Blocks navigation until saved successfully.

---

### 4.2 Screen 2: Requester Ticket Detail (Regression + Comments)

- **Header**: Back to "My Tickets" button, Ticket Number heading (`TKT-2026-001234`), Status badge, and Requested Priority badge.
- **Resolution Indication Button**:
  - "Problem Appears Resolved" button (Zen Green outline / soft green fill).
  - When clicked: Updates state to display "Resolution Confirmed by Requester" banner, while preserving official status.
- **Attachments Section**: Full Lab 2 functionality preserved (Download active files, Soft-remove with modal requiring reason, Upload additional files up to 5 max).
- **Public Comments Feed**:
  - Chronological list of comments showing author initials avatar, name, role badge, timestamp, and message body.
  - "Add Public Comment" textarea with character counter (max 2,000) and "Post Comment" button.

---

### 4.3 Screen 3: IT Staff Ticket Queue

- **Header**: Page title "Ticket Queue", total ticket counter ("Showing 1 to 10 of 67 tickets").
- **Toolbar & Filter Bar**:
  - Search input: Placeholder `"Search by ticket number, summary, or requester..."` with clear icon.
  - Status filter dropdown (Multi-select or single select: All, New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled).
  - Priority filter dropdown (All, Low, Medium, High, Urgent).
  - Ownership filter toggle/dropdown: `All Tickets` | `Unassigned` | `Assigned to Me`.
- **Data Presentation**:
  - **Desktop ($\ge 1024\text{px}$)**: Table with columns:
    1. Ticket No. (clickable link to Detail)
    2. Created Date
    3. Summary (truncated with tooltip)
    4. Category
    5. Req Priority (badge)
    6. IT Priority (badge)
    7. Status (badge)
    8. Owner (name or "Unassigned" in italic)
  - **Mobile / Tablet ($< 1024\text{px}$)**: Card-based list view where each card shows Ticket No, Status badge, Summary, Requester, IT Priority, Owner, and a prominent "View Details" touch target.
- **Pagination Bar**: Previous, Page numbers (active page highlighted in Primary Green), Next.
- **States**: Loading skeleton, Empty queue ("No tickets currently in the queue"), No search results ("No tickets match your filters").

---

### 4.4 Screen 4: IT Staff Ticket Detail & Operational Controls

- **Header Bar**: "Back to Queue" navigation button, Ticket No, and "Claim Ticket" shortcut button (if unassigned).
- **Operational Controls Grid (Prominent Top Card)**:
  - **Ticket Owner**: Dropdown listing all active IT Staff and Administrators, plus "Unassigned". Immediate update with success toast.
  - **IT Priority**: Dropdown (`Low`, `Medium`, `High`, `Urgent`). Can be changed independently of Requested Priority.
  - **Status**: Dropdown displaying only permitted next statuses based on the Transition Matrix. Invalid transitions are disabled or excluded.
- **Ticket Core Info (Read-only)**: Requester Name, Email, Category, Related System, Summary, Description, and Creation Date.
- **Tabs Section**:
  1. **Tab 1: Public Comments**:
     - Shared discussion visible to Requester and Staff.
     - Green theme accent.
  2. **Tab 2: Internal Notes**:
     - Operational staff notes visible **only** to IT Staff and Admin.
     - Amber/Warm accent banner: *"Internal Notes are private and never visible to the ticket Requester."*
     - Distinct yellow/amber card styling for notes.
     - Textarea and "Add Internal Note" button.
  3. **Tab 3: Attachments**:
     - Download links for active files, soft-removed files shown with strikethrough/grayed metadata and removal reason.

---

### 4.5 Screen 5: Administrator User Management

- **Header**: "User Management" heading, total user count, search box, role filter dropdown, and "+ Create User" button.
- **User Table**:
  - Columns: Name, Email, Role (badge), Status (Active: green dot + text, Inactive: gray dot + text), Actions ("Edit" button).
- **Create / Edit User Modal / Drawer**:
  - Full Name (required).
  - Email Address (required, email format, unique check).
  - Role dropdown (`Requester`, `IT Staff`, `Administrator`).
  - Active Switch / Toggle (`Yes` / `No`).
    - *Safety Guard*: If editing the logged-in administrator, the toggle is disabled with helper text: *"You cannot deactivate your own account."*
    - *Safety Guard*: If editing the last active administrator, the toggle is disabled with helper text: *"System must have at least one active Administrator."*
  - Initial Password Field (for Create mode, or "Reset Initial Password" in Edit mode).
  - Action Buttons: "Save User", "Cancel", and "Deactivate User" (in edit mode, triggers confirmation modal).

---

## 5. Responsive Breakpoint Rules

| Viewport | Width | Layout Adjustments |
| :--- | :--- | :--- |
| **Desktop** | $\ge 1280\text{px}$ | Full multi-column table layouts; multi-column form grids; side-by-side metadata and operational panels. |
| **Tablet** | $768\text{px} - 1024\text{px}$ | 2-column form grids; condensed table columns (summary truncated); horizontal scroll preserved if necessary with sticky headers. |
| **Mobile** | $375\text{px} - 480\text{px}$ | Tables transform to stacked cards; single-column forms; full-width modal drawers; full-width buttons. Touch targets minimum $44\text{px} \times 44\text{px}$. |

---

## 6. Visual Inspection & Quality Checklist

- [ ] **No Dev Selector**: The temporary Development Requester dropdown is completely absent from all views.
- [ ] **Zen Green Fidelity**: Hex colors strictly match Primary Green (`#006B3C`), Secondary Green (`#0B7A46`), and Pale Green (`#EAF6EF`).
- [ ] **Notes vs. Comments Distinction**: Public Comments and Internal Notes use noticeably different visual treatments (e.g. green accents vs amber warnings).
- [ ] **Touch Targets**: All interactive elements (buttons, inputs, dropdowns) have at least $44\text{px}$ height on mobile.
- [ ] **No Text Clipping / Overlap**: Long ticket summaries, user names, and emails wrap or truncate cleanly without breaking container boundaries.
- [ ] **Accessible Focus Rings**: Visible high-contrast focus rings appear when navigating with the keyboard (`Tab` key).
- [ ] **Zero Horizontal Scroll**: No unintended horizontal page scrollbars on mobile ($375\text{px}$) or tablet viewports.
