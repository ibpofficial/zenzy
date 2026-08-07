"use client";

import React, { useState } from "react";
import { Project, PaymentRequest } from "@/lib/schema";
import { CreditCard, IndianRupee, ShieldCheck, CheckCircle2, Lock, X, Zap, Loader2 } from "lucide-react";

interface PaymentGatewayModalProps {
  project: Project;
  paymentRequests: PaymentRequest[];
  onClose: () => void;
  onPaymentSuccess: (paymentId: string, amount: number, gateway: string, requestId?: string) => Promise<void>;
}

export default function PaymentGatewayModal({
  project,
  paymentRequests,
  onClose,
  onPaymentSuccess,
}: PaymentGatewayModalProps) {
  const pendingRequests = paymentRequests.filter((p) => p.status === "pending");
  const selectedReq = pendingRequests.length > 0 ? pendingRequests[0] : null;

  const [paymentAmount, setPaymentAmount] = useState<number>(
    selectedReq ? selectedReq.amount : project.pendingPaymentsAmount || 40000
  );
  const [processing, setProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [txnId, setTxnId] = useState("");

  const handleRazorpayCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    setProcessing(true);

    try {
      // 1. Ensure Razorpay Checkout SDK Script is Loaded dynamically
      if (!(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay Checkout SDK script"));
          document.body.appendChild(script);
        });
      }

      // 2. Create Razorpay Order via Backend Route
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: "INR",
          receipt: `proj_${Date.now().toString().slice(-6)}`,
          notes: {
            projectId: project.id,
            projectTitle: project.title,
            requestId: selectedReq?.id || "",
          },
        }),
      });

      if (!orderRes.ok) {
        alert("Failed to create Razorpay payment order. Please try again.");
        setProcessing(false);
        return;
      }

      const orderData = await orderRes.json();

      // 3. Configure Razorpay Popup Options (Same as Shop & Accept Quote)
      const options = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TMWjMDIprOz1xj",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Zenzy Project Workspace",
        description: selectedReq ? selectedReq.description : `Milestone Release for ${project.title}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // Verify HMAC Signature on Backend
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: paymentAmount,
                projectId: project.id,
                clientId: project.clientId,
                clientName: project.clientName || "Customer",
                workerId: project.businessId,
                workerName: project.businessName || "Contractor",
                description: selectedReq ? selectedReq.description : `Milestone Release for ${project.title}`,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await onPaymentSuccess(
                response.razorpay_payment_id,
                paymentAmount,
                "Razorpay Gateway",
                selectedReq?.id
              );
              setTxnId(response.razorpay_payment_id);
              setPaymentDone(true);
            } else {
              alert("Razorpay payment verification failed.");
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            alert("Verification error: " + (err.message || err));
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
        prefill: {
          name: project.clientName || "Customer",
          email: "",
          contact: "",
        },
        theme: {
          color: "#0f2744",
        },
      };

      // 4. Open Razorpay Checkout Popup
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay checkout error:", err);
      alert("Razorpay gateway error: " + (err.message || err));
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-left relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Razorpay Payment Gateway
              </h3>
              <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Razorpay Test &amp; Live Gateway Ready
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentDone ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900">Razorpay Payment Verified!</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Transaction ID: <strong className="font-mono text-slate-900">{txnId}</strong>
              </p>
              <p className="text-xs text-emerald-700 font-extrabold mt-1">
                ₹{paymentAmount.toLocaleString("en-IN")} deposited securely in Escrow ledger.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md"
            >
              Close &amp; Return to Workspace
            </button>
          </div>
        ) : (
          <form onSubmit={handleRazorpayCheckout} className="space-y-4 text-xs font-semibold">
            {/* Amount details */}
            <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Payment Request Details
              </span>
              <p className="text-xs font-bold text-slate-800 line-clamp-2">
                {selectedReq ? selectedReq.description : project.title}
              </p>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Enter Payment Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-base font-black font-mono text-slate-900 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Gateway Info */}
            <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-900 font-black text-xs">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Official Razorpay Checkout</span>
              </div>
              <p className="text-[11px] text-indigo-800 font-medium leading-relaxed">
                Clicking below opens the official Razorpay Checkout popup supporting <strong>UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, &amp; Wallets</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2 text-[11px] text-slate-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Escrow Protected · Instant HMAC Verification</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-6 py-2.5 bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{paymentAmount.toLocaleString("en-IN")} via Razorpay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
