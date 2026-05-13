// Vercel Serverless Function — proxies Spotify "currently playing".
//
// Flow on every request:
//   1. Exchange the long-lived refresh token for a short-lived access token
//      (Spotify access tokens last 1h; refresh tokens are forever).
//   2. Hit /me/player/currently-playing. If nothing's playing (204), fall back
//      to /me/player/recently-played.
//   3. Return a normalized JSON shape the frontend can render directly.
//
// Cached at the Vercel edge for 15s — visitor refreshes inside that window all
// hit the cache, not Spotify. Keeps us well below the rate limit.
//
// Env vars (set via `vercel env add ...`):
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET
//   SPOTIFY_REFRESH_TOKEN

const TOKEN_URL         = "https://accounts.spotify.com/api/token";
const CURRENT_URL       = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENT_URL        = "https://api.spotify.com/v1/me/player/recently-played?limit=1";

async function getAccessToken() {
  const id     = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
  // Return a structured result so the caller can surface exactly what failed.
  if (!id)      return { error: "missing-env", detail: "SPOTIFY_CLIENT_ID is not set on this deployment." };
  if (!secret)  return { error: "missing-env", detail: "SPOTIFY_CLIENT_SECRET is not set." };
  if (!refresh) return { error: "missing-env", detail: "SPOTIFY_REFRESH_TOKEN is not set." };

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh,
  });
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  const text = await r.text();
  if (!r.ok) {
    return { error: "token-refresh-failed", status: r.status, body: text.slice(0, 400) };
  }
  let json;
  try { json = JSON.parse(text); } catch (_) { return { error: "token-parse-failed", body: text.slice(0, 400) }; }
  if (!json.access_token) return { error: "no-access-token", body: text.slice(0, 400) };
  return { token: json.access_token };
}

function shapeTrack(item, isPlaying) {
  if (!item) return null;
  return {
    status: "ok",
    isPlaying,
    title: item.name,
    artist: (item.artists || []).map((a) => a.name).join(", "),
    album: item.album?.name || "",
    albumArt: item.album?.images?.[0]?.url || null,
    url: item.external_urls?.spotify || null,
  };
}

export default async function handler(req, res) {
  // Cache at the edge — visitors within 15s share a single Spotify hit.
  res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");

  const auth = await getAccessToken();
  if (auth.error) {
    return res.status(200).json({
      status: auth.error === "missing-env" ? "unconfigured" : "error",
      error: auth.error,
      detail: auth.detail || auth.body || null,
      httpStatus: auth.status || null,
    });
  }
  const token = auth.token;

  try {
    // 1. Currently playing
    const cur = await fetch(CURRENT_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (cur.status === 200) {
      const data = await cur.json();
      if (data?.item) {
        return res.status(200).json(shapeTrack(data.item, !!data.is_playing));
      }
    }
    // 2. Fall back to recently-played
    const rec = await fetch(RECENT_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (rec.ok) {
      const data = await rec.json();
      const item = data?.items?.[0]?.track;
      if (item) return res.status(200).json(shapeTrack(item, false));
    }
    return res.status(200).json({ status: "ok", isPlaying: false, title: null });
  } catch (e) {
    return res.status(200).json({ status: "error", error: String(e?.message || e) });
  }
}
