/**
 * lib/hubspot.ts
 * Thin server-side wrapper around HubSpot CRM v3 REST API.
 * Uses process.env.HUBSPOT_ACCESS_TOKEN for authorization.
 * Features automatic fallback for custom properties and 360° Admin CRM capabilities.
 */

const HUBSPOT_API_BASE = "https://api.hubapi.com";

function getAccessToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    throw new Error("HUBSPOT_ACCESS_TOKEN is not set in environment variables (.env.local).");
  }
  return token.trim();
}

function getHeaders() {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
  };
}

/**
 * Sanitizes and validates email addresses for HubSpot CRM requirements
 */
export function sanitizeEmail(rawEmail?: string, fallbackId?: string): string {
  if (rawEmail && typeof rawEmail === "string" && rawEmail.trim().length > 3 && rawEmail.includes("@") && rawEmail.includes(".")) {
    return rawEmail.trim().toLowerCase();
  }
  const cleanId = (fallbackId || `user_${Date.now()}`).toLowerCase().replace(/[^a-z0-9]/g, "");
  return `partner_${cleanId}@placeholder.zenzy.shop`;
}

/**
 * Helper to remove undefined or null values from property objects
 */
function cleanProperties(props: Record<string, any>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  for (const [key, val] of Object.entries(props)) {
    if (val !== undefined && val !== null && val !== "") {
      let strVal = String(val).trim();
      if (key === "phone") {
        strVal = strVal.replace(/[^0-9+]/g, "");
      }
      if (strVal) {
        cleaned[key] = strVal;
      }
    }
  }
  return cleaned;
}

/**
 * Helper to extract missing property names from HubSpot error payload
 */
function extractMissingProperties(errText: string): string[] {
  const missingProps: string[] = [];
  try {
    const json = JSON.parse(errText);
    if (Array.isArray(json.errors)) {
      for (const err of json.errors) {
        if (err.code === "PROPERTY_DOESNT_EXIST" && err.context?.propertyName) {
          missingProps.push(...err.context.propertyName);
        }
      }
    }
  } catch (e) {
    const matches = errText.matchAll(/Property [\\"]*([^\\"\s]+)[\\"]* does not exist/gi);
    for (const m of matches) {
      if (m[1]) missingProps.push(m[1]);
    }
  }
  return [...new Set(missingProps)];
}

export interface HubSpotContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  zenzy_uid?: string;
  zenzy_category?: string;
  zenzy_gst_number?: string;
  zenzy_license_number?: string;
  zenzy_experience?: string;
  zenzy_years_in_business?: string;
  zenzy_team_size?: string;
  [key: string]: any;
}

export interface HubSpotDealProperties {
  dealname: string;
  pipeline?: string;
  dealstage?: string;
  amount?: string | number;
  zenzy_uid?: string;
  [key: string]: any;
}

/**
 * Searches for a Contact by email address or zenzy_uid
 */
export async function searchContact(email?: string, zenzyUid?: string): Promise<any | null> {
  try {
    const cleanMail = email ? sanitizeEmail(email, zenzyUid) : undefined;
    const filters: any[] = [];
    if (cleanMail) {
      filters.push({ propertyName: "email", operator: "EQ", value: cleanMail });
    } else if (zenzyUid) {
      filters.push({ propertyName: "zenzy_uid", operator: "EQ", value: zenzyUid });
    }

    if (filters.length === 0) return null;

    const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        filterGroups: [{ filters }],
      }),
    });

    if (!res.ok) {
      if (zenzyUid && cleanMail) {
        return searchContact(cleanMail, undefined);
      }
      return null;
    }

    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (err) {
    console.error("HubSpot searchContact exception:", err);
    return null;
  }
}

/**
 * Upserts a Contact in HubSpot by email or zenzy_uid.
 * Automatically retries omitting custom properties if they don't exist in HubSpot UI.
 */
export async function upsertContact(props: HubSpotContactProperties): Promise<{ id: string; properties: any }> {
  props.email = sanitizeEmail(props.email, props.zenzy_uid);
  const existing = await searchContact(props.email, props.zenzy_uid);
  let properties = cleanProperties(props);

  const endpoint = existing
    ? `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${existing.id}`
    : `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`;
  const method = existing ? "PATCH" : "POST";

  const res = await fetch(endpoint, {
    method,
    headers: getHeaders(),
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    const errText = await res.text();
    const missingProps = extractMissingProperties(errText);

    if (missingProps.length > 0) {
      console.warn("HubSpot portal missing contact properties:", missingProps, "— Retrying without missing custom properties.");
      for (const p of missingProps) {
        delete properties[p];
      }

      const retryRes = await fetch(endpoint, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({ properties }),
      });

      if (!retryRes.ok) {
        const retryErrText = await retryRes.text();
        throw new Error(`HubSpot Contact ${existing ? "update" : "create"} failed (${retryRes.status}): ${retryErrText}`);
      }

      const result = await retryRes.json();
      return { id: result.id, properties: result.properties };
    }

    throw new Error(`HubSpot Contact ${existing ? "update" : "create"} failed (${res.status}): ${errText}`);
  }

  const result = await res.json();
  return { id: result.id, properties: result.properties };
}

/**
 * Searches for a Deal by zenzy_uid filter
 */
export async function searchDealByZenzyUid(zenzyUid: string): Promise<any | null> {
  if (!zenzyUid) return null;
  try {
    const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals/search`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [{ propertyName: "zenzy_uid", operator: "EQ", value: zenzyUid }],
          },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (err) {
    console.error("HubSpot searchDeal exception:", err);
    return null;
  }
}

/**
 * Associates a Deal to a Contact in HubSpot
 */
export async function associateDealToContact(dealId: string, contactId: string): Promise<void> {
  try {
    const res = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}/deal_to_contact`,
      {
        method: "PUT",
        headers: getHeaders(),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`HubSpot associate Deal ${dealId} to Contact ${contactId} warning:`, res.status, errText);
    }
  } catch (err) {
    console.error("HubSpot associateDealToContact exception:", err);
  }
}

/**
 * Upserts a Deal in HubSpot and connects it with a Contact.
 * Automatically retries omitting custom properties if they don't exist in HubSpot UI.
 */
export async function upsertDeal(
  props: HubSpotDealProperties,
  contactId?: string
): Promise<{ id: string; properties: any }> {
  let properties = cleanProperties(props);

  let existingDeal: any = null;
  if (props.zenzy_uid) {
    existingDeal = await searchDealByZenzyUid(props.zenzy_uid);
  }

  const endpoint = existingDeal
    ? `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${existingDeal.id}`
    : `${HUBSPOT_API_BASE}/crm/v3/objects/deals`;
  const method = existingDeal ? "PATCH" : "POST";

  const res = await fetch(endpoint, {
    method,
    headers: getHeaders(),
    body: JSON.stringify({ properties }),
  });

  if (!res.ok) {
    const errText = await res.text();
    const missingProps = extractMissingProperties(errText);

    if (missingProps.length > 0) {
      console.warn("HubSpot Deal missing properties:", missingProps, "— Retrying without missing custom properties.");
      for (const p of missingProps) {
        delete properties[p];
      }

      const retryRes = await fetch(endpoint, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({ properties }),
      });

      if (!retryRes.ok) {
        const retryErrText = await retryRes.text();
        throw new Error(`HubSpot Deal ${existingDeal ? "update" : "create"} failed (${retryRes.status}): ${retryErrText}`);
      }

      const retryResult = await retryRes.json();
      const dealId = retryResult.id;
      const dealProperties = retryResult.properties;

      if (contactId && dealId) {
        await associateDealToContact(dealId, contactId);
      }

      return { id: dealId, properties: dealProperties };
    }

    throw new Error(`HubSpot Deal ${existingDeal ? "update" : "create"} failed (${res.status}): ${errText}`);
  }

  const result = await res.json();
  const dealId = result.id;
  const dealProperties = result.properties;

  if (contactId && dealId) {
    await associateDealToContact(dealId, contactId);
  }

  return { id: dealId, properties: dealProperties };
}

/**
 * Creates a Note in HubSpot and associates it with a Contact.
 */
export async function addNoteToContact(contactId: string, noteText: string): Promise<string | null> {
  if (!contactId || !noteText) return null;

  try {
    const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/notes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        properties: {
          hs_timestamp: new Date().toISOString(),
          hs_note_body: noteText,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("HubSpot create Note failed:", res.status, errText);
      return null;
    }

    const note = await res.json();
    const noteId = note.id;

    await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/notes/${noteId}/associations/contacts/${contactId}/note_to_contact`,
      {
        method: "PUT",
        headers: getHeaders(),
      }
    );

    return noteId;
  } catch (err) {
    console.error("HubSpot addNoteToContact exception:", err);
    return null;
  }
}

/**
 * Gets a Deal by ID
 */
export async function getDeal(dealId: string): Promise<any | null> {
  try {
    const res = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}?properties=dealstage,pipeline,zenzy_uid,dealname,amount`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("HubSpot getDeal exception:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 360° ADMIN CRM EXTENSION FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a Task in HubSpot and associates it with a Contact.
 */
export async function createHubSpotTask(
  contactId: string,
  subject: string,
  dueDateMs?: number,
  priority: string = "MEDIUM"
): Promise<string | null> {
  if (!contactId || !subject) return null;

  try {
    const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/tasks`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        properties: {
          hs_timestamp: new Date(dueDateMs || Date.now() + 86400000).toISOString(),
          hs_task_subject: subject,
          hs_task_status: "NOT_STARTED",
          hs_task_priority: priority,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("HubSpot createTask failed:", res.status, errText);
      return null;
    }

    const task = await res.json();
    const taskId = task.id;

    await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/tasks/${taskId}/associations/contacts/${contactId}/task_to_contact`,
      {
        method: "PUT",
        headers: getHeaders(),
      }
    );

    return taskId;
  } catch (err) {
    console.error("HubSpot createHubSpotTask exception:", err);
    return null;
  }
}

/**
 * Updates a Deal stage directly in HubSpot
 */
export async function updateDealStage(dealId: string, newStage: string, pipeline: string = "default"): Promise<boolean> {
  if (!dealId || !newStage) return false;

  try {
    const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/deals/${dealId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        properties: {
          dealstage: newStage,
          pipeline,
        },
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("HubSpot updateDealStage exception:", err);
    return false;
  }
}

/**
 * Diagnostic Health Check for HubSpot API
 */
export async function getHubSpotHealth(): Promise<{
  connected: boolean;
  status: number;
  rateLimitRemaining?: string | null;
  error?: string;
}> {
  try {
    const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts?limit=1`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (res.ok) {
      return {
        connected: true,
        status: res.status,
        rateLimitRemaining: res.headers.get("x-hubspot-ratelimit-remaining"),
      };
    } else {
      const errText = await res.text();
      return {
        connected: false,
        status: res.status,
        error: errText,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      status: 500,
      error: err.message || "Network connection failure",
    };
  }
}

/**
 * Fetches 360° details of a Contact including properties and associated notes
 */
export async function getContact360(contactId: string): Promise<any | null> {
  if (!contactId) return null;

  try {
    const res = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}?properties=email,firstname,lastname,phone,company,zenzy_uid,zenzy_category,zenzy_gst_number,zenzy_license_number,zenzy_experience,createdate,lastmodifieddate`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    );

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("HubSpot getContact360 exception:", err);
    return null;
  }
}
