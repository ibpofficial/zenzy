import React, { useRef } from "react";
import {
  ShieldCheck,
  Building,
  CircleCheck,
  TriangleAlert,
  Clock,
  XCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  CheckSquare,
  Square,
  Sparkles,
  Lock,
  GitBranch,
  History,
  Copy
} from "lucide-react";
import TrustScoreCard from "@/components/TrustScoreCard";
import { calculateQuoteCalculations, getQuoteStatusConfig } from "@/lib/quoteUtils";
import { generatePdfFromElement } from "@/lib/pdfExport";

interface QuoteDocumentProps {
  quote: any;
  worker?: any;
  isEditable?: boolean;
  selectedOptionalIds?: string[];
  onToggleOptionalItem?: (itemId: string) => void;
  allowClientOptionalSelect?: boolean;
  onUpdateField?: (field: string, value: any) => void;
  // Dynamic section mutation callbacks
  onUpdateSectionTitle?: (sectionId: string, title: string) => void;
  onUpdateSectionContent?: (sectionId: string, content: any) => void;
  onMoveSection?: (index: number, direction: "up" | "down") => void;
  onRemoveSection?: (sectionId: string) => void;
  onAddSection?: (type: "text" | "grid" | "table") => void;
}

export function getContrastColor(hexColor: string) {
  if (!hexColor) return "#ffffff";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f172a" : "#ffffff";
}

export function decodeQuote(encodedStr: string) {
  try {
    if (!encodedStr || !encodedStr.startsWith("url_")) return null;
    let base64 = encodedStr.slice(4);

    // Swap URL-safe base64 characters back to standard
    base64 = base64.replace(/-/g, "+").replace(/_/g, "/");

    // Repair stripped padding '=' characters
    const pad = base64.length % 4;
    if (pad === 2) {
      base64 += "==";
    } else if (pad === 3) {
      base64 += "=";
    }

    // RegEx validation to verify it contains valid base64 character set
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(base64)) {
      console.warn("Invalid base64 string pattern in URL, skipping decode");
      return null;
    }

    const binaryString = atob(base64);
    const decoded = decodeURIComponent(
      binaryString
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Decoding error caught:", e);
    return null;
  }
}

// Convert legacy flat database quote formats into block-based sections list for backward compatibility
export function getQuoteSections(quote: any) {
  if (quote.sections && Array.isArray(quote.sections)) {
    return quote.sections;
  }

  const list: any[] = [];

  // 1. Project Overview & Description
  if (quote.projectTitle || quote.projectDescription) {
    list.push({
      id: "sec-overview",
      title: quote.projectTitle || "Project Description",
      type: "text",
      content: quote.projectDescription || "",
    });
  }

  // 2. Project Parameters Grid
  if (quote.plotArea || quote.projectDuration || quote.structureType) {
    const gridItems: any[] = [];
    if (quote.plotArea) gridItems.push({ key: "Area / Scope", value: quote.plotArea });
    if (quote.projectDuration) gridItems.push({ key: "Timeline", value: quote.projectDuration });
    if (quote.structureType) gridItems.push({ key: "Structure Type", value: quote.structureType });
    list.push({
      id: "sec-params",
      title: "Project Parameters",
      type: "grid",
      content: gridItems,
    });
  }

  // 3. Cost Breakdown Table
  const items = quote.items || quote.lineItems || [];
  if (items.length > 0) {
    list.push({
      id: "sec-table",
      title: "Cost Breakdown & Rates",
      type: "table",
      content: items.map((it: any) => ({
        id: it.id || `item-${Math.random()}`,
        phase: it.phase || "General",
        name: it.name || it.description || "",
        qty: Number(it.qty || 1),
        unit: it.unit || "Sq Ft",
        rate: Number(it.rate || 0),
        gst: Number(it.gst || 18),
        hsn: it.hsn || "",
        discount: Number(it.discount || 0),
        discountType: it.discountType || "flat",
        optional: Boolean(it.optional),
      })),
    });
  }

  // 4. Material Specifications
  if (
    quote.materials &&
    Object.keys(quote.materials).length > 0 &&
    Object.values(quote.materials).some((v) => v)
  ) {
    const materialItems = Object.entries(quote.materials).map(([k, v]) => ({
      key: k.toUpperCase(),
      value: v as string,
    }));
    list.push({
      id: "sec-materials",
      title: "Material Specifications",
      type: "grid",
      content: materialItems,
    });
  }

  // 5. Inclusions & Exclusions
  if (quote.inclusionsExclusions) {
    list.push({
      id: "sec-scope",
      title: "Scope Inclusions & Exclusions",
      type: "text",
      content: quote.inclusionsExclusions,
    });
  }

  // 6. Warranties & Prerequisites
  if (quote.defectLiability || quote.milestoneVerification || quote.clientPrerequisites) {
    const warrantyItems: any[] = [];
    if (quote.defectLiability) warrantyItems.push({ key: "Warranty Period", value: quote.defectLiability });
    if (quote.milestoneVerification) warrantyItems.push({ key: "Verification Method", value: quote.milestoneVerification });
    if (quote.clientPrerequisites) warrantyItems.push({ key: "Client Site Prerequisites", value: quote.clientPrerequisites });
    list.push({
      id: "sec-warranties",
      title: "Warranties & Prerequisites",
      type: "grid",
      content: warrantyItems,
    });
  }

  // 7. Terms and Conditions
  if (quote.termsAndConditions) {
    list.push({
      id: "sec-terms",
      title: "Terms & Conditions",
      type: "text",
      content: quote.termsAndConditions,
    });
  }

  return list;
}

export default function QuoteDocument({
  quote,
  worker,
  isEditable = false,
  selectedOptionalIds,
  onToggleOptionalItem,
  allowClientOptionalSelect = false,
  onUpdateField,
  onUpdateSectionTitle,
  onUpdateSectionContent,
  onMoveSection,
  onRemoveSection,
  onAddSection,
}: QuoteDocumentProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  if (!quote) return null;

  // Extract dynamic sections
  const sections = getQuoteSections(quote);

  // Compute financial totals using central financial engine
  const financialTotals = calculateQuoteCalculations(quote, selectedOptionalIds);
  const {
    isSameState,
    taxInclusive,
    subtotal,
    lineDiscountsTotal,
    globalDiscountAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxAmount,
    grandTotal,
  } = financialTotals;

  const brandLogo = quote.workerLogo || worker?.logo || worker?.avatar || "";
  const proName =
    quote.workerName ||
    worker?.businessName ||
    worker?.companyName ||
    worker?.name ||
    quote.businessName ||
    "Zenzy Verified Contractor";
  const proPhone = quote.workerPhone || worker?.phone || quote.contactPhone || "";
  const proAddress =
    quote.workerAddress || worker?.serviceArea || worker?.address || "Jaipur, Rajasthan";
  const licenseNo = quote.licenseNo || worker?.licenseNumber || worker?.documentVerifications?.licenseNumber || "";

  const accepted = quote.status === "Accepted" || quote.status === "accepted";
  const declined = quote.status === "Declined" || quote.status === "declined";
  const isExpired =
    quote.expiryDate && new Date(quote.expiryDate) < new Date() && !accepted;

  const statusConfig = getQuoteStatusConfig(quote.status, quote.expiryDate);
  const quoteVersion = Number(quote.version || 1);

  // Helper styles for inline input fields
  const inputClass =
    "bg-transparent border-b border-dashed border-slate-200 hover:border-slate-400 focus:border-slate-800 outline-none transition py-0.5 rounded px-1 w-full text-slate-800";
  const boldInputClass = `${inputClass} font-semibold text-slate-900`;

  return (
    <div
      ref={cardRef}
      className="pro-card border border-slate-200 bg-white print:border-0 relative font-sans text-slate-900 shadow-subtle rounded-pro-md overflow-hidden"
    >
      {/* Versioning & Revision Bar */}
      {quoteVersion > 1 && (
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono">
            <GitBranch className="w-3.5 h-3.5 text-primary-600" />
            <span className="font-bold text-slate-900">Revision v{quoteVersion}</span>
            {quote.revisionOf && (
              <span className="text-slate-500 text-[11px]">(Revised from original)</span>
            )}
          </div>
          {quote.versionSummary && (
            <span className="text-[11px] text-slate-600 italic">
              Changes: {quote.versionSummary}
            </span>
          )}
        </div>
      )}

      {/* Document Header */}
      <div className="px-6 sm:px-8 py-6 sm:py-8 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              {isEditable ? (
                <input
                  type="text"
                  value={quote.quoteDocumentTitle || "Quotation"}
                  onChange={(e) => onUpdateField?.("quoteDocumentTitle", e.target.value)}
                  className="text-xl font-bold tracking-tight text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-slate-800 outline-none w-64"
                />
              ) : (
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  {quote.quoteDocumentTitle || "Quotation"}
                </h1>
              )}

              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {isEditable ? (
                  <div className="flex items-center gap-1">
                    <span>#</span>
                    <input
                      type="text"
                      value={quote.quoteNumber || ""}
                      onChange={(e) => onUpdateField?.("quoteNumber", e.target.value)}
                      className="bg-transparent border-b border-dashed border-slate-300 focus:border-slate-800 outline-none w-28 font-mono text-xs"
                    />
                  </div>
                ) : (
                  `#${quote.quoteNumber || quote.id?.slice(0, 8) || "Estimate"}`
                )}
              </span>

              {taxInclusive && (
                <span className="text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-pro-sm">
                  GST Inclusive
                </span>
              )}

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-pro-sm ${statusConfig.badgeClass}`}>
                {statusConfig.label}
              </span>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
              <span>Issued</span>
              {isEditable ? (
                <input
                  type="date"
                  value={quote.createdAt ? quote.createdAt.split("T")[0] : ""}
                  onChange={(e) => onUpdateField?.("createdAt", e.target.value)}
                  className="bg-transparent text-slate-600 font-sans text-xs border-b border-dashed border-slate-300 focus:border-slate-800 outline-none py-0.5"
                />
              ) : (
                <span className="font-medium text-slate-700">
                  {quote.createdAt
                    ? new Date(quote.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              )}
            </div>
          </div>

          {/* Eye-catching Primary Accent Grand Total (Largest, boldest element) */}
          <div className="text-right flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (cardRef.current) {
                    generatePdfFromElement(
                      cardRef.current,
                      `Quotation_${quote.quoteNumber || "Estimate"}`
                    );
                  }
                }}
                className="pro-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer print:hidden"
                title="Export PDF Document"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <div className="text-3xl font-black tracking-tight text-primary-600 font-mono tabular-nums">
                ₹{grandTotal.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Estimated Amount
            </div>
          </div>
        </div>
      </div>

      {/* Business Details & Prominent Trust Score */}
      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-slate-50/40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start gap-4">
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={proName}
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                <Building className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <div className="flex-1">
              {isEditable ? (
                <input
                  type="text"
                  value={quote.workerName || ""}
                  placeholder="Company / Contractor Name"
                  onChange={(e) => onUpdateField?.("workerName", e.target.value)}
                  className="text-base font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-slate-800 outline-none w-72 px-1 py-0.5"
                />
              ) : (
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>{proName}</span>
                </h2>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                <div>
                  {isEditable ? (
                    <input
                      type="tel"
                      maxLength={10}
                      value={quote.workerPhone || ""}
                      placeholder="10-digit Phone"
                      onChange={(e) => onUpdateField?.("workerPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="text-xs text-slate-600 bg-transparent border-b border-dashed border-slate-300 outline-none w-28 font-mono"
                    />
                  ) : (
                    <span>{proPhone}</span>
                  )}
                </div>
                <div>
                  <span>•</span>{" "}
                  {isEditable ? (
                    <input
                      type="text"
                      value={quote.workerAddress || ""}
                      placeholder="Address"
                      onChange={(e) => onUpdateField?.("workerAddress", e.target.value)}
                      className="text-xs text-slate-600 bg-transparent border-b border-dashed border-slate-300 outline-none w-48"
                    />
                  ) : (
                    <span>{proAddress}</span>
                  )}
                </div>
                {licenseNo && (
                  <div>
                    <span>•</span> <span>Lic. {licenseNo}</span>
                  </div>
                )}
                {isEditable && (
                  <div>
                    <span>•</span>{" "}
                    <input
                      type="text"
                      value={quote.workerGstin || ""}
                      placeholder="GSTIN"
                      onChange={(e) => onUpdateField?.("workerGstin", e.target.value)}
                      className="text-xs text-slate-600 bg-transparent border-b border-dashed border-slate-300 outline-none w-32"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prominent Credibility Trust Score Badge */}
          {worker?.trustScore && (
            <div className="shrink-0 self-start sm:self-center">
              <TrustScoreCard trustScore={worker.trustScore} compact={true} />
            </div>
          )}
        </div>
      </div>

      {/* Client Info & Project Details Section */}
      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/20">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Client Details
          </h4>
          <div className="space-y-1 text-xs text-slate-700">
            {isEditable ? (
              <div className="space-y-1">
                <input
                  type="text"
                  value={quote.customerName || ""}
                  placeholder="Client Name (Required)"
                  onChange={(e) => onUpdateField?.("customerName", e.target.value)}
                  className={boldInputClass}
                />
                <input
                  type="text"
                  value={quote.customerCompany || ""}
                  placeholder="Organization / Company"
                  onChange={(e) => onUpdateField?.("customerCompany", e.target.value)}
                  className={inputClass}
                />
                <input
                  type="text"
                  value={quote.customerPhone || ""}
                  placeholder="Client Phone"
                  onChange={(e) => onUpdateField?.("customerPhone", e.target.value)}
                  className={inputClass}
                />
                <input
                  type="email"
                  value={quote.customerEmail || ""}
                  placeholder="Client Email"
                  onChange={(e) => onUpdateField?.("customerEmail", e.target.value)}
                  className={inputClass}
                />
                <input
                  type="text"
                  value={quote.customerAddress || ""}
                  placeholder="Client Site / Home Address"
                  onChange={(e) => onUpdateField?.("customerAddress", e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : (
              <>
                <p className="font-bold text-slate-900 text-sm">
                  {quote.customerName || "Valued Client"}
                </p>
                {quote.customerCompany && (
                  <p className="text-slate-500">{quote.customerCompany}</p>
                )}
                {quote.customerPhone && (
                  <p className="text-slate-500">{quote.customerPhone}</p>
                )}
                {quote.customerEmail && (
                  <p className="text-slate-500 font-mono text-[11px]">
                    {quote.customerEmail}
                  </p>
                )}
                {quote.customerAddress && (
                  <p className="text-slate-500">{quote.customerAddress}</p>
                )}
              </>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Project Overview
          </h4>
          <div className="space-y-1 text-xs text-slate-700">
            {isEditable ? (
              <div className="space-y-1">
                <input
                  type="text"
                  value={quote.projectTitle || ""}
                  placeholder="Project Title (Required)"
                  onChange={(e) => onUpdateField?.("projectTitle", e.target.value)}
                  className={boldInputClass}
                />
                <textarea
                  value={quote.projectDescription || ""}
                  placeholder="Scope / Project Description"
                  rows={3}
                  onChange={(e) => onUpdateField?.("projectDescription", e.target.value)}
                  className="bg-transparent border border-dashed border-slate-300 hover:border-slate-400 focus:border-slate-800 outline-none w-full p-1 text-xs resize-none rounded-pro-sm"
                />
              </div>
            ) : (
              <>
                <p className="font-bold text-slate-900 text-sm">
                  {quote.projectTitle || "Technical Service Estimate"}
                </p>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                  {quote.projectDescription || "Itemized breakdown of requested works."}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Render Dynamic Block-based Sections */}
      <div className="divide-y divide-slate-100">
        {sections.map((section: any, idx: number) => (
          <div key={section.id} className="px-6 sm:px-8 py-6 relative group quote-section-block">
            {/* Section Header with Consistent Type Scale */}
            <div className="flex justify-between items-center mb-3">
              {isEditable ? (
                <input
                  type="text"
                  value={section.title || ""}
                  onChange={(e) => onUpdateSectionTitle?.(section.id, e.target.value)}
                  className="text-xs font-bold text-slate-600 uppercase tracking-wider bg-transparent border-b border-dashed border-slate-300 outline-none w-72"
                />
              ) : (
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </h4>
              )}

              {/* Section management controls */}
              {isEditable && (
                <div className="flex items-center gap-1 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onMoveSection?.(idx, "up")}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveSection?.(idx, "down")}
                    disabled={idx === sections.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveSection?.(section.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    title="Remove Section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Type 1: Text Section */}
            {section.type === "text" && (
              <div>
                {isEditable ? (
                  <textarea
                    value={section.content || ""}
                    onChange={(e) => onUpdateSectionContent?.(section.id, e.target.value)}
                    placeholder="Enter details..."
                    rows={4}
                    className="w-full bg-transparent border border-dashed border-slate-200 hover:border-slate-400 focus:border-slate-800 rounded-pro-sm p-2 text-xs text-slate-800 outline-none resize-y"
                  />
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                    {section.content}
                  </p>
                )}
              </div>
            )}

            {/* Type 2: Key-Value Parameters Grid */}
            {section.type === "grid" && (
              <div>
                {isEditable ? (
                  <div className="space-y-3 print:hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {(section.content || []).map((row: any, rIdx: number) => (
                        <div
                          key={rIdx}
                          className="bg-white border border-slate-200 rounded-pro-md p-3 relative group/row shadow-subtle"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const newContent = (section.content || []).filter(
                                (_: any, i: number) => i !== rIdx
                              );
                              onUpdateSectionContent?.(section.id, newContent);
                            }}
                            className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover/row:opacity-100 transition cursor-pointer"
                          >
                            ✕
                          </button>
                          <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={row.key || ""}
                            placeholder="e.g. Plot Area"
                            onChange={(e) => {
                              const newContent = [...section.content];
                              newContent[rIdx] = { ...newContent[rIdx], key: e.target.value };
                              onUpdateSectionContent?.(section.id, newContent);
                            }}
                            className="text-[10px] text-primary-700 uppercase font-bold bg-transparent outline-none w-full border-b border-dashed border-slate-200 pb-0.5"
                          />
                          <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mt-2 mb-1">
                            Value
                          </label>
                          <input
                            type="text"
                            value={row.value || ""}
                            placeholder="e.g. 2,400 Sq Ft"
                            onChange={(e) => {
                              const newContent = [...section.content];
                              newContent[rIdx] = { ...newContent[rIdx], value: e.target.value };
                              onUpdateSectionContent?.(section.id, newContent);
                            }}
                            className="text-xs font-bold text-slate-900 bg-transparent outline-none w-full border-b border-dashed border-slate-200 pb-0.5"
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const newContent = [
                            ...(section.content || []),
                            { key: "New Parameter", value: "" },
                          ];
                          onUpdateSectionContent?.(section.id, newContent);
                        }}
                        className="border border-dashed border-slate-300 hover:border-primary-400 hover:bg-primary-50/20 rounded-pro-md p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition text-slate-400 hover:text-primary-600"
                      >
                        <span className="text-xl font-light">+</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Add Parameter
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(section.content || []).map((row: any, rIdx: number) => (
                      <div
                        key={rIdx}
                        className="bg-slate-50/60 rounded-pro-sm p-2.5 border border-slate-200/60"
                      >
                        <span className="text-[9.5px] text-slate-400 uppercase block font-bold tracking-wider">
                          {row.key}
                        </span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Type 3: Itemized Line-Items Table */}
            {section.type === "table" && (
              <div>
                {isEditable ? (
                  <div className="space-y-2 print:hidden">
                    <div className="grid grid-cols-12 gap-2 px-3 pb-1 border-b border-slate-100">
                      <div className="col-span-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        #
                      </div>
                      <div className="col-span-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Description & Phase
                      </div>
                      <div className="col-span-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        HSN
                      </div>
                      <div className="col-span-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Qty
                      </div>
                      <div className="col-span-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Unit
                      </div>
                      <div className="col-span-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Rate (₹)
                      </div>
                      <div className="col-span-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        GST%
                      </div>
                      <div className="col-span-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Disc
                      </div>
                      <div className="col-span-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">
                        Total
                      </div>
                    </div>

                    {(section.content || []).map((row: any, rIdx: number) => {
                      const rowId = row.id || `item-${rIdx}`;
                      const rowQty = Number(row.qty || 1);
                      const rowRate = Number(row.rate || 0);
                      const rowGross = rowQty * rowRate;
                      let lineDisc = 0;
                      if (Number(row.discount) > 0) {
                        lineDisc =
                          row.discountType === "percent"
                            ? rowGross * (Number(row.discount) / 100)
                            : Number(row.discount);
                      }
                      const rowNet = Math.max(0, rowGross - lineDisc);
                      const gstAmt = rowNet * (Number(row.gst || 0) / 100);
                      const rowTotal = rowNet + gstAmt;

                      return (
                        <div
                          key={rowId}
                          className="bg-white border border-slate-200 rounded-pro-md overflow-hidden hover:border-slate-300 transition-all group/row"
                        >
                          <div className="grid grid-cols-12 gap-2 items-start p-3">
                            <div className="col-span-1 flex flex-col items-center gap-1 pt-1">
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 rounded w-5 h-5 flex items-center justify-center">
                                {rIdx + 1}
                              </span>
                              <label
                                className="flex flex-col items-center gap-0.5 cursor-pointer"
                                title="Mark as optional client add-on"
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(row.optional)}
                                  onChange={(e) => {
                                    const nc = [...section.content];
                                    nc[rIdx] = { ...nc[rIdx], optional: e.target.checked };
                                    onUpdateSectionContent?.(section.id, nc);
                                  }}
                                  className="w-3 h-3 rounded border-slate-300 cursor-pointer"
                                />
                                <span className="text-[7.5px] text-slate-400 font-semibold">
                                  OPT
                                </span>
                              </label>
                            </div>

                            <div className="col-span-4 space-y-1">
                              <input
                                type="text"
                                value={row.phase || ""}
                                placeholder="Phase label"
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], phase: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="text-[9px] font-bold uppercase text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded outline-none w-full"
                              />
                              <input
                                type="text"
                                value={row.name || ""}
                                placeholder="Item description"
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], name: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="text-xs font-semibold text-slate-900 bg-transparent outline-none w-full border-b border-dashed border-slate-200 focus:border-slate-800 pb-0.5"
                              />
                            </div>

                            <div className="col-span-1">
                              <input
                                type="text"
                                value={row.hsn || ""}
                                placeholder="9954"
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], hsn: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="w-full text-center text-xs font-mono bg-slate-50 border border-slate-200 rounded px-1 py-1 outline-none"
                              />
                            </div>

                            <div className="col-span-1">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                inputMode="decimal"
                                value={rowQty}
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], qty: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="w-full text-right text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded px-1.5 py-1 outline-none"
                              />
                            </div>

                            <div className="col-span-1">
                              <select
                                value={row.unit || "Sq Ft"}
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], unit: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="w-full text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded px-1 py-1 outline-none"
                              >
                                <option>Sq Ft</option>
                                <option>Sq M</option>
                                <option>Rmt</option>
                                <option>Nos</option>
                                <option>Job</option>
                                <option>Units</option>
                                <option>Kg</option>
                                <option>Days</option>
                                <option>LS</option>
                              </select>
                            </div>

                            <div className="col-span-1">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                inputMode="decimal"
                                value={rowRate}
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], rate: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="w-full text-right text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded px-1 py-1 outline-none"
                              />
                            </div>

                            <div className="col-span-1">
                              <select
                                value={String(row.gst ?? 18)}
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], gst: Number(e.target.value) };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 rounded px-1 py-1 outline-none"
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </div>

                            <div className="col-span-1 space-y-1">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                inputMode="decimal"
                                value={row.discount || ""}
                                placeholder="0"
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], discount: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="w-full text-right text-xs bg-slate-50 border border-slate-200 rounded px-1 py-1 outline-none"
                              />
                            </div>

                            <div className="col-span-1 flex flex-col items-end gap-1">
                              <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                                ₹{Math.round(rowTotal).toLocaleString("en-IN")}
                              </span>
                              <div className="flex flex-col items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nc = [...(section.content || [])];
                                    const cloned = { ...row, id: `item-${Date.now()}` };
                                    nc.splice(rIdx + 1, 0, cloned);
                                    onUpdateSectionContent?.(section.id, nc);
                                  }}
                                  className="text-slate-400 hover:text-primary-600 p-0.5 rounded cursor-pointer opacity-0 group-hover/row:opacity-100 transition"
                                  title="Duplicate line item"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nc = (section.content || []).filter(
                                      (_: any, i: number) => i !== rIdx
                                    );
                                    onUpdateSectionContent?.(section.id, nc);
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer opacity-0 group-hover/row:opacity-100 transition"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        const newContent = [
                          ...(section.content || []),
                          {
                            id: `item-${Date.now()}`,
                            phase: "",
                            name: "",
                            qty: 1,
                            unit: "Sq Ft",
                            rate: 0,
                            gst: 18,
                            hsn: "9954",
                            discount: 0,
                            discountType: "flat",
                            optional: false,
                          },
                        ];
                        onUpdateSectionContent?.(section.id, newContent);
                      }}
                      className="w-full py-2 border border-dashed border-slate-300 hover:border-primary-400 hover:bg-primary-50/20 rounded-pro-md text-xs font-semibold text-slate-500 hover:text-primary-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Line Item
                    </button>
                  </div>
                ) : (
                  /* Read-only Client Table View */
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          {allowClientOptionalSelect && <th className="py-2 w-8 text-center"></th>}
                          <th className="text-left py-2">Description</th>
                          <th className="text-center py-2 w-16">HSN</th>
                          <th className="text-right py-2 w-16">Qty</th>
                          <th className="text-right py-2 w-24">Rate</th>
                          <th className="text-right py-2 w-14">GST</th>
                          <th className="text-right py-2 w-28">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(section.content || []).map((row: any, rIdx: number) => {
                          const rowId = row.id || `item-${rIdx}`;
                          const isOptional = Boolean(row.optional);
                          const isSelected = selectedOptionalIds
                            ? selectedOptionalIds.includes(rowId)
                            : true;
                          const rowQty = Number(row.qty || 1);
                          const rowRate = Number(row.rate || 0);
                          const rowGross = rowQty * rowRate;
                          let lineDisc = 0;
                          if (Number(row.discount) > 0) {
                            lineDisc =
                              row.discountType === "percent"
                                ? rowGross * (Number(row.discount) / 100)
                                : Number(row.discount);
                          }
                          const rowNet = Math.max(0, rowGross - lineDisc);
                          const rowTotal = rowNet;

                          return (
                            <tr
                              key={rowId}
                              className={`transition ${
                                isOptional && !isSelected ? "opacity-35 bg-slate-50" : "hover:bg-slate-50/50"
                              }`}
                            >
                              {allowClientOptionalSelect && (
                                <td className="py-2.5 text-center">
                                  {isOptional ? (
                                    <button
                                      type="button"
                                      onClick={() => onToggleOptionalItem?.(rowId)}
                                      className="text-slate-700 hover:text-primary-600 cursor-pointer p-1"
                                      title="Toggle optional item"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-primary-600" />
                                      ) : (
                                        <Square className="w-4 h-4 text-slate-300" />
                                      )}
                                    </button>
                                  ) : (
                                    <span className="text-slate-300 text-xs">•</span>
                                  )}
                                </td>
                              )}
                              <td className="py-2.5 text-slate-800">
                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                  {row.phase && (
                                    <span className="text-[8.5px] font-bold uppercase text-primary-700 bg-primary-50 px-1 py-0.5 rounded-pro-sm">
                                      {row.phase}
                                    </span>
                                  )}
                                  {isOptional && (
                                    <span className="text-[8.5px] font-bold uppercase text-amber-700 bg-amber-50 px-1 py-0.5 rounded-pro-sm">
                                      Optional Add-on
                                    </span>
                                  )}
                                </div>
                                <p className="font-semibold text-slate-900">{row.name || row.description}</p>
                              </td>
                              <td className="text-center py-2.5 text-slate-400 font-mono">{row.hsn || "9954"}</td>
                              <td className="text-right py-2.5 font-mono tabular-nums text-slate-600">
                                {rowQty} {row.unit || ""}
                              </td>
                              <td className="text-right py-2.5 font-mono tabular-nums text-slate-600">
                                ₹{rowRate.toLocaleString("en-IN")}
                              </td>
                              <td className="text-right py-2.5 text-slate-400 font-mono text-[11px]">
                                {row.gst ?? 18}%
                              </td>
                              <td className="text-right py-2.5 font-bold font-mono tabular-nums text-slate-900">
                                ₹{rowTotal.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Block insertion in editor mode */}
      {isEditable && (
        <div className="px-6 sm:px-8 py-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 print:hidden">
          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block w-full mb-1">
            + Insert Document Section
          </span>
          <button
            type="button"
            onClick={() => onAddSection?.("text")}
            className="pro-btn-secondary py-1 px-3 text-xs"
          >
            + Text Block
          </button>
          <button
            type="button"
            onClick={() => onAddSection?.("grid")}
            className="pro-btn-secondary py-1 px-3 text-xs"
          >
            + Parameters Grid
          </button>
          <button
            type="button"
            onClick={() => onAddSection?.("table")}
            className="pro-btn-secondary py-1 px-3 text-xs"
          >
            + Cost Table
          </button>
        </div>
      )}

      {/* Financial Summary Footer */}
      <div className="px-6 sm:px-8 py-6 border-t border-slate-200 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">
              Payment Terms & Schedule
            </span>
            {isEditable ? (
              <input
                type="text"
                value={quote.paymentTerms || ""}
                onChange={(e) => onUpdateField?.("paymentTerms", e.target.value)}
                placeholder="e.g. 30% Booking | 70% Handover"
                className="bg-transparent border-b border-dashed border-slate-300 outline-none w-80 mt-1 font-semibold text-slate-800 text-xs"
              />
            ) : (
              <span className="text-slate-800 font-semibold mt-0.5 block">
                {quote.paymentTerms || "Standard Net-15"}
              </span>
            )}

            {/* Calculated Milestone Breakdown Card */}
            <div className="mt-3 pt-2">
              <span className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                💳 Milestone Payment Schedule Breakdown
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Booking Deposit (20%)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">₹{Math.round(grandTotal * 0.20).toLocaleString("en-IN")}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Structure & Slab (30%)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">₹{Math.round(grandTotal * 0.30).toLocaleString("en-IN")}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">MEP & Finishes (30%)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">₹{Math.round(grandTotal * 0.30).toLocaleString("en-IN")}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Final Handover (20%)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">₹{Math.round(grandTotal * 0.20).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-72 space-y-1.5 text-right font-mono tabular-nums">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal {taxInclusive && "(Tax Incl.)"}</span>
              <span className="font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            {(lineDiscountsTotal > 0 || globalDiscountAmount > 0) && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">
                  -₹{(lineDiscountsTotal + globalDiscountAmount).toLocaleString("en-IN")}
                </span>
              </div>
            )}

            {taxAmount > 0 && (
              <>
                {isSameState ? (
                  <>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>CGST (9%)</span>
                      <span>₹{cgstAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>SGST (9%)</span>
                      <span>₹{sgstAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>IGST (18%)</span>
                    <span>₹{igstAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </>
            )}

            <div className="border-t border-slate-300 pt-2 flex justify-between text-base font-black text-slate-900 font-sans">
              <span>Grand Total</span>
              <span className="text-primary-600 font-mono font-black text-xl">
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Verification Block (read-only) */}
      {!isEditable && accepted && (quote.signatureName || quote.acceptedSignature) && (
        <div className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-emerald-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Digitally Signed & Authorized
              </p>
              <p className="font-bold text-slate-900">
                {quote.signatureName || quote.acceptedSignature}
              </p>
              {quote.snapshotHash && (
                <p className="text-[9.5px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" /> Audit Hash: {quote.snapshotHash}
                </p>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-pro-sm">
            ✓ Verified Sign-off
          </span>
        </div>
      )}

      {/* Footer info (Valid Until date) */}
      <div className="px-6 sm:px-8 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-500">
        <span>
          Valid until{" "}
          {isEditable ? (
            <input
              type="date"
              value={quote.expiryDate ? quote.expiryDate.split("T")[0] : ""}
              onChange={(e) => onUpdateField?.("expiryDate", e.target.value)}
              className="bg-transparent text-slate-600 font-sans text-xs border-b border-dashed border-slate-300 outline-none w-28 py-0.5"
            />
          ) : quote.expiryDate ? (
            new Date(quote.expiryDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          ) : (
            "—"
          )}
        </span>
        <span className="font-mono text-[11px]">
          Estimate #{quote.quoteNumber || quote.id?.slice(0, 8) || "Draft"}
        </span>
      </div>
    </div>
  );
}
