// Vercel Serverless Function — proxies Spotify "currently playing", falling
// back to recently-played when nothing is actively playing. Cached at the edge
// for 15s so heavy traffic doesn't hammer Spotify.
import { getAccessToken, shapeTrack } from "./_spotify.js";

const CURRENT_URL = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENT_URL  = "https://api.spotify.com/v1/me/player/recently-played?limit=1";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");

  const auth = await getAccessToken();
  if (auth.error) {
    return res.status(200).json({
      status: auth.error === "missing-env" ? "unconfigured" : "error",
      error: auth.error,
      detail: auth.detail || auth.body || null,
    });
  }
  const headers = { Authorization: `Bearer ${auth.token}` };

  try {
    // 1. Currently playing
    const cur = await fetch(CURRENT_URL, { headers });
    if (cur.status === 200) {
      const data = await cur.json();
      if (data?.item) {
        return res.status(200).json({
          status: "ok",
          isPlaying: !!data.is_playing,
          ...shapeTrack(data.item),
        });
      }
    }
    // 2. Fall back to recently-played
    const rec = await fetch(RECENT_URL, { headers });
    if (rec.ok) {
      const data = await rec.json();
      const item = data?.items?.[0]?.track;
      if (item) return res.status(200).json({ status: "ok", isPlaying: false, ...shapeTrack(item) });
    }
    return res.status(200).json({ status: "ok", isPlaying: false, title: null });
  } catch (e) {
    return res.status(200).json({ status: "error", error: String(e?.message || e) });
  }
}
