import { NextResponse } from "next/server";
import { BusinessProfile } from "@/lib/schema";

// Heuristic Fallback generator in case of missing API key or fetch errors
const generateFallbackTaglines = (profs: BusinessProfile[]): Record<string, string> => {
  const results: Record<string, string> = {};
  
  // Determine best attributes
  let bestTrustId = "";
  let maxTrust = -1;
  let minRateId = "";
  let minRate = Infinity;
  let bestExpId = "";
  let maxExpDays = -1;

  profs.forEach((p) => {
    const trustVal = p.trustScore?.overall || 0;
    if (trustVal > maxTrust) {
      maxTrust = trustVal;
      bestTrustId = p.uid;
    }

    // Parse starting price / rate
    const startingFrom = p.priceStartingFrom || p.pricingRate || "0";
    const rateVal = parseInt(startingFrom.replace(/\D/g, "")) || 0;
    if (rateVal > 0 && rateVal < minRate) {
      minRate = rateVal;
      minRateId = p.uid;
    }

    // Parse experience
    const expVal = parseInt(p.experience || "0") || 0;
    if (expVal > maxExpDays) {
      maxExpDays = expVal;
      bestExpId = p.uid;
    }
  });

  profs.forEach((p) => {
    if (p.uid === bestTrustId && maxTrust >= 75) {
      results[p.uid] = "Most highly trusted provider";
    } else if (p.uid === minRateId && minRate !== Infinity) {
      results[p.uid] = "Most budget-friendly choice";
    } else if (p.uid === bestExpId && maxExpDays > 0) {
      results[p.uid] = "Most experienced professional";
    } else {
      results[p.uid] = `Verified ${p.category} specialist`;
    }
  });

  return results;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { professionals } = body as { professionals: BusinessProfile[] };

    if (!professionals || !Array.isArray(professionals) || professionals.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid parameter: professionals" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      // Return fallback positioning immediately if no API key is set
      const taglines = generateFallbackTaglines(professionals);
      return NextResponse.json({ taglines });
    }

    // Call Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = `You are a positioning consultant. Analyze the following local service professionals and return a JSON object mapping each uid to a short, one-sentence positioning tagline summary (maximum 6 words, e.g. "Best for premium projects", "Fastest response time", "Most experienced contractor"):

${JSON.stringify(
  professionals.map((p) => ({
    uid: p.uid,
    name: p.name,
    category: p.category,
    experience: p.experience,
    pricing: p.priceStartingFrom || p.pricingRate,
    trustScore: p.trustScore?.overall
  })),
  null,
  2
)}

Return ONLY a valid JSON object. Do not wrap it in markdown backticks or blockquotes. Format:
{
  "uid1": "tagline1",
  "uid2": "tagline2"
}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const taglines = JSON.parse(textResult.trim());

    return NextResponse.json({ taglines });
  } catch (err: any) {
    console.warn("GenAI comparison generation encountered error (using heuristic fallback):", err);
    // Graceful fallback to heuristic positioning taglines
    try {
      const body = await request.clone().json().catch(() => ({}));
      const { professionals } = body as { professionals: BusinessProfile[] };
      const fallbackTaglines = generateFallbackTaglines(professionals);
      return NextResponse.json({ taglines: fallbackTaglines });
    } catch {
      return NextResponse.json(
        { error: "Failed to generate comparison summaries" },
        { status: 500 }
      );
    }
  }
}
