# Zenzy New Features & URL Testing Guide

Use this guide to test all newly built modules and UI enhancements directly on your live website.

---

## 🌐 New Navigation & Page Routes

Log in as a **Professional / Business User** to access these new private dashboard routes:

| Module Name | Page URL | Key Features to Test |
| :--- | :--- | :--- |
| 👥 **Customer CRM (List)** | `/business/dashboard/crm` | Search clients, filter by status (`Lead`, `Active`, `Completed`, `Archived`), toggle Starred clients, Repeat client indicators, Add Customer modal. |
| 👤 **Customer 360 View** | `/business/dashboard/crm/[customerId]` | Unified client detail view combining Projects, Quotes, Invoices, Payments, Timestamped Notes, Attached Documents, Activity Timeline, & Schedulable Follow-ups. |
| 🎨 **Portfolio Manager** | `/business/dashboard/portfolio` | Create project albums with Before/After photo pairs, video walkthrough links, cost, duration, client ratings, and "Publish to Profile" toggle. |
| 📅 **Universal Calendar** | `/business/dashboard/calendar` | Consolidated calendar for Site Visits, Client Meetings, Payment Dues, Material Deliveries, CRM Follow-ups (auto-synced), & Warranty Reminders. |
| 📁 **Document Vault** | `/business/dashboard/vault` | Categorized vault for GST, PAN, Aadhaar, Contracts, Bills, Drawings, & Insurance policies with tag search & expiry alerts. |
| 👷 **Team & Staff** | `/business/dashboard/team` | Staff roster, Daily Attendance Tracker (`Present`, `Absent`, `Half Day`, `Leave`), salary pay cycles, and job roles. |
| 💰 **Finance & Cash Flow** | `/business/dashboard/finance` | Gross Collected Revenue, Logged Material/Labor Expenses, Computed Net Profit, Pending Unpaid Invoices, and expense logger. |
| 🛡️ **Warranty Management** | `/business/dashboard/warranty` | Issue 6/12/24/36-month digital warranty cards for completed projects, log customer claim issues, and schedule site resolution visits. |
| 📊 **Business Analytics** | `/business/dashboard/analytics` | Strategic growth insights for Repeat Customer Rate %, Average Project Value, Quote Acceptance Rate %, & Lead Conversion %. |
| 🚚 **Suppliers & Costs** | `/business/dashboard/suppliers` | Supplier contact directory, material price history log, and side-by-side material price comparison matrix across dealers. |

---

## 🌟 Card & Navigation UI Updates Built

### 1. **Location Search Selector (Homepage)**
- **Where to see it:** Homepage top hero search bar (`/`).
- **What's new:** Compact, borderless inline pill button. Clean overlay dropdown with fast auto-location detection, search filter, and popular cities grid.

### 2. **Professional Service Cards**
- **Where to see it:** Services Page (`/services`) & Homepage Trending Pros section (`/`).
- **What's new:**
  - **Verified Badge Seal:** Official Instagram-style 12-point rounded scalloped seal badge (`#0095f6`) with a crisp, bold white checkmark (`#ffffff`) inside (no outer border rings).
  - **Round Avatars:** 100% circular (`rounded-full`), completely borderless profile pictures.
  - **Clean Badges:** Signless, minimalist status & category pills (`Frequent Choice`, `Featured Choice`, `Available`).
  - **Compare Pill:** Sleek floating `+ Compare` / `✓ Comparing` toggle button (Services page).

---

## 🚀 How to Test Step-by-Step

1. Start your local dev server:
   ```bash
   npm run dev
   ```
2. Open your browser at `http://localhost:3000`.
3. Check the **Homepage (`/`)** search bar location dropdown & trending pro cards.
4. Check the **Services Page (`/services`)** cards, round borderless avatars, and scalloped verified badges.
5. Log in with your professional account and navigate to `/business/dashboard/crm` to access your new **Professional Suite HQ**!
