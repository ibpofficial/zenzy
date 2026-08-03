# HubSpot CRM Setup Guide for Zenzy

This document provides step-by-step instructions to configure your HubSpot CRM portal for Zenzy's internal operations sync.

---

## 1. Environment Configuration

Add the following variable to your `.env.local` file (do **not** commit this file):

```env
# HubSpot Private App Access Token
HUBSPOT_ACCESS_TOKEN=pat-na2-your-private-app-token

# (Optional) Custom Pipeline IDs and Stage IDs
# HUBSPOT_ONBOARDING_PIPELINE=default
# HUBSPOT_ONBOARDING_STAGE=appointmentscheduled
# HUBSPOT_PARTNERSHIPS_PIPELINE=default
# HUBSPOT_PARTNERSHIPS_STAGE=appointmentscheduled
```

> [!NOTE]
> Server-side API handlers (`app/api/hubspot/sync-professional/route.ts` and `app/api/hubspot/sync-lead/route.ts`) access `process.env.HUBSPOT_ACCESS_TOKEN`. This token is **never exposed** to client components or `NEXT_PUBLIC_*` variables.

---

## 2. Custom HubSpot Properties (Create in HubSpot UI)

Navigate to **HubSpot Settings → Data Management → Properties** to create the following custom fields.

### Contact Properties (Group: "Zenzy Information")

| Label | Internal Name (`propertyName`) | Field Type | Description |
| :--- | :--- | :--- | :--- |
| **Zenzy UID** | `zenzy_uid` | Single-line text | Unique Firestore User / Worker ID (**Required join key**) |
| **Zenzy Category** | `zenzy_category` | Single-line text | Trade category & subcategory (e.g., Architect - Luxury Villas) |
| **GST Number** | `zenzy_gst_number` | Single-line text | Business GSTIN for verification checklist |
| **Trade License Number** | `zenzy_license_number` | Single-line text | Council / Municipal license number |
| **Years in Business** | `zenzy_years_in_business` | Single-line text | Total professional experience / years active |
| **Team Size** | `zenzy_team_size` | Single-line text | Number of team members / crew size |

### Deal Properties (Group: "Zenzy Information")

| Label | Internal Name (`propertyName`) | Field Type | Description |
| :--- | :--- | :--- | :--- |
| **Zenzy UID** | `zenzy_uid` | Single-line text | Unique Firestore User / Worker ID (**Required join key**) |

---

## 3. Pipelines & Stages Setup

### Flow A: Professional Onboarding Pipeline
1. Create a Deal Pipeline named **"Professional Onboarding"** (or use your portal's default Sales pipeline).
2. Stages recommended:
   - **Application Received** (`appointmentscheduled`)
   - **Verification in Progress** (`qualifiedtobuy`)
   - **Approved / Active** (`closedwon`)
   - **Rejected** (`closedlost`)

### Flow B: Partnerships / Inbound Leads Pipeline
1. Create a Deal Pipeline named **"Partnerships"** (or use default pipeline).
2. Inbound inquiries from the Zenzy contact form automatically create a Contact + Deal in this pipeline.

---

## 4. Operational Workflows & Admin Controls

1. **Automatic Background Sync**:
   - When a professional updates their profile in `/worker/verification`, Zenzy automatically upserts the Contact + Deal in HubSpot and posts a timeline Note.
   - When a user submits an inquiry on `/contact`, Zenzy creates a Contact + Deal in the Partnerships pipeline.
2. **Admin Visibility**:
   - Go to **Admin Console → Verification Center** (`/admin`).
   - Each professional card displays the **HubSpot Sync Status** badge (`Synced ✅` / `Failed ⚠️` / `Not Synced`).
   - Click **"Sync Now"** to manually retry syncing any professional record to HubSpot at any time.

---

## 5. Phase 2 (Future Webhook Integration)

When you are ready to enable bidirectional sync (HubSpot Deal Approval → automatically updates Zenzy Firestore status), register your webhook endpoint in HubSpot Developer Settings:

- **Target Webhook URL**: `https://your-domain.com/api/hubspot/webhook`
- **Subscription Event**: `deal.propertyChange` (Property: `dealstage`)
