import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", receipt = "rcpt_" + Date.now(), notes = {} } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TMWjMDIprOz1xj";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "K3NxeKJyrxuOHHD3ZPyuz6dY";

    const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    // Convert amount in ₹ to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100);

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt,
        notes,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Razorpay Order API Error:", errText);
      return NextResponse.json({ error: "Failed to create Razorpay order", details: errText }, { status: response.status });
    }

    const orderData = await response.json();
    return NextResponse.json({
      id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      status: orderData.status,
      keyId,
    });
  } catch (error: any) {
    console.error("Create Razorpay Order Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
