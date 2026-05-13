#!/usr/bin/env node
// One-shot Spotify OAuth helper. Run once, copy the printed refresh token into
// Vercel env vars, never run again.
//
// Usage:
//   SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/spotify-auth.js
//
// What this does:
//   1. Spins up a tiny local HTTP server on 127.0.0.1:8888.
//   2. Opens your browser to Spotify's authorize page.
//   3. After you click Agree, Spotify redirects back to /callback with a code.
//   4. We exchange the code for a refresh_token and print it to your terminal.
//
// Prereqs (done once on developer.spotify.com):
//   - Create an app at https://developer.spotify.com/dashboard
//   - Add redirect URI:  http://127.0.0.1:8888/callback
//   - Grab Client ID + Client Secret from the app's Settings page

import http from "node:http";
import { exec } from "node:child_process";

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPE = "user-read-currently-playing user-read-recently-played";

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the env first:");
  console.error("  SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node scripts/spotify-auth.js");
  process.exit(1);
}

const authUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    show_dialog: "true",
  }).toString();

const openInBrowser = (url) => {
  const cmd =
    process.platform === "darwin" ? `open "${url}"` :
    process.platform === "win32"  ? `start "" "${url}"` :
                                    `xdg-open "${url}"`;
  exec(cmd);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404);
    return res.end("not found");
  }
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400);
    return res.end("missing code parameter");
  }

  // Exchange code → tokens
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  let json;
  try {
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });
    json = await r.json();
  } catch (e) {
    res.writeHead(500);
    res.end("Token exchange failed: " + e.message);
    return;
  }

  if (!json.refresh_token) {
    console.error("\nNo refresh_token in response:\n", json);
    res.writeHead(500);
    res.end("No refresh_token. Check your terminal.");
    server.close();
    return;
  }

  console.log("\n  ✓ Got refresh token.\n");
  console.log("  Set these in Vercel env vars (all environments):\n");
  console.log(`    SPOTIFY_CLIENT_ID     = ${CLIENT_ID}`);
  console.log(`    SPOTIFY_CLIENT_SECRET = ${CLIENT_SECRET}`);
  console.log(`    SPOTIFY_REFRESH_TOKEN = ${json.refresh_token}\n`);
  console.log("  Easiest way: paste them at\n    https://vercel.com/didriks-vault/didrik-blog/settings/environment-variables\n");
  console.log("  Then redeploy: git push (any commit), or `npx vercel --prod`.\n");

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<html><body style="font:16px system-ui;background:#1a1622;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>✓ Done.</h1><p>Refresh token printed in your terminal.</p><p style="opacity:.6;font-size:13px">You can close this tab.</p></div></body></html>`);
  setTimeout(() => server.close(), 800);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  → Opening Spotify authorize page in your browser…`);
  console.log(`     (if it doesn't open, paste this URL manually:)\n     ${authUrl}\n`);
  openInBrowser(authUrl);
});
