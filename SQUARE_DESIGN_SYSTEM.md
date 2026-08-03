# Square Executive Design System & UI Specification Guidelines

> **Repository Standard**: This document defines the exact visual aesthetics, geometry, typography, color palettes, and component patterns for Zenzy's executive "Square Design" system. All future pages, components, dashboards, and tools MUST adhere strictly to these rules.

---

## 1. Core Visual Principles

1. **Structured Geometry ("Square Design with Softened Edges")**
   - Structural cards, panels, and forms must use **square geometry with subtle, crisp rounded corners**:
     - Standard Cards & Containers: `rounded-[10px]` or `rounded-[12px]`
     - Small Controls & Badges: `rounded-[6px]` or `rounded-[8px]`
     - **AVOID** overly rounded bubble shapes (`rounded-3xl`, `rounded-full` for cards/inputs).
   
2. **Strict No-Emoji Rule**
   - **NEVER use literal emojis** (`📄`, `🛠️`, `💰`, `🎉`, `✓`, `★`, `⚡`, `📍`, `🔒`, `🏷️`).
   - Use curated **Lucide SVG Icons** exclusively (`FileText`, `Sparkles`, `Download`, `Printer`, `Building2`, `Layers`, `Wrench`, `ShieldCheck`, `Eye`, `CheckCircle2`, `DollarSign`).

3. **Dedicated Workspaces Over Popup Modals**
   - Complex workflows, generators, brief tools, contracts, and configuration screens MUST be built as **dedicated full-screen pages** (e.g. `/requirements/brief-generator`), NOT floating popup modals.

---

## 2. Color Palette & Utility Classes

| Usage | Tailwind Class / Hex | Visual Role |
| :--- | :--- | :--- |
| **Executive Header / Primary Navy** | `bg-[#0f2744]` / `text-[#0f2744]` | Deep corporate navy brand identity |
| **Header Gradient** | `bg-gradient-to-r from-[#0f2744] via-[#1a365d] to-[#0f2744]` | Top banner background |
| **Primary Action Button** | `bg-[#0f2744] hover:bg-[#1e3a8a] text-white border border-[#1e3e66]` | Main user interaction buttons |
| **Success Action / Download** | `bg-emerald-600 hover:bg-emerald-700 text-white` | Downloads, saves, approvals |
| **Page Canvas Background** | `bg-slate-50` | Clean high-contrast workspace |
| **Card & Container Fill** | `bg-white` | Pure white structural boxes |
| **Borders & Outlines** | `border border-slate-200/90` (light) / `border-slate-800` (dark) | Crisp structural boundaries |

---

## 3. Component Architecture & Patterns

### A. Executive Header Banner
```tsx
<div className="bg-gradient-to-r from-[#0f2744] via-[#1a365d] to-[#0f2744] text-white p-6 sm:p-8 rounded-[10px] border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Executive Console
      </span>
    </div>
    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
      [Page Title]
    </h1>
    <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
      [Description text]
    </p>
  </div>
</div>
```

### B. Square Operational Stat Cards
```tsx
<div className="bg-white p-4 rounded-[10px] border border-slate-200/90 shadow-xs flex items-center gap-3">
  <div className="w-10 h-10 rounded-[8px] bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
    <Wrench className="w-5 h-5" />
  </div>
  <div>
    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Metric Title</span>
    <span className="text-lg font-black text-slate-900">Value</span>
  </div>
</div>
```

### C. Square Form Control Cards
```tsx
<div className="bg-white border border-slate-200/90 p-6 rounded-[10px] shadow-xs space-y-4">
  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
    <h3 className="font-extrabold text-xs text-[#0f2744] uppercase tracking-wider flex items-center gap-2">
      <FileText className="w-4 h-4 text-[#0f2744]" />
      Section Title
    </h3>
  </div>
  <input
    type="text"
    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
  />
</div>
```

### D. Selectable Square Tier Option Cards
```tsx
<div className="p-4 rounded-[10px] border-2 cursor-pointer transition flex items-start gap-3 bg-white border-slate-200 hover:border-slate-300">
  <div className="w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 mt-0.5 border-slate-300 bg-white">
    <Check className="w-3.5 h-3.5 stroke-[3]" />
  </div>
  <div>
    <span className="font-extrabold text-xs text-slate-900 block">Tier Name</span>
    <span className="text-[11px] text-slate-500 font-medium leading-relaxed block mt-0.5">Description</span>
  </div>
</div>
```

---

## 4. Summary Checklist for Future Development
- [x] Use `rounded-[10px]` / `rounded-[12px]` for all card containers.
- [x] Use `#0f2744` deep navy for primary buttons and section header icons.
- [x] Ensure ZERO emojis are used anywhere; always use Lucide SVG icons.
- [x] Make complex tools dedicated full pages rather than popup modals.
- [x] Keep uppercase tracking for labels (`text-xs font-black uppercase tracking-wider`).
