"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Award, ShieldCheck, Heart, Sparkles, Mail, Crown, Briefcase, MapPin, Users, Globe, ArrowRight } from "lucide-react";
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

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z" />
  </svg>
);

const DEFAULT_TEAM = [
  {
    id: "default-ishant",
    name: "Ishant Upadhyay",
    role: "Founder & Chief Architect",
    desc: "Visionary designer focused on engineering high-end localized service protocols to uplift India's unorganized workforce.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
    linkedin: "https://linkedin.com/in/ishantupadhyay",
    twitter: "https://twitter.com/ishantupadhyay",
    instagram: "https://instagram.com/ishantupadhyay",
    email: "contact@zenzy.shop"
  },
  {
    id: "default-1",
    name: "Priya Sharma",
    role: "Head of Operations",
    desc: "Leading ground-level operations and partner onboarding across Delhi NCR with 8+ years of experience.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80",
    linkedin: "https://linkedin.com/in/priyasharma",
    twitter: "https://twitter.com/priyasharma",
    instagram: "https://instagram.com/priyasharma",
    email: "contact@zenzy.shop"
  },
  {
    id: "default-2",
    name: "Arjun Mehta",
    role: "Tech Lead - Full Stack",
    desc: "Architecting scalable solutions and building the protocol infrastructure for India's gig economy.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
    linkedin: "https://linkedin.com/in/arjunmehta",
    twitter: "https://twitter.com/arjunmehta",
    instagram: "https://instagram.com/arjunmehta",
    email: "contact@zenzy.shop"
  },
  {
    id: "default-3",
    name: "Neha Patel",
    role: "Community & Growth",
    desc: "Driving community engagement and empowering local workers through digital literacy initiatives.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
    linkedin: "https://linkedin.com/in/nehapatel",
    twitter: "https://twitter.com/nehapatel",
    instagram: "https://instagram.com/nehapatel",
    email: "contact@zenzy.shop"
  },
  {
    id: "default-4",
    name: "Vikram Singh",
    role: "Product & Design",
    desc: "Crafting intuitive user experiences that bridge the gap between service providers and customers.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
    linkedin: "https://linkedin.com/in/vikramsingh",
    twitter: "https://twitter.com/vikramsingh",
    instagram: "https://instagram.com/vikramsingh",
    email: "contact@zenzy.shop"
  }
];

export default function AboutPage() {
  const [team, setTeam] = useState<any[]>(DEFAULT_TEAM);
  const [selectedMember, setSelectedMember] = useState<any>(null);

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

  const founder = team.find(member => member.name?.toLowerCase().includes("ishant"));
  const teamMembers = team.filter(member => !member.name?.toLowerCase().includes("ishant"));

  // Social Modal for mobile
  const SocialModal = ({ member, onClose }: { member: any, onClose: () => void }) => {
    if (!member) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl transform animate-scale-in" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={member.image} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                <p className="text-xs text-slate-500">{member.role}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
              <XIcon className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <a href={member.linkedin} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] transition-all hover:scale-105">
              <LinkedinIcon className="w-5 h-5" />
              <span className="text-xs font-semibold">LinkedIn</span>
            </a>
            <a href={member.twitter} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-black/5 hover:bg-black/10 text-black transition-all hover:scale-105">
              <XIcon className="w-5 h-5" />
              <span className="text-xs font-semibold">Twitter</span>
            </a>
            <a href={member.instagram} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#E4405F]/10 hover:bg-[#E4405F]/20 text-[#E4405F] transition-all hover:scale-105">
              <InstagramIcon className="w-5 h-5" />
              <span className="text-xs font-semibold">Instagram</span>
            </a>
            <a href={`mailto:${member.email}`}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-600 transition-all hover:scale-105">
              <Mail className="w-5 h-5" />
              <span className="text-xs font-semibold">Email</span>
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-850 font-sans transition-colors relative overflow-x-hidden">
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
              <Sparkles className="w-4 h-4" /> Zenzy Operating System
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Helping service businesses win projects and operate professionally.
            </h1>
            <p className="text-slate-500 font-semibold text-lg leading-relaxed">
              Construction companies, contractors, architects, and interior designers often lose projects because work is scattered across phone calls, PDFs, and chat apps. Zenzy brings your entire business—from first inquiry to project completion—into one collaborative operating system.
            </p>
          </section>

          {/* Section 2: Stat Bubbles */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-subtle text-center space-y-2 hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6" />
              </div>
              <span className="block text-4xl font-black text-slate-900">1,300+</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Businesses</span>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-2">
                Contractors, architects, and interior design firms with certified digital portfolios and credentials.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-subtle text-center space-y-2 hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="block text-4xl font-black text-slate-900">100% Shared</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Workspaces</span>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-2">
                Every project gets a dedicated workspace with milestones, quotes, approvals, and communication.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-subtle text-center space-y-2 hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <span className="block text-4xl font-black text-slate-900">End-to-End</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lifecycle CRM</span>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed mt-2">
                From initial customer inquiry to final payment and project handover inside one unified dashboard.
              </p>
            </div>
          </section>

          {/* Section 3: Founder Message */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/90 p-8 md:p-12 shadow-2xl shadow-primary-500/5 animate-fade-up">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl space-y-6">
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
                We believe every contractor, architect, and interior designer deserves modern software tools to win clients, send structured quotes, and run project workspaces with zero chaos.
                <span className="font-serif text-primary-400/60 ml-1 text-3xl align-middle">”</span>
              </blockquote>

              <div className="pt-4 flex flex-col items-start gap-1 border-t border-white/5">
                <span className="text-lg font-bold text-white tracking-tight">
                  Ishant Upadhyay
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                    Founder, Zenzy Technologies
                  </span>
                  <span className="w-1 h-1 rounded-full bg-primary-500/50"></span>
                  <span className="text-[10px] font-medium text-primary-400/60 uppercase tracking-widest">
                    #BusinessOS
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Team Grid - Premium Design */}
          <section className="space-y-12 animate-fade-up">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-50 to-indigo-50 text-primary-600 text-xs font-bold uppercase tracking-wider border border-primary-100">
                <Crown className="w-3.5 h-3.5" />
                Leadership
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                Meet Our Core Team
              </h3>
              <p className="text-slate-500 text-sm font-medium max-w-md mx-auto">
                The visionaries building the operating system for modern service businesses
              </p>
            </div>

            {/* Founder Card - Premium Hero Style */}
            {founder && (
              <div className="relative group">
                {/* Glow effects */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 via-indigo-500 to-rose-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 via-indigo-500 to-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-700 blur-sm"></div>

                <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                    {/* Image Section - 2 columns on md */}
                    <div className="md:col-span-2 relative h-80 md:h-auto">
                      <img
                        src={founder.image}
                        alt={founder.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent md:bg-gradient-to-r md:from-slate-900/50 md:via-transparent md:to-transparent"></div>

                      {/* Status badge */}
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Founder</span>
                      </div>

                      {/* Social links overlay on image for mobile */}
                      <div className="absolute bottom-4 right-4 flex gap-2 md:hidden">
                        <a href={founder.linkedin} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center text-white transition-all hover:scale-110">
                          <LinkedinIcon className="w-4 h-4" />
                        </a>
                        <a href={founder.twitter} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center text-white transition-all hover:scale-110">
                          <XIcon className="w-4 h-4" />
                        </a>
                        <a href={founder.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center text-white transition-all hover:scale-110">
                          <InstagramIcon className="w-4 h-4" />
                        </a>
                        <a href={`mailto:${founder.email}`} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center text-white transition-all hover:scale-110">
                          <Mail className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Content Section - 3 columns on md */}
                    <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-slate-50 to-white">
                      <div className="space-y-3">
                        {/* Name and title */}
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                              {founder.name}
                            </h4>
                            <p className="text-sm font-semibold text-primary-600 mt-0.5 flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              {founder.role}
                            </p>
                          </div>
                          <span className="hidden sm:inline-block px-3 py-1 bg-gradient-to-r from-primary-50 to-indigo-50 text-primary-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary-100">
                            Chief Architect
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                          {founder.desc}
                        </p>

                        {/* Social Links - Desktop */}
                        <div className="hidden md:flex items-center gap-3 pt-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Connect:</span>
                          <a href={founder.linkedin} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center text-slate-600 transition-all hover:scale-110 hover:shadow-md border border-slate-200 hover:border-primary-200">
                            <LinkedinIcon className="w-4.5 h-4.5" />
                          </a>
                          <a href={founder.twitter} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center text-slate-600 transition-all hover:scale-110 hover:shadow-md border border-slate-200 hover:border-primary-200">
                            <XIcon className="w-4.5 h-4.5" />
                          </a>
                          <a href={founder.instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center text-slate-600 transition-all hover:scale-110 hover:shadow-md border border-slate-200 hover:border-primary-200">
                            <InstagramIcon className="w-4.5 h-4.5" />
                          </a>
                          <a href={`mailto:${founder.email}`} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-primary-50 hover:text-primary-600 flex items-center justify-center text-slate-600 transition-all hover:scale-110 hover:shadow-md border border-slate-200 hover:border-primary-200">
                            <Mail className="w-4.5 h-4.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Members Grid - 4 Cards in a Row */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 px-2">
                  <Users className="w-4 h-4" />
                  Core Team
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {teamMembers.map((member, index) => (
                  <div
                    key={member.id}
                    className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary-200 flex flex-col"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Image Container */}
                    <div className="relative w-full aspect-square overflow-hidden">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />

                      {/* Gradient overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>

                      {/* Premium Role Badge - Top Right */}
                      <div className="absolute top-3 right-3">
                        <div className="relative">
                          {/* Glow effect */}
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/30 to-indigo-500/30 rounded-full blur-sm"></div>
                          {/* Badge content */}
                          <div className="relative bg-black/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-white/10 shadow-xl flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {member.role?.split(' ').slice(0, 2).join(' ')}
                          </div>
                        </div>
                      </div>

                      {/* Social Icons - Always visible on mobile, hover on desktop */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2.5 w-full justify-center px-4">
                        {/* Mobile: always visible, Desktop: hidden by default, show on hover */}
                        <div className="flex gap-2.5 transition-all duration-500 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0 opacity-100 translate-y-0">
                          <a
                            href={member.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white flex items-center justify-center text-slate-700 hover:text-primary-600 transition-all hover:scale-110 shadow-lg border border-white/20 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <LinkedinIcon className="w-4 h-4" />
                          </a>
                          <a
                            href={member.twitter}
                            target="_blank"
                            rel="noreferrer"
                            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white flex items-center justify-center text-slate-700 hover:text-primary-600 transition-all hover:scale-110 shadow-lg border border-white/20 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <XIcon className="w-4 h-4" />
                          </a>
                          <a
                            href={member.instagram}
                            target="_blank"
                            rel="noreferrer"
                            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white flex items-center justify-center text-slate-700 hover:text-primary-600 transition-all hover:scale-110 shadow-lg border border-white/20 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <InstagramIcon className="w-4 h-4" />
                          </a>
                          <a
                            href={`mailto:${member.email}`}
                            className="w-9 h-9 rounded-full bg-white/95 hover:bg-white flex items-center justify-center text-slate-700 hover:text-primary-600 transition-all hover:scale-110 shadow-lg border border-white/20 backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors">
                        {member.name}
                      </h4>
                      {/* Role with premium styling */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold text-primary-600 uppercase tracking-wider">
                          {member.role}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-primary-300"></span>
                        <span className="text-[8px] font-medium text-slate-400 uppercase tracking-wider">
                          {member.role?.includes('Head') ? 'Leadership' :
                            member.role?.includes('Lead') ? 'Technical' :
                              member.role?.includes('Community') ? 'Community' : 'Core'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] font-medium leading-relaxed mt-2 flex-1 line-clamp-3">
                        {member.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5: Project Timeline */}
          <section className="space-y-8 animate-fade-up">
            <h3 className="text-2xl font-extrabold text-center text-slate-900 tracking-tight">Platform Roadmap</h3>

            <div className="relative border-l-2 border-slate-200 ml-4 md:ml-32 space-y-10 py-4">

              <div className="relative pl-8">
                <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full bg-primary-600 ring-4 ring-primary-100"></div>
                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Phase 1: Foundation</span>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">Business OS & Verification Core</h4>
                <p className="text-slate-500 text-sm font-semibold mt-1 max-w-xl">
                  Onboarded initial construction, contractor, and interior design firms; established strict credential verification and digital portfolio systems.
                </p>
              </div>

              <div className="relative pl-8">
                <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full bg-slate-300"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phase 2: Workspaces & CRM</span>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">Project Workspaces & Quotation Engine</h4>
                <p className="text-slate-500 text-sm font-semibold mt-1 max-w-xl">
                  Launched collaborative client project workspaces, interactive quotation builders, milestone approvals, and centralized document hubs.
                </p>
              </div>

              <div className="relative pl-8">
                <div className="absolute -left-[9px] top-1.5 w-4.5 h-4.5 rounded-full bg-slate-300"></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phase 3: Ecosystem Scale</span>
                <h4 className="text-lg font-extrabold text-slate-900 mt-0.5">Nationwide Operating System</h4>
                <p className="text-slate-500 text-sm font-semibold mt-1 max-w-xl">
                  Deployment of automated invoicing, escrow milestone payments, client CRM analytics, and pan-India service business expansion.
                </p>
              </div>

            </div>
          </section>

          {/* Section 6: Contact & Support */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm animate-fade-up">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider border border-primary-100">
                  <Mail className="w-3.5 h-3.5" /> Get In Touch
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Contact Us
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl">
                  Have questions about our platform, partnerships, or need support? Reach out directly to our team anytime.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                <a
                  href="mailto:contact@zenzy.shop"
                  className="flex items-center gap-3 px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 group"
                >
                  <Mail className="w-5 h-5 text-primary-400 group-hover:scale-110 transition-transform" />
                  <span>contact@zenzy.shop</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </section>

          {/* Mobile Footer Links - Only visible on mobile */}
          <div className="md:hidden mt-8 pt-6 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
              <a href="/privasy-policy" className="text-slate-500 hover:text-primary-600 transition-colors font-medium">
                Privacy Policy
              </a>
              <span className="text-slate-300 select-none">•</span>
              <a href="/cookies.html" className="text-slate-500 hover:text-primary-600 transition-colors font-medium">
                Cookies
              </a>
              <span className="text-slate-300 select-none">•</span>
              <a href="/termsandconditions.html" className="text-slate-500 hover:text-primary-600 transition-colors font-medium">
                Terms & Conditions
              </a>
            </div>
          </div>

        </main>

        <Footer />
      </div>

      {/* Social Modal */}
      <SocialModal member={selectedMember} onClose={() => setSelectedMember(null)} />
    </div>
  );
}