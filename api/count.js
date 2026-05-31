// Visitor counter. Each request bumps the `visits` key by 1 and returns the
// running total. Backed by Upstash Redis via Vercel's marketplace integration —
// Redis.fromEnv() reads KV_REST_API_URL + KV_REST_API_TOKEN that Vercel injects
// once the database is linked to the project.
//
// If the integration isn't set up yet (env vars missing), the endpoint returns
// { count: null, status: "unconfigured" } so the frontend can fail silently.
import { Redis } from "@upstash/redis";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(200).json({ count: null, status: "unconfigured" });
  }

  try {
    const redis = Redis.fromEnv();
    const count = await redis.incr("visits");
    return res.status(200).json({ count, status: "ok" });
  } catch (e) {
    return res.status(200).json({ count: null, status: "error", message: String(e?.message || e) });
  }
}
