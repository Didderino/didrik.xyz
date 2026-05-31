// Dynamic OG-image generator (edge function).
//
// Hit /api/og?title=...&kind=...&subtitle=...&badge=... and you get a
// 1200×630 PNG mirroring the splash aesthetic. Used by the per-item share
// pages in /p/<slug>.html — each one points its og:image at this endpoint
// with the right query string baked in.
//
// Authored without JSX so this file stays a plain .js — no esbuild JSX
// transform involved, no extension dance with Vercel's runtime detection.
// `h()` is React.createElement re-exported for terseness.
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

// Tiny helper — same signature as React.createElement
function h(tag, props, ...children) {
  return { type: tag, props: { ...props, children: children.length === 1 ? children[0] : children } };
}

export default async function handler(req) {
  const url = new URL(req.url);
  const params = url.searchParams;
  const title    = params.get("title")    || "Didrik";
  const subtitle = params.get("subtitle") || "Archive";
  const kind     = params.get("kind")     || "";
  const badgePath = params.get("badge")   || "";
  const badgeUrl  = badgePath ? new URL(badgePath, url.origin).href : null;

  const bg = "linear-gradient(160deg, #1a1330 0%, #2a1f4a 45%, #4a3970 100%)";

  const tree = h("div", {
    style: {
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
    },
  },
    // Wave ribbon
    h("svg", {
      width: 1200, height: 200,
      viewBox: "0 0 1200 200",
      style: { position: "absolute", left: 0, bottom: 220, width: 1200, height: 200 },
    },
      h("path", {
        d: "M0,120 C200,40 400,200 600,120 C800,40 1000,200 1200,120",
        fill: "none",
        stroke: "rgba(220,235,255,0.30)",
        strokeWidth: 50,
      }),
      h("path", {
        d: "M0,120 C200,40 400,200 600,120 C800,40 1000,200 1200,120",
        fill: "none",
        stroke: "rgba(255,255,255,0.85)",
        strokeWidth: 2,
      })
    ),

    // Top row: kind eyebrow + badge
    h("div", {
      style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" },
    },
      h("div", {
        style: {
          fontSize: 24,
          letterSpacing: 10,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          fontWeight: 400,
          display: "flex",
        },
      }, kind),
      badgeUrl && h("div", {
        style: {
          display: "flex",
          width: 140, height: 140,
          borderRadius: 28,
          overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.18)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        },
      },
        h("img", { src: badgeUrl, width: 140, height: 140, style: { objectFit: "cover" } })
      )
    ),

    // Title + subtitle
    h("div", {
      style: { display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right", width: "100%" },
    },
      h("div", {
        style: {
          fontSize: 110,
          fontWeight: 500,
          letterSpacing: -2,
          lineHeight: 1,
          color: "#ffffff",
        },
      }, title),
      subtitle && h("div", {
        style: {
          fontSize: 30,
          fontWeight: 300,
          marginTop: 18,
          color: "rgba(255,255,255,0.78)",
          letterSpacing: 1,
        },
      }, subtitle)
    )
  );

  return new ImageResponse(tree, { width: 1200, height: 630 });
}
