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
