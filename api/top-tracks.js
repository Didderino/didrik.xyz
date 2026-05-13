// Top tracks over the last ~4 weeks. Requires the user-top-read scope —
// re-run scripts/spotify-auth.js to mint a new refresh token if you set up
// Spotify before this scope was added.
import { getAccessToken, shapeTrack } from "./_spotify.js";

const TOP_URL = "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5";

export default async function handler(req, res) {
  // Top tracks roll over slowly — cache more aggressively (5min edge, 1h SWR).
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");

  const auth = await getAccessToken();
  if (auth.error) {
    return res.status(200).json({
      status: auth.error === "missing-env" ? "unconfigured" : "error",
      error: auth.error,
      detail: auth.detail || auth.body || null,
    });
  }
  try {
    const r = await fetch(TOP_URL, { headers: { Authorization: `Bearer ${auth.token}` } });
    if (r.status === 403) {
      return res.status(200).json({
        status: "needs-scope",
        message: "Re-run scripts/spotify-auth.js — user-top-read scope was added after your last auth.",
      });
    }
    if (!r.ok) return res.status(200).json({ status: "error", httpStatus: r.status });
    const data = await r.json();
    const tracks = (data.items || []).map(shapeTrack).filter(Boolean);
    return res.status(200).json({ status: "ok", tracks });
  } catch (e) {
    return res.status(200).json({ status: "error", error: String(e?.message || e) });
  }
}
