"use client";

import React, { useState, useEffect, useRef } from "react";
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

const XIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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

  // Firestore team fetch
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "team"), (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));

      if (items.length > 0) {
        setTeam(items);
      } else {
        setTeam(DEFAULT_TEAM);
      }

      if (snap.empty) {
        const seedTeam = async () => {
          const teamRef = collection(db, "team");
          for (const member of DEFAULT_TEAM) {
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
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-850 font-sans transition-colors relative overflow-x-hidden">
      {/* Content with relative z-index */}
      <div className="relative z-10">
        <Navbar />

        <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-12 flex-grow space-y-16">

          {/* Section 1: Mission Hero */}
          <section className="text-center max-w-3xl mx-auto space-y-6 animate-fade-up">
            <div className="flex justify-center mb-6">
              <div className="relative w-36 h-36 flex items-center justify-center animate-logo-entrance">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <img
                  src="/logo.png"
                  alt="Zenzy Big Logo"
                  className="w-28 h-28 object-contain relative z-10 animate-bounce-soft"
                />
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-primary-600 bg-primary-50 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Zenzy Mission Protocol
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Restoring dignity to India's unorganized workforce.
            </h1>
            <p className="text-slate-500 font-semibold text-lg leading-relaxed">
              Over 90% of India's labor force works in the unorganized sector without digital identities or direct customer access. Zenzy organizes, validates, and empowers them to work directly on their own terms.
            </p>
          </section>

          {/* Section 2: Stat Bubbles */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-subtle text-center space-y-2 hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6" />
              </div>
              <span className="block text-4xl font-black text-slate-900">1,300+</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vetted Partners</span>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-2">
                Every electrician, painter, and mason undergoes strict trade and identity verification.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-subtle text-center space-y-2 hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="block text-4xl font-black text-slate-900">0% Markup</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Direct Transaction</span>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-2">
                Users negotiate and pay professionals directly. Zenzy takes 0% cut from workers.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-subtle text-center space-y-2 hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <span className="block text-4xl font-black text-slate-900">47 Blocks</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Localized Hubs</span>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-2">
                Deep block-level support ensures emergency service pros arrive in under 30 minutes.
              </p>
            </div>
          </section>

          {/* Section 3: Founder Message — REFINED */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/90 p-8 md:p-12 shadow-2xl shadow-primary-500/5 animate-fade-up">
            {/* Abstract glow */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl space-y-6">
              {/* Decorative quote mark */}
              <div className="text-6xl font-serif text-primary-400/20 leading-none -mb-8 -mt-2 select-none">
                "
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-primary-400 uppercase tracking-[0.2em]">
                  Our Core Vision
                </h3>
                <div className="h-0.5 w-12 bg-gradient-to-r from-primary-500 to-transparent rounded-full"></div>
              </div>

              <blockquote className="text-xl md:text-2xl font-light text-slate-200/90 leading-relaxed tracking-wide pl-0 md:pl-4">
                <span className="font-serif text-primary-400/60 mr-1 text-3xl align-middle">“</span>
                We believe that every plumber, painter, and welder deserves a digital profile as premium as any software engineer's LinkedIn page.
                <span className="font-serif text-primary-400/60 ml-1 text-3xl align-middle">”</span>
              </blockquote>

              <div className="pt-4 flex flex-col items-start gap-1 border-t border-white/5">
                <span className="text-lg font-bold text-white tracking-tight">
                  Ishant Upadhyay
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                    Founder, Zenzy Protocol
                  </span>
                  <span className="w-1 h-1 rounded-full bg-primary-500/50"></span>
                  <span className="text-[10px] font-medium text-primary-400/60 uppercase tracking-widest">
                    #DignityFirst
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Team Grid */}
          <section className="space-y-10 animate-fade-up">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h3 className="text-3xl font-extrabold tracking-tight text-slate-900">Meet Our Core Team</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">The builders behind the labor protocol</p>
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
                      <div className="absolute inset-0 animate-founder-glow"></div>
                      <div className="relative bg-slate-950 bg-grid-particles text-white rounded-[14px] overflow-hidden flex flex-col h-full z-10">
                        <div className="relative w-full aspect-[4/3] overflow-hidden group">
                          <img
                            src={member.image}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750"
                            alt={member.name}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none opacity-60"></div>
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

                          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                            <a href={member.linkedin || "#"} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/5">
                              <LinkedinIcon className="w-4.5 h-4.5" />
                            </a>
                            <a href={member.twitter || "#"} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/5">
                              <XIcon className="w-4.5 h-4.5" />
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

                return (
                  <div
                    key={member.id}
                    className="bg-white border border-slate-200 rounded-2xl shadow-subtle flex flex-col justify-between overflow-hidden hover:-translate-y-1.5 transition duration-300 hover:border-slate-300 w-full sm:w-[350px] md:w-[360px]"
                  >
                    <div className="flex flex-col h-full">
                      <div className="relative w-full aspect-[4/3] overflow-hidden group">
                        <img
                          src={member.image}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-750"
                          alt={member.name}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none opacity-40"></div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-xl font-black text-slate-900 tracking-tight">{member.name}</h4>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</span>
                          <p className="text-slate-550 text-xs font-semibold leading-relaxed pt-1">{member.desc}</p>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <a href={member.linkedin || "#"} target="_blank" rel="noreferrer" className="w-8.5 h-8.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-850 transition-all hover:scale-110 active:scale-95 cursor-pointer">
                            <LinkedinIcon className="w-4 h-4" />
                          </a>
                          <a href={member.twitter || "#"} target="_blank" rel="noreferrer" className="w-8.5 h-8.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-450 hover:text-slate-850 transition-all hover:scale-110 active:scale-95 cursor-pointer">
                            <XIcon className="w-4.5 h-4.5" />
                          </a>
                          <a href={`mailto:${member.email}`} className="w-8.5 h-8.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-450 hover:text-slate-850 transition-all hover:scale-110 active:scale-95 cursor-pointer">
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
            <h3 className="text-2xl font-extrabold text-center text-slate-900 tracking-tight">Protocol Roadmap</h3>

            <div className="relative border-l-2 border-slate-200 ml-4 md:ml-32 space-y-10 py-4">

              <div className="relative pl-8">
                <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full bg-primary-600 ring-4 ring-primary-100"></div>
                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Phase 1: Seed Launch</span>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">Dwarka Block Testing</h4>
                <p className="text-slate-500 text-sm font-semibold mt-1 max-w-xl">
                  Onboarded the first 300+ electrical and plumbing partners, establishing initial document verification protocols.
                </p>
              </div>

              <div className="relative pl-8">
                <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full bg-slate-300"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phase 2: Scale expansion</span>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">Direct Rental Module</h4>
                <p className="text-slate-500 text-sm font-semibold mt-1 max-w-xl">
                  Launch the zero-brokerage Airbnb-style pg and flat listing system to integrate housing and local service networks.
                </p>
              </div>

              <div className="relative pl-8">
                <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full bg-slate-300"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phase 3: Nationwide Protocol</span>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">UPI micro-payments & safety checks</h4>
                <p className="text-slate-500 text-sm font-semibold mt-1 max-w-xl">
                  Deployment of custom Razorpay API hooks, auto invoicing, and whole-country expansion modules.
                </p>
              </div>

            </div>
          </section>

        </main>

        <Footer />
      </div>
    </div>
  );
}