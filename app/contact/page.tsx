"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowUpRight, Clock, Award, Shield, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "supportTickets"), {
        customerName: name,
        customerEmail: email,
        subject: subject || "No Subject",
        message: message,
        timestamp: serverTimestamp(),
        status: "Open",
        priority: "Medium",
        messages: [
          {
            sender: "customer",
            text: message,
            timestamp: new Date().toISOString()
          }
        ]
      });

      // Trigger background server-side HubSpot CRM sync for lead intake
      fetch("/api/hubspot/sync-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          subject: subject || "No Subject",
          message,
          ticketId: docRef.id,
        }),
      }).catch((syncErr) => {
        console.warn("HubSpot background lead sync failed:", syncErr);
      });

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      showToast("Message sent! Our support team will contact you shortly.");
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      showToast("Failed to send message. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Navbar />

      <main className="relative max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-12 flex-grow space-y-12">

        {/* Header Section with Logo Animation */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="flex justify-center mb-2">
            <div className="relative w-36 h-36 flex items-center justify-center animate-logo-entrance">
              {/* Soft, Light Gradient Shadow Behind Logo */}
              <div className="absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse-slow"
                style={{
                  background: "radial-gradient(circle at center, rgba(26, 42, 74, 0.15) 0%, rgba(26, 42, 74, 0.05) 40%, rgba(26, 42, 74, 0) 70%)",
                  transform: "scale(1.4)"
                }}
              ></div>
              {/* Secondary lighter glow */}
              <div className="absolute inset-0 rounded-full blur-3xl opacity-20"
                style={{
                  background: "radial-gradient(circle at center, rgba(100, 120, 180, 0.12) 0%, rgba(100, 120, 180, 0.03) 50%, transparent 80%)",
                  transform: "scale(1.8)"
                }}
              ></div>
              <img
                src="/logo.png"
                alt="Zenzy Big Logo"
                className="w-24 h-24 object-contain relative z-10 animate-bounce-soft"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
              Get in Touch
            </h1>
            <p className="text-slate-600 text-base max-w-xl mx-auto leading-relaxed">
              Have questions about booking or want to partner with us? Our dedicated team is available 24/7 to assist you.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Award className="w-4 h-4 text-slate-400" />
              <span>Premium Service</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users className="w-4 h-4 text-slate-400" />
              <span>500+ Partners</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Cards */}
          <div className="space-y-4">

            {/* Phone Support Card */}
            <a
              href="tel:+919511528193"
              className="group bg-white hover:bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 block p-6 rounded-2xl border border-slate-200 hover:border-slate-300 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-200 transition-colors shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">Call Support</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Direct hotline (24/7)</p>
                  <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-slate-700 group-hover:gap-2 transition-all">
                    <span>+91 9511528193</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </div>
            </a>

            {/* WhatsApp Support Card */}
            <a
              href="https://wa.me/9511528193"
              target="_blank"
              rel="noreferrer"
              className="group bg-white hover:bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 block p-6 rounded-2xl border border-slate-200 hover:border-slate-300 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-200 transition-colors shrink-0">
                  <WhatsAppIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">WhatsApp Chat</h4>
                  <p className="text-slate-500 text-xs mt-0.5">Quick text assistance</p>
                  <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-slate-700 group-hover:gap-2 transition-all">
                    <span>Chat on WhatsApp</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </div>
            </a>

            {/* Email Support Card */}
            <a
              href="mailto:contact@zenzy.shop"
              className="group bg-white hover:bg-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 block p-6 rounded-2xl border border-slate-200 hover:border-slate-300 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-200 transition-colors shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">Email Support</h4>
                  <p className="text-slate-500 text-xs mt-0.5">General & corporate queries</p>
                  <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-slate-700 group-hover:gap-2 transition-all">
                    <span>contact@zenzy.shop</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </div>
            </a>
          </div>

          {/* Support Form Card */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 border border-slate-200">
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Instant Support Desk
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-3">Send us a Message</h3>
                <p className="text-slate-500 text-sm mt-1">We respond to all tickets within 15 minutes</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="support-ticket-name" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      id="support-ticket-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="support-ticket-email" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      id="support-ticket-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="support-ticket-subject" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    id="support-ticket-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Partner onboarding inquiry"
                    className="w-full px-4 py-3 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="support-ticket-message" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Message</label>
                  <textarea
                    required
                    rows={4}
                    id="support-ticket-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help you..."
                    className="w-full px-4 py-3 border border-slate-200 focus:border-slate-400 rounded-xl text-sm outline-none resize-none bg-white transition-all duration-300 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-red-500" />
              <div>
                <h4 className="font-bold text-slate-900">Our Campus</h4>
                <p className="text-xs text-slate-500">Visit us at our headquarters</p>
              </div>
            </div>
            <div className="text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
              VGU, Sector 36, NRI Rd, Jagatpura, Jaipur, Rajasthan 303012
            </div>
          </div>

          <div className="h-72 w-full mt-6 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
            <iframe
              src="https://maps.google.com/maps?q=Vivekananda%20Global%20University,%20NRI%20Road,%20Jagatpura,%20Jaipur&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="VGU Jaipur Location"
            />
          </div>
        </section>
      </main>

      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-semibold text-sm shadow-2xl z-[120] flex items-center gap-3 animate-fade-up border border-white/10">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <Footer />
    </div>
  );
}