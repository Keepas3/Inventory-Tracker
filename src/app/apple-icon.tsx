import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS home-screen icon; the OS applies its own rounded mask, so this is a full-bleed square.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#047857" }}>
        <svg width="112" height="112" viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
          <path d="M32 13 48 22v20L32 51 16 42V22z" />
          <path d="m16 22 16 9 16-9M32 31v20" />
        </svg>
      </div>
    ),
    size,
  );
}
