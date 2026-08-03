"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Footer() {
  const { openAuthModal } = useAuth();
  const [siteConfig, setSiteConfig] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) setSiteConfig(snap.data());
    });
    return () => unsub();
  }, []);

  return (
    <footer className="hidden md:block relative mt-48 sm:mt-56 text-slate-300">
      {/* SVG Water Waves */}
      <div className="w-full overflow-hidden leading-[0] bg-transparent">
        <svg
          className="waves w-full h-[60px] min-h-[40px] max-h-[80px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 24 150 28"
          preserveAspectRatio="none"
          shapeRendering="auto"
        >
          <defs>
            <path
              id="gentle-wave"
              d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v44h-352z"
            />
          </defs>
          <g className="parallax">
            <use href="#gentle-wave" x="48" y="0" fill="rgba(37, 99, 235, 0.2)" />
            <use href="#gentle-wave" x="48" y="3" fill="rgba(124, 58, 237, 0.25)" />
            <use href="#gentle-wave" x="48" y="5" fill="rgba(37, 99, 235, 0.4)" />
            <use href="#gentle-wave" x="48" y="7" fill="#0f172a" />
          </g>
        </svg>
      </div>

      <div className="bg-slate-900 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">

          {/* Footer Link Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-12">

            {/* Logo & Intro Column */}
            <div className="lg:col-span-2">
              <h2 className="text-3.5xl font-extrabold text-white mb-4 tracking-tight flex items-center gap-2.5">
                <img src="/logo.png" alt="Zenzy Logo" className="h-8.5 w-auto object-contain brightness-0 invert" />
                <span>zenzy</span>
              </h2>
              <p className="text-slate-400 text-[14px] leading-relaxed max-w-sm mb-6">
                Zenzy is an all-in-one platform that helps professional service businesses build trust, win projects and manage every client journey through collaborative project workspaces.
              </p>
              <div className="flex gap-3">
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/zenzyforall"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-primary-600 transition hover:-translate-y-1"
                >
                  <i className="fab fa-facebook-f"></i>
                </a>

                {/* X (Twitter) */}
                <a
                  href="https://x.com/zenzyforall"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="X (Twitter)"
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-primary-600 transition hover:-translate-y-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/zenzyforall/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-primary-600 transition hover:-translate-y-1"
                >
                  <i className="fab fa-instagram"></i>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://www.linkedin.com/in/zenzy-for-all-74a125425/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-primary-600 transition hover:-translate-y-1"
                >
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>

            {/* Column 1: Services */}
            <div>
              <h4 className="text-white font-extrabold text-[15px] tracking-wide uppercase mb-5 pb-1 border-b border-slate-800 inline-block">
                Services
              </h4>
              <ul className="space-y-3 text-[14px] font-semibold text-slate-400">
                <li><Link href="/services" className="hover:text-white transition">AC Technicians</Link></li>
                <li><Link href="/services" className="hover:text-white transition">Electricians</Link></li>
                <li><Link href="/services" className="hover:text-white transition">Plumbers</Link></li>
                <li><Link href="/services" className="hover:text-white transition">Painters</Link></li>
                <li><Link href="/services" className="hover:text-white transition">Carpenters</Link></li>
              </ul>
            </div>

            {/* Column 2: Properties */}
            <div>
              <h4 className="text-white font-extrabold text-[15px] tracking-wide uppercase mb-5 pb-1 border-b border-slate-800 inline-block">
                Rentals
              </h4>
              <ul className="space-y-3 text-[14px] font-semibold text-slate-400">
                <li><Link href="/rent" className="hover:text-white transition">Studio Apartments</Link></li>
                <li><Link href="/rent" className="hover:text-white transition">Family BHKs</Link></li>
                <li><Link href="/rent" className="hover:text-white transition">Luxury Penthouses</Link></li>
                <li><Link href="/rent" className="hover:text-white transition">Student PGs</Link></li>
                <li><Link href="/rent" className="hover:text-white transition">Zero Brokerage Rooms</Link></li>
              </ul>
            </div>

            {/* Column 3: Shop */}
            <div>
              <h4 className="text-white font-extrabold text-[15px] tracking-wide uppercase mb-5 pb-1 border-b border-slate-800 inline-block">
                Shop
              </h4>
              <ul className="space-y-3 text-[14px] font-semibold text-slate-400">
                <li><Link href="/shop" className="hover:text-white transition">All Products</Link></li>
                <li><Link href="/shop?category=electronics" className="hover:text-white transition">Electronics</Link></li>
                <li><Link href="/shop?category=fashion" className="hover:text-white transition">Fashion</Link></li>
                <li><Link href="/shop?category=home" className="hover:text-white transition">Home & Living</Link></li>
                <li><Link href="/shop?category=beauty" className="hover:text-white transition">Beauty & Wellness</Link></li>
              </ul>
            </div>

            {/* Column 4: Corporate */}
            <div>
              <h4 className="text-white font-extrabold text-[15px] tracking-wide uppercase mb-5 pb-1 border-b border-slate-800 inline-block">
                Zenzy
              </h4>
              <ul className="space-y-3 text-[14px] font-semibold text-slate-400">
                <li><Link href="/about" className="hover:text-white transition">About Protocol</Link></li>
                <li>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("open-support-desk"))}
                    className="hover:text-white transition text-slate-400 font-semibold text-[14px] bg-transparent border-none p-0 cursor-pointer text-left focus:outline-none"
                  >
                    Zenzy Help Desk
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openAuthModal("signup")}
                    className="hover:text-white transition text-slate-400 font-semibold text-[14px] bg-transparent border-none p-0 cursor-pointer text-left focus:outline-none"
                  >
                    Join as Partner
                  </button>
                </li>

                <li><Link href="/privasy-policy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>

          </div>

          {/* Footer Bottom Banner */}
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-[12px] text-slate-500 font-semibold gap-4">
            <p>© {new Date().getFullYear()} Zenzy Technologies Private Limited. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/termsandconditions.html" className="hover:text-slate-300 transition">Terms of Service</a>
              <a href="/cookies.html" className="hover:text-slate-300 transition">Cookie Policy</a>
              <a href="/safetyguidelines.html" className="hover:text-slate-300 transition">Safety Guidelines</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}