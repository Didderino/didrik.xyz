// Most recent 10 tracks Spotify has logged. Uses the user-read-recently-played
// scope which was part of the original auth flow.
import { getAccessToken, shapeTrack } from "./_spotify.js";

const REC_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=10";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");

  const auth = await getAccessToken();
  if (auth.error) {
    return res.status(200).json({
      status: auth.error === "missing-env" ? "unconfigured" : "error",
      error: auth.error,
      detail: auth.detail || auth.body || null,
    });
  }
  try {
    const r = await fetch(REC_URL, { headers: { Authorization: `Bearer ${auth.token}` } });
    if (!r.ok) return res.status(200).json({ status: "error", httpStatus: r.status });
    const data = await r.json();
    const tracks = (data.items || [])
      .map((it) => ({ ...shapeTrack(it.track), playedAt: it.played_at }))
      .filter(Boolean);
    return res.status(200).json({ status: "ok", tracks });
  } catch (e) {
    return res.status(200).json({ status: "error", error: String(e?.message || e) });
  }
}
