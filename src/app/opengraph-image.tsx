import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const features = ["Scan receipts with AI", "Ask in plain English", "Smart restock alerts"];

// The card shown when the demo link is pasted into Slack, LinkedIn, iMessage, etc.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#fafafa",
          background: "linear-gradient(135deg, #052e22 0%, #09090b 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "#047857", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="44" height="44" viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
              <path d="M32 13 48 22v20L32 51 16 42V22z" />
              <path d="m16 22 16 9 16-9M32 31v20" />
            </svg>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>{SITE.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, maxWidth: 960 }}>Know what you own, and what to restock.</div>
          <div style={{ fontSize: 30, color: "#a1a1aa", maxWidth: 900 }}>An AI-assisted inventory tracker with receipt scanning, natural-language Q&amp;A and usage-based restock suggestions.</div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {features.map((f) => (
            <div key={f} style={{ display: "flex", padding: "12px 24px", borderRadius: 999, background: "#052e22", color: "#34d399", fontSize: 26, border: "1px solid #065f46" }}>
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
