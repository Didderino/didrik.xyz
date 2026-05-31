// Dynamic OG-image generator (edge function).
//
// Hit /api/og?title=...&kind=...&subtitle=...&badge=...&hue=... and you get a
// 1200×630 PNG mirroring the splash aesthetic. Used by the per-item share
// pages in /p/<slug>.html — each one points its og:image at this endpoint
// with the right query string baked in.
//
// All params are optional — defaults produce the same "Didrik Archive" card
// as the static og.png.
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const params = url.searchParams;
  const title    = params.get("title")    || "Didrik";
  const subtitle = params.get("subtitle") || "Archive";
  const kind     = params.get("kind")     || "";
  const badgePath = params.get("badge")   || "";
  const badgeUrl  = badgePath ? new URL(badgePath, url.origin).href : null;

  // Twilight gradient that matches the live site
  const bg = "linear-gradient(160deg, #1a1330 0%, #2a1f4a 45%, #4a3970 100%)";

  return new ImageResponse(
    (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        color: "#ffffff",
        fontFamily: "Helvetica, Arial, sans-serif",
        background: bg,
        position: "relative",
      }}>
        {/* Wave ribbon, simplified version of the live wave */}
        <svg
          width="1200"
          height="200"
          viewBox="0 0 1200 200"
          style={{ position: "absolute", left: 0, bottom: 220, width: 1200, height: 200 }}
        >
          <path
            d="M0,120 C200,40 400,200 600,120 C800,40 1000,200 1200,120"
            fill="none"
            stroke="rgba(220,235,255,0.30)"
            strokeWidth="50"
          />
          <path
            d="M0,120 C200,40 400,200 600,120 C800,40 1000,200 1200,120"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
          />
        </svg>

        {/* Top row — kind eyebrow + badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
          <div style={{
            fontSize: 24,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.5)",
            fontWeight: 400,
            display: "flex",
          }}>
            {kind}
          </div>
          {badgeUrl && (
            <div style={{
              display: "flex",
              width: 140,
              height: 140,
              borderRadius: 28,
              overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.18)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            }}>
              <img src={badgeUrl} width="140" height="140" style={{ objectFit: "cover" }} />
            </div>
          )}
        </div>

        {/* Title + subtitle near the bottom */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right", width: "100%" }}>
          <div style={{
            fontSize: 110,
            fontWeight: 500,
            letterSpacing: -2,
            lineHeight: 1,
            color: "#ffffff",
            textShadow: "0 0 24px rgba(255,255,255,0.18)",
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: 30,
              fontWeight: 300,
              marginTop: 18,
              color: "rgba(255,255,255,0.78)",
              letterSpacing: 1,
            }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
