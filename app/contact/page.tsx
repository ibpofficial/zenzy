"use client";

import React, { useState } from "react";
import { Mail, Phone, MessageSquare, MapPin, Send, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar"; // Replace with your actual Navbar path
import Footer from "@/components/Footer"; // Replace with your actual Footer path

// Keep the mock Firebase objects
const db = {}; // Mock Firestore DB object
const addDoc = async () => ({ id: "123" });
const collection = () => ({});
const serverTimestamp = () => ({});

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
    // Simulated async operation
    setTimeout(() => {
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      showToast("Message sent! Our support team will contact you shortly.");
      setSubmitting(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-12 flex-grow space-y-12 animate-fade-up">

        <div className="text-center max-w-xl mx-auto space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Get in touch with Zenzy</h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-[14px]">
            Have booking questions? Want to onboard as a partner? We are available 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-start gap-4 hover:-translate-y-0.5 transition">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-[15px] text-slate-900 dark:text-white">Call Support</h4>
                <p className="text-slate-500 dark:text-slate-450 text-xs font-semibold mt-1">Direct support hotline (24/7)</p>
                <a href="tel:+919511528193" className="text-primary-600 dark:text-primary-400 font-bold text-sm block mt-1.5">+91 9511528193</a>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-start gap-4 hover:-translate-y-0.5 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-[15px] text-slate-900 dark:text-white">WhatsApp Chat</h4>
                <p className="text-slate-500 dark:text-slate-450 text-xs font-semibold mt-1">Quick text assistance</p>
                <a href="https://wa.me/9511528193" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 font-bold text-sm block mt-1.5">Chat on WhatsApp</a>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-start gap-4 hover:-translate-y-0.5 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-[15px] text-slate-900 dark:text-white">Email Support</h4>
                <p className="text-slate-500 dark:text-slate-450 text-xs font-semibold mt-1">General & corporate queries</p>
                <a href="mailto:support@zenzy.com" className="text-indigo-600 dark:text-indigo-450 font-bold text-sm block mt-1.5">support@zenzy.com</a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Send an Incident Message</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1">We respond to support tickets in under 15 minutes.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ishant Upadhyay"
                    className="w-full px-4.5 py-3 border border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 rounded-xl text-xs font-semibold outline-none bg-transparent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Your Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. support@zenzy.com"
                    className="w-full px-4.5 py-3 border border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 rounded-xl text-xs font-semibold outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Partner onboarding details"
                  className="w-full px-4.5 py-3 border border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 rounded-xl text-xs font-semibold outline-none bg-transparent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Message Comments</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you need help with..."
                  className="w-full px-4.5 py-3 border border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 rounded-xl text-xs font-semibold outline-none resize-none bg-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition disabled:bg-slate-400 cursor-pointer"
              >
                {submitting ? "Sending Ticket..." : "Send Message"} <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        <section className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <h4 className="font-extrabold text-[15px] text-slate-900 dark:text-white uppercase tracking-wide">Our Campus Location</h4>
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              VGU, Sector 36, NRI Rd, Jagatpura, Jaipur, Rajasthan 303012
            </div>
          </div>

          <div className="h-80 w-full bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3557.574637775966!2d75.8797455759714!3d26.892015262796195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db7b5c8983935%3A0x6b83f3e28405d4f!2sVivekananda%20Global%20University!5e0!3m2!1sen!2sin!4v1716380695000!5m2!1sen!2sin&zoom=15&maptype=roadmap&markers=color:red%7C26.892015,75.879745"
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
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-4 rounded-full font-bold text-[13px] shadow-float z-[120] flex items-center gap-2 animate-fade-up">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <Footer />
    </div>
  );
}