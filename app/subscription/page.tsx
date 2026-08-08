"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PremiumGoldButton from "@/components/PremiumGoldButton";
import {
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  ArrowRight,
  ChevronDown,
  Users,
  MessageSquare,
  Briefcase,
  Shield,
  Gift,
  Tag,
  Star,
  Award,
  ShieldCheck
} from "lucide-react";

/* ═══════════════════ PLAN DATA ═══════════════════ */

const customerPlans = [
  {
    id: "c-free", name: "Free", tag: "For individuals", price: 0, yearly: 0,
    highlights: ["3 bookings per month", "Browse verified profiles", "Basic search filters", "Standard support (48h)", "Service history"],
    cta: "Get Started", popular: false, tier: "starter"
  },
  {
    id: "c-pro", name: "Pro", tag: "Most popular", price: 1099, yearly: 9899,
    highlights: ["Unlimited bookings", "AI search & smart matching", "Compare pros side-by-side", "Live chat & job tracking", "AI cost estimation", "10% off all bookings", "Priority support (4h)"],
    cta: "Upgrade to Pro (₹1,099)", popular: true, tier: "pro"
  },
  {
    id: "c-elite", name: "Elite", tag: "Full experience", price: 1649, yearly: 5499,
    highlights: ["Everything in Pro", "Video consultations", "Emergency priority booking", "Warranty management", "AI Project Planner", "25% off all bookings", "Dedicated manager", "Instant support (30 min)"],
    cta: "Go Elite (₹1,649)", popular: false, tier: "elite"
  },
];

const professionalPlans = [
  {
    id: "p-starter", name: "Starter", tag: "Launch your business", price: 0, yearly: 0,
    highlights: ["Business profile & verification", "Portfolio (10 images)", "Accept/reject bookings", "Basic earnings overview", "Customer reviews", "Standard search listing"],
    cta: "Start Free", popular: false, tier: "starter"
  },
  {
    id: "p-business", name: "Business", tag: "Grow & scale", price: 1099, yearly: 9349,
    highlights: ["Personal website (zenzy.shop/you)", "Unlimited portfolio", "CRM & customer database", "Smart calendar & scheduling", "Quote & invoice generator", "AI proposal generator", "Business analytics", "WhatsApp integration", "Priority support (4h)"],
    cta: "Upgrade to Business (₹1,099)", popular: true, tier: "pro"
  },
  {
    id: "p-enterprise", name: "Enterprise", tag: "Full business suite", price: 2749, yearly: 10999,
    highlights: ["Everything in Business", "Team management (25 members)", "AI Business Coach", "AI Content Creator", "Full website customization", "Marketing tools suite", "Branded invoices & contracts", "25% lower commission", "API access", "Dedicated manager"],
    cta: "Go Enterprise (₹2,749)", popular: false, tier: "elite"
  },
];

/* ═══════════════════ COMPARISON TABLE DATA ═══════════════════ */

const customerComparison = [
  { f: "Monthly Bookings", a: "3", b: "Unlimited", c: "Unlimited" },
  { f: "AI-Powered Search", a: false, b: true, c: true },
  { f: "Smart Professional Matching", a: false, b: true, c: true },
  { f: "Compare Professionals", a: false, b: true, c: true },
  { f: "Verified Profiles & Portfolios", a: true, b: true, c: true },
  { f: "Instant Booking", a: true, b: true, c: true },
  { f: "Multiple Quotes", a: false, b: true, c: true },
  { f: "Live Chat", a: false, b: true, c: true },
  { f: "Video Consultation", a: false, b: false, c: true },
  { f: "Live Job Tracking", a: false, b: true, c: true },
  { f: "AI Cost Estimation", a: false, b: true, c: true },
  { f: "Secure Escrow Payments", a: true, b: true, c: true },
  { f: "Digital Invoices", a: false, b: true, c: true },
  { f: "Booking Discounts", a: "—", b: "10%", c: "25%" },
  { f: "Service History & Favourites", a: true, b: true, c: true },
  { f: "Warranty Management", a: false, b: false, c: true },
  { f: "Emergency Booking", a: false, b: false, c: true },
  { f: "AI Project Planner", a: false, b: false, c: true },
  { f: "Reviews & Ratings", a: true, b: true, c: true },
  { f: "Referral Rewards", a: false, b: "Limited", c: "Unlimited" },
  { f: "Loyalty Program", a: false, b: false, c: true },
  { f: "Customer Dashboard", a: "Basic", b: "Full", c: "Full + AI" },
  { f: "Notifications", a: "Email", b: "Push + Email", c: "+ WhatsApp" },
  { f: "Support Response", a: "48h", b: "4h", c: "30 min" },
  { f: "Dedicated Manager", a: false, b: false, c: true },
  { f: "Concierge Service", a: false, b: false, c: true },
];

const professionalComparison = [
  { f: "Business Profile & Verification", a: true, b: true, c: true },
  { f: "Personal Website", a: false, b: true, c: true },
  { f: "Portfolio", a: "10 images", b: "Unlimited", c: "+ Video" },
  { f: "Website Customization", a: false, b: "Basic", c: "Full" },
  { f: "QR Business Profile Card", a: false, b: true, c: true },
  { f: "SEO-Optimized Profile", a: false, b: false, c: true },
  { f: "Lead Management", a: "Basic", b: "Advanced", c: "+ AI" },
  { f: "Booking Management", a: true, b: true, c: true },
  { f: "Smart Calendar", a: false, b: true, c: true },
  { f: "Customer Database & CRM", a: false, b: true, c: true },
  { f: "Team Management", a: false, b: false, c: "25 members" },
  { f: "Digital Contracts", a: false, b: true, c: true },
  { f: "Quote Generator", a: false, b: true, c: true },
  { f: "Invoice Generator", a: false, b: true, c: true },
  { f: "AI Proposal Generator", a: false, b: true, c: true },
  { f: "AI Business Coach", a: false, b: false, c: true },
  { f: "AI Content Creator", a: false, b: false, c: true },
  { f: "Earnings Dashboard", a: "Basic", b: "Detailed", c: "+ Forecast" },
  { f: "Business Analytics", a: false, b: true, c: "Advanced" },
  { f: "Expense Tracking", a: false, b: true, c: true },
  { f: "Inventory Management", a: false, b: true, c: true },
  { f: "Branded Invoices", a: false, b: false, c: true },
  { f: "Platform Commission", a: "Standard", b: "Standard", c: "25% lower" },
  { f: "Search Listing", a: "Standard", b: "Priority", c: "Top" },
  { f: "Marketing Tools", a: false, b: false, c: true },
  { f: "WhatsApp Integration", a: false, b: true, c: true },
  { f: "Reviews Dashboard", a: true, b: true, c: true },
  { f: "API Access", a: false, b: false, c: true },
  { f: "Notifications", a: "Email", b: "Push + Email", c: "+ WhatsApp" },
  { f: "Support Response", a: "48h", b: "4h", c: "30 min" },
  { f: "Dedicated Manager", a: false, b: false, c: true },
];

const faqs = [
  { q: "Can I have both a Customer and Professional plan?", a: "Yes. These are separate subscriptions. Many users book services as a customer while also offering their own professional services — you can subscribe to both independently." },
  { q: "Is there a free trial?", a: "All paid plans include a 7-day free trial. No credit card required upfront. If you don't upgrade before the trial ends, you'll simply revert to the free tier." },
  { q: "How does the Professional personal website work?", a: "Business and Enterprise plans include a custom page at zenzy.shop/your-name with your portfolio, reviews, pricing, and direct booking — essentially your own micro-website powered by Zenzy." },
  { q: "What's included in the CRM?", a: "Customer database with interaction history, follow-up reminders, lead scoring, booking analytics, and automated communications. Enterprise adds AI-powered insights and team collaboration." },
  { q: "What's the cancellation policy?", a: "Cancel anytime from your dashboard. Your benefits continue until the end of the billing period. No fees, no penalties." },
  { q: "How much do yearly plans save?", a: "Yearly billing saves approximately 30% compared to monthly — equivalent to getting 3+ months free every year." },
];

/* ═══════════════════ COMPONENT ═══════════════════ */

export default function SubscriptionPage() {
  const { user, userData } = useAuth();
  const [tab, setTab] = useState<"customer" | "professional">("customer");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const plans = tab === "customer" ? customerPlans : professionalPlans;
  const comparison = tab === "customer" ? customerComparison : professionalComparison;
  const labels = tab === "customer" ? ["Free", "Pro", "Elite"] : ["Starter", "Business", "Enterprise"];

  const price = (p: any) => p.price === 0 ? 0 : billing === "yearly" ? p.yearly : p.price;
  const savings = (p: any) => p.price === 0 ? 0 : (p.price * 12) - p.yearly;

  // New Member Welcome Discount (15% Auto-Discount for New Users)
  const getWelcomeDiscountedPrice = (plan: any) => {
    const raw = price(plan);
    if (raw === 0) return 0;
    return Math.round(raw * 0.85); // 15% discount for new members
  };

  const handleRazorpaySubscription = async (plan: any) => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    const finalAmount = getWelcomeDiscountedPrice(plan);
    if (finalAmount === 0) {
      alert("You are on the Free Plan.");
      return;
    }

    try {
      setProcessingPlanId(plan.id);
      if (!(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay script"));
          document.body.appendChild(script);
        });
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          currency: "INR",
          receipt: `sub_${plan.id}_${Date.now().toString().slice(-6)}`,
        }),
      });

      if (!orderRes.ok) {
        alert("Failed to initiate Razorpay subscription order.");
        setProcessingPlanId(null);
        return;
      }

      const order = await orderRes.json();

      const options = {
        key: order.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TMWjMDIprOz1xj",
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Zenzy Premium Subscription",
        description: `Upgrade to ${plan.name} Plan (${billing})`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: finalAmount,
                clientId: user.uid,
                clientName: userData?.name || user.displayName || user.email || "Subscriber",
                clientEmail: user.email || "",
                clientPhone: userData?.phone || "",
                planName: plan.name,
                billingCycle: billing,
                userType: tab === "customer" ? "Customer" : "Professional",
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              const { addDoc, collection, updateDoc, doc } = await import("firebase/firestore");
              const { db } = await import("@/lib/firebase");

              await addDoc(collection(db, "premiumPayments"), {
                userId: user.uid,
                userName: userData?.name || user.displayName || user.email || "Subscriber",
                userEmail: user.email || "",
                userPhone: userData?.phone || "",
                userType: tab === "customer" ? "Customer" : "Professional",
                planName: plan.name,
                planId: plan.id,
                amount: finalAmount,
                billingCycle: billing,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                status: "Active",
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + (billing === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
              });

              const collName = tab === "professional" ? "workers" : "users";
              try {
                await updateDoc(doc(db, collName, user.uid), {
                  subscription: plan.name,
                  role: "pro_active",
                  isPremium: true,
                  premiumUntil: new Date(Date.now() + (billing === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
                });
              } catch (uErr) {
                console.warn("User doc update warning:", uErr);
              }

              alert(`🎉 Congratulations! You are now subscribed to Zenzy ${plan.name} (${billing}). Payment ID: ${response.razorpay_payment_id}`);
            } else {
              alert("Payment verification failed.");
            }
          } catch (err) {
            console.error("Verification error:", err);
          } finally {
            setProcessingPlanId(null);
          }
        },
        prefill: {
          name: userData?.name || user.displayName || "Subscriber",
          email: user.email || "",
          contact: userData?.phone || "",
        },
        theme: {
          color: "#d97706",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay subscription error:", err);
      alert("Razorpay error: " + (err.message || err));
      setProcessingPlanId(null);
    }
  };

  const cell = (v: any, isPro = false, isElite = false) => {
    if (v === true) {
      return (
        <div className="flex justify-center">
          {isElite ? (
            <Crown className="w-4 h-4 text-amber-400 fill-amber-400/30" />
          ) : isPro ? (
            <Check className="w-4.5 h-4.5 text-amber-500 font-bold" strokeWidth={3} />
          ) : (
            <Check className="w-4 h-4 text-slate-700" strokeWidth={2.5} />
          )}
        </div>
      );
    }
    if (v === false) return <span className="block w-1.5 h-1.5 rounded-full bg-slate-300 mx-auto" />;
    return (
      <span className={`text-[11px] font-bold ${isElite ? "text-amber-400" : isPro ? "text-amber-600" : "text-slate-600"}`}>
        {v}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors relative overflow-hidden">
      <Navbar />
      
      {/* Background Gold Ambient Glow Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-amber-400/10 via-yellow-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-96 -right-40 w-[500px] h-[500px] bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

      <main className="flex-grow relative z-10">

        {/* ─── HERO ─── */}
        <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 pt-28 pb-10 text-center">
          <div className="space-y-4">
            
            {/* Crown Premium Badge Button */}
            <div className="flex justify-center pb-2">
              <PremiumGoldButton
                text="PREMIUM"
                onClick={() => {
                  const el = document.getElementById("pricing-cards");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-black tracking-tight leading-[1.1] text-slate-900">
              Unlock Extraordinary Value with{" "}
              <span className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 bg-clip-text text-transparent drop-shadow-xs">
                Zenzy Gold
              </span>
            </h1>

            <p className="text-slate-600 text-[15px] max-w-xl mx-auto leading-relaxed font-medium">
              Elevate your home services with VIP matching, zero waiting times, AI cost forecasting, and exclusive gold tier discounts.
            </p>

            {/* ─── GOLD WELCOME DISCOUNT BANNER ─── */}
            <div className="max-w-xl mx-auto bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white border border-amber-500/40 p-4 rounded-2xl shadow-lg shadow-amber-900/10 flex items-center justify-center gap-3 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
              <Gift className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs text-slate-200 font-semibold leading-snug">
                ✨ <span className="text-amber-300 font-extrabold">Gold Pass Unlocked!</span> New members get an automatic{" "}
                <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent font-black underline decoration-amber-400/50">
                  15% Luxury Welcome Discount
                </span>{" "}
                applied on all plans below!
              </p>
            </div>
          </div>
        </section>

        {/* ─── TAB + BILLING TOGGLE ─── */}
        <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 pb-10">
          {/* Audience Tab */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-slate-900 p-1.5 rounded-2xl gap-1 border border-amber-500/30 shadow-md">
              {[
                { key: "customer", label: "For Customers", icon: <Users className="w-3.5 h-3.5" /> },
                { key: "professional", label: "For Professionals", icon: <Briefcase className="w-3.5 h-3.5" /> },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key as any); setTableExpanded(false); }}
                  className={`flex items-center gap-2 px-6 sm:px-8 py-2.5 rounded-xl text-[12px] font-extrabold transition-all duration-200 cursor-pointer ${
                    tab === t.key
                      ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Billing */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-[12px] font-bold ${billing === "monthly" ? "text-slate-900" : "text-slate-400"}`}>Monthly</span>
            <button
              onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
              className="relative w-12 h-6 rounded-full bg-slate-800 transition-colors cursor-pointer p-0.5 border border-amber-500/30"
              aria-label="Toggle billing"
            >
              <div className={`w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 shadow-sm transition-transform duration-200 ${billing === "yearly" ? "translate-x-6" : "translate-x-0"}`} />
            </button>
            <span className={`text-[12px] font-bold ${billing === "yearly" ? "text-slate-900" : "text-slate-400"}`}>
              Yearly
            </span>
            {billing === "yearly" && (
              <span className="text-[10px] font-black text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
                Save 30% Gold Perk
              </span>
            )}
          </div>
        </section>

        {/* ─── PRICING CARDS ─── */}
        <section id="pricing-cards" className="max-w-5xl mx-auto w-full px-5 sm:px-8 pb-20 scroll-mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const normalPrice = price(plan);
              const discountedPrice = getWelcomeDiscountedPrice(plan);
              const isPopular = plan.popular;
              const isEliteTier = plan.tier === "elite";

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col p-7 rounded-3xl transition-all duration-300 ${
                    isEliteTier
                      ? "bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950 text-white border-2 border-amber-500/60 shadow-[0_15px_40px_rgba(245,158,11,0.2)] hover:-translate-y-1"
                      : isPopular
                      ? "bg-gradient-to-b from-amber-50/60 via-white to-amber-50/30 text-slate-900 border-2 border-amber-400 shadow-[0_12px_35px_rgba(245,158,11,0.18)] hover:-translate-y-1"
                      : "bg-white text-slate-900 border border-slate-200 hover:border-amber-300 shadow-subtle hover:-translate-y-0.5"
                  }`}
                >
                  {/* Top Gold Shimmer Border for Popular / Elite */}
                  {isPopular && (
                    <div className="absolute -top-px left-8 right-8 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full" />
                  )}

                  {/* Header */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className={`text-[19px] font-black tracking-tight ${isEliteTier ? "text-white" : "text-slate-900"}`}>
                        {plan.name}
                      </h3>
                      
                      {isPopular && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                          <Crown className="w-3 h-3 text-slate-950 fill-slate-950" /> Most Popular
                        </span>
                      )}

                      {isEliteTier && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full">
                          <Crown className="w-3 h-3 text-amber-400 fill-amber-400" /> Gold VIP
                        </span>
                      )}
                    </div>
                    <p className={`text-[12px] font-bold ${isEliteTier ? "text-amber-300/80" : "text-slate-400"}`}>{plan.tag}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    {plan.price === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className={`text-[40px] font-black leading-none tracking-tight ${isEliteTier ? "text-white" : "text-slate-900"}`}>₹0</span>
                        <span className="text-[13px] font-bold text-slate-400">/forever</span>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <div className="flex items-baseline gap-2">
                            <span className={`text-[40px] font-black leading-none tracking-tight ${
                              isEliteTier 
                                ? "bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent"
                                : "text-slate-900"
                            }`}>
                              ₹{discountedPrice.toLocaleString("en-IN")}
                            </span>
                            <span className="text-sm font-bold text-slate-400 line-through">
                              ₹{normalPrice.toLocaleString("en-IN")}
                            </span>
                            <span className={`text-[13px] font-bold ${isEliteTier ? "text-slate-400" : "text-slate-500"}`}>
                              /{billing === "yearly" ? "year" : "mo"}
                            </span>
                          </div>
                          <span className="inline-block bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-[9.5px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                            ✨ 15% Gold Discount Applied
                          </span>
                        </div>

                        {billing === "yearly" && savings(plan) > 0 && (
                          <p className={`text-[11px] font-bold mt-1.5 ${isEliteTier ? "text-amber-200/70" : "text-amber-700"}`}>
                            ₹{Math.round(discountedPrice / 12).toLocaleString("en-IN")}/mo · Save ₹{savings(plan).toLocaleString("en-IN")}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    disabled={processingPlanId === plan.id}
                    onClick={() => handleRazorpaySubscription(plan)}
                    className={`w-full py-3.5 rounded-2xl text-[12.5px] font-black transition-all duration-200 cursor-pointer mb-6 flex items-center justify-center gap-2 ${
                      isEliteTier
                        ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98]"
                        : isPopular
                        ? "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 active:scale-[0.98]"
                        : "bg-slate-900 text-white hover:bg-slate-800 border border-slate-800 hover:border-amber-400/30 active:scale-[0.98]"
                    }`}
                  >
                    {processingPlanId === plan.id ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {(isPopular || isEliteTier) && <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />}
                        {plan.price === 0 ? "Start Free" : `Subscribe for ₹${discountedPrice.toLocaleString("en-IN")}`}
                      </span>
                    )}
                  </button>

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    <p className={`text-[10px] font-black uppercase tracking-wider ${isEliteTier ? "text-amber-300/60" : "text-slate-400"}`}>
                      Gold Vault Benefits
                    </p>
                    {plan.highlights.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        {isEliteTier ? (
                          <Crown className="w-4 h-4 text-amber-400 fill-amber-400/30 shrink-0 mt-0.5" />
                        ) : isPopular ? (
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        ) : (
                          <Check className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" strokeWidth={2.5} />
                        )}
                        <span className={`text-[13px] font-medium leading-snug ${isEliteTier ? "text-slate-200" : "text-slate-700"}`}>
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── COMPARISON TABLE ─── */}
        <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 pb-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
              <Award className="w-4 h-4 text-amber-500" /> Detailed Tier Matrix
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Compare all features & gold benefits</h2>
            <p className="text-[13px] font-medium text-slate-500 mt-1">
              {tab === "customer" ? `${customerComparison.length} features across customer tiers` : `${professionalComparison.length} features across professional tiers`}
            </p>
          </div>

          <div className="border border-amber-500/20 rounded-3xl overflow-hidden bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-amber-500/20 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/50">
                    <th className="text-left px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-wider w-[44%]">Feature</th>
                    {labels.map((l, i) => (
                      <th key={i} className={`px-4 py-4 text-[11px] font-black uppercase tracking-wider text-center ${
                        i === 2 ? "text-amber-600 font-extrabold flex-1" : i === 1 ? "text-slate-900 font-extrabold" : "text-slate-400"
                      }`}>
                        <div className="flex items-center justify-center gap-1">
                          {i === 2 && <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                          {i === 1 && <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                          {l}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(tableExpanded ? comparison : comparison.slice(0, 10)).map((row, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-6 py-3.5 text-[12.5px] font-bold text-slate-700">{row.f}</td>
                      <td className="px-4 py-3.5 text-center">{cell(row.a)}</td>
                      <td className="px-4 py-3.5 text-center bg-amber-50/20">{cell(row.b, true, false)}</td>
                      <td className="px-4 py-3.5 text-center bg-amber-50/40">{cell(row.c, false, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!tableExpanded && comparison.length > 10 && (
              <button
                onClick={() => setTableExpanded(true)}
                className="w-full border-t border-slate-100 py-4 text-[12px] font-bold text-amber-700 hover:text-amber-900 hover:bg-amber-50/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Show all {comparison.length} feature benchmarks <ChevronDown className="w-4 h-4 text-amber-500" />
              </button>
            )}
          </div>
        </section>

        {/* ─── PLATFORM FEATURES ─── */}
        <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 pb-20">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 rounded-3xl p-8 md:p-12 border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl mx-auto text-center space-y-5 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full">
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Standard Across All Tiers</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Enterprise Gold Infrastructure & Security
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 pt-3 text-left max-w-lg mx-auto">
                {[
                  "AI-Powered Search",
                  "Escrow Payments",
                  "Fraud Detection",
                  "Dispute Resolution",
                  "Trust Score System",
                  "Multi-City Support",
                  "Push Notifications",
                  "SEO-Friendly Profiles",
                  "PWA Support",
                  "Role-Based Dashboards",
                  "Advanced Filters",
                  "Referral System",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2.5} />
                    <span className="text-[12px] font-bold text-slate-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="max-w-2xl mx-auto w-full px-5 sm:px-8 pb-20">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-slate-200/80 border-t border-b border-slate-200/80">
            {faqs.map((faq, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
                >
                  <span className="text-[14px] font-bold text-slate-900 pr-6 group-hover:text-amber-600 transition-colors">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-amber-500 shrink-0 transition-transform duration-200 ${faqOpen === idx ? "rotate-180" : ""}`} />
                </button>
                {faqOpen === idx && (
                  <p className="pb-5 text-[13px] font-medium text-slate-600 leading-relaxed -mt-1">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── BOTTOM CTA ─── */}
        <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 pb-20">
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-950 via-slate-900 to-indigo-950 rounded-3xl p-10 md:p-14 text-center border border-amber-500/40 shadow-2xl">

            {/* Glowing Orbs */}
            <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-2xl mx-auto space-y-6">

              {/* Premium badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 border border-amber-400/40 rounded-full">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-black text-amber-300 tracking-[0.15em] uppercase">No credit card required upfront</span>
              </div>

              {/* Main headline */}
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
                  Start your free{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    7-day Gold Trial
                  </span>
                </h2>
                <p className="text-[14px] font-medium text-slate-300 leading-relaxed max-w-lg mx-auto">
                  Experience full VIP access to verified professionals and business scaling tools.
                  <span className="block text-slate-400 text-xs mt-1">Upgrade, downgrade, or cancel anytime from your dashboard.</span>
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => { if (!user) window.location.href = "/auth"; else window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="group relative px-9 py-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-[14px] rounded-2xl transition-all duration-300 cursor-pointer active:scale-[0.97] flex items-center gap-2.5 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                >
                  <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Claim Your Gold Pass</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>

                <Link
                  href="/contact"
                  className="group px-9 py-4 text-slate-300 hover:text-white border border-amber-400/30 hover:border-amber-400/60 rounded-2xl font-bold text-[14px] transition-all duration-300 flex items-center gap-2 bg-white/5"
                >
                  <span>Contact Sales</span>
                  <span className="inline-block transition-all duration-300 group-hover:translate-x-1">→</span>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-5 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
                  <span className="text-xs font-bold">Full VIP access</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
                  <span className="text-xs font-bold">Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
                  <span className="text-xs font-bold">Zero risk</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
                  <span className="text-xs font-bold">7-day free trial</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}