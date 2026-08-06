import { getQuoteSections } from "@/components/QuoteDocument";

export interface TaxBreakdown {
  isSameState: boolean;
  taxInclusive: boolean;
  subtotal: number;
  lineDiscountsTotal: number;
  globalDiscountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  grandTotal: number;
  itemBreakdowns: {
    id: string;
    baseTotal: number;
    discountAmt: number;
    netBase: number;
    gstRate: number;
    gstAmount: number;
    finalRowTotal: number;
  }[];
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  unit: string;
  rate: number;
  gst: number;
  hsn?: string;
  category: "civil" | "interior" | "electrical" | "plumbing" | "consulting" | "general";
  workerId?: string;
  businessId?: string;
}

export interface QuoteVersionChange {
  timestamp: string;
  version: number;
  revisedBy?: string;
  addedItemsCount: number;
  removedItemsCount: number;
  modifiedItemsCount: number;
  totalDelta: number;
  summaryText: string;
}

export const PRESEEDED_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "cat-1",
    name: "Architectural 2D Blueprint & Layout Plan",
    description: "Complete CAD floorplan drawings, dimensioning & room layouts",
    unit: "Sq Ft",
    rate: 25,
    gst: 18,
    hsn: "9983",
    category: "consulting",
  },
  {
    id: "cat-2",
    name: "RCC Structural Foundation & Column Footings",
    description: "Earth excavation, steel binding Fe550, M25 grade concrete casting",
    unit: "Sq Ft",
    rate: 450,
    gst: 18,
    hsn: "9954",
    category: "civil",
  },
  {
    id: "cat-3",
    name: "AAC Block Masonry Work (9-inch Outer Wall)",
    description: "Autoclaved Aerated Concrete blocks with polymer mortar joining",
    unit: "Sq Ft",
    rate: 180,
    gst: 18,
    hsn: "9954",
    category: "civil",
  },
  {
    id: "cat-4",
    name: "Concealed FR-LSH Electrical Wiring Rough-in",
    description: "Havells/Finolex copper wiring, heavy duty PVC conduits & gang boxes",
    unit: "Sq Ft",
    rate: 95,
    gst: 18,
    hsn: "9954",
    category: "electrical",
  },
  {
    id: "cat-5",
    name: "CPVC & SWR Plumbing Distribution Lines",
    description: "Astral/Ashirvad hot/cold CPVC pipes, drainage lines & pressure test",
    unit: "Job",
    rate: 45000,
    gst: 18,
    hsn: "9954",
    category: "plumbing",
  },
  {
    id: "cat-6",
    name: "Modular Acrylic Kitchen Cabinetry",
    description: "Hettich soft-close tandem boxes, marine plywood & HDHMR shutters",
    unit: "Units",
    rate: 210000,
    gst: 18,
    hsn: "9954",
    category: "interior",
  },
  {
    id: "cat-7",
    name: "Gypsum Designer False Ceiling",
    description: "Saint-Gobain gypsum boards, GI framing, cove lighting channels & jointing",
    unit: "Sq Ft",
    rate: 115,
    gst: 18,
    hsn: "9954",
    category: "interior",
  },
  {
    id: "cat-8",
    name: "Asian Paints Royale Emulsion Wall Finish",
    description: "2 coats primer, acrylic putty surface smoothing & 2 coats premium emulsion",
    unit: "Sq Ft",
    rate: 38,
    gst: 18,
    hsn: "9954",
    category: "interior",
  },
  {
    id: "cat-9",
    name: "Retainer & Project Supervision Fee",
    description: "Dedicated project manager, site inspections, quality audit reports & milestone verification",
    unit: "Days",
    rate: 2500,
    gst: 18,
    hsn: "9983",
    category: "consulting",
  },
];

export const STARTER_CATEGORY_TEMPLATES = [
  {
    id: "tmpl-renovation",
    name: "Full Home Renovation & Modernization",
    category: "Renovation",
    description: "Turnkey home overhaul including structural alterations, flooring, bath makeover & painting",
    sections: [
      {
        id: "sec-overview",
        title: "Renovation Scope Overview",
        type: "text",
        content: "Comprehensive residential renovation including demolition of old tile work, modern bath fittings, electrical rewire, and premium interior paint.",
      },
      {
        id: "sec-params",
        title: "Renovation Parameters",
        type: "grid",
        content: [
          { key: "Carpet Area", value: "1,500 Sq Ft" },
          { key: "Estimated Timeline", value: "45 Days" },
          { key: "Occupancy State", value: "Unoccupied during works" },
        ],
      },
      {
        id: "sec-table",
        title: "Itemized Scope Breakdown & Rates",
        type: "table",
        content: [
          { id: "ren-1", phase: "Demolition & Prep", name: "Dismantling old flooring tiles, plaster scraping & debris disposal", qty: 1500, unit: "Sq Ft", rate: 22, gst: 18, hsn: "9954" },
          { id: "ren-2", phase: "Bathroom Remodel", name: "Waterproofing 2 bathrooms, vitrified wall tiles & Kohler fittings", qty: 2, unit: "Sets", rate: 75000, gst: 18, hsn: "9954" },
          { id: "ren-3", phase: "Flooring Installation", name: "800x800mm Double Charged Vitrified Tiles laying with spacer joints", qty: 1500, unit: "Sq Ft", rate: 125, gst: 18, hsn: "9954" },
          { id: "ren-4", phase: "Wall Painting", name: "Asian Paints Royale Emulsion wall finish with 2 coats putty base", qty: 1500, unit: "Sq Ft", rate: 38, gst: 18, hsn: "9954", optional: true },
        ],
      },
      {
        id: "sec-terms",
        title: "Terms & Guarantee",
        type: "text",
        content: "1. 12-month warranty against leakage & tile de-bonding.\n2. Debris cleared daily.\n3. 30% booking advance required.",
      },
    ],
  },
  {
    id: "tmpl-interior",
    name: "Luxury Interior Fit-Out & Woodwork",
    category: "Interior",
    description: "Complete interior carpentry, false ceiling, lighting & custom wardrobes",
    sections: [
      {
        id: "sec-overview",
        title: "Interior Fit-Out Overview",
        type: "text",
        content: "Turnkey interior execution covering modular kitchen, bedroom wardrobes, ambient cove lighting, and living room accent wall.",
      },
      {
        id: "sec-params",
        title: "Design Specifications",
        type: "grid",
        content: [
          { key: "Carpet Scope Area", value: "1,800 Sq Ft" },
          { key: "Wood Type", value: "BWP Grade Marine Plywood" },
          { key: "Hardware Brand", value: "Hettich / Hafele Soft-close" },
        ],
      },
      {
        id: "sec-table",
        title: "Itemized Scope Breakdown & Rates",
        type: "table",
        content: [
          { id: "int-1", phase: "Modular Kitchen", name: "Acrylic finish modular kitchen with tandem drawers & cutlery trays", qty: 1, unit: "Units", rate: 220000, gst: 18, hsn: "9954" },
          { id: "int-2", phase: "Master Bedroom", name: "8ft x 9ft Full height wardrobe with laminate finish & mirror shutter", qty: 1, unit: "Units", rate: 110000, gst: 18, hsn: "9954" },
          { id: "int-3", phase: "False Ceiling", name: "Gypsum ceiling with LED profile tracks & magnetic spot channels", qty: 1800, unit: "Sq Ft", rate: 115, gst: 18, hsn: "9954" },
          { id: "int-4", phase: "Living Accent Wall", name: "Fluted Charcoal Louver Panels with LED backlight ambient strip", qty: 1, unit: "Job", rate: 38000, gst: 18, hsn: "9954", optional: true },
        ],
      },
    ],
  },
  {
    id: "tmpl-electrical",
    name: "Commercial & Residential Electrical Setup",
    category: "Electrical",
    description: "Full building wiring, distribution panels, earthing & fixture testing",
    sections: [
      {
        id: "sec-overview",
        title: "Electrical Scope Overview",
        type: "text",
        content: "Turnkey electrical installation including main distribution panelboard, copper cabling, earthing pits, and safety testing.",
      },
      {
        id: "sec-params",
        title: "Load Parameters",
        type: "grid",
        content: [
          { key: "Connected Load", value: "15 KW 3-Phase" },
          { key: "Conduit Type", value: "Heavy Duty PVC Rigid Conduits" },
          { key: "Safety Interlock", value: "4-Pole ELCB & MCB Protection" },
        ],
      },
      {
        id: "sec-table",
        title: "Itemized Scope Breakdown & Rates",
        type: "table",
        content: [
          { id: "elec-1", phase: "Distribution Panel", name: "16-Way TPN Distribution Board with Schneider 63A MCB main", qty: 1, unit: "Job", rate: 38000, gst: 18, hsn: "9954" },
          { id: "elec-2", phase: "Wiring & Conduiting", name: "FR-LSH concealed copper wiring run & metal junction switch boxes", qty: 2400, unit: "Sq Ft", rate: 95, gst: 18, hsn: "9954" },
          { id: "elec-3", phase: "Earthing System", name: "Chemical Gel Earthing Pit with 50mm Copper Bonded Electrode", qty: 2, unit: "Nos", rate: 14500, gst: 18, hsn: "9954" },
        ],
      },
    ],
  },
  {
    id: "tmpl-onetime",
    name: "One-Time Technical Repair & Service",
    category: "One-Time Service",
    description: "Immediate technical inspection, localized repair, sealing & structural patch",
    sections: [
      {
        id: "sec-overview",
        title: "Service Scope Overview",
        type: "text",
        content: "One-time technical service visit including root-cause diagnostic, localized epoxy injection sealing, and pressure washing.",
      },
      {
        id: "sec-table",
        title: "Itemized Scope Breakdown & Rates",
        type: "table",
        content: [
          { id: "one-1", phase: "Diagnostic & Repair", name: "Epoxy resin high-pressure injection for slab crack repair", qty: 1, unit: "Job", rate: 12500, gst: 18, hsn: "9954" },
          { id: "one-2", phase: "Surface Protection", name: "PU elastomeric waterproofing coating on target wet area (2 coats)", qty: 350, unit: "Sq Ft", rate: 65, gst: 18, hsn: "9954" },
        ],
      },
    ],
  },
  {
    id: "tmpl-retainer",
    name: "Monthly Project Supervision Retainer",
    category: "Retainer/Consulting",
    description: "Monthly professional site supervision, quality audits & billing verification",
    sections: [
      {
        id: "sec-overview",
        title: "Retainer Engagement Terms",
        type: "text",
        content: "Ongoing monthly professional engineering oversight, weekly site inspection reports, contractor bill audit, and quality assurance certification.",
      },
      {
        id: "sec-table",
        title: "Itemized Scope Breakdown & Rates",
        type: "table",
        content: [
          { id: "ret-1", phase: "Supervision", name: "Dedicated Senior Site Engineer bi-weekly physical inspection & audit report", qty: 1, unit: "Job", rate: 35000, gst: 18, hsn: "9983" },
          { id: "ret-2", phase: "Bill Verification", name: "Measurement book verification & contractor invoice validation", qty: 1, unit: "Job", rate: 15000, gst: 18, hsn: "9983" },
        ],
      },
    ],
  },
];

/**
 * Checks if worker state and customer state match (Intra-state vs Inter-state)
 */
export function checkIsSameState(workerState?: string, customerState?: string): boolean {
  if (!workerState || !customerState) return true; // Default to intra-state CGST+SGST if state unprovided
  const cleanStr = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const w = cleanStr(workerState);
  const c = cleanStr(customerState);
  if (!w || !c) return true;
  return w.includes(c) || c.includes(w);
}

/**
 * Computes complete GST, discount, and grand total breakdown for a quotation object
 */
export function calculateQuoteCalculations(
  quote: any,
  selectedOptionalIds?: string[]
): TaxBreakdown {
  if (!quote) {
    return {
      isSameState: true,
      taxInclusive: false,
      subtotal: 0,
      lineDiscountsTotal: 0,
      globalDiscountAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      taxAmount: 0,
      grandTotal: 0,
      itemBreakdowns: [],
    };
  }

  const sections = getQuoteSections(quote);
  const isSameState = checkIsSameState(
    quote.workerState || quote.workerAddress,
    quote.customerState || quote.customerAddress
  );
  const taxInclusive = Boolean(quote.taxInclusive);

  const allTableItems = sections
    .filter((s: any) => s.type === "table")
    .flatMap((s: any) => s.content || []);

  let rawSubtotal = 0;
  let lineDiscountsTotal = 0;
  let netBaseSubtotal = 0;
  let totalTaxAmount = 0;
  const itemBreakdowns: TaxBreakdown["itemBreakdowns"] = [];

  allTableItems.forEach((item: any, idx: number) => {
    // If item is marked optional and not selected by client, skip it
    if (item.optional && selectedOptionalIds && !selectedOptionalIds.includes(item.id || `item-${idx}`)) {
      return;
    }

    const qty = Number(item.qty || 1);
    const rate = Number(item.rate || 0);
    const lineGross = qty * rate;
    rawSubtotal += lineGross;

    // Line item discount
    let discountAmt = 0;
    const itemDiscVal = Number(item.discount || 0);
    if (itemDiscVal > 0) {
      if (item.discountType === "percent") {
        discountAmt = lineGross * (itemDiscVal / 100);
      } else {
        discountAmt = itemDiscVal;
      }
    }
    lineDiscountsTotal += discountAmt;
    const grossAfterLineDiscount = Math.max(0, lineGross - discountAmt);

    // GST calculation
    const gstRate = Number(item.gst || 0) / 100;
    let netBase = 0;
    let gstAmount = 0;

    if (taxInclusive && gstRate > 0) {
      netBase = grossAfterLineDiscount / (1 + gstRate);
      gstAmount = grossAfterLineDiscount - netBase;
    } else {
      netBase = grossAfterLineDiscount;
      gstAmount = grossAfterLineDiscount * gstRate;
    }

    netBaseSubtotal += netBase;
    totalTaxAmount += gstAmount;

    itemBreakdowns.push({
      id: item.id || `item-${idx}`,
      baseTotal: lineGross,
      discountAmt,
      netBase,
      gstRate: gstRate * 100,
      gstAmount,
      finalRowTotal: taxInclusive ? grossAfterLineDiscount : netBase + gstAmount,
    });
  });

  // Global discount
  const globalDiscVal = Number(quote.discount || 0);
  let globalDiscountAmount = 0;
  if (globalDiscVal > 0) {
    if (quote.discountType === "percent") {
      globalDiscountAmount = netBaseSubtotal * (globalDiscVal / 100);
    } else {
      globalDiscountAmount = globalDiscVal;
    }
  }

  // Recalculate tax if global discount reduces tax base, or apply tax as calculated
  const netTaxableSubtotal = Math.max(0, netBaseSubtotal - globalDiscountAmount);
  
  // Tax split
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isSameState) {
    cgstAmount = totalTaxAmount / 2;
    sgstAmount = totalTaxAmount / 2;
  } else {
    igstAmount = totalTaxAmount;
  }

  const grandTotal = Math.max(0, netTaxableSubtotal + totalTaxAmount);

  return {
    isSameState,
    taxInclusive,
    subtotal: taxInclusive ? rawSubtotal : netBaseSubtotal,
    lineDiscountsTotal,
    globalDiscountAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxAmount: totalTaxAmount,
    grandTotal,
    itemBreakdowns,
  };
}

/**
 * Calculates a structured difference between two quote revisions
 */
export function calculateQuoteDiff(priorQuote: any, newQuote: any): QuoteVersionChange {
  const priorSections = getQuoteSections(priorQuote);
  const newSections = getQuoteSections(newQuote);

  const priorItems: any[] = priorSections
    .filter((s: any) => s.type === "table")
    .flatMap((s: any) => s.content || []);
  const newItems: any[] = newSections
    .filter((s: any) => s.type === "table")
    .flatMap((s: any) => s.content || []);

  const priorCalc = calculateQuoteCalculations(priorQuote);
  const newCalc = calculateQuoteCalculations(newQuote);
  const totalDelta = newCalc.grandTotal - priorCalc.grandTotal;

  let addedItemsCount = 0;
  let removedItemsCount = 0;
  let modifiedItemsCount = 0;

  const priorMap = new Map(priorItems.map((it) => [it.id || it.name, it]));
  const newMap = new Map(newItems.map((it) => [it.id || it.name, it]));

  newItems.forEach((it) => {
    const key = it.id || it.name;
    if (!priorMap.has(key)) {
      addedItemsCount++;
    } else {
      const pIt = priorMap.get(key);
      if (
        Number(pIt.qty) !== Number(it.qty) ||
        Number(pIt.rate) !== Number(it.rate) ||
        pIt.name !== it.name ||
        Number(pIt.discount) !== Number(it.discount)
      ) {
        modifiedItemsCount++;
      }
    }
  });

  priorItems.forEach((it) => {
    const key = it.id || it.name;
    if (!newMap.has(key)) {
      removedItemsCount++;
    }
  });

  const changes: string[] = [];
  if (addedItemsCount > 0) changes.push(`+${addedItemsCount} line items added`);
  if (removedItemsCount > 0) changes.push(`−${removedItemsCount} line items removed`);
  if (modifiedItemsCount > 0) changes.push(`${modifiedItemsCount} items revised`);
  if (totalDelta !== 0) {
    const sign = totalDelta > 0 ? "+" : "−";
    changes.push(`Total delta: ${sign}₹${Math.abs(totalDelta).toLocaleString("en-IN")}`);
  }

  return {
    timestamp: new Date().toISOString(),
    version: Number(newQuote.version || 2),
    revisedBy: newQuote.workerName || "Contractor",
    addedItemsCount,
    removedItemsCount,
    modifiedItemsCount,
    totalDelta,
    summaryText: changes.length > 0 ? changes.join(" · ") : "Minor text/terms revision",
  };
}

/**
 * Creates a cloned revision of an existing quote with incremented version number
 */
export function createQuoteRevision(priorQuote: any, newVersionNumber?: number): any {
  const currentVersion = Number(priorQuote.version || 1);
  const nextVersion = newVersionNumber || currentVersion + 1;
  const rootId = priorQuote.revisionOf || priorQuote.id;
  const quoteNumBase = (priorQuote.quoteNumber || "QT-EST").split("-R")[0];

  return {
    ...priorQuote,
    id: `q-rev-${Date.now()}`,
    quoteNumber: `${quoteNumBase}-R${nextVersion}`,
    version: nextVersion,
    revisionOf: rootId,
    priorVersionId: priorQuote.id,
    status: "Draft",
    viewCount: 0,
    firstViewedAt: null,
    lastViewedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Returns color tokens and icons for quote statuses using existing design tokens
 */
export function getQuoteStatusConfig(status: string, expiryDate?: string) {
  const s = (status || "draft").toLowerCase();
  const isExpired = expiryDate && new Date(expiryDate) < new Date() && s !== "accepted";

  if (s === "accepted") {
    return {
      label: "Accepted",
      badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      dotClass: "bg-emerald-500",
      colorKey: "emerald" as const,
    };
  }
  if (s === "declined") {
    return {
      label: "Declined",
      badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
      dotClass: "bg-rose-500",
      colorKey: "rose" as const,
    };
  }
  if (isExpired || s === "expired") {
    return {
      label: "Expired",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
      dotClass: "bg-amber-500",
      colorKey: "gold" as const,
    };
  }
  if (s === "viewed") {
    return {
      label: "Viewed",
      badgeClass: "bg-primary-50 text-primary-700 border border-primary-200",
      dotClass: "bg-primary-500",
      colorKey: "primary" as const,
    };
  }
  if (s === "sent" || s === "pending") {
    return {
      label: "Sent",
      badgeClass: "bg-slate-100 text-slate-700 border border-slate-300",
      dotClass: "bg-slate-500",
      colorKey: "slate" as const,
    };
  }
  if (s === "approval_pending") {
    return {
      label: "Approval Required",
      badgeClass: "bg-amber-50 text-amber-800 border border-amber-300",
      dotClass: "bg-amber-600",
      colorKey: "gold" as const,
    };
  }

  return {
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
    dotClass: "bg-slate-400",
    colorKey: "slate" as const,
  };
}

/**
 * Team mode helper: Checks if a quote total exceeds business approval threshold
 */
export function isTeamApprovalRequired(quoteTotal: number, teamSettings?: any): boolean {
  if (!teamSettings || !teamSettings.teamModeEnabled || !teamSettings.requireApprovalAbove) {
    return false;
  }
  const threshold = Number(teamSettings.requireApprovalAbove);
  return quoteTotal >= threshold;
}

/**
 * Checks if a quote has passed its expiry date (and is not yet accepted)
 */
export function isQuoteExpired(quote: any): boolean {
  if (!quote || quote.status === "Accepted" || quote.status === "accepted") {
    return false;
  }
  if (!quote.expiryDate) return false;
  const expiry = new Date(quote.expiryDate);
  const now = new Date();
  // Set to end of expiry day
  expiry.setHours(23, 59, 59, 999);
  return expiry < now;
}

/**
 * Checks if a quote expires within the next 3 days
 */
export function isQuoteExpiringSoon(quote: any): boolean {
  if (!quote || quote.status === "Accepted" || quote.status === "accepted" || quote.status === "Declined") {
    return false;
  }
  if (!quote.expiryDate) return false;
  const expiry = new Date(quote.expiryDate);
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24);
  return diffDays >= 0 && diffDays <= 3;
}

/**
 * Generates a SHA-256 hash or deterministic checksum string of the agreed quote content for audit locking
 */
export async function generateQuoteSnapshotHash(quote: any, clientName: string, clientEmail: string): Promise<string> {
  const payload = {
    quoteId: quote.id,
    quoteNumber: quote.quoteNumber,
    customerName: clientName,
    customerEmail: clientEmail,
    grandTotal: quote.grandTotal || quote.total,
    sections: quote.sections || getQuoteSections(quote),
    signedAt: new Date().toISOString(),
  };
  const jsonString = JSON.stringify(payload);
  
  if (typeof crypto !== "undefined" && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(jsonString);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
    } catch (e) {
      console.warn("Crypto SHA-256 fallback:", e);
    }
  }

  // Fallback simple hash calculation if subtle crypto is not available
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `snaps_${Math.abs(hash).toString(16)}_${Date.now().toString(36)}`;
}

