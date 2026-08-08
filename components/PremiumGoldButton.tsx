"use client";

import React from "react";
import { Crown, ChevronRight } from "lucide-react";

interface PremiumGoldButtonProps {
  text?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function PremiumGoldButton({
  text = "PREMIUM",
  onClick,
  className = "",
  disabled = false,
}: PremiumGoldButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative inline-flex items-center group p-[2px] rounded-full overflow-hidden cursor-pointer select-none transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] focus:outline-none ${className}`}
    >
      {/* ─── SHINING BORDER ANIMATION (Rotating Conic Gold Light Sweep) ─── */}
      <span className="absolute inset-[-150%] animate-[spin_3.5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_260deg,#FDE047_310deg,#F59E0B_340deg,transparent_360deg)] pointer-events-none" />

      {/* ─── MAIN BUTTON BODY ─── */}
      <span className="relative z-10 flex items-center justify-between gap-4 w-full bg-gradient-to-r from-[#0a0c0e] via-[#15191e] to-[#0a0c0e] rounded-full px-2.5 py-2 border border-amber-400/30 shadow-[0_10px_25px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)] group-hover:border-amber-400/60 transition-colors">
        
        {/* LEFT GOLD SHIELD WITH EMBOSSED CROWN */}
        <span className="relative flex items-center justify-center px-4 py-2.5 rounded-full bg-gradient-to-r from-[#B87A1E] via-[#F3C059] to-[#E5A83B] shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_2px_6px_rgba(0,0,0,0.4)] border border-amber-200/50">
          {/* Subtle Inner Glow */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
          <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#241703] fill-[#241703] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] relative z-10" />
        </span>

        {/* MIDDLE TEXT ("P R E M I U M") */}
        <span className="font-serif font-extrabold text-base sm:text-lg tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5C4] via-[#F3C059] to-[#996914] drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] px-2">
          {text}
        </span>

        {/* RIGHT GOLD CIRCLE WITH CHEVRON ARROW */}
        <span className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-[#FFF0A3] via-[#E8B244] to-[#996713] border border-amber-200/60 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7),0_3px_8px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#2A1A02] stroke-[3.5]" />
        </span>
      </span>

      {/* ─── AMBIENT GLOW EFFECT ON HOVER ─── */}
      <span className="absolute inset-0 rounded-full bg-amber-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </button>
  );
}
