import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ---------- DATA ----------
// Item shapes:
//   { id, title, subtitle, body }                       → opens a content panel
//   { id, title, subtitle, href }                       → opens an external link in a new tab
//   { id, title, subtitle, body: "skate-edit", youtube }→ skate edit (video embed)
//   { id, title, subtitle, body: "film-roll", slug, count, meta } → film roll gallery
//
// HOW TO ADD A NEW PHOTO ROLL:
//   1. Put scans in /img/<slug>/ as 01.jpg, 02.jpg, ... NN.jpg (zero-padded).
//   2. Add a new entry below with that slug and count.
//   3. Run `cd ~/didrik-site && npx vercel --prod`.
//
// HOW TO ADD A LOGBOOK ENTRY: scroll down to LOG_ENTRIES.
const CATEGORIES = [
  {
    id: "about",
    label: "About",
    icon: "user",
    items: [
      { id: "about-me", title: "About Didrik", subtitle: "23 · bergen / berlin", body: "about" },
      { id: "now", title: "Now", subtitle: "Summer 2026", body: "now" },
    ],
  },
  {
    id: "skate",
    label: "Skate",
    icon: "skate",
    items: [
      {
        id: "sk-everyday", title: "EVERYDAY", subtitle: "Views Limited · Bergen 2023",
        body: "skate-edit", youtube: "iJQ_2I1RRo4",
        credits: {
          film: "Georg Nuttall",
          cast: ["Amund Jonsson", "Didrik", "Povilas Jucys", "Sander Systad", "August Hågøy", "Elias Heitmann", "Hauk Vangen", "Oliver Nuttall"],
          additional: ["Herman Bucher", "Frank Williams Kayasman", "Andreas Ottesen", "Victor Dale", "Truls Knarvik", "Kristoffer Kaald", "Dovydas Jucys", "Mikolaj Wilczak", "Håvard Helleland", "Jonas Bang"],
          location: "Bergen, 2023",
        },
      },
      {
        id: "sk-paristokyo", title: "PARIS TOKYO", subtitle: "Views Limited · Bergen 2022",
        body: "skate-edit", youtube: "XAoQOppZdf8",
        credits: {
          film: "Georg Nuttall (filmed & edited)",
          cast: ["August Hågøy", "Jonas Bang", "Didrik"],
          music: "Tim Hecker · John Glacier",
          location: "Bergen, 2022",
        },
      },
      {
        id: "sk-who", title: "WHO?", subtitle: "Views Limited · Bergen 2021",
        body: "skate-edit", youtube: "_zNDGDopFQI",
        credits: {
          film: "Georg Nuttall",
          cast: ["Amund Jonsson", "Povilas Jucys", "Sean Stephenson", "Didrik", "August Hågøy", "Jonas Bang", "Herman Bucher", "Andreas Ottesen", "Sander Systad", "Oliver Nuttall", "Elias Heitmann"],
          location: "Bergen, 2021",
        },
      },
    ],
  },
  {
    id: "pictures",
    label: "Pictures",
    icon: "image",
    items: [
      // slug → folder name under public/img/. count → number of images there.
      // Add new sets by dropping images named 01.jpg, 02.jpg, ... into a new
      // folder and prepending a new entry here.
      { id: "p-japan", title: "Japan", subtitle: "Fuji Rensha · Fuji · 2024", body: "film-roll",
        slug: "roll-01", count: 6, meta: { camera: "Fuji Rensha", stock: "Fuji", date: "Japan, 2024" } },
    ],
  },
  {
    id: "sounds",
    label: "Sounds",
    icon: "note",
    items: [
      // All three pulled live from Spotify. Setup once with scripts/spotify-auth.js.
      { id: "now-playing",     title: "Now Playing",     subtitle: "Live from Spotify",  body: "now-playing" },
      { id: "on-rotation",     title: "On Rotation",     subtitle: "Top tracks · 4 weeks", body: "on-rotation" },
      { id: "recently-played", title: "Recently Played", subtitle: "Last 10",            body: "recently-played" },
    ],
  },
  {
    id: "logbook",
    label: "Logbook",
    icon: "doc",
    items: [
      // Logbook items are read-only views into LOG_ENTRIES below — you don't need
      // to touch this list when you write a new entry, just add to LOG_ENTRIES.
      { id: "log-recent",  title: "Recent",      subtitle: "Last few weeks", body: "log-view", range: "recent" },
      { id: "log-2026",    title: "2026",        subtitle: "This year",      body: "log-view", range: "2026" },
      { id: "log-archive", title: "Archive",     subtitle: "Everything",     body: "log-view", range: "all" },
    ],
  },
  {
    id: "links",
    label: "Links",
    icon: "link",
    items: [
      { id: "ig", title: "Instagram", subtitle: "@didrikln", href: "https://instagram.com/didrikln/" },
    ],
  },
];

// ---------- LOGBOOK ENTRIES ----------
// To add an entry: copy the example block, change date + body, paste at the
// top of the array. Body can be a JSX fragment (use <p>, <ul>, <em>, <code>,
// <a> etc.) or just a string for short one-liners. Dates are sorted
// newest-first automatically.
//
// Example shape:
//   {
//     date: "2026-05-12",
//     body: <><p>Skated Operaen. Light was good.</p></>,
//   },
const LOG_ENTRIES = [];

// ---------- ICONS (original glyphs) ----------
function Icon({ name, size = 64 }) {
  const stroke = "rgba(255,255,255,0.92)";
  const fill = "rgba(255,255,255,0.10)";
  const common = { width: size, height: size, viewBox: "0 0 64 64", fill: "none", stroke, strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "user":
      return (
        <svg {...common}>
          <circle cx="32" cy="24" r="9" fill={fill} />
          <path d="M14 52c2-9 10-14 18-14s16 5 18 14" fill={fill} />
        </svg>
      );
    case "doc":
      return (
        <svg {...common}>
          <path d="M18 10h20l10 10v34H18z" fill={fill} />
          <path d="M38 10v10h10" />
          <path d="M24 30h16M24 38h16M24 46h10" />
        </svg>
      );
    case "cube":
      return (
        <svg {...common}>
          <path d="M32 8 54 20v24L32 56 10 44V20z" fill={fill} />
          <path d="M32 8v24M32 32 10 20M32 32l22-12" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="10" y="14" width="44" height="36" rx="2" fill={fill} />
          <circle cx="22" cy="26" r="3.5" />
          <path d="m14 46 12-12 10 10 6-6 8 8" />
        </svg>
      );
    case "note":
      return (
        <svg {...common}>
          <path d="M26 46V14l22-4v32" fill={fill} />
          <circle cx="22" cy="46" r="5" fill={fill} />
          <circle cx="44" cy="42" r="5" fill={fill} />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="M28 36c-4-4-4-10 0-14l6-6c4-4 10-4 14 0s4 10 0 14l-4 4" fill={fill} />
          <path d="M36 28c4 4 4 10 0 14l-6 6c-4 4-10 4-14 0s-4-10 0-14l4-4" fill={fill} />
        </svg>
      );
    case "skate":
      // Skateboard truck, front view: kingpin nut on top, wide hanger across
      // the middle with axle stubs poking out the ends, baseplate trapezoid +
      // pivot bushing underneath.
      return (
        <svg {...common}>
          {/* kingpin nut */}
          <circle cx="32" cy="19" r="2.2" fill={fill} />
          {/* hanger — long pill with a gentle dip on top where the kingpin sits */}
          <path d="M8 30 C8 26 13 24 19 25 C24 26 28 24 32 24 C36 24 40 26 45 25 C51 24 56 26 56 30 C56 34 51 36 45 35 L19 35 C13 36 8 34 8 30 Z" fill={fill} />
          {/* axle stubs */}
          <line x1="2" y1="30" x2="8" y2="30" />
          <line x1="56" y1="30" x2="62" y2="30" />
          {/* axle-end nuts */}
          <circle cx="3" cy="30" r="1.4" fill={fill} />
          <circle cx="61" cy="30" r="1.4" fill={fill} />
          {/* baseplate trapezoid below the hanger */}
          <path d="M26 36 L38 36 L36 46 L28 46 Z" fill={fill} />
          {/* pivot bushing */}
          <rect x="28" y="46" width="8" height="3" rx="1" fill={fill} />
        </svg>
      );
    case "pin":
      // Classic map pin droplet with a smaller circle inside.
      return (
        <svg {...common}>
          <path d="M32 8c-9 0-16 7-16 16 0 12 16 32 16 32s16-20 16-32c0-9-7-16-16-16z" fill={fill} />
          <circle cx="32" cy="24" r="6" />
        </svg>
      );
    default:
      return <svg {...common}><circle cx="32" cy="32" r="14" fill={fill} /></svg>;
  }
}

// Smaller item-icon variant
function ItemIcon({ category, size = 36 }) {
  return <Icon name={CATEGORIES.find(c => c.id === category)?.icon || "doc"} size={size} />;
}

// ---------- BACKGROUND WAVE ----------
// Gauzy, multi-layered ribbon that drifts horizontally. The path is intentionally
// wider than the viewBox so translate() reveals new sections as the wave flows.
const RIBBON_PATHS = [
  "M-1200,640 C-600,540 0,760 600,560 C1200,360 1800,720 2400,540 C3000,380 3600,640 4200,520",
  "M-1200,660 C-500,520 100,800 700,540 C1300,340 1900,740 2500,520 C3100,360 3700,660 4200,510",
  "M-1200,630 C-700,560 -100,750 500,580 C1100,400 1700,700 2300,560 C2900,400 3500,620 4200,540",
  "M-1200,670 C-650,540 -50,790 550,560 C1150,360 1750,760 2350,540 C2950,380 3550,660 4200,520",
  "M-1200,645 C-580,545 20,765 620,555 C1220,355 1820,725 2420,535 C3020,375 3620,635 4200,515",
];

function WaveBackground({ hue, wave, particles }) {
  const grad = `linear-gradient(160deg,
    oklch(0.16 0.10 ${hue}) 0%,
    oklch(0.22 0.13 ${hue + 6}) 45%,
    oklch(0.32 0.11 ${hue + 14}) 100%)`;
  return (
    <div className="bg-wrap" aria-hidden="true">
      <div className="bg-grad" style={{ background: grad }} />
      <div className="bg-glow" />
      <svg className="wave" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ribbonFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="10%" stopColor="rgba(220,235,255,0.45)" />
            <stop offset="35%" stopColor="rgba(235,245,255,0.95)" />
            <stop offset="65%" stopColor="rgba(220,235,255,0.85)" />
            <stop offset="90%" stopColor="rgba(200,220,255,0.30)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id="blur-xl" x="-5%" y="-50%" width="110%" height="200%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="blur-md" x="-5%" y="-50%" width="110%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="blur-sm" x="-5%" y="-50%" width="110%" height="200%">
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>
        <g style={{ opacity: wave }} className="ribbon-stack">
          {/* Wide, very soft halo layer */}
          <path className="ribbon ribbon-halo" d={RIBBON_PATHS[0]}
            stroke="url(#ribbonFade)" strokeWidth="70" fill="none"
            opacity="0.10" filter="url(#blur-xl)" />
          {/* Mid gauze */}
          <path className="ribbon ribbon-mid-a" d={RIBBON_PATHS[1]}
            stroke="url(#ribbonFade)" strokeWidth="34" fill="none"
            opacity="0.18" filter="url(#blur-md)" />
          <path className="ribbon ribbon-mid-b" d={RIBBON_PATHS[2]}
            stroke="url(#ribbonFade)" strokeWidth="22" fill="none"
            opacity="0.22" filter="url(#blur-md)" />
          {/* Inner sheer ribbons */}
          <path className="ribbon ribbon-inner-a" d={RIBBON_PATHS[3]}
            stroke="url(#ribbonFade)" strokeWidth="9" fill="none"
            opacity="0.45" filter="url(#blur-sm)" />
          <path className="ribbon ribbon-inner-b" d={RIBBON_PATHS[4]}
            stroke="url(#ribbonFade)" strokeWidth="4" fill="none"
            opacity="0.65" />
          {/* Hairline highlight */}
          <path className="ribbon ribbon-highlight" d={RIBBON_PATHS[1]}
            stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" fill="none"
            opacity="0.55" />
        </g>
      </svg>
      {particles && <ParticleField wave={wave} />}
    </div>
  );
}

// Particles riding along the wave path. Most cluster within a horizontal band
// around y≈55%, with a sparse upper layer for atmosphere.
function ParticleField({ wave }) {
  const particles = useMemo(() => {
    const arr = [];
    const N = 140;
    for (let i = 0; i < N; i++) {
      const inBand = i % 4 !== 0;
      const seed = i * 9301 + 49297;
      const r1 = ((seed % 233280) / 233280);
      const r2 = (((seed * 7) % 233280) / 233280);
      const r3 = (((seed * 13) % 233280) / 233280);
      const x = r1 * 110 - 5;
      const y = inBand
        ? 40 + r2 * 28 + Math.sin(r1 * Math.PI * 2) * 6
        : r2 * 100;
      const size = 1 + (i % 5) * 0.35 + (inBand ? 0.4 : 0);
      const duration = 18 + r3 * 26;
      const delay = -r1 * duration;
      const peak = (inBand ? 0.55 : 0.25) + r3 * 0.4;
      const twinkleDur = 4 + (i % 7) * 0.8;
      const twinkleDelay = -r2 * twinkleDur;
      const drift = 60 + r3 * 80;     // vertical bob amplitude px
      const variant = i % 3;
      arr.push({ x, y, size, duration, delay, peak, twinkleDur, twinkleDelay, drift, variant });
    }
    return arr;
  }, []);

  return (
    <div className="particles" style={{ opacity: wave }}>
      {particles.map((p, i) => (
        <span key={i} className={`particle p-v${p.variant}`} style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          ["--peak"]: p.peak,
          ["--dur"]: `${p.duration}s`,
          ["--delay"]: `${p.delay}s`,
          ["--tdur"]: `${p.twinkleDur}s`,
          ["--tdelay"]: `${p.twinkleDelay}s`,
          ["--bob"]: `${p.drift}px`,
        }} />
      ))}
    </div>
  );
}

// ---------- CLOCK ----------
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15 * 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// Tiny analog clock for the status bar. Same monoline aesthetic as the rest of
// the icon set. Hands are drawn with simple trig — hour hand sweeps 1/12 of
// the way around for every hour (plus the fractional offset from minutes),
// minute hand sweeps 1/60 per minute.
function AnalogClock({ size = 16, hour, minute }) {
  const hourDeg   = ((hour % 12) + minute / 60) * 30;
  const minuteDeg = minute * 6;
  const polar = (deg, r) => {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: 12 + r * Math.cos(rad), y: 12 + r * Math.sin(rad) };
  };
  const h = polar(hourDeg, 4.2);
  const m = polar(minuteDeg, 6.6);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
      className="sb-clock"
    >
      <circle cx="12" cy="12" r="9.5" strokeWidth="1.2" />
      <line x1="12" y1="12" x2={h.x} y2={h.y} strokeWidth="1.6" />
      <line x1="12" y1="12" x2={m.x} y2={m.y} strokeWidth="1.1" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Top-right pill: analog clock + date + 24-hour time. Dims (along with the
// XMB) when a content panel is open.
function StatusBar({ open }) {
  const now = useClock();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const date = `${now.getDate()}/${now.getMonth() + 1}`;
  return (
    <div className={`statusbar ${open ? "is-dim" : ""}`}>
      <AnalogClock hour={now.getHours()} minute={now.getMinutes()} />
      <span className="sb-datetime">{date} {time}</span>
    </div>
  );
}

// ---------- XMB NAV ----------
// Mobile shrinks columns so all categories fit on one screen — same feel as
// desktop where you can see the whole row at a glance.
function useColWidth() {
  const get = () => (typeof window !== "undefined" && window.innerWidth < 600 ? 76 : 200);
  const [w, setW] = useState(get);
  useEffect(() => {
    const onResize = () => setW(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

// Inline replacement for the static "Now Playing" XMB item. Swaps the music
// icon for the live album art and the title/sub for track/artist. An eyebrow
// line above the title spells out "Currently playing on Spotify" or "Last
// played on Spotify" so visitors know what they're looking at.
function NowPlayingMenuItem({ data, active, onClick }) {
  const hasLive = data?.status === "ok" && data?.title;
  const eyebrow = !hasLive
    ? "From Spotify"
    : data.isPlaying
      ? "Currently playing on Spotify"
      : "Last played on Spotify";
  return (
    <button
      key="now-playing"
      type="button"
      className={`xmb-item np-item ${active ? "is-active" : ""}`}
      onClick={onClick}
      tabIndex={-1}
    >
      <div className="xmb-item-icon np-item-icon">
        {hasLive && data.albumArt ? (
          <img className="np-item-art" src={data.albumArt} alt="" loading="lazy" />
        ) : (
          <Icon name="note" size={36} />
        )}
        {hasLive && data.isPlaying && <span className="np-item-dot" aria-hidden="true" />}
      </div>
      <div className="xmb-item-text">
        <div className={`np-item-eyebrow ${hasLive && data.isPlaying ? "is-live" : ""}`}>{eyebrow}</div>
        <div className="xmb-item-title">{hasLive ? data.title : "Now Playing"}</div>
        <div className="xmb-item-sub">{hasLive ? data.artist : "Live from Spotify"}</div>
      </div>
    </button>
  );
}

function XMB({ catIdx, itemIdx, onSelectCat, onSelectItem, onOpen, nowPlaying }) {
  const colWidth = useColWidth();
  // 50vw (viewport center) instead of 50% (row's own center) — the row's
  // intrinsic width is N × colWidth which doesn't equal the viewport on phones,
  // so the old math pushed the active column hard to the right on small screens.
  return (
    <div className="xmb">
      <div
        className="xmb-row"
        style={{ transform: `translateX(calc(50vw - ${catIdx * colWidth + colWidth / 2}px))` }}
      >
        {CATEGORIES.map((cat, ci) => {
          const active = ci === catIdx;
          return (
            <div key={cat.id} className={`xmb-col ${active ? "is-active" : ""}`} style={{ width: colWidth }}>
              <button className="xmb-cat" onClick={() => onSelectCat(ci)}>
                <div className="xmb-icon-wrap">
                  <Icon name={cat.icon} size={64} />
                </div>
                <div className="xmb-cat-label">{cat.label}</div>
              </button>
              <div className="xmb-items">
                {cat.items.map((item, ii) => {
                  const itemActive = active && ii === itemIdx;
                  const click = () => { onSelectItem(ci, ii); onOpen(item); };

                  // The now-playing item renders live Spotify data instead of
                  // a static icon/title/sub. Same click behavior as other items.
                  if (item.id === "now-playing") {
                    return <NowPlayingMenuItem key={item.id} data={nowPlaying} active={itemActive} onClick={click} />;
                  }

                  return (
                    <button
                      key={item.id}
                      className={`xmb-item ${itemActive ? "is-active" : ""}`}
                      onClick={click}
                      tabIndex={-1}
                    >
                      <div className="xmb-item-icon">
                        <ItemIcon category={cat.id} size={36} />
                      </div>
                      <div className="xmb-item-text">
                        <div className="xmb-item-title">
                          {item.title}
                          {item.href && <span className="xmb-item-ext" aria-hidden="true">↗</span>}
                        </div>
                        <div className="xmb-item-sub">{item.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- CONTENT PANELS ----------
function Placeholder({ label, height = 220 }) {
  return (
    <div className="placeholder" style={{ height }}>
      <div className="placeholder-stripes" />
      <div className="placeholder-label">{label}</div>
    </div>
  );
}

// Lazy-loaded video embed. Until the user actually clicks play, we just show
// the YouTube thumbnail with a play overlay — no iframe, no ~200KB player
// shell, no analytics requests. Click swaps in the iframe with autoplay=1.
function VideoEmbed({ youtube, vimeo, label }) {
  const [loaded, setLoaded] = useState(false);
  if (!youtube && !vimeo) {
    return <Placeholder label={label || "video — paste a YouTube/Vimeo ID into the data"} height={380} />;
  }
  if (loaded) {
    const src = youtube
      ? `https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1`
      : `https://player.vimeo.com/video/${vimeo}?autoplay=1`;
    return (
      <div className="video-frame">
        <iframe
          src={src}
          title={label || "video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  const thumb = youtube ? `https://i.ytimg.com/vi/${youtube}/hqdefault.jpg` : null;
  return (
    <button
      type="button"
      className="video-frame video-poster"
      aria-label={`Play ${label || 'video'}`}
      onClick={() => setLoaded(true)}
    >
      {thumb && <img src={thumb} alt="" loading="lazy" />}
      <span className="video-play" aria-hidden="true">▶</span>
    </button>
  );
}

// Tiny shared hook used by both the chip and the panel. Polls /api/now-playing
// every 30s. The endpoint is edge-cached for 15s so concurrent pollers don't
// hammer Spotify — they share the cached response.
function useNowPlaying() {
  const [data, setData] = useState({ status: "loading" });
  useEffect(() => {
    let alive = true;
    const fetchOnce = async () => {
      try {
        const r = await fetch("/api/now-playing", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        if (alive) setData(json);
      } catch (e) {
        if (alive) setData({ status: "error", error: String(e?.message || e) });
      }
    };
    fetchOnce();
    const t = setInterval(fetchOnce, 30 * 1000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return data;
}

// Generic hook for any Spotify endpoint that returns { status, tracks }.
function useTrackList(endpoint, interval = 5 * 60 * 1000) {
  const [data, setData] = useState({ status: "loading" });
  useEffect(() => {
    let alive = true;
    const fetchOnce = async () => {
      try {
        const r = await fetch(endpoint, { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        if (alive) setData(json);
      } catch (e) {
        if (alive) setData({ status: "error", error: String(e?.message || e) });
      }
    };
    fetchOnce();
    const t = setInterval(fetchOnce, interval);
    return () => { alive = false; clearInterval(t); };
  }, [endpoint, interval]);
  return data;
}

// Shared renderer for any "list of tracks" panel — keeps On Rotation and
// Recently Played visually identical, just fed by different endpoints.
function TrackList({ data, emptyText }) {
  if (data.status === "loading") return <article><p className="lead">Checking the turntable…</p></article>;
  if (data.status === "needs-scope") {
    return (
      <article>
        <p className="lead">Needs a re-auth.</p>
        <p>Run <code>node scripts/spotify-auth.js</code> again with the new <code>user-top-read</code> scope, then update <code>SPOTIFY_REFRESH_TOKEN</code> in Vercel.</p>
      </article>
    );
  }
  if (data.status === "unconfigured") {
    return <article><p className="lead">Spotify isn't connected yet.</p></article>;
  }
  if (data.status !== "ok" || !data.tracks?.length) {
    return <article><p className="lead">{emptyText || "Nothing here yet."}</p></article>;
  }
  return (
    <article>
      <ol className="sp-list">
        {data.tracks.map((t, i) => (
          <li key={`${t.url || t.title}-${i}`}>
            <span className="sp-num">{String(i + 1).padStart(2, "0")}</span>
            {t.albumArt && (
              <a href={t.url} target="_blank" rel="noreferrer" className="sp-art-link" aria-label={t.title}>
                <img className="sp-art" src={t.albumArt} alt="" loading="lazy" />
              </a>
            )}
            <div className="sp-text">
              <a href={t.url} target="_blank" rel="noreferrer" className="sp-title">{t.title}</a>
              <div className="sp-meta">{t.artist}{t.album ? ` · ${t.album}` : ""}</div>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

function OnRotation() {
  const data = useTrackList("/api/top-tracks");
  return <TrackList data={data} emptyText="Not enough listening data yet." />;
}

function RecentlyPlayed() {
  const data = useTrackList("/api/recently-played", 60 * 1000);
  return <TrackList data={data} emptyText="No recent activity." />;
}

// Live Spotify "Now Playing" widget — full panel view. Uses the same hook as
// the inline XMB item; the API's edge cache keeps both pollers cheap.
function NowPlaying() {
  const data = useNowPlaying();

  if (data.status === "loading") {
    return <article><p className="lead">Checking the turntable…</p></article>;
  }
  if (data.status === "unconfigured") {
    return (
      <article>
        <p className="lead">Spotify isn't connected yet.</p>
        <p>Run <code>node scripts/spotify-auth.js</code> from the repo, then set <code>SPOTIFY_CLIENT_ID</code>, <code>SPOTIFY_CLIENT_SECRET</code>, and <code>SPOTIFY_REFRESH_TOKEN</code> in Vercel env vars and redeploy.</p>
      </article>
    );
  }
  if (data.status === "error" || !data.title) {
    return <article><p className="lead">Quiet right now.</p></article>;
  }
  return (
    <article className="np">
      <div className="np-eyebrow">{data.isPlaying ? "Now playing" : "Last played"}</div>
      <div className="np-row">
        {data.albumArt && (
          <a href={data.url} target="_blank" rel="noreferrer" className="np-art-link" aria-label={`Open ${data.title} in Spotify`}>
            <img className="np-art" src={data.albumArt} alt="" loading="lazy" />
          </a>
        )}
        <div className="np-text">
          <a href={data.url} target="_blank" rel="noreferrer" className="np-title">{data.title}</a>
          <div className="np-artist">{data.artist}</div>
          {data.album && <div className="np-album">{data.album}</div>}
        </div>
      </div>
    </article>
  );
}

// Google My Maps embed. To create one:
//   1. Go to mymaps.google.com → Create a new map.
//   2. Drop pins for each spot. Click a pin to add notes + photos.
//   3. Share → "Public on the web" → Embed on my site → copy the iframe src.
//   4. Paste that URL into the item's `mapSrc` field.
function MapEmbed({ src, label }) {
  if (!src) {
    return (
      <div className="map-empty">
        <Placeholder label={label || "map — paste a Google My Maps embed URL into the data"} height={360} />
        <p className="caption small">Make a map at <em>mymaps.google.com</em>, then Share → Embed on my site → paste the <code>src</code> URL into the <code>mapSrc</code> field for this spot.</p>
      </div>
    );
  }
  return (
    <div className="map-frame">
      <iframe src={src} title={label || "spots map"} loading="lazy" />
    </div>
  );
}

function ContentBody({ kind, item }) {
  switch (kind) {
    case "about":
      return (
        <article>
          <p className="lead">Didrik, 23 — bergen / berlin based.</p>
          <p>A personal archive. Current, past, and future interests, updated whenever.</p>
        </article>
      );
    case "now":
      return (
        <article>
          <p className="lead">Interning in Bergen &amp; Gothenburg.</p>
          <h2>Goal for the summer</h2>
          <ul>
            <li>Swim in the ocean as much as possible.</li>
            <li>Grill as much as possible.</li>
            <li>Meet up with the homies as much as possible.</li>
          </ul>
        </article>
      );

    // ---------- SKATE EDITS ----------
    // One panel for any skate-edit item. Pulls video ID + credits from `item`.
    case "skate-edit": {
      const c = item?.credits || {};
      return (
        <article>
          <VideoEmbed youtube={item?.youtube} label={item?.title} />
          <dl className="contact-list">
            {c.film       && (<><dt>Film by</dt><dd>{c.film}</dd></>)}
            {c.cast       && (<><dt>Featuring</dt><dd>{c.cast.join(", ")}</dd></>)}
            {c.additional && (<><dt>Additional</dt><dd>{c.additional.join(", ")}</dd></>)}
            {c.music      && (<><dt>Music</dt><dd>{c.music}</dd></>)}
            {c.location   && (<><dt>Location</dt><dd>{c.location}</dd></>)}
          </dl>
          <p>
            Released by <a href="https://www.viewslimited.com" target="_blank" rel="noreferrer">Views Limited</a>.
            {item?.youtube && <> Also on <a href={`https://www.youtube.com/watch?v=${item.youtube}`} target="_blank" rel="noreferrer">YouTube ↗</a>.</>}
          </p>
        </article>
      );
    }

    // ---------- FILM ROLLS ----------
    case "film-roll": {
      const slug = item?.slug;
      const count = item?.count || 0;
      const meta = item?.meta || {};
      if (count === 0) {
        return (
          <article>
            <p className="lead">No scans uploaded yet.</p>
            <div className="photo-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <Placeholder key={i} label={`scan ${String(i + 1).padStart(2, "0")}`} height={150} />
              ))}
            </div>
            <p className="caption small">
              Drop scans in <code>/img/{slug}/</code> as <code>01.jpg</code>, <code>02.jpg</code>, … then bump <code>count</code> in the data and redeploy.
            </p>
          </article>
        );
      }
      return (
        <article>
          <div className="photo-grid">
            {Array.from({ length: count }).map((_, i) => {
              const file = `${String(i + 1).padStart(2, "0")}.jpg`;
              return (
                <a key={i} href={`/img/${slug}/${file}`} target="_blank" rel="noreferrer" className="film-scan-link">
                  <img src={`/img/${slug}/${file}`} alt={`${item.title} – scan ${i + 1}`} className="film-scan" loading="lazy" />
                </a>
              );
            })}
          </div>
          <p className="caption">{meta.camera} · {meta.stock} · {meta.date}</p>
        </article>
      );
    }

    // ---------- SOUNDS ----------
    case "now-playing":     return <NowPlaying />;
    case "on-rotation":     return <OnRotation />;
    case "recently-played": return <RecentlyPlayed />;

    // ---------- LOGBOOK ----------
    case "log-view": {
      const range = item?.range || "recent";
      const sorted = [...LOG_ENTRIES].sort((a, b) => (a.date < b.date ? 1 : -1));
      const now = new Date();
      const filtered = sorted.filter((e) => {
        if (range === "all") return true;
        if (range === "recent") {
          const cutoff = new Date(now);
          cutoff.setDate(cutoff.getDate() - 42); // ~6 weeks
          return new Date(e.date) >= cutoff;
        }
        if (/^\d{4}$/.test(range)) return e.date.startsWith(range);
        return true;
      });
      if (filtered.length === 0) {
        return (
          <article>
            <p className="lead">Pending.</p>
            <p>Updated when there's something worth saving.</p>
          </article>
        );
      }
      return (
        <article className="log-list">
          {filtered.map((e) => (
            <section key={e.date} className="log-entry">
              <h2 className="log-date">{formatLogDate(e.date)}</h2>
              <div className="log-body">{e.body}</div>
            </section>
          ))}
        </article>
      );
    }

    default:
      return <article><p>Coming soon.</p></article>;
  }
}

// "2026-05-11" → "Mon 11 May 2026". Locale-stable, no surprises on other browsers.
function formatLogDate(iso) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// Card tilt — max rotation in degrees. Keep low; this should read as "the
// card is sitting on a surface" not "the card is on a swivel".
const TILT_MAX = 1.6;

function ContentPanel({ open, item, onClose }) {
  const innerRef = useRef(null);
  // Only run the parallax on devices with a real cursor. Touch devices fire
  // mousemove on tap in some browsers and the tilt looks jarring there.
  const canTilt = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    []
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset tilt whenever the card content changes (key change re-mounts the
  // node and the cpRise animation runs fresh).
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.setProperty("--tx", "0deg");
    el.style.setProperty("--ty", "0deg");
  }, [item?.id]);

  const onPointerMove = (e) => {
    if (!canTilt) return;
    const el = innerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Normalize cursor pos to -1..1 relative to card center, clamped so cursor
    // outside the card doesn't overshoot.
    const nx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
    const ny = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
    const cx = Math.max(-1, Math.min(1, nx));
    const cy = Math.max(-1, Math.min(1, ny));
    // rotateX is inverted: cursor above center → top of card tilts back.
    el.style.setProperty("--tx", `${(-cy * TILT_MAX).toFixed(2)}deg`);
    el.style.setProperty("--ty", `${( cx * TILT_MAX).toFixed(2)}deg`);
  };

  const onPointerLeave = () => {
    if (!canTilt) return;
    const el = innerRef.current;
    if (!el) return;
    el.style.setProperty("--tx", "0deg");
    el.style.setProperty("--ty", "0deg");
  };

  return (
    <div className={`content-panel ${open ? "is-open" : ""}`}
         onMouseMove={onPointerMove}
         onMouseLeave={onPointerLeave}>
      <div ref={innerRef} className="cp-inner" key={item?.id || "empty"}>
        {item && (
          <>
            <header className="cp-head">
              <div className="cp-eyebrow">{CATEGORIES.find(c => c.items.some(i => i.id === item.id))?.label}</div>
              <h1 className="cp-title">{item.title}</h1>
              <div className="cp-sub">{item.subtitle}</div>
            </header>
            <div className="cp-body">
              <ContentBody kind={item.body} item={item} />
            </div>
            <footer className="cp-foot">
              <button className="cp-back" onClick={onClose}>
                <span className="cp-back-glyph">◁</span>
                <span>Back</span>
              </button>
              <div className="cp-hint">esc · ⌫</div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- HINTS ----------
function Hints({ open }) {
  if (open) return null;
  return (
    <div className="hints">
      <div className="hint"><kbd>◁</kbd><kbd>▷</kbd><span>category</span></div>
      <div className="hint"><kbd>△</kbd><kbd>▽</kbd><span>item</span></div>
      <div className="hint"><kbd>⏎</kbd><span>open</span></div>
    </div>
  );
}

// One-shot pill that appears on touch devices after the splash, then auto-
// dismisses. We persist the dismissal in localStorage so returning visitors
// don't see it again. Coarse-pointer media query keeps it off mouse setups
// even if you're using a small viewport (devtools, etc.).
function TouchHint() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let showT, hideT;
    try {
      if (localStorage.getItem('th-seen')) return undefined;
      if (!matchMedia('(hover: none) and (pointer: coarse)').matches) return undefined;
    } catch (_) { return undefined; }
    // Wait for the boot animation to finish before piling on UI.
    showT = setTimeout(() => setVisible(true), 5400);
    hideT = setTimeout(() => {
      setVisible(false);
      try { localStorage.setItem('th-seen', '1'); } catch (_) {}
    }, 5400 + 4500);
    return () => { clearTimeout(showT); clearTimeout(hideT); };
  }, []);
  if (!visible) return null;
  return (
    <div className="touch-hint" aria-hidden="true">
      <span className="th-arrows">◁ ▷ △ ▽</span>
      <span>swipe to navigate</span>
    </div>
  );
}

// ---------- APP ----------
// Display constants — used to be tweakable via the Tweaks panel; now baked in
// since the panel only ever activated inside the dev host, not the live site.
const HUE = 285;          // twilight purple
const WAVE_OPACITY = 0.95;
const PARTICLES_ON = true;

// Minimum touch distance to count as a swipe (px). Below this we treat the
// gesture as a tap and let the button's onClick fire normally.
const SWIPE_THRESHOLD = 40;
const SWIPE_MAX_DURATION = 700; // ms — anything slower than this is a drag, ignore

// Boot sequence:
//   black → bg (waves visible) → menu
// The title fade-in/hold/fade-out is owned by a CSS keyframe animation on
// .splash-title so it runs once from mount and can't double-fire from React.
const BOOT_TIMINGS = {
  bgReveal: 200,   // black overlay starts fading
  menuIn:   5000,  // title animation finished, reveal page
};

function useBootPhase() {
  const [phase, setPhase] = useState("black");
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase("bg"),   BOOT_TIMINGS.bgReveal),
      setTimeout(() => setPhase("menu"), BOOT_TIMINGS.menuIn),
    ];
    return () => t.forEach(clearTimeout);
  }, []);
  return phase;
}

function Splash({ phase }) {
  if (phase === "menu") return null;
  return (
    <div className={`splash splash-${phase}`} aria-hidden="true">
      <div className="splash-black" />
      <div className="splash-title">
        <span className="splash-title-name">Didrik</span>
        <span className="splash-title-thin">Archive</span>
        <div className="splash-title-rule" />
      </div>
    </div>
  );
}

function App() {
  const phase = useBootPhase();
  const menuReady = phase === "menu";

  const [catIdx, setCatIdx] = useState(1);
  const [itemIdx, setItemIdx] = useState(0);
  const [open, setOpen] = useState(false);

  const currentCat = CATEGORIES[catIdx];
  const currentItem = currentCat.items[Math.min(itemIdx, currentCat.items.length - 1)];

  // Shared Spotify state — both the XMB row (live item icon/title/sub) and
  // the content panel use this. One polling timer, one source of truth.
  const nowPlaying = useNowPlaying();

  // Items with `href` open externally; everything else opens the content panel.
  // The optional `itm` arg lets click handlers pass the freshly-clicked item
  // directly, avoiding a stale-closure race with the `currentItem` state.
  // Special case: now-playing opens the Spotify URL when we have one.
  const openItem = useCallback((itm) => {
    const target = itm || currentItem;
    if (target?.id === "now-playing" && nowPlaying?.status === "ok" && nowPlaying.url) {
      window.open(nowPlaying.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (target?.href) {
      window.open(target.href, "_blank", "noopener,noreferrer");
      return;
    }
    setOpen(true);
  }, [currentItem, nowPlaying]);


  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (open || !menuReady) return;
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCatIdx(i => Math.max(0, i - 1));
        setItemIdx(0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCatIdx(i => Math.min(CATEGORIES.length - 1, i + 1));
        setItemIdx(0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setItemIdx(i => Math.max(0, i - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setItemIdx(i => Math.min(CATEGORIES[catIdx].items.length - 1, i + 1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openItem();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [catIdx, open, menuReady, openItem]);

  // ---------- TOUCH / SWIPE NAV ----------
  // Horizontal swipe → switch category. Vertical swipe → switch item.
  // A tap (movement under SWIPE_THRESHOLD) falls through to the underlying
  // button's onClick, so the existing tap-to-select / tap-again-to-open works.
  const touchRef = useRef({ x: 0, y: 0, t: 0 });
  const onTouchStart = (e) => {
    if (!menuReady || open) return;
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e) => {
    if (!menuReady || open) return;
    const start = touchRef.current;
    if (!start.t) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.t;
    touchRef.current = { x: 0, y: 0, t: 0 };
    if (dt > SWIPE_MAX_DURATION) return;
    const absX = Math.abs(dx), absY = Math.abs(dy);
    if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) return; // tap
    if (absX > absY) {
      // Horizontal: swipe left → next category, swipe right → previous.
      if (dx < 0) setCatIdx(i => Math.min(CATEGORIES.length - 1, i + 1));
      else        setCatIdx(i => Math.max(0, i - 1));
      setItemIdx(0);
    } else {
      // Vertical: swipe up → next item, swipe down → previous.
      if (dy < 0) setItemIdx(i => Math.min(CATEGORIES[catIdx].items.length - 1, i + 1));
      else        setItemIdx(i => Math.max(0, i - 1));
    }
  };

  return (
    <div className={`root boot-${phase} ${menuReady ? "is-booted" : ""}`}>
      <WaveBackground hue={HUE} wave={WAVE_OPACITY} particles={PARTICLES_ON} />
      <Splash phase={phase} />

      <div className={`xmb-stage ${open ? "is-dim" : ""}`}
           onTouchStart={onTouchStart}
           onTouchEnd={onTouchEnd}>
        <XMB
          catIdx={catIdx}
          itemIdx={itemIdx}
          onSelectCat={(ci) => { setCatIdx(ci); setItemIdx(0); }}
          onSelectItem={(ci, ii) => { setCatIdx(ci); setItemIdx(ii); }}
          onOpen={openItem}
          nowPlaying={nowPlaying}
        />
      </div>

      <StatusBar open={open} />
      <Hints open={open} />
      <TouchHint />

      <ContentPanel open={open} item={currentItem} onClose={() => setOpen(false)} />
    </div>
  );
}

export default App;
