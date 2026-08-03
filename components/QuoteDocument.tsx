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
  Lock
} from "lucide-react";
import TrustScoreCard from "@/components/TrustScoreCard";
import { calculateQuoteCalculations } from "@/lib/quoteUtils";
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
    const decoded = decodeURIComponent(binaryString.split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
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
      content: quote.projectDescription || ""
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
      content: gridItems
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
        optional: Boolean(it.optional)
      }))
    });
  }

  // 4. Material Specifications
  if (quote.materials && Object.keys(quote.materials).length > 0 && Object.values(quote.materials).some(v => v)) {
    const materialItems = Object.entries(quote.materials).map(([k, v]) => ({
      key: k.toUpperCase(),
      value: v as string
    }));
    list.push({
      id: "sec-materials",
      title: "Material Specifications",
      type: "grid",
      content: materialItems
    });
  }

  // 5. Inclusions & Exclusions
  if (quote.inclusionsExclusions) {
    list.push({
      id: "sec-scope",
      title: "Scope Inclusions & Exclusions",
      type: "text",
      content: quote.inclusionsExclusions
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
      content: warrantyItems
    });
  }

  // 7. Terms and Conditions
  if (quote.termsAndConditions) {
    list.push({
      id: "sec-terms",
      title: "Terms & Conditions",
      type: "text",
      content: quote.termsAndConditions
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
  onAddSection
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
    grandTotal
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

  const getStatusConfig = () => {
    if (accepted) return { label: "Accepted", color: "green", icon: CircleCheck };
    if (declined) return { label: "Declined", color: "red", icon: XCircle };
    if (isExpired) return { label: "Expired", color: "orange", icon: TriangleAlert };
    return { label: "Pending", color: "gray", icon: Clock };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Helper styles for inline input fields
  const inputClass = "bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none transition py-0.5 rounded px-1 w-full";
  const boldInputClass = `${inputClass} font-semibold text-gray-900`;

  return (
    <div ref={cardRef} className="border border-gray-200 bg-white print:border-0 relative font-sans text-gray-900 shadow-sm">
      
      {/* Document Header */}
      <div className="px-6 sm:px-8 py-6 sm:py-8 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              {isEditable ? (
                <input
                  type="text"
                  value={quote.quoteDocumentTitle || "Quotation"}
                  onChange={(e) => onUpdateField?.("quoteDocumentTitle", e.target.value)}
                  className="text-xl font-light tracking-tight text-gray-900 bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none w-64"
                />
              ) : (
                <h1 className="text-xl font-light tracking-tight text-gray-900">
                  {quote.quoteDocumentTitle || "Quotation"}
                </h1>
              )}

              <span className="text-xs text-gray-600 font-mono">
                {isEditable ? (
                  <div className="flex items-center gap-1">
                    <span>#</span>
                    <input
                      type="text"
                      value={quote.quoteNumber || ""}
                      onChange={(e) => onUpdateField?.("quoteNumber", e.target.value)}
                      className="bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none w-28 font-mono text-xs"
                    />
                  </div>
                ) : (
                  `#${quote.quoteNumber || quote.id?.slice(0, 8) || "Estimate"}`
                )}
              </span>

              {taxInclusive && (
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                  GST Inclusive
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 flex items-center gap-1.5 flex-wrap">
              <span>Issued</span>
              {isEditable ? (
                <input
                  type="date"
                  value={quote.createdAt ? quote.createdAt.split("T")[0] : ""}
                  onChange={(e) => onUpdateField?.("createdAt", e.target.value)}
                  className="bg-transparent text-gray-400 font-sans text-sm border-b border-dashed border-transparent hover:border-gray-350 focus:border-gray-650 outline-none py-0.5"
                />
              ) : (
                <span>
                  {quote.createdAt
                    ? new Date(quote.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    : "—"}
                </span>
              )}
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (cardRef.current) {
                    generatePdfFromElement(cardRef.current, `Quotation_${quote.quoteNumber || "Estimate"}`);
                  }
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer print:hidden transition shadow-xs"
                title="Export PDF Document"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <div className="text-2xl font-light tracking-tight">₹{grandTotal.toLocaleString("en-IN")}</div>
            </div>
            <div className="text-xs text-gray-400">Total Estimated Amount</div>
          </div>
        </div>
      </div>

      {/* Business Info (Contractor Details) */}
      <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
        <div className="flex items-start gap-4">
          {brandLogo ? (
            <img
              src={brandLogo}
              alt={proName}
              className="w-12 h-12 rounded-full object-cover border border-gray-100 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
              <Building className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            {isEditable ? (
              <input
                type="text"
                value={quote.workerName || ""}
                placeholder="Company / Contractor Name"
                onChange={(e) => onUpdateField?.("workerName", e.target.value)}
                className="text-base font-medium text-gray-900 bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none w-72 px-1 py-0.5"
              />
            ) : (
              <h2 className="text-base font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                <span>{proName}</span>
                {worker?.trustScore && <TrustScoreCard trustScore={worker.trustScore} compact={true} />}
              </h2>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1.5">
              <div className="flex items-center gap-1">
                {isEditable ? (
                  <input
                    type="text"
                    value={quote.workerPhone || ""}
                    placeholder="Phone"
                    onChange={(e) => onUpdateField?.("workerPhone", e.target.value)}
                    className="text-xs text-gray-500 bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none w-28"
                  />
                ) : (
                  <span>{proPhone}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span>•</span>
                {isEditable ? (
                  <input
                    type="text"
                    value={quote.workerAddress || ""}
                    placeholder="Address"
                    onChange={(e) => onUpdateField?.("workerAddress", e.target.value)}
                    className="text-xs text-gray-500 bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none w-48"
                  />
                ) : (
                  <span>{proAddress}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span>•</span>
                {isEditable ? (
                  <input
                    type="text"
                    value={quote.licenseNo || ""}
                    placeholder="License / Reg"
                    onChange={(e) => onUpdateField?.("licenseNo", e.target.value)}
                    className="text-xs text-gray-500 bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none w-28"
                  />
                ) : (
                  licenseNo && <span>Lic. {licenseNo}</span>
                )}
              </div>
              {isEditable && (
                <div className="flex items-center gap-1">
                  <span>•</span>
                  <input
                    type="text"
                    value={quote.workerGstin || ""}
                    placeholder="GSTIN"
                    onChange={(e) => onUpdateField?.("workerGstin", e.target.value)}
                    className="text-xs text-gray-500 bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none w-32"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Client Info & Project Details Section */}
      <div className="px-6 sm:px-8 py-5 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/30">
        <div>
          <h4 className="text-xs font-semibold text-gray-650 uppercase tracking-wider mb-2">Client Details</h4>
          <div className="space-y-1.5 text-sm text-gray-700">
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
                <p className="font-semibold text-gray-900">{quote.customerName || "Valued Client"}</p>
                {quote.customerCompany && <p className="text-xs text-gray-500">{quote.customerCompany}</p>}
                {quote.customerPhone && <p className="text-xs text-gray-500 mt-0.5">{quote.customerPhone}</p>}
                {quote.customerEmail && <p className="text-xs text-gray-500">{quote.customerEmail}</p>}
                {quote.customerAddress && <p className="text-xs text-gray-500">{quote.customerAddress}</p>}
              </>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-650 uppercase tracking-wider mb-2">Project Overview</h4>
          <div className="space-y-1.5 text-sm text-gray-700">
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
                  className="bg-transparent border border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none w-full p-1 text-xs resize-none rounded"
                />
              </div>
            ) : (
              <>
                <p className="font-semibold text-gray-900">{quote.projectTitle || "Technical Service Estimate"}</p>
                <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">
                  {quote.projectDescription || "Itemized breakdown of requested works."}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Render Dynamic Block-based Sections */}
      <div className="divide-y divide-gray-100">
        {sections.map((section: any, idx: number) => (
          <div key={section.id} className="px-6 sm:px-8 py-6 relative group">
            
            {/* Section Header */}
            <div className="flex justify-between items-center mb-3">
              {isEditable ? (
                <input
                  type="text"
                  value={section.title || ""}
                  onChange={(e) => onUpdateSectionTitle?.(section.id, e.target.value)}
                  className="text-xs font-bold text-gray-900 uppercase tracking-wider bg-transparent border-b border-dashed border-transparent hover:border-gray-350 focus:border-gray-650 outline-none w-72"
                />
              ) : (
                <h4 className="text-xs font-semibold text-gray-650 uppercase tracking-wider">
                  {section.title}
                </h4>
              )}

              {/* Section management controls (Move Up/Down, Remove) */}
              {isEditable && (
                <div className="flex items-center gap-1.5 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onMoveSection?.(idx, "up")}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveSection?.(idx, "down")}
                    disabled={idx === sections.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveSection?.(section.id)}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded cursor-pointer"
                    title="Remove Section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Section Contents based on Type */}
            {/* Type 1: Text Section */}
            {section.type === "text" && (
              <div>
                {isEditable ? (
                  <textarea
                    value={section.content || ""}
                    onChange={(e) => onUpdateSectionContent?.(section.id, e.target.value)}
                    placeholder="Enter details..."
                    rows={4}
                    className="w-full bg-transparent border border-dashed border-gray-200 hover:border-gray-400 focus:border-gray-800 rounded p-2 text-sm outline-none resize-y"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
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
                        <div key={rIdx} className="bg-white border border-gray-200 rounded-xl p-3.5 relative group/row shadow-xs hover:border-gray-350 hover:shadow-sm transition-all">
                          <button
                            type="button"
                            onClick={() => {
                              const newContent = (section.content || []).filter((_: any, i: number) => i !== rIdx);
                              onUpdateSectionContent?.(section.id, newContent);
                            }}
                            className="absolute top-2 right-2 text-gray-250 hover:text-red-500 hover:bg-red-50 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover/row:opacity-100 transition cursor-pointer"
                            title="Remove this parameter box"
                          >
                            ✕
                          </button>
                          <label className="text-[9.5px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Parameter Label</label>
                          <input
                            type="text"
                            value={row.key || ""}
                            placeholder="e.g. Total Plot Area"
                            onChange={(e) => {
                              const newContent = [...section.content];
                              newContent[rIdx] = { ...newContent[rIdx], key: e.target.value };
                              onUpdateSectionContent?.(section.id, newContent);
                            }}
                            className="text-[10px] text-indigo-700 uppercase font-bold bg-transparent outline-none w-full border-b border-dashed border-gray-200 hover:border-indigo-300 focus:border-indigo-500 pb-0.5 transition"
                          />
                          <label className="text-[9.5px] text-gray-400 uppercase font-bold tracking-wider block mt-2 mb-1">Value / Detail</label>
                          <input
                            type="text"
                            value={row.value || ""}
                            placeholder="e.g. 2,400 Sq Ft"
                            onChange={(e) => {
                              const newContent = [...section.content];
                              newContent[rIdx] = { ...newContent[rIdx], value: e.target.value };
                              onUpdateSectionContent?.(section.id, newContent);
                            }}
                            className="text-sm font-bold text-gray-900 bg-transparent outline-none w-full border-b border-dashed border-gray-200 hover:border-gray-400 focus:border-gray-700 pb-0.5 transition"
                          />
                        </div>
                      ))}

                      {/* Inline Add New Box card */}
                      <button
                        type="button"
                        onClick={() => {
                          const newContent = [...(section.content || []), { key: "New Parameter", value: "" }];
                          onUpdateSectionContent?.(section.id, newContent);
                        }}
                        className="border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-xl p-3.5 flex flex-col items-center justify-center gap-2 min-h-[100px] cursor-pointer transition text-gray-400 hover:text-indigo-600 group/add"
                      >
                        <span className="text-2xl font-light group-hover/add:scale-110 transition-transform">+</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Add Parameter Box</span>
                      </button>
                    </div>

                    {/* Quick Preset Add Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider self-center mr-1">Quick Add:</span>
                      {[
                        { key: "Total Plot / Work Area", value: "" },
                        { key: "Estimated Timeline", value: "" },
                        { key: "Structure Type", value: "" },
                        { key: "Floors / Levels", value: "" },
                        { key: "No. of Bedrooms", value: "" },
                        { key: "Foundation Type", value: "" },
                        { key: "Carpet Area", value: "" },
                        { key: "Execution Team Size", value: "" },
                        { key: "Power Rating", value: "" },
                        { key: "Delivery Format", value: "" },
                      ].map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => {
                            if ((section.content || []).some((r: any) => r.key === preset.key)) return;
                            const newContent = [...(section.content || []), { key: preset.key, value: preset.value }];
                            onUpdateSectionContent?.(section.id, newContent);
                          }}
                          className="text-[9.5px] font-semibold border border-gray-200 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-gray-600 px-2 py-1 rounded-lg cursor-pointer transition"
                        >
                          + {preset.key}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(section.content || []).map((row: any, rIdx: number) => (
                      <div key={rIdx} className="bg-gray-50/50 rounded-xl p-3 border border-gray-150">
                        <span className="text-[10px] text-gray-600 uppercase block font-semibold">{row.key}</span>
                        <span className="text-xs font-bold text-gray-800 block mt-0.5">{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Type 3: Itemized Line-Items Table */}
            {section.type === "table" && (
              <div>
                {/* Edit Mode: Card-based rich row editor */}
                {isEditable ? (
                  <div className="space-y-2 print:hidden">
                    {/* Table header labels */}
                    <div className="grid grid-cols-12 gap-2 px-3 pb-1 border-b border-gray-100">
                      <div className="col-span-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">#</div>
                      <div className="col-span-4 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Description & Phase</div>
                      <div className="col-span-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">HSN/SAC</div>
                      <div className="col-span-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Qty</div>
                      <div className="col-span-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Unit</div>
                      <div className="col-span-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Rate (₹)</div>
                      <div className="col-span-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">GST%</div>
                      <div className="col-span-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Disc.</div>
                      <div className="col-span-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-right">Total</div>
                    </div>

                    {(section.content || []).map((row: any, rIdx: number) => {
                      const rowId = row.id || `item-${rIdx}`;
                      const rowQty = Number(row.qty || 1);
                      const rowRate = Number(row.rate || 0);
                      const rowGross = rowQty * rowRate;
                      let lineDisc = 0;
                      if (Number(row.discount) > 0) {
                        lineDisc = row.discountType === "percent"
                          ? rowGross * (Number(row.discount) / 100)
                          : Number(row.discount);
                      }
                      const rowNet = Math.max(0, rowGross - lineDisc);
                      const gstAmt = rowNet * (Number(row.gst || 0) / 100);
                      const rowTotal = rowNet + gstAmt;

                      return (
                        <div
                          key={rowId}
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all group/row"
                        >
                          {/* Row top: main fields */}
                          <div className="grid grid-cols-12 gap-2 items-start p-3">
                            {/* Index */}
                            <div className="col-span-1 flex flex-col items-center gap-1 pt-1">
                              <span className="text-[9px] font-black text-gray-400 bg-gray-100 rounded-md w-6 h-6 flex items-center justify-center">{rIdx + 1}</span>
                              {/* Optional toggle */}
                              <label className="flex flex-col items-center gap-0.5 cursor-pointer" title="Mark as optional add-on">
                                <input
                                  type="checkbox"
                                  checked={Boolean(row.optional)}
                                  onChange={(e) => {
                                    const nc = [...section.content];
                                    nc[rIdx] = { ...nc[rIdx], optional: e.target.checked };
                                    onUpdateSectionContent?.(section.id, nc);
                                  }}
                                  className="w-3 h-3 rounded border-gray-300 cursor-pointer"
                                />
                                <span className="text-[7.5px] text-gray-400 font-semibold leading-none">OPT</span>
                              </label>
                            </div>

                            {/* Description + Phase */}
                            <div className="col-span-4 space-y-1.5">
                              <input
                                type="text"
                                value={row.phase || ""}
                                placeholder="Phase / Stage label"
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], phase: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="text-[9px] font-bold uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md outline-none w-full"
                              />
                              <input
                                type="text"
                                value={row.name || ""}
                                placeholder="Item description / scope detail"
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], name: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="text-sm font-semibold text-gray-900 bg-transparent outline-none w-full border-b border-dashed border-gray-200 hover:border-gray-400 focus:border-gray-700 pb-0.5"
                              />
                              <input
                                type="text"
                                value={row.notes || ""}
                                placeholder="Specification notes (optional)…"
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], notes: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="text-[10px] text-gray-400 italic bg-transparent outline-none w-full border-b border-dashed border-gray-100 hover:border-gray-300 focus:border-gray-500 pb-0.5"
                              />
                            </div>

                            {/* HSN/SAC */}
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
                                className="w-full text-center text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-1.5 py-1.5 outline-none focus:border-gray-400"
                              />
                            </div>

                            {/* Qty */}
                            <div className="col-span-1">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={rowQty}
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], qty: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="w-full text-right text-sm font-bold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-gray-400"
                              />
                            </div>

                            {/* Unit */}
                            <div className="col-span-1">
                              <select
                                value={row.unit || "Sq Ft"}
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], unit: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-1 py-1.5 outline-none focus:border-gray-400"
                              >
                                <option>Sq Ft</option>
                                <option>Sq M</option>
                                <option>Rmt</option>
                                <option>Nos</option>
                                <option>Job</option>
                                <option>Units</option>
                                <option>Sets</option>
                                <option>Kg</option>
                                <option>MT</option>
                                <option>Ltrs</option>
                                <option>Bags</option>
                                <option>Days</option>
                                <option>Hrs</option>
                                <option>LS</option>
                              </select>
                            </div>

                            {/* Rate */}
                            <div className="col-span-1">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={rowRate}
                                  onChange={(e) => {
                                    const nc = [...section.content];
                                    nc[rIdx] = { ...nc[rIdx], rate: e.target.value };
                                    onUpdateSectionContent?.(section.id, nc);
                                  }}
                                  className="w-full text-right text-sm font-bold bg-gray-50 border border-gray-200 rounded-lg pl-5 pr-2 py-1.5 outline-none focus:border-gray-400"
                                />
                              </div>
                            </div>

                            {/* GST % Slab */}
                            <div className="col-span-1">
                              <select
                                value={String(row.gst ?? 18)}
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], gst: Number(e.target.value) };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-1 py-1.5 outline-none focus:border-gray-400"
                              >
                                <option value="0">0% Nil</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </div>

                            {/* Per-row Discount */}
                            <div className="col-span-1 space-y-1">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={row.discount || ""}
                                placeholder="0"
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], discount: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="w-full text-right text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-gray-400"
                              />
                              <select
                                value={row.discountType || "flat"}
                                onChange={(e) => {
                                  const nc = [...section.content];
                                  nc[rIdx] = { ...nc[rIdx], discountType: e.target.value };
                                  onUpdateSectionContent?.(section.id, nc);
                                }}
                                className="w-full text-[9px] font-bold bg-gray-50 border border-gray-200 rounded-lg px-1 py-1 outline-none focus:border-gray-400"
                              >
                                <option value="flat">₹ Flat</option>
                                <option value="percent">% Off</option>
                              </select>
                            </div>

                            {/* Row Total + Actions */}
                            <div className="col-span-1 flex flex-col items-end gap-1.5 pt-1">
                              <span className="text-sm font-black text-gray-900">₹{Math.round(rowTotal).toLocaleString("en-IN")}</span>
                              {gstAmt > 0 && (
                                <span className="text-[9px] text-gray-400 font-mono">+GST ₹{Math.round(gstAmt).toLocaleString("en-IN")}</span>
                              )}
                              <div className="flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                {/* Duplicate */}
                                <button
                                  type="button"
                                  title="Duplicate this row"
                                  onClick={() => {
                                    const nc = [...section.content];
                                    const clone = { ...row, id: `item-${Date.now()}` };
                                    nc.splice(rIdx + 1, 0, clone);
                                    onUpdateSectionContent?.(section.id, nc);
                                  }}
                                  className="p-1 rounded-lg bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-400 cursor-pointer transition"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                {/* Delete */}
                                <button
                                  type="button"
                                  title="Remove this line item"
                                  onClick={() => {
                                    const nc = (section.content || []).filter((_: any, i: number) => i !== rIdx);
                                    onUpdateSectionContent?.(section.id, nc);
                                  }}
                                  className="p-1 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-400 cursor-pointer transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Row bottom: breakdown hint */}
                          {rowGross > 0 && (
                            <div className="px-3 pb-2 flex gap-3 text-[9px] text-gray-400 font-mono border-t border-gray-50 pt-1.5">
                              <span>Gross: ₹{Math.round(rowGross).toLocaleString("en-IN")}</span>
                              {lineDisc > 0 && <span className="text-emerald-600">− Disc: ₹{Math.round(lineDisc).toLocaleString("en-IN")}</span>}
                              <span>Net: ₹{Math.round(rowNet).toLocaleString("en-IN")}</span>
                              {gstAmt > 0 && <span className="text-indigo-500">GST @{row.gst}%: ₹{Math.round(gstAmt).toLocaleString("en-IN")}</span>}
                              {row.optional && <span className="text-amber-500 font-bold">OPTIONAL ADD-ON</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Row CTA */}
                    <button
                      type="button"
                      onClick={() => {
                        const newContent = [
                          ...(section.content || []),
                          { id: `item-${Date.now()}`, phase: "", name: "", qty: 1, unit: "Sq Ft", rate: 0, gst: 18, hsn: "9954", discount: 0, discountType: "flat", optional: false, notes: "" }
                        ];
                        onUpdateSectionContent?.(section.id, newContent);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-xl text-xs font-bold text-gray-400 hover:text-indigo-600 transition cursor-pointer group/addrow"
                    >
                      <Plus className="w-4 h-4 group-hover/addrow:scale-110 transition-transform" />
                      Add Line Item
                    </button>

                    {/* Section subtotal strip */}
                    {(section.content || []).length > 0 && (
                      <div className="flex justify-end">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-700">
                          Section Subtotal: ₹{(section.content || []).reduce((s: number, r: any) => {
                            const g = Number(r.qty || 1) * Number(r.rate || 0);
                            let d = 0;
                            if (Number(r.discount) > 0) d = r.discountType === "percent" ? g * Number(r.discount) / 100 : Number(r.discount);
                            const net = Math.max(0, g - d);
                            return s + net + net * (Number(r.gst || 0) / 100);
                          }, 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Read-only mode table */
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-600 font-semibold">
                          {allowClientOptionalSelect && <th className="py-2 text-xs w-8 text-center"></th>}
                          <th className="text-left py-2 text-xs font-medium uppercase tracking-wider">Description</th>
                          <th className="text-center py-2 text-xs font-medium uppercase tracking-wider w-20">HSN/SAC</th>
                          <th className="text-right py-2 text-xs font-medium uppercase tracking-wider w-20">Qty</th>
                          <th className="text-right py-2 text-xs font-medium uppercase tracking-wider w-24">Rate</th>
                          <th className="text-right py-2 text-xs font-medium uppercase tracking-wider w-16">GST%</th>
                          <th className="text-right py-2 text-xs font-medium uppercase tracking-wider w-28">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(section.content || []).map((row: any, rIdx: number) => {
                          const rowId = row.id || `item-${rIdx}`;
                          const isOptional = Boolean(row.optional);
                          const isSelected = selectedOptionalIds ? selectedOptionalIds.includes(rowId) : true;
                          const rowQty = Number(row.qty || 1);
                          const rowRate = Number(row.rate || 0);
                          const rowGross = rowQty * rowRate;
                          let lineDisc = 0;
                          if (Number(row.discount) > 0) {
                            lineDisc = row.discountType === "percent" ? rowGross * (Number(row.discount) / 100) : Number(row.discount);
                          }
                          const rowNet = Math.max(0, rowGross - lineDisc);
                          const rowTotal = rowNet;

                          return (
                            <tr
                              key={rowId}
                              className={`border-b border-gray-50 transition ${
                                isOptional && !isSelected ? "opacity-40 bg-gray-50/50" : ""
                              }`}
                            >
                              {allowClientOptionalSelect && (
                                <td className="py-2.5 text-center">
                                  {isOptional ? (
                                    <button
                                      type="button"
                                      onClick={() => onToggleOptionalItem?.(rowId)}
                                      className="text-gray-700 hover:text-indigo-600 cursor-pointer p-1"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                                      ) : (
                                        <Square className="w-4 h-4 text-gray-300" />
                                      )}
                                    </button>
                                  ) : (
                                    <span className="text-slate-300 text-xs">•</span>
                                  )}
                                </td>
                              )}
                              <td className="py-2.5 text-gray-700">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                  {row.phase && (
                                    <span className="text-[9px] font-semibold uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                                      {row.phase}
                                    </span>
                                  )}
                                  {isOptional && (
                                    <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                      Optional Add-on
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-800 font-medium">{row.name || row.description}</p>
                                {row.notes && <p className="text-[10px] text-gray-400 italic mt-0.5">{row.notes}</p>}
                              </td>
                              <td className="text-center py-2.5 text-xs text-gray-400 font-mono">{row.hsn || "9954"}</td>
                              <td className="text-right py-2.5 text-gray-500">{rowQty} {row.unit || ""}</td>
                              <td className="text-right py-2.5 text-gray-500">₹{rowRate.toLocaleString("en-IN")}</td>
                              <td className="text-right py-2.5 text-gray-400 text-xs">{row.gst ?? 18}%</td>
                              <td className="text-right py-2.5 font-medium">
                                <span>₹{rowTotal.toLocaleString("en-IN")}</span>
                                {lineDisc > 0 && (
                                  <span className="block text-[9px] text-emerald-600 font-mono">-₹{Math.round(lineDisc).toLocaleString("en-IN")} disc</span>
                                )}
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

      {/* Block addition dashboard in editor mode */}
      {isEditable && (
        <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-gray-50/20 flex flex-wrap gap-2.5 print:hidden">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block w-full mb-1">
            + Insert Section Block
          </span>
          <button
            type="button"
            onClick={() => onAddSection?.("text")}
            className="text-[10.5px] font-semibold border border-gray-250 bg-white hover:bg-gray-50 text-gray-800 px-3 py-1.5 rounded-lg cursor-pointer transition shadow-3xs"
          >
            + Add Text Scope Block
          </button>
          <button
            type="button"
            onClick={() => onAddSection?.("grid")}
            className="text-[10.5px] font-semibold border border-gray-250 bg-white hover:bg-gray-50 text-gray-800 px-3 py-1.5 rounded-lg cursor-pointer transition shadow-3xs"
          >
            + Add Parameters Grid
          </button>
          <button
            type="button"
            onClick={() => onAddSection?.("table")}
            className="text-[10.5px] font-semibold border border-gray-250 bg-white hover:bg-gray-50 text-gray-800 px-3 py-1.5 rounded-lg cursor-pointer transition shadow-3xs"
          >
            + Add Cost Table
          </button>
        </div>
      )}

      {/* Financial Summary Footer */}
      <div className="px-6 sm:px-8 py-6 border-t border-gray-150 bg-gray-50/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm">
          <div>
            <span className="text-xs text-gray-600 uppercase block font-semibold">Payment schedule / terms</span>
            {isEditable ? (
              <input
                type="text"
                value={quote.paymentTerms || ""}
                onChange={(e) => onUpdateField?.("paymentTerms", e.target.value)}
                placeholder="e.g. 30% Booking | 70% Handover"
                className="bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none w-80 mt-1 font-semibold text-gray-800"
              />
            ) : (
              <span className="text-gray-800 font-semibold">{quote.paymentTerms || "Standard Net-15"}</span>
            )}
          </div>

          <div className="w-full sm:w-72 space-y-1.5 text-right">
            <div className="flex justify-between text-xs text-gray-650">
              <span>Subtotal {taxInclusive && "(Tax Incl.)"}</span>
              <span className="font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            {(lineDiscountsTotal > 0 || globalDiscountAmount > 0) && (
              <div className="flex justify-between text-xs text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">-₹{(lineDiscountsTotal + globalDiscountAmount).toLocaleString("en-IN")}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <>
                {isSameState ? (
                  <>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>CGST (9%)</span>
                      <span className="font-mono">₹{cgstAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>SGST (9%)</span>
                      <span className="font-mono">₹{sgstAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>IGST (18%)</span>
                    <span className="font-mono">₹{igstAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </>
            )}

            <div className="border-t border-gray-250 pt-2 flex justify-between text-base font-bold text-gray-900">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Verification Block (read-only) */}
      {!isEditable && accepted && (quote.signatureName || quote.acceptedSignature || quote.signatureDataUrl) && (
        <div className="px-6 sm:px-8 py-5 border-t border-gray-100 bg-green-50/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Digitally Signed & Authorized</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {quote.signatureName || quote.acceptedSignature || "Authorized Client"}
              </p>
              {quote.acceptedEmail && <p className="text-xs text-gray-500 font-mono">{quote.acceptedEmail}</p>}
              {quote.snapshotHash && (
                <p className="text-[9.5px] font-mono text-gray-400 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" /> Hash: {quote.snapshotHash}
                </p>
              )}
            </div>
          </div>

          {quote.signatureDataUrl ? (
            <div className="border border-green-200 bg-white p-2 rounded-xl text-center shrink-0">
              <img
                src={quote.signatureDataUrl}
                alt="Drawn E-Signature"
                className="h-12 object-contain max-w-[160px] mx-auto"
              />
              <span className="text-[9px] text-gray-400 font-semibold uppercase block border-t border-gray-100 pt-1 mt-1">Drawn E-Signature</span>
            </div>
          ) : (
            <span className="text-[10.5px] font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
              ✓ Verified Sign-off
            </span>
          )}
        </div>
      )}

      {/* Footer info (Valid Until date) */}
      <div className="px-6 sm:px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-gray-600">
        <span>
          Valid until{" "}
          {isEditable ? (
            <input
              type="date"
              value={quote.expiryDate ? quote.expiryDate.split("T")[0] : ""}
              onChange={(e) => onUpdateField?.("expiryDate", e.target.value)}
              className="bg-transparent text-gray-400 font-sans text-xs border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-650 outline-none w-28 py-0.5"
            />
          ) : quote.expiryDate ? (
            new Date(quote.expiryDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })
          ) : (
            "—"
          )}
        </span>
        <span className="font-mono">Estimate #{quote.quoteNumber || quote.id?.slice(0, 8) || "Draft"}</span>
      </div>

    </div>
  );
}
