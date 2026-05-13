// Shared helpers for the Spotify serverless endpoints.
// Keeping this in `_underscore-prefixed` form so Vercel doesn't treat it as
// its own route (Vercel ignores files whose first character isn't a letter
// when generating function routes, and `_` qualifies).

const TOKEN_URL = "https://accounts.spotify.com/api/token";

// Exchanges the long-lived refresh token for a short-lived access token.
// Returns { token } on success, or { error, detail } on any failure so the
// caller can surface a useful message to the frontend.
export async function getAccessToken() {
  const id      = process.env.SPOTIFY_CLIENT_ID;
  const secret  = process.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN;
  if (!id)      return { error: "missing-env", detail: "SPOTIFY_CLIENT_ID is not set." };
  if (!secret)  return { error: "missing-env", detail: "SPOTIFY_CLIENT_SECRET is not set." };
  if (!refresh) return { error: "missing-env", detail: "SPOTIFY_REFRESH_TOKEN is not set." };

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
    }).toString(),
  });
  const text = await r.text();
  if (!r.ok) return { error: "token-refresh-failed", status: r.status, body: text.slice(0, 400) };
  try {
    const json = JSON.parse(text);
    if (!json.access_token) return { error: "no-access-token", body: text.slice(0, 400) };
    return { token: json.access_token };
  } catch (_) {
    return { error: "token-parse-failed", body: text.slice(0, 400) };
  }
}

// Standard shape for an individual track item. Keeps the frontend dumb.
export function shapeTrack(item) {
  if (!item) return null;
  return {
    title: item.name,
    artist: (item.artists || []).map((a) => a.name).join(", "),
    album: item.album?.name || "",
    albumArt: item.album?.images?.[0]?.url || null,
    url: item.external_urls?.spotify || null,
  };
}
