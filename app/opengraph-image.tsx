import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Zenzy | The Operating System for Modern Service Businesses";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f2744",
          backgroundImage: "linear-gradient(135deg, #0f2744 0%, #1a365d 50%, #081526 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Top Decorative Border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "linear-gradient(90deg, #3b82f6, #6366f1, #a855f7)",
          }}
        />

        {/* Logo and Brand Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              backgroundColor: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "42px",
              fontWeight: "900",
              boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
            }}
          >
            Z
          </div>
          <span
            style={{
              fontSize: "56px",
              fontWeight: "900",
              letterSpacing: "-1.5px",
              color: "#ffffff",
            }}
          >
            Zenzy
          </span>
        </div>

        {/* Main Headline */}
        <div
          style={{
            fontSize: "44px",
            fontWeight: "800",
            maxWidth: "960px",
            lineHeight: "1.2",
            marginBottom: "24px",
            color: "#ffffff",
            letterSpacing: "-0.5px",
          }}
        >
          The Operating System for Modern Service Businesses
        </div>

        {/* Subtitle Description */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#93c5fd",
            maxWidth: "880px",
            lineHeight: "1.5",
            marginBottom: "36px",
          }}
        >
          Win Projects. Manage Work. Grow Your Business.
        </div>

        {/* Domain Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 28px",
            borderRadius: "40px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            fontSize: "20px",
            fontWeight: "700",
            color: "#60a5fa",
          }}
        >
          https://zenzy.shop
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
