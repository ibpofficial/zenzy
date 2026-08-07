import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { prompt, persona, projectContext, history } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const openRouterApiKey =
      process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    const isClient = persona === "client";
    const systemPrompt = `You are Zen AI, the intelligent, conversational AI Assistant for Zenzy.
User Role: ${isClient ? "Client / Homeowner" : "Contractor / Professional Service Provider"}

Guidelines:
1. Be warm, natural, and helpful. If the user says "hi", "hello", or introduces themselves, greet them warmly and offer quick assistance.
2. You have live context about their workspace project:
${JSON.stringify(projectContext || {}, null, 2)}
3. Answer questions clearly, accurately, and format responses with clean markdown bullet points.
4. For homeowners: Emphasize milestone progress, escrow safety, and clear site updates.
5. For contractors: Focus on net earnings payouts, client sign-offs, labor tracking, and project efficiency.`;

    // 1. Try OpenRouter DeepSeek Model Endpoint
    if (openRouterApiKey) {
      try {
        const formattedHistory = (history || []).slice(-6).map((h: any) => ({
          role: h.sender === "user" ? "user" : "assistant",
          content: h.text
        }));

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openRouterApiKey}`,
            "HTTP-Referer": "https://zenzy.com",
            "X-Title": "Zenzy Workspace AI"
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              ...formattedHistory,
              { role: "user", content: prompt }
            ]
          })
        });

        if (response.ok) {
          const resData = await response.json();
          const replyText = resData.choices?.[0]?.message?.content;
          if (replyText) {
            return NextResponse.json({ reply: replyText.trim() });
          }
        }
      } catch (apiErr) {
        console.warn("DeepSeek OpenRouter API attempt warning:", apiErr);
      }

      // 2. Try Direct Gemini AI API Endpoint as fallback
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${openRouterApiKey}`;
        const fullPrompt = `${systemPrompt}\n\nUser Question: ${prompt}`;

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          })
        });

        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const gText = gData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (gText) {
            return NextResponse.json({ reply: gText.trim() });
          }
        }
      } catch (gErr) {
        console.warn("Gemini API fallback attempt warning:", gErr);
      }
    }

    // 3. Conversational Heuristic AI Engine (For greetings, queries & offline resilience)
    const pTitle = projectContext?.title || "Workspace Project";
    const progress = projectContext?.progressPercent ?? 46;
    const paid = projectContext?.totalPaid ?? 215000;
    const qLower = prompt.toLowerCase();

    let replyText = "";
    if (qLower === "hi" || qLower === "hello font-bold" || qLower.startsWith("hi") || qLower.startsWith("hello") || qLower.startsWith("hey")) {
      replyText = `Hello! 👋 I am **Zen AI**, your assistant for **"${pTitle}"**.\n\nHow can I assist you today? You can ask me about:\n• Remaining project work & milestones\n• Financial payments & net payouts\n• Latest site daily reports & photos`;
    } else if (qLower.includes("who are you") || qLower.includes("what are you")) {
      replyText = `I am **Zen AI**, Zenzy's official workspace assistant tailored for your role as a **${isClient ? "Homeowner" : "Professional Contractor"}**.`;
    } else if (qLower.includes("payment") || qLower.includes("earning") || qLower.includes("budget") || qLower.includes("escrow")) {
      replyText = isClient
        ? `💳 **Financial Escrow Summary for "${pTitle}":**\n\n• **Gross Released:** ₹${paid.toLocaleString("en-IN")}\n• **Overall Progress:** ${progress}%\n• **Escrow Guarantee:** Your funds are protected until milestone work is verified.`
        : `💰 **Contractor Net Payout Ledger:**\n\n• **Gross Escrow Released:** ₹${paid.toLocaleString("en-IN")}\n• **Net Contractor Payout (95%):** ₹${Math.round(paid * 0.95).toLocaleString("en-IN")}\n• **Zenzy Platform Fee (5%):** ₹${Math.round(paid * 0.05).toLocaleString("en-IN")}`;
    } else if (qLower.includes("work") || qLower.includes("remaining") || qLower.includes("timeline")) {
      replyText = `📊 **Project Execution Status for "${pTitle}":**\n\n• **Current Completion:** ${progress}%\n• **Current Active Stage:** Electrical & Plumbing\n• **Overall Status:** Tracking on schedule.`;
    } else {
      replyText = `✨ **Zen AI Assistant Response for "${pTitle}":**\n\n• **Current Stage:** Electrical Work (${progress}% Done)\n• **Trust Score:** 92/100\n• **Recommendation:** All ongoing tasks are tracked in your live workspace.`;
    }

    return NextResponse.json({ reply: replyText });
  } catch (err: any) {
    console.error("Zen AI API Error:", err);
    return NextResponse.json(
      { reply: "Hello! I am Zen AI. I am ready to help you with your project progress, financial reports, or daily logs." },
      { status: 200 }
    );
  }
}
