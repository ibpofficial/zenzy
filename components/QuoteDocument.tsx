"use client";

import React from "react";
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
  ArrowDown
} from "lucide-react";

interface QuoteDocumentProps {
  quote: any;
  worker?: any;
  isEditable?: boolean;
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
        gst: Number(it.gst || 18)
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
  onUpdateField,
  onUpdateSectionTitle,
  onUpdateSectionContent,
  onMoveSection,
  onRemoveSection,
  onAddSection
}: QuoteDocumentProps) {
  if (!quote) return null;

  // Extract dynamic sections
  const sections = getQuoteSections(quote);

  // Compute subtotal and tax amounts dynamically across all table sections
  const allTableItems = sections
    .filter((s: any) => s.type === "table")
    .flatMap((s: any) => s.content || []);

  const subtotal = allTableItems.reduce((sum: number, item: any) => sum + (Number(item.qty || 1) * Number(item.rate || 0)), 0);
  const taxAmount = allTableItems.reduce((sum: number, item: any) => {
    const rowSub = Number(item.qty || 1) * Number(item.rate || 0);
    const gstRate = Number(item.gst || 0) / 100;
    return sum + (rowSub * gstRate);
  }, 0);

  const discount = Number(quote.discount || 0);
  const grandTotal = Math.max(0, subtotal - discount + taxAmount);

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
    <div className="border border-gray-200 bg-white print:border-0 relative font-sans text-gray-900">
      
      {/* Document Header */}
      <div className="px-6 sm:px-8 py-6 sm:py-8 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
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
                      className="bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none w-24 font-mono text-xs"
                    />
                  </div>
                ) : (
                  `#${quote.quoteNumber || quote.id?.slice(0, 8) || "Estimate"}`
                )}
              </span>
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

          <div className="text-right">
            <div className="text-2xl font-light tracking-tight">₹{grandTotal.toLocaleString("en-IN")}</div>
            <div className="text-xs text-gray-400">Total Amount</div>
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
              <h2 className="text-base font-medium text-gray-900">{proName}</h2>
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
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(section.content || []).map((row: any, rIdx: number) => (
                        <div key={rIdx} className="bg-gray-50/50 p-2.5 border border-gray-150 rounded-lg relative group/row">
                          <input
                            type="text"
                            value={row.key || ""}
                            placeholder="Label"
                            onChange={(e) => {
                              const newContent = [...section.content];
                              newContent[rIdx] = { ...newContent[rIdx], key: e.target.value };
                              onUpdateSectionContent?.(section.id, newContent);
                            }}
                            className="text-[9px] text-gray-600 uppercase font-semibold bg-transparent outline-none w-full border-b border-transparent hover:border-gray-200"
                          />
                          <input
                            type="text"
                            value={row.value || ""}
                            placeholder="Value"
                            onChange={(e) => {
                              const newContent = [...section.content];
                              newContent[rIdx] = { ...newContent[rIdx], value: e.target.value };
                              onUpdateSectionContent?.(section.id, newContent);
                            }}
                            className="text-xs font-bold text-gray-850 bg-transparent outline-none w-full mt-1 border-b border-transparent hover:border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newContent = (section.content || []).filter((_: any, i: number) => i !== rIdx);
                              onUpdateSectionContent?.(section.id, newContent);
                            }}
                            className="absolute -top-1.5 -right-1.5 text-gray-300 hover:text-red-500 bg-white border border-gray-200 rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer"
                            title="Remove Parameter Row"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newContent = [...(section.content || []), { key: "Label", value: "Value" }];
                        onUpdateSectionContent?.(section.id, newContent);
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer print:hidden"
                    >
                      + Add Parameter Row
                    </button>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-150 text-gray-600 font-semibold">
                        <th className="text-left py-2 text-xs font-medium uppercase tracking-wider">Description</th>
                        <th className="text-right py-2 text-xs font-medium uppercase tracking-wider w-24">Qty</th>
                        <th className="text-right py-2 text-xs font-medium uppercase tracking-wider w-28">Rate</th>
                        <th className="text-right py-2 text-xs font-medium uppercase tracking-wider w-32">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(section.content || []).map((row: any, rIdx: number) => {
                        const rowQty = Number(row.qty || 1);
                        const rowRate = Number(row.rate || 0);
                        const rowTotal = rowQty * rowRate;

                        return (
                          <tr key={row.id || rIdx} className="border-b border-gray-50">
                            <td className="py-2.5 text-gray-700">
                              {isEditable ? (
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={row.phase || ""}
                                    placeholder="Phase / Stage"
                                    onChange={(e) => {
                                      const newContent = [...section.content];
                                      newContent[rIdx] = { ...newContent[rIdx], phase: e.target.value };
                                      onUpdateSectionContent?.(section.id, newContent);
                                    }}
                                    className="text-[9px] font-semibold uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded outline-none block max-w-max"
                                  />
                                  <input
                                    type="text"
                                    value={row.name || ""}
                                    placeholder="Scope Description"
                                    onChange={(e) => {
                                      const newContent = [...section.content];
                                      newContent[rIdx] = { ...newContent[rIdx], name: e.target.value };
                                      onUpdateSectionContent?.(section.id, newContent);
                                    }}
                                    className="w-full bg-transparent outline-none border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 text-sm py-0.5 px-1 rounded"
                                  />
                                </div>
                              ) : (
                                <>
                                  {row.phase && (
                                    <span className="text-[9px] font-semibold uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded inline-block mb-1">
                                      {row.phase}
                                    </span>
                                  )}
                                  <p className="text-gray-800 font-medium">{row.name || row.description}</p>
                                </>
                              )}
                            </td>

                            <td className="text-right py-2.5 text-gray-500">
                              {isEditable ? (
                                <div className="flex justify-end gap-1 items-center">
                                  <input
                                    type="number"
                                    min={1}
                                    value={rowQty}
                                    onChange={(e) => {
                                      const newContent = [...section.content];
                                      newContent[rIdx] = { ...newContent[rIdx], qty: Number(e.target.value) };
                                      onUpdateSectionContent?.(section.id, newContent);
                                    }}
                                    className="w-12 text-right bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={row.unit || "Sq Ft"}
                                    placeholder="Unit"
                                    onChange={(e) => {
                                      const newContent = [...section.content];
                                      newContent[rIdx] = { ...newContent[rIdx], unit: e.target.value };
                                      onUpdateSectionContent?.(section.id, newContent);
                                    }}
                                    className="w-10 text-left bg-transparent text-[10px] text-gray-400 outline-none"
                                  />
                                </div>
                              ) : (
                                <span>
                                  {rowQty} {row.unit || ""}
                                </span>
                              )}
                            </td>

                            <td className="text-right py-2.5 text-gray-500">
                              {isEditable ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={rowRate}
                                  onChange={(e) => {
                                    const newContent = [...section.content];
                                    newContent[rIdx] = { ...newContent[rIdx], rate: Number(e.target.value) };
                                    onUpdateSectionContent?.(section.id, newContent);
                                  }}
                                  className="w-20 text-right bg-transparent border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-800 outline-none font-mono"
                                />
                              ) : (
                                <span>₹{rowRate.toLocaleString("en-IN")}</span>
                              )}
                            </td>

                            <td className="text-right py-2.5 font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <span>₹{rowTotal.toLocaleString("en-IN")}</span>
                                {isEditable && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newContent = (section.content || []).filter((_: any, i: number) => i !== rIdx);
                                      onUpdateSectionContent?.(section.id, newContent);
                                    }}
                                    className="text-gray-300 hover:text-red-500 transition p-1 cursor-pointer"
                                    title="Delete Row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {isEditable && (
                  <button
                    type="button"
                    onClick={() => {
                      const newContent = [
                        ...(section.content || []),
                        { id: `item-${Date.now()}`, phase: "General", name: "New Item", qty: 1, unit: "Sq Ft", rate: 0, gst: 18 }
                      ];
                      onUpdateSectionContent?.(section.id, newContent);
                    }}
                    className="text-[10px] font-bold text-indigo-650 hover:text-indigo-850 flex items-center gap-1 mt-3 cursor-pointer print:hidden"
                  >
                    + Add Table Line Item
                  </button>
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

          <div className="w-full sm:w-64 space-y-2 text-right">
            <div className="flex justify-between text-xs text-gray-650">
              <span>Subtotal</span>
              <span className="font-semibold">₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Discount</span>
              {isEditable ? (
                <div className="flex items-center justify-end gap-1 font-mono text-emerald-600">
                  <span>-₹</span>
                  <input
                    type="number"
                    min={0}
                    value={quote.discount || 0}
                    onChange={(e) => onUpdateField?.("discount", Number(e.target.value))}
                    className="w-20 text-right bg-transparent border-b border-dashed border-transparent hover:border-gray-350 focus:border-gray-650 outline-none font-bold"
                  />
                </div>
              ) : (
                <span className="font-semibold">-₹{discount.toLocaleString("en-IN")}</span>
              )}
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Estimated GST</span>
                <span className="font-semibold">₹{taxAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="border-t border-gray-250 pt-2 flex justify-between text-base font-semibold text-gray-900">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Verification (read-only) */}
      {!isEditable && accepted && (quote.signatureName || quote.acceptedSignature) && (
        <div className="px-6 sm:px-8 py-5 border-t border-gray-100 bg-green-50/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-800">Digitally Signed & Accepted</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{quote.signatureName || quote.acceptedSignature}</p>
            </div>
          </div>
          <span className="text-[10.5px] font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
            ✓ Verified
          </span>
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
