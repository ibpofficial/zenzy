const fs = require('fs');

const filePath = 'c:\\Users\\Acer\\Desktop\\zenzy\\app\\[slug]\\page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Insert State variables
const stateTarget = '  const [editingCareerIdx, setEditingCareerIdx] = useState<number | null>(null);';
const stateInsert = `  const [editingCareerIdx, setEditingCareerIdx] = useState<number | null>(null);

  // Custom Sections Management
  const [customSectionModalOpen, setCustomSectionModalOpen] = useState(false);
  const [editingCustomSectionIdx, setEditingCustomSectionIdx] = useState<number | null>(null);
  const [csTitle, setCsTitle] = useState("");
  const [csContent, setCsContent] = useState("");

  // Quotation Management
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [editingQuotationIdx, setEditingQuotationIdx] = useState<number | null>(null);
  const [qTitle, setQTitle] = useState("");
  const [qRate, setQRate] = useState("");
  const [qDesc, setQDesc] = useState("");`;

if (content.includes(stateTarget)) {
  content = content.replace(stateTarget, stateInsert);
  console.log('STATES_INSERT_SUCCESS');
} else {
  console.log('stateTarget not found');
}

// 2. Insert CRUD actions
const crudEndMarker = `      await updateDoc(doc(db, "workers", worker.id), { careerHistory: list });
      setWorker((prev: any) => ({ ...prev, careerHistory: list }));
      alert("Career timeline updated!");
      setCareerModalOpen(false);
    } catch {
      alert("Failed to save career timeline event.");
    }
  };`;

const actionsInsert = `
  // Custom Sections Actions
  const handleOpenEditCustomSection = (idx: number) => {
    const list = worker.customSections || [];
    const item = list[idx];
    if (!item) return;
    setEditingCustomSectionIdx(idx);
    setCsTitle(item.title || "");
    setCsContent(item.content || "");
    setCustomSectionModalOpen(true);
  };

  const handleDeleteCustomSection = async (idx: number) => {
    if (!worker) return;
    if (!confirm("Are you sure you want to delete this custom section?")) return;
    try {
      const list = [...(worker.customSections || [])];
      list.splice(idx, 1);
      await updateDoc(doc(db, "workers", worker.id), { customSections: list });
      setWorker((prev: any) => ({ ...prev, customSections: list }));
      alert("Custom section deleted!");
    } catch {
      alert("Failed to delete section.");
    }
  };

  const handleSaveCustomSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    try {
      const list = [...(worker.customSections || [])];
      const payload = {
        id: editingCustomSectionIdx !== null ? list[editingCustomSectionIdx].id : \`sec-\${Date.now()}\`,
        title: csTitle,
        content: csContent
      };
      if (editingCustomSectionIdx !== null) {
        list[editingCustomSectionIdx] = payload;
      } else {
        list.push(payload);
      }
      await updateDoc(doc(db, "workers", worker.id), { customSections: list });
      setWorker((prev: any) => ({ ...prev, customSections: list }));
      alert("Custom section saved!");
      setCustomSectionModalOpen(false);
    } catch {
      alert("Failed to save section.");
    }
  };

  // Quotations Actions
  const handleOpenEditQuotation = (idx: number) => {
    const list = worker.quotations || [];
    const item = list[idx];
    if (!item) return;
    setEditingQuotationIdx(idx);
    setQTitle(item.title || "");
    setQRate(item.rate || "");
    setQDesc(item.description || "");
    setQuotationModalOpen(true);
  };

  const handleDeleteQuotation = async (idx: number) => {
    if (!worker) return;
    if (!confirm("Are you sure you want to delete this quotation card?")) return;
    try {
      const list = [...(worker.quotations || [])];
      list.splice(idx, 1);
      await updateDoc(doc(db, "workers", worker.id), { quotations: list });
      setWorker((prev: any) => ({ ...prev, quotations: list }));
      alert("Quotation card deleted!");
    } catch {
      alert("Failed to delete quotation.");
    }
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    try {
      const list = [...(worker.quotations || [])];
      const payload = {
        id: editingQuotationIdx !== null ? list[editingQuotationIdx].id : \`quote-\&{Date.now()}\`,
        title: qTitle,
        rate: qRate,
        description: qDesc
      };
      if (editingQuotationIdx !== null) {
        list[editingQuotationIdx] = payload;
      } else {
        list.push(payload);
      }
      await updateDoc(doc(db, "workers", worker.id), { quotations: list });
      setWorker((prev: any) => ({ ...prev, quotations: list }));
      alert("Quotation saved successfully!");
      setQuotationModalOpen(false);
    } catch {
      alert("Failed to save quotation.");
    }
  };
`;

if (content.includes(crudEndMarker)) {
  content = content.replace(crudEndMarker, crudEndMarker + actionsInsert);
  console.log('ACTIONS_INSERT_SUCCESS');
} else {
  // Let's also check with LF endings if CRLF check fails
  const crudEndMarkerLF = crudEndMarker.replace(/\r\n/g, '\n');
  if (content.includes(crudEndMarkerLF)) {
    content = content.replace(crudEndMarkerLF, crudEndMarkerLF + actionsInsert);
    console.log('ACTIONS_INSERT_SUCCESS_LF');
  } else {
    console.log('crudEndMarker not found');
  }
}

// 3. Insert Custom Sections UI in Overview tab
const timelineMarker = '          {/* TAB: OVERVIEW */}';
const customSectionsUI = `                {/* Dynamic Custom Sections */}
                {((worker.customSections && worker.customSections.length > 0) || isSelf) && (
                  <div className="space-y-6 text-left">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h3 className={\`\${theme.heading} text-sm flex items-center gap-1.5\`}>
                        <Sliders className="w-4 h-4 text-indigo-500" /> Additional Info & Guidelines
                      </h3>
                      {isSelf && (
                        <button
                          onClick={() => {
                            setEditingCustomSectionIdx(null);
                            setCsTitle("");
                            setCsContent("");
                            setCustomSectionModalOpen(true);
                          }}
                          className="text-[10px] font-black uppercase tracking-wider text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Section
                        </button>
                      )}
                    </div>

                    {(!worker.customSections || worker.customSections.length === 0) ? (
                      <p className="text-slate-400 italic text-xs">No custom details published yet. Click "Add Section" to specify guidelines.</p>
                    ) : (
                      <div className="space-y-4">
                        {worker.customSections.map((sec, idx) => (
                          <div key={sec.id || idx} className={\`\${theme.card} p-6 space-y-3 relative group/sec text-left\`}>
                            <div className="flex justify-between items-center">
                              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{sec.title}</h4>
                              {isSelf && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleOpenEditCustomSection(idx)}
                                    className="text-[9px] font-black text-indigo-600 hover:underline uppercase cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCustomSection(idx)}
                                    className="text-[9px] font-black text-red-600 hover:underline uppercase cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-slate-500 dark:text-slate-350 text-xs leading-relaxed whitespace-pre-wrap font-semibold">
                              {sec.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

`;

// We want to insert customSectionsUI right before line: `          {/* Dynamic Career Timeline */}` inside TAB: OVERVIEW
const bioEndMarker = '                 {/* Dynamic Career Timeline */}';
const bioEndMarkerLF = bioEndMarker.replace(/\r\n/g, '\n');

if (content.includes(bioEndMarker)) {
  content = content.replace(bioEndMarker, customSectionsUI + bioEndMarker);
  console.log('CUSTOM_SECTIONS_UI_INSERT_SUCCESS');
} else if (content.includes(bioEndMarkerLF)) {
  content = content.replace(bioEndMarkerLF, customSectionsUI + bioEndMarkerLF);
  console.log('CUSTOM_SECTIONS_UI_INSERT_SUCCESS_LF');
} else {
  // Let's search with smaller indent
  const marker2 = '/* Dynamic Career Timeline */';
  const idx = content.indexOf(marker2);
  if (idx !== -1) {
    const lineStart = content.lastIndexOf('\n', idx);
    content = content.substring(0, lineStart + 1) + customSectionsUI + content.substring(lineStart + 1);
    console.log('CUSTOM_SECTIONS_UI_INSERT_SUCCESS_OFFSET');
  } else {
    console.log('bioEndMarker not found');
  }
}

// 4. Overwrite Marketplace tab to support Fixed packages AND Quotations
const mktTabStart = '            {/* TAB: MARKETPLACE */}';
const mktTabEnd = '            {/* TAB: TRUST LEDGER */}';

const mktTabStartIdx = content.indexOf(mktTabStart);
const mktTabEndIdx = content.indexOf(mktTabEnd);

if (mktTabStartIdx !== -1 && mktTabEndIdx !== -1) {
  const newMarketplaceContent = `            {/* TAB: MARKETPLACE */}
            {activeTab === "marketplace" && (
              <div className="space-y-8 animate-fade-up">
                
                {/* 1. Fixed-Fee Marketplace Packages */}
                <div className="space-y-6">
                  <div className={\`\${theme.card} p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4\`}>
                    <div>
                      <h3 className={\`\${theme.heading} text-sm\`}>Fixed-Fee Marketplace Packages</h3>
                      <p className="text-xs text-slate-450 dark:text-slate-400">Order pre-packaged fixed-fee service plans directly.</p>
                    </div>
                    {isSelf && (
                      <button
                        onClick={handleOpenAddMkt}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl tracking-wider transition cursor-pointer shadow flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Package
                      </button>
                    )}
                  </div>
   
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    {marketplace.map((pack: any, idx: number) => (
                      <div key={pack.id || idx} className={\`\${theme.card} p-5 flex flex-col justify-between hover:border-indigo-505 transition relative group\`}>
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-extrabold text-slate-800 dark:text-slate-100 text-[15px] block">{pack.title}</span>
                            {isSelf && worker.marketplaceItems && worker.marketplaceItems.length > 0 && (
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => handleOpenEditMkt(idx)}
                                  className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 hover:underline uppercase cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMkt(idx)}
                                  className="text-[10px] font-black text-red-655 hover:underline uppercase cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed font-semibold">{pack.description || "Pre-arranged specialist design services."}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{parseInt(pack.price || "0").toLocaleString()}</span>
                          <button
                            onClick={() => handleBuyPackage(pack)}
                            className={\`\${theme.button} px-4 py-2 font-bold text-xs uppercase\`}
                          >
                            Buy Package
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Custom Rate Quotation Cards (Rate cards instead of Fixed Price) */}
                {((worker.quotations && worker.quotations.length > 0) || isSelf) && (
                  <div className="space-y-6">
                    <div className={\`\${theme.card} p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4\`}>
                      <div>
                        <h3 className={\`\${theme.heading} text-sm\`}>Custom Pricing & Rate Cards</h3>
                        <p className="text-xs text-slate-450 dark:text-slate-400">View customized quote parameters, hourly charges, or specific pricing rates per unit measurement.</p>
                      </div>
                      {isSelf && (
                        <button
                          onClick={() => {
                            setEditingQuotationIdx(null);
                            setQTitle("");
                            setQRate("");
                            setQDesc("");
                            setQuotationModalOpen(true);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-705 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl tracking-wider transition cursor-pointer shadow flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Rate Card
                        </button>
                      )}
                    </div>

                    {(!worker.quotations || worker.quotations.length === 0) ? (
                      <p className="text-slate-400 italic text-xs">No quotation rate cards published yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        {worker.quotations.map((quote: any, idx: number) => (
                          <div key={quote.id || idx} className={\`\${theme.card} p-5 flex flex-col justify-between hover:border-indigo-505 transition relative group\`}>
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-[15px] block">{quote.title}</span>
                                {isSelf && (
                                  <div className="flex gap-2 shrink-0">
                                    <button
                                      onClick={() => handleOpenEditQuotation(idx)}
                                      className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 hover:underline uppercase cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteQuotation(idx)}
                                      className="text-[10px] font-black text-red-655 hover:underline uppercase cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="text-slate-550 dark:text-slate-400 text-xs leading-relaxed font-semibold">{quote.description || "Custom services quotation sheet."}</p>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl text-xs font-black">
                                Rate: {quote.rate}
                              </span>
                              <button
                                onClick={() => {
                                  if (!user) { openAuthModal("login"); return; }
                                  setProjectFormOpen(true);
                                  setFormProjectTitle(\`Inquiry regarding: \${quote.title}\`);
                                  setFormProjectScope(\`Interested in rate quotation: \${quote.rate}. Description: \${quote.description}\`);
                                }}
                                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 font-bold text-xs uppercase rounded-xl transition"
                              >
                                Request Quote
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
\n`;
  content = content.substring(0, mktTabStartIdx) + newMarketplaceContent + content.substring(mktTabEndIdx);
  console.log('MARKETPLACE_REPLACEMENT_SUCCESS');
} else {
  console.log('Marketplace index not found');
}

// 5. Insert Modals
const modalTarget = '      {/* ═══════ START YOUR PROJECT INQUIRY MODAL ═══════ */}';
const newModals = `      {/* ═══════ CUSTOM SECTION EDITOR MODAL ═══════ */}
      {customSectionModalOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[550px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-850 shadow-2xl relative animate-scale-in">
            <div className="p-6 bg-slate-50 dark:bg-slate-955/40 border-b dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {editingCustomSectionIdx !== null ? "Edit Custom Section" : "Add Custom Section"}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Create custom info blocks for design creeds, warranty terms, or special policies.</p>
              </div>
              <button
                onClick={() => setCustomSectionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-550 hover:bg-slate-355 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomSection} className="p-6 space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Section Title</label>
                <input
                  type="text"
                  required
                  value={csTitle}
                  onChange={(e) => setCsTitle(e.target.value)}
                  placeholder="e.g. Design Creed & Vision"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-855 rounded-xl outline-none text-slate-800 dark:text-white focus:border-indigo-650 font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Section Content Text</label>
                <textarea
                  rows={5}
                  required
                  value={csContent}
                  onChange={(e) => setCsContent(e.target.value)}
                  placeholder="Detail the visionary aspects, custom workflow rules, or warranty guidelines..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border dark:border-slate-855 rounded-xl outline-none resize-none text-slate-800 dark:text-white focus:border-indigo-650 font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-905 dark:bg-white text-white dark:text-slate-905 py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition"
              >
                Save Custom Section
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ QUOTATION RATE CARD EDITOR MODAL ═══════ */}
      {quotationModalOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[550px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-850 shadow-2xl relative animate-scale-in">
            <div className="p-6 bg-slate-50 dark:bg-slate-955/40 border-b dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {editingQuotationIdx !== null ? "Edit Quotation Rate Card" : "Add Quotation Rate Card"}
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Specify unit rates or hourly estimates instead of single fixed-price packages.</p>
              </div>
              <button
                onClick={() => setQuotationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-550 hover:bg-slate-355 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuotation} className="p-6 space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Service Title</label>
                  <input
                    type="text"
                    required
                    value={qTitle}
                    onChange={(e) => setQTitle(e.target.value)}
                    placeholder="e.g. 3D Elevation Consultation"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-855 rounded-xl outline-none text-slate-800 dark:text-white focus:border-indigo-650 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Rate (e.g. ₹500/sqft, ₹1200/hr)</label>
                  <input
                    type="text"
                    required
                    value={qRate}
                    onChange={(e) => setQRate(e.target.value)}
                    placeholder="e.g. ₹499/hr or ₹15 Lakhs"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-855 rounded-xl outline-none text-slate-800 dark:text-white focus:border-indigo-650 font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase">Quotation Description</label>
                <textarea
                  rows={4}
                  required
                  value={qDesc}
                  onChange={(e) => setQDesc(e.target.value)}
                  placeholder="Detail the materials included, minimum project value, terms of measurement, or call-out charges..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-955 border dark:border-slate-855 rounded-xl outline-none resize-none text-slate-800 dark:text-white focus:border-indigo-650 font-medium"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-905 dark:bg-white text-white dark:text-slate-905 py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition"
              >
                Save Quotation Card
              </button>
            </form>
          </div>
        </div>
      )}

`;

if (content.includes(modalTarget)) {
  content = content.replace(modalTarget, newModals + modalTarget);
  console.log('MODALS_INSERT_SUCCESS');
} else {
  console.log('modalTarget not found');
}

// 6. Refactor Hero cover section to be bright light glassmorphism instead of dark
const heroSearch = '      {/* Dynamic Unified Premium Hero Cover Header */}';
const heroStartIdx = content.indexOf(heroSearch);
if (heroStartIdx !== -1) {
  const heroEndMarker = '      {/* Main Core Body */}';
  const heroEndIdx = content.indexOf(heroEndMarker);
  if (heroEndIdx !== -1) {
    const replacementHero = `      {/* Dynamic Unified Premium Hero Cover Header */}
      <section 
        className="relative min-h-[380px] sm:min-h-[460px] w-full overflow-hidden flex items-end pb-12 group"
        onDragOver={handleDragOver}
        onDrop={(e) => handleFileDrop(e, "cover")}
      >
        <img 
          src={worker.coverImage || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80"} 
          className="absolute inset-0 w-full h-full object-cover opacity-100 transition-transform duration-700 group-hover:scale-105" 
          alt="Architect backdrop" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/70 to-black/15 dark:from-slate-950 dark:via-slate-955/85 dark:to-black/35" />
        
        {isSelf && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button
              onClick={() => coverInputRef.current?.click()}
              className="bg-white hover:bg-slate-50 text-slate-900 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-2xl transition-all duration-300 hover:scale-105"
            >
              {coverUploading ? "Uploading Banner..." : <><Camera className="w-4.5 h-4.5 text-indigo-650" /> Drag & Drop / Click to Change Cover</>}
            </button>
          </div>
        )}

        <div className="max-w-6xl mx-auto w-full px-5 relative z-20">
          <div className="bg-white/90 dark:bg-slate-900/75 backdrop-blur-xl border border-white/40 dark:border-slate-800/50 p-6 sm:p-8 rounded-[2rem] shadow-2xl text-slate-800 dark:text-white transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              
              <div className="flex items-center gap-5 sm:gap-6 flex-col sm:flex-row text-center sm:text-left">
                {/* Profile Picture */}
                <div 
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] overflow-hidden border-4 border-white/40 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-2xl shrink-0 relative group/avatar cursor-pointer transition-all duration-300 hover:scale-105"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleFileDrop(e, "avatar")}
                  onClick={() => isSelf && avatarInputRef.current?.click()}
                >
                  <img 
                    src={worker.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80"} 
                    className="w-full h-full object-cover" 
                    alt={worker.name} 
                  />
                  {isSelf && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white text-[10px] font-black gap-1 text-center p-2 select-none uppercase tracking-wider">
                      <Camera className="w-5 h-5 text-indigo-405" />
                      <span>{avatarUploading ? "Uploading..." : "Change Photo"}</span>
                    </div>
                  )}
                </div>

                {/* Profile Information */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                      {worker.name}
                    </h1>
                    {worker.verified && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-555 dark:text-emerald-400" /> Verified Pro
                      </span>
                    )}
                    {isSelf && (
                      <button
                        onClick={handleOpenInfoEdit}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-750 dark:text-white border border-slate-200 dark:border-white/15 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 hover:scale-[1.02]"
                      >
                        <Edit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" /> Edit Credentials
                      </button>
                    )}
                  </div>

                  {worker.tagline ? (
                    <p className="text-sm sm:text-base font-semibold text-slate-650 dark:text-slate-200/90 leading-normal">{worker.tagline}</p>
                  ) : (
                    <p className="text-sm sm:text-base font-semibold text-slate-650 dark:text-slate-200/90">{worker.category} Specialist</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3.5 text-xs font-bold justify-center sm:justify-start text-slate-550 dark:text-slate-300">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> {worker.serviceArea || "Delhi NCR"}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
                    <span className="flex items-center gap-1 text-amber-500"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {overallRating} ({reviews.length} reviews)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
                    <span className="flex items-center gap-1"><Award className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Exp: {worker.experience || "5 years"}</span>
                  </div>
                </div>
              </div>

              {/* Quick Contact CTAs */}
              <div className="flex gap-3 w-full md:w-auto items-center justify-center">
                <button 
                  onClick={() => {
                    if (!user) { openAuthModal("login"); return; }
                    setActiveTab("portal");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 font-black text-xs uppercase tracking-wider transition-all duration-350 cursor-pointer flex items-center justify-center gap-1.5 rounded-2xl shadow-xl hover:shadow-indigo-650/25 hover:scale-[1.02]"
                >
                  Collaboration Portal <ChevronRight className="w-4 h-4" />
                </button>
                <a 
                  href={\`tel:\${worker.phone}\`}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 text-slate-750 dark:text-white p-4 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-[1.02]"
                  title="Call Professional"
                >
                  <Phone className="w-4.5 h-4.5" />
                </a>
              </div>

            </div>
          </div>
        </div>
      </section>\n`;
    content = content.substring(0, heroStartIdx) + replacementHero + content.substring(heroEndIdx);
    console.log('HERO_LIGHT_THEME_SUCCESS');
  }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('ALL_UPDATES_SUCCESSFULLY_APPLIED');
