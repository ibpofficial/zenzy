"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MessageSquare, MapPin, Send, CheckCircle, ExternalLink } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet marker icons in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Dynamic imports for Map components to prevent SSR errors
const MapContainer = typeof window !== "undefined" ? require("react-leaflet").MapContainer : null;
const TileLayer = typeof window !== "undefined" ? require("react-leaflet").TileLayer : null;
const Marker = typeof window !== "undefined" ? require("react-leaflet").Marker : null;
const Popup = typeof window !== "undefined" ? require("react-leaflet").Popup : null;

export default function ContactPage() {
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const vguPosition: [number, number] = [26.7865, 75.8361]; // Coordinates for VGU Jaipur

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSubmitting(true);
    try {
      // Save support ticket to Firestore
      await addDoc(collection(db, "supportTickets"), {
        customerName: name,
        customerEmail: email,
        subject: subject || "General Inquiry",
        message,
        status: "Open",
        timestamp: serverTimestamp()
      });

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      showToast("Message sent! Our support team will contact you shortly.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-12 flex-grow space-y-12 animate-fade-up">

        {/* Title */}
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Get in touch with Zenzy</h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-[14px]">
            Have booking questions? Want to onboard as a partner? We are available 24/7.
          </p>
        </div>

        {/* Main contact form + info grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Info cards (Column 1) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-start gap-4 hover:-translate-y-0.5 transition">
              <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-[15px] text-slate-900 dark:text-white">Call Support</h4>
                <p className="text-slate-500 dark:text-slate-450 text-xs font-semibold mt-1">Direct support hotline (24/7)</p>
                <a href="tel:+9511528193" className="text-primary-600 dark:text-primary-400 font-bold text-sm block mt-1.5">+91 9511528193</a>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex items-start gap-4 hover:-translate-y-0.5 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-[15px] text-slate-900 dark:text-white">WhatsApp Chat</h4>
                <p className="text-slate-500 dark:text-slate-450 text-xs font-semibold mt-1">Quick text assistance</p>
                <a href="https://wa.me/9511528193" target="_blank" rel="noreferrer" className="text-emerald dark:text-emerald-400 font-bold text-sm block mt-1.5">Chat on WhatsApp</a>
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

          {/* Form Pane (Column 2 & 3) */}
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
                    className="w-full px-4.5 py-3 border border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 rounded-xl text-xs font-semibold outline-none"
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
                    className="w-full px-4.5 py-3 border border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 rounded-xl text-xs font-semibold outline-none"
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
                  className="w-full px-4.5 py-3 border border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 rounded-xl text-xs font-semibold outline-none"
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
                  className="w-full px-4.5 py-3 border border-slate-200 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-500 rounded-xl text-xs font-semibold outline-none resize-none"
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

        {/* Map and Address Section - Combined */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map Container */}
          <div className="w-full">
            {isMounted && MapContainer && (
              <MapContainer
                center={vguPosition}
                zoom={15}
                style={{ height: "400px", width: "100%", borderRadius: "12px", zIndex: 0 }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={vguPosition} icon={icon}>
                  <Popup>
                    <div className="text-sm">
                      <strong>Zenzy Headquarters</strong><br />
                      Vivekananda Global University (VGU)<br />
                      Jagatpura, Jaipur, Rajasthan, India
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            )}
          </div>

          {/* Address Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-subtle flex flex-col justify-center">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <MapPin className="text-red-500" /> Our Location
            </h2>
            <div className="text-slate-600 dark:text-slate-400 mb-6 space-y-1">
              <p className="font-medium text-slate-900 dark:text-white">Zenzy Headquarters</p>
              <p>Vivekananda Global University (VGU)</p>
              <p>Jagatpura, Jaipur, Rajasthan</p>
              <p>India</p>
            </div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Vivekananda+Global+University+Jaipur"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition font-bold text-xs uppercase tracking-wider"
            >
              Get Directions <ExternalLink size={16} />
            </a>
          </div>
        </div>

      </main>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-4 rounded-full font-bold text-[13px] shadow-float z-[120] flex items-center gap-2 animate-fade-up">
          <CheckCircle className="w-4 h-4 text-emerald" />
          <span>{toastMsg}</span>
        </div>
      )}

      <Footer />
    </div>
  );
}