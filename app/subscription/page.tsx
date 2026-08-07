"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  Tag
} from "lucide-react";

/* ═══════════════════ PLAN DATA (10% INCREASED PRICING) ═══════════════════ */

const customerPlans = [
  {
    id: "c-free", name: "Free", tag: "For individuals", price: 0, yearly: 0,
    highlights: ["3 bookings per month", "Browse verified profiles", "Basic search filters", "Standard support (48h)", "Service history"],
    cta: "Get Started", popular: false,
  },
  {
    id: "c-pro", name: "Pro", tag: "Most popular", price: 1099, yearly: 9899,
    highlights: ["Unlimited bookings", "AI search & smart matching", "Compare pros side-by-side", "Live chat & job tracking", "AI cost estimation", "10% off all bookings", "Priority support (4h)"],
    cta: "Upgrade to Pro (₹1,099)", popular: true,
  },
  {
    id: "c-elite", name: "Elite", tag: "Full experience", price: 1649, yearly: 5499,
    highlights: ["Everything in Pro", "Video consultations", "Emergency priority booking", "Warranty management", "AI Project Planner", "25% off all bookings", "Dedicated manager", "Instant support (30 min)"],
    cta: "Go Elite (₹1,649)", popular: false,
  },
];

const professionalPlans = [
  {
    id: "p-starter", name: "Starter", tag: "Launch your business", price: 0, yearly: 0,
    highlights: ["Business profile & verification", "Portfolio (10 images)", "Accept/reject bookings", "Basic earnings overview", "Customer reviews", "Standard search listing"],
    cta: "Start Free", popular: false,
  },
  {
    id: "p-business", name: "Business", tag: "Grow & scale", price: 1099, yearly: 9349,
    highlights: ["Personal website (zenzy.shop/you)", "Unlimited portfolio", "CRM & customer database", "Smart calendar & scheduling", "Quote & invoice generator", "AI proposal generator", "Business analytics", "WhatsApp integration", "Priority support (4h)"],
    cta: "Upgrade to Business (₹1,099)", popular: true,
  },
  {
    id: "p-enterprise", name: "Enterprise", tag: "Full business suite", price: 2749, yearly: 10999,
    highlights: ["Everything in Business", "Team management (25 members)", "AI Business Coach", "AI Content Creator", "Full website customization", "Marketing tools suite", "Branded invoices & contracts", "25% lower commission", "API access", "Dedicated manager"],
    cta: "Go Enterprise (₹2,749)", popular: false,
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
          color: "#0f2744",
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

  const cell = (v: any) => {
    if (v === true) return <Check className="w-4 h-4 text-slate-800 mx-auto" strokeWidth={2.5} />;
    if (v === false) return <span className="block w-1 h-1 rounded-full bg-slate-300 mx-auto" />;
    return <span className="text-[11px] font-medium text-slate-500">{v}</span>;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans transition-colors">
      <Navbar />
      <main className="flex-grow">

        {/* ─── HERO ─── */}
        <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 pt-32 pb-10 text-center">
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Zenzy Premium</p>
            <h1 className="text-4xl md:text-[3.25rem] font-bold tracking-tight leading-[1.1] text-slate-900">
              Simple, transparent pricing.
            </h1>
            <p className="text-slate-500 text-[15px] max-w-lg mx-auto leading-relaxed">
              Choose a plan for booking services or growing your professional business. Scale up or down anytime.
            </p>

            {/* ─── NEW USER WELCOME DISCOUNT BANNER ─── */}
            <div className="max-w-lg mx-auto bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200 p-3.5 rounded-xl shadow-xs flex items-center justify-center gap-2.5 text-center">
              <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs text-slate-900 font-black">
                🎁 <span className="text-emerald-700">Welcome Discount Unlocked!</span> As a new member, enjoy an automatic <span className="underline decoration-emerald-500 text-indigo-700 font-extrabold">15% Special Discount</span> on all premium plans below!
              </p>
            </div>
          </div>
        </section>

        {/* ─── TAB + BILLING TOGGLE ─── */}
        <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 pb-10">
          {/* Audience Tab */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-slate-100/80 rounded-xl p-1 gap-1 border border-slate-200/50">
              {[
                { key: "customer", label: "For Customers", icon: <Users className="w-3.5 h-3.5" /> },
                { key: "professional", label: "For Professionals", icon: <Briefcase className="w-3.5 h-3.5" /> },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key as any); setTableExpanded(false); }}
                  className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer ${tab === t.key
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Billing */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-[12px] font-medium ${billing === "monthly" ? "text-slate-900" : "text-slate-400"}`}>Monthly</span>
            <button
              onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
              className="relative w-11 h-6 rounded-full bg-slate-300 transition-colors cursor-pointer p-0.5"
              aria-label="Toggle billing"
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${billing === "yearly" ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <span className={`text-[12px] font-medium ${billing === "yearly" ? "text-slate-900" : "text-slate-400"}`}>
              Yearly
            </span>
            {billing === "yearly" && (
              <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">
                Save 30%
              </span>
            )}
          </div>
        </section>

        {/* ─── PRICING CARDS ─── */}
        <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const normalPrice = price(plan);
              const discountedPrice = getWelcomeDiscountedPrice(plan);
              const hasDiscount = normalPrice > 0;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col p-7 rounded-2xl border transition-all duration-200 ${plan.popular
                      ? "border-slate-900 bg-slate-50/40 shadow-sm"
                      : "border-slate-200/80 bg-white hover:border-slate-300/80"
                    }`}
                >
                  {/* Popular indicator */}
                  {plan.popular && (
                    <div className="absolute -top-px left-8 right-8 h-[2px] bg-slate-900 rounded-full" />
                  )}

                  {/* Header */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-[17px] font-semibold text-slate-900 tracking-tight">{plan.name}</h3>
                      {plan.popular && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] font-medium text-slate-400">{plan.tag}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    {plan.price === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-[38px] font-bold text-slate-900 leading-none tracking-tight">₹0</span>
                        <span className="text-[13px] font-medium text-slate-400">/forever</span>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[38px] font-bold text-slate-900 leading-none tracking-tight">
                              ₹{discountedPrice.toLocaleString("en-IN")}
                            </span>
                            <span className="text-sm font-bold text-slate-400 line-through">
                              ₹{normalPrice.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[13px] font-medium text-slate-400">
                              /{billing === "yearly" ? "year" : "mo"}
                            </span>
                          </div>
                          <span className="inline-block bg-emerald-100 text-emerald-800 text-[9.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                            15% New Member Welcome Discount Applied
                          </span>
                        </div>

                        {billing === "yearly" && savings(plan) > 0 && (
                          <p className="text-[11px] font-medium text-slate-500 mt-1.5">
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
                    className={`w-full py-3 rounded-xl text-[12px] font-bold transition-all duration-200 cursor-pointer hover:opacity-90 active:scale-[0.98] mb-6 flex items-center justify-center gap-2 ${plan.popular
                        ? "bg-slate-900 text-white hover:bg-slate-800"
                        : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                  >
                    {processingPlanId === plan.id ? (
                      <span>Processing Payment...</span>
                    ) : (
                      <span>{plan.price === 0 ? "Start Free" : `Subscribe for ₹${discountedPrice.toLocaleString("en-IN")}`}</span>
                    )}
                  </button>

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">What's included</p>
                    {plan.highlights.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span className="text-[13px] font-medium text-slate-600 leading-snug">{f}</span>
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
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Compare all features</h2>
            <p className="text-[13px] font-medium text-slate-400 mt-1">
              {tab === "customer" ? `${customerComparison.length} features across all customer plans` : `${professionalComparison.length} features across all professional plans`}
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[46%]">Feature</th>
                    {labels.map((l, i) => (
                      <th key={i} className={`px-3 py-4 text-[11px] font-semibold uppercase tracking-wider text-center ${i === 1 ? "text-slate-900" : "text-slate-400"
                        }`}>
                        {l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(tableExpanded ? comparison : comparison.slice(0, 10)).map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50 last:border-none">
                      <td className="px-5 py-3 text-[12.5px] font-medium text-slate-600">{row.f}</td>
                      <td className="px-3 py-3 text-center">{cell(row.a)}</td>
                      <td className="px-3 py-3 text-center bg-slate-50/30">{cell(row.b)}</td>
                      <td className="px-3 py-3 text-center">{cell(row.c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!tableExpanded && comparison.length > 10 && (
              <button
                onClick={() => setTableExpanded(true)}
                className="w-full border-t border-slate-100 py-3.5 text-[12px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Show all {comparison.length} features <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* ─── PLATFORM FEATURES ─── */}
        <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 pb-20">
          <div className="bg-slate-900 rounded-2xl p-8 md:p-12 border border-slate-800">
            <div className="max-w-2xl mx-auto text-center space-y-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Included in every plan</p>
              <h2 className="text-2xl font-bold text-white tracking-tight">Enterprise-grade infrastructure</h2>
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
                    <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={2.5} />
                    <span className="text-[12px] font-medium text-slate-400">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="max-w-2xl mx-auto w-full px-5 sm:px-8 pb-20">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
            {faqs.map((faq, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
                >
                  <span className="text-[14px] font-medium text-slate-900 pr-6 group-hover:text-slate-600 transition-colors">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${faqOpen === idx ? "rotate-180" : ""
                    }`} />
                </button>
                {faqOpen === idx && (
                  <p className="pb-5 text-[13px] font-medium text-slate-500 leading-relaxed -mt-1">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── BOTTOM CTA ─── */}
        <section className="max-w-5xl mx-auto w-full px-5 sm:px-8 pb-20">
          <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-10 md:p-14 text-center border border-slate-800">

            {/* Subtle glow effects */}
            <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-2xl mx-auto space-y-6">

              {/* Premium badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-medium text-white/60 tracking-[0.15em] uppercase">No credit card required</span>
              </div>

              {/* Main headline */}
              <div className="space-y-2">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-[1.15]">
                  Start your
                  <span className="block text-white/80">
                    7-day free trial
                  </span>
                </h2>
                <p className="text-[14px] font-normal text-white/40 leading-relaxed max-w-lg mx-auto">
                  Join thousands of teams already building better products.
                  <span className="block text-white/25 text-xs mt-0.5">Upgrade, downgrade, or cancel — it's always your choice.</span>
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => { if (!user) window.location.href = "/auth"; else window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="group relative px-9 py-3.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-medium text-[14px] transition-all duration-300 cursor-pointer active:scale-[0.97] flex items-center gap-2.5 shadow-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-emerald-400 text-[9px] font-medium text-black rounded-full shadow-sm">
                    Free
                  </span>
                </button>

                <Link
                  href="/contact"
                  className="group px-9 py-3.5 text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-xl font-medium text-[14px] transition-all duration-300 flex items-center gap-2"
                >
                  <span>Contact Sales</span>
                  <span className="inline-block transition-all duration-300 group-hover:translate-x-1">→</span>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-5 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-white/30">
                  <Check className="w-3.5 h-3.5 text-emerald-400/60" strokeWidth={2.5} />
                  <span className="text-xs font-medium">Full access</span>
                </div>
                <div className="flex items-center gap-2 text-white/30">
                  <Check className="w-3.5 h-3.5 text-emerald-400/60" strokeWidth={2.5} />
                  <span className="text-xs font-medium">Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2 text-white/30">
                  <Check className="w-3.5 h-3.5 text-emerald-400/60" strokeWidth={2.5} />
                  <span className="text-xs font-medium">No risk</span>
                </div>
                <div className="flex items-center gap-2 text-white/30">
                  <Check className="w-3.5 h-3.5 text-emerald-400/60" strokeWidth={2.5} />
                  <span className="text-xs font-medium">7-day trial</span>
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