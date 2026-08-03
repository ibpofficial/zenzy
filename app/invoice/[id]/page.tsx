"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import QuoteDocument from "@/components/QuoteDocument";
import {
  ChevronLeft,
  FileCheck,
  CreditCard,
  Calendar,
  CheckCircle,
  Download,
  Building,
  ArrowLeft
} from "lucide-react";

export default function PublicInvoicePage() {
  const params = useParams();
  const invoiceId = params?.id as string;
  const router = useRouter();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      if (!invoiceId) return;
      try {
        setLoading(true);
        const invRef = doc(db, "invoices", invoiceId);
        const invSnap = await getDoc(invRef);

        if (invSnap.exists()) {
          setInvoice({ id: invSnap.id, ...invSnap.data() });
        } else {
          setInvoice(null);
        }
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [invoiceId]);

  const handleMarkAsPaid = async () => {
    if (!invoice || updating) return;
    if (!confirm("Mark this invoice as Paid?")) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "invoices", invoice.id), {
        status: "Paid",
        paidAt: new Date().toISOString()
      });
      setInvoice((prev: any) => ({ ...prev, status: "Paid", paidAt: new Date().toISOString() }));
      alert("✓ Invoice status updated to Paid.");
    } catch (e) {
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingScreen autoDismiss={false} />;

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <FileCheck className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">Invoice Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-2">
            The requested invoice document #{invoiceId} does not exist.
          </p>
          <Link
            href="/services"
            className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase"
          >
            Go to Services
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Convert invoice data to QuoteDocument format
  const mockQuoteObj = {
    ...invoice,
    quoteDocumentTitle: `OFFICIAL TAX INVOICE - #${invoice.invoiceNumber}`,
    quoteNumber: invoice.invoiceNumber,
    createdAt: invoice.issueDate || invoice.createdAt,
    expiryDate: invoice.dueDate,
  };

  const isPaid = invoice.status === "Paid";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 print:bg-white">
      {/* Top Banner Navigation */}
      <div className="print:hidden border-b border-gray-200 bg-white py-3.5 px-6 flex items-center justify-between sticky top-0 z-[100] shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            Commercial Invoice
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
            isPaid ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-800 border border-amber-300"
          }`}>
            {invoice.status || "Unpaid"}
          </span>

          {!isPaid && (
            <button
              type="button"
              onClick={handleMarkAsPaid}
              disabled={updating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Mark Paid
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 pt-6">
        {/* Header summary card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Tax Invoice #{invoice.invoiceNumber}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Converted from Quote #{invoice.quoteNumber || invoice.quoteId?.slice(0, 8)}</p>
          </div>

          <div className="flex gap-4 text-xs font-semibold text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Issue Date</span>
              <span>{new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Payment Due</span>
              <span className="text-slate-900 font-bold">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN") : "Net 15"}</span>
            </div>
          </div>
        </div>

        {/* Invoice Render Tree via QuoteDocument */}
        <QuoteDocument quote={mockQuoteObj} />
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
