"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mail, Phone, MessageSquare, MapPin, Send, CheckCircle, ArrowUpRight } from "lucide-react";
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

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "supportTickets"), {
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

  // ---- SNAKE BACKGROUND (no food, controlled spawning) ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const activeCtx = ctx;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener('resize', resize);
    resize();

    const snakeColors = [
      '#1f4b3f', '#b28b4a', '#2b5f7a', '#9b6b43', '#4a6b5a',
      '#8f6b4a', '#2f5f6f', '#a0704a', '#3d6b5a', '#b07a4a',
      '#5f3b6b', '#6b8f4a', '#b84a4a', '#4a7a8f', '#b08a4a'
    ];

    class Snake {
      body: { x: number; y: number }[];
      dir: number;
      color: string;
      speed: number;
      time: number;
      constructor() {
        this.body = [];
        const startX = 60 + Math.random() * (W - 120);
        const startY = 60 + Math.random() * (H - 120);
        const len = 6 + Math.floor(Math.random() * 6);
        for (let i = 0; i < len; i++) {
          this.body.push({ x: startX - i * 8, y: startY });
        }
        this.dir = Math.floor(Math.random() * 4);
        this.color = snakeColors[Math.floor(Math.random() * snakeColors.length)];
        this.speed = 60 + Math.random() * 50;
        this.time = 0;
      }

      update(delta: number) {
        this.time += delta;
        if (this.time < this.speed) return false;
        this.time = 0;

        const head = this.body[0];
        let newX = head.x, newY = head.y;

        if (Math.random() < 0.25) {
          this.dir = Math.floor(Math.random() * 4);
        }

        switch (this.dir) {
          case 0: newX += 8; break;
          case 1: newY += 8; break;
          case 2: newX -= 8; break;
          case 3: newY -= 8; break;
        }

        if (newX < 0) newX = W;
        if (newX > W) newX = 0;
        if (newY < 0) newY = H;
        if (newY > H) newY = 0;

        // No food — just move
        this.body.unshift({ x: newX, y: newY });
        this.body.pop(); // maintain length
        return true;
      }

      draw(ctx: CanvasRenderingContext2D) {
        for (let i = 0; i < this.body.length; i++) {
          const p = this.body[i];
          const radius = 6.5 - (i / this.body.length) * 1.8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(3.5, radius), 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.shadowColor = 'rgba(0,0,0,0.06)';
          ctx.shadowBlur = 10;
          ctx.fill();
          if (i === 0) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(p.x - 4, p.y - 4, 2.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(p.x + 4, p.y - 4, 2.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(p.x - 4, p.y - 4, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(p.x + 4, p.y - 4, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.shadowBlur = 0;
      }
    }

    // ---- SPAWNING LOGIC ----
    // Phase 1: initial 10 snakes, then stop adding for 25 seconds
    // Phase 2: at 30 seconds, add 100 snakes instantly, then stop forever

    let snakes: Snake[] = [];
    let phase = 'initial'; // 'initial' | 'waiting' | 'burst' | 'done'
    let phaseTimer = 0; // seconds since phase start

    // Start with 10 snakes
    for (let i = 0; i < 10; i++) {
      snakes.push(new Snake());
    }

    // Track time for phase transitions
    let elapsedTime = 0;

    let lastTime = 0;
    let animationId: number;

    function animate(time: number) {
      const delta = lastTime ? (time - lastTime) / 1000 : 0.016; // seconds
      lastTime = time;
      elapsedTime += delta;

      // Update all snakes
      snakes.forEach(s => s.update(delta * 1000));

      // ---- PHASE MANAGEMENT ----
      if (phase === 'initial') {
        // After 25 seconds of initial phase, move to waiting
        if (elapsedTime >= 25) {
          phase = 'waiting';
          phaseTimer = 0;
        }
      } else if (phase === 'waiting') {
        phaseTimer += delta;
        // Wait 5 more seconds (total 30s) then burst
        if (phaseTimer >= 5) {
          phase = 'burst';
          // Add 100 snakes instantly
          for (let i = 0; i < 100; i++) {
            snakes.push(new Snake());
          }
          phase = 'done';
        }
      } else if (phase === 'done') {
        // No more spawning, just let snakes roam
      }

      // Clear and draw
      activeCtx.clearRect(0, 0, W, H);
      snakes.forEach(s => s.draw(activeCtx));

      animationId = requestAnimationFrame(animate);
    }

    animate(0);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-850 font-sans transition-colors relative overflow-x-hidden">
      <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-12 flex-grow space-y-12 animate-fade-up">

        {/* Header Section with Animated Big Logo */}
        <div className="text-center max-w-xl mx-auto space-y-6">
          <div className="flex justify-center mb-2">
            <div className="relative w-36 h-36 flex items-center justify-center animate-logo-entrance">
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
              <img
                src="/logo.png"
                alt="Zenzy Big Logo"
                className="w-24 h-24 object-contain relative z-10 animate-bounce-soft"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Get in touch with Zenzy</h1>
            <p className="text-slate-500 font-semibold text-[14px] mt-2">
              Have booking questions? Want to onboard as a partner? We are available 24/7.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">

            {/* Phone Support Card */}
            <a
              href="tel:+919511528193"
              id="contact-card-phone"
              className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 block p-6 rounded-3xl group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[15px] text-slate-900">Call Support</h4>
                  <p className="text-slate-500 text-xs font-semibold mt-1">Direct support hotline (24/7)</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Call Hotline</span>
                <div className="flex items-center gap-1 text-sm font-bold text-slate-900 group-hover:underline">
                  <span>+91 9511528193</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </a>

            {/* WhatsApp Support Card */}
            <a
              href="https://wa.me/9511528193"
              target="_blank"
              rel="noreferrer"
              id="contact-card-whatsapp"
              className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 block p-6 rounded-3xl group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <WhatsAppIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[15px] text-slate-900">WhatsApp Chat</h4>
                  <p className="text-slate-500 text-xs font-semibold mt-1">Quick text assistance</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Message Us</span>
                <div className="flex items-center gap-1 text-sm font-bold text-slate-900 group-hover:underline">
                  <span>Chat on WhatsApp</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </a>

            {/* Email Support Card */}
            <a
              href="mailto:support@zenzy.com"
              id="contact-card-email"
              className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 block p-6 rounded-3xl group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[15px] text-slate-900">Email Support</h4>
                  <p className="text-slate-500 text-xs font-semibold mt-1">General & corporate queries</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Write Email</span>
                <div className="flex items-center gap-1 text-sm font-bold text-slate-900 group-hover:underline">
                  <span>support@zenzy.com</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </a>
          </div>

          {/* Right Column: Support Form Card */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary-500/10 transition-colors duration-500" />

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 bg-blue-50 uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse brand-pulse-dot" /> Instant Support Desk
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">Send an Incident Message</h3>
              <p className="text-slate-400 text-xs font-semibold mt-1">We respond to support tickets in under 15 minutes.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="support-ticket-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Name</label>
                  <input
                    type="text"
                    required
                    id="support-ticket-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ishant Upadhyay"
                    className="w-full px-4 py-3 border border-slate-200 focus:border-primary-500 rounded-xl text-xs font-semibold outline-none bg-white transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="support-ticket-email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Email</label>
                  <input
                    type="email"
                    required
                    id="support-ticket-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. support@zenzy.com"
                    className="w-full px-4 py-3 border border-slate-200 focus:border-primary-500 rounded-xl text-xs font-semibold outline-none bg-white transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="support-ticket-subject" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  id="support-ticket-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Partner onboarding details"
                  className="w-full px-4 py-3 border border-slate-200 focus:border-primary-500 rounded-xl text-xs font-semibold outline-none bg-white transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="support-ticket-message" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message Comments</label>
                <textarea
                  required
                  rows={4}
                  id="support-ticket-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you need help with..."
                  className="w-full px-4 py-3 border border-slate-200 focus:border-primary-500 rounded-xl text-xs font-semibold outline-none resize-none bg-white transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                id="support-ticket-submit"
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors duration-200 disabled:bg-slate-450 cursor-pointer"
              >
                {submitting ? "Sending Ticket..." : "Send Message"} <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section: Location Section */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-6 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-sm animate-pulse-slow" />
                <MapPin className="w-5 h-5 text-red-500 relative z-10" />
              </div>
              <h4 className="font-extrabold text-[15px] text-slate-900 uppercase tracking-wide">Our Campus Location</h4>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              VGU, Sector 36, NRI Rd, Jagatpura, Jaipur, Rajasthan 303012
            </div>
          </div>

          <div className="h-80 w-full bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200 animate-fade-in">
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
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full font-bold text-[13px] shadow-float z-[120] flex items-center gap-2 animate-fade-up">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <Footer />
    </div>
  );
}