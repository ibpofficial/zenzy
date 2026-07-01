"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Award, ShieldCheck, Heart, Sparkles, Mail } from "lucide-react";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
  </svg>
);

const DEFAULT_TEAM = [
  {
    id: "default-ishant",
    name: "Ishant Upadhyay",
    role: "Founder & Chief Architect",
    desc: "Visionary designer focused on engineering high-end localized service protocols to uplift India's unorganized workforce.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
    linkedin: "https://linkedin.com",
    twitter: "https://twitter.com",
    email: "ishant@zenzy.com"
  }
];

export default function AboutPage() {
  const [team, setTeam] = useState<any[]>(DEFAULT_TEAM);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "team"), (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));

      if (items.length > 0) {
        setTeam(items);
      } else {
        setTeam(DEFAULT_TEAM);
      }

      // Seed if empty
      if (snap.empty) {
        const seedTeam = async () => {
          const teamRef = collection(db, "team");
          for (const member of DEFAULT_TEAM) {
            // Remove id key when seeding Firestore
            const { id, ...data } = member;
            await addDoc(teamRef, data);
          }
        };
        seedTeam();
      }
    });
    return () => unsub();
  }, []);
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-12 flex-grow space-y-16">

        {/* Section 1: Mission Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-6 animate-fade-up">
          {/* Animated Big Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative w-36 h-36 flex items-center justify-center animate-logo-entrance">
              <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
              <img
                src="/logo.png"
                alt="Zenzy Big Logo"
                className="w-28 h-28 object-contain relative z-10 animate-bounce-soft"
              />
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Zenzy Mission Protocol
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Restoring dignity to India's unorganized workforce.
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg leading-relaxed">
            Over 90% of India's labor force works in the unorganized sector without digital identities or direct customer access. Zenzy organizes, validates, and empowers them to work directly on their own terms.
          </p>
        </section>

        {/* Section 2: Stat Bubbles */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle text-center space-y-2 hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6" />
            </div>
            <span className="block text-4xl font-black text-slate-900 dark:text-white">1,300+</span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Vetted Partners</span>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed mt-2">
              Every electrician, painter, and mason undergoes strict trade and identity verification.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle text-center space-y-2 hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="block text-4xl font-black text-slate-900 dark:text-white">0% Markup</span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Direct Transaction</span>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed mt-2">
              Users negotiate and pay professionals directly. Zenzy takes 0% cut from workers.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle text-center space-y-2 hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6" />
            </div>
            <span className="block text-4xl font-black text-slate-900 dark:text-white">47 Blocks</span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Localized Hubs</span>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed mt-2">
              Deep block-level support ensures emergency service pros arrive in under 30 minutes.
            </p>
          </div>
        </section>

        {/* Section 3: Founder Message */}
        <section className="bg-slate-900 dark:bg-slate-900/60 text-white rounded-2xl p-8 md:p-12 relative overflow-hidden border border-slate-800 dark:border-slate-800/80 animate-fade-up">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600 rounded-full blur-[120px] opacity-20"></div>

          <div className="relative z-10 max-w-3xl space-y-6">
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">Our Core Vision</h3>
            <blockquote className="text-lg md:text-xl font-medium text-slate-300 dark:text-slate-350 italic leading-relaxed pl-6 border-l-4 border-primary-500">
              "We believe that every plumber, painter, and welder deserves a digital profile as premium as any software engineer's LinkedIn page. Dignity and transparency are not luxury features—they are basic rights."
            </blockquote>
            <div className="pt-2">
              <span className="block font-bold text-[15px] text-white">Ishant Upadhyay</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Founder, Zenzy Protocol</span>
            </div>
          </div>
        </section>

        {/* Section 4: Team Grid */}
        <section className="space-y-10 animate-fade-up">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Meet Our Core Team</h3>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">The builders behind the labor protocol</p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
            {team.map((member) => {
              const isIshant = member.name?.toLowerCase().includes("ishant");
              if (isIshant) {
                return (
                  <div
                    key={member.id}
                    className="animate-founder-card relative p-[2px] rounded-2xl overflow-hidden shadow-2xl hover:shadow-[0_24px_60px_rgba(244,63,94,0.25)] hover:scale-[1.02] transition-all duration-500 w-full sm:w-[350px] md:w-[360px]"
                  >
                    {/* Glowing animated background rotating outline */}
                    <div className="absolute inset-0 animate-founder-glow"></div>

                    {/* Inner content with futuristic particles pattern backdrop */}
                    <div className="relative bg-slate-950 dark:bg-slate-950 bg-grid-particles text-white rounded-[14px] overflow-hidden flex flex-col h-full z-10">

                      {/* Integrated image at top (no outer padding, no border around image) */}
                      <div className="relative w-full aspect-[4/3] overflow-hidden group">
                        <img
                          src={member.image}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750"
                          alt={member.name}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none opacity-60"></div>
                        {/* Floating badge */}
                        <div className="absolute bottom-3 left-4 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 shadow-lg">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse brand-pulse-dot"></span>
                          <span className="text-white text-[9px] font-black uppercase tracking-widest">
                            Founder & Lead
                          </span>
                        </div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-indigo-300 to-cyan-300 drop-shadow-[0_0_15px_rgba(244,63,94,0.25)]">
                            {member.name}
                          </h4>
                          <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            {member.role}
                          </span>
                          <p className="text-slate-300 text-[13.5px] font-medium leading-relaxed">
                            {member.desc}
                          </p>
                        </div>

                        {/* Social contacts with dynamic micro-interactions */}
                        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                          <a href={member.linkedin || "#"} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/5">
                            <LinkedinIcon className="w-4.5 h-4.5" />
                          </a>
                          <a href={member.twitter || "#"} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/5">
                            <TwitterIcon className="w-4.5 h-4.5" />
                          </a>
                          <a href={`mailto:${member.email}`} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/5">
                            <Mail className="w-4.5 h-4.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Standard Premium Team Member Card
              return (
                <div
                  key={member.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-subtle flex flex-col justify-between overflow-hidden hover:-translate-y-1.5 transition duration-300 hover:border-slate-300 dark:hover:border-slate-700 w-full sm:w-[350px] md:w-[360px]"
                >
                  <div className="flex flex-col h-full">
                    {/* Integrated image at top (no outer padding, no border around image) */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden group">
                      <img
                        src={member.image}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750"
                        alt={member.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent pointer-events-none opacity-40"></div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{member.name}</h4>
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{member.role}</span>
                        <p className="text-slate-550 dark:text-slate-400 text-xs font-semibold leading-relaxed pt-1">{member.desc}</p>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <a href={member.linkedin || "#"} target="_blank" rel="noreferrer" className="w-8.5 h-8.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-850 dark:hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer">
                          <LinkedinIcon className="w-4 h-4" />
                        </a>
                        <a href={member.twitter || "#"} target="_blank" rel="noreferrer" className="w-8.5 h-8.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-450 hover:text-slate-850 dark:hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer">
                          <TwitterIcon className="w-4.5 h-4.5" />
                        </a>
                        <a href={`mailto:${member.email}`} className="w-8.5 h-8.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-450 hover:text-slate-850 dark:hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer">
                          <Mail className="w-4.5 h-4.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 5: Project Timeline */}
        <section className="space-y-8 animate-fade-up">
          <h3 className="text-2xl font-extrabold text-center text-slate-900 dark:text-white tracking-tight">Protocol Roadmap</h3>

          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-32 space-y-10 py-4">

            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full bg-primary-600 ring-4 ring-primary-100 dark:ring-primary-950/45"></div>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Phase 1: Seed Launch</span>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Dwarka Block Testing</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1 max-w-xl">
                Onboarded the first 300+ electrical and plumbing partners, establishing initial document verification protocols.
              </p>
            </div>

            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full bg-slate-300 dark:bg-slate-800"></div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phase 2: Scale expansion</span>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Direct Rental Module</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1 max-w-xl">
                Launch the zero-brokerage Airbnb-style pg and flat listing system to integrate housing and local service networks.
              </p>
            </div>

            <div className="relative pl-8">
              <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full bg-slate-300 dark:bg-slate-800"></div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phase 3: Nationwide Protocol</span>
              <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">UPI micro-payments & safety checks</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1 max-w-xl">
                Deployment of custom Razorpay API hooks, auto invoicing, and whole-country expansion modules.
              </p>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
