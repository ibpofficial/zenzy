import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      quoteId,
      inquiryId,
      projectId,
      clientId,
      clientName = "Customer",
      clientEmail = "",
      clientPhone = "",
      workerId = "",
      workerName = "",
      amount = 0,
      description = "Quotation Payment",
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required Razorpay signature parameters" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "K3NxeKJyrxuOHHD3ZPyuz6dY";

    // Verify Razorpay HMAC SHA256 Signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      console.error("Razorpay signature verification failed!");
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    // 1. Record full payment transaction in Firestore 'payments' collection for Admin Panel
    const paymentDoc = await addDoc(collection(db, "payments"), {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount,
      currency: "INR",
      status: "success",
      gateway: "Razorpay Test Mode",
      description,
      quoteId: quoteId || null,
      inquiryId: inquiryId || null,
      projectId: projectId || null,
      clientId: clientId || null,
      clientName,
      clientEmail,
      clientPhone,
      workerId,
      workerName,
      createdAt: timestamp,
    });

    // 2. If linked to a quote, update quote payment status
    if (quoteId) {
      try {
        const quoteRef = doc(db, "quotations", quoteId);
        await updateDoc(quoteRef, {
          paymentStatus: "paid",
          paidAmount: amount,
          paymentId: razorpay_payment_id,
          paidAt: timestamp,
        });
      } catch (err) {
        console.error("Error updating quote payment status:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and recorded successfully",
      id: paymentDoc.id,
      paymentId: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error("Verify Razorpay Payment Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
