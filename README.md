# V168 — Nuxt 3

Rebuild of the static V168 site on Nuxt 3, for server-side rendering and real per-page SEO
(dynamic `<title>`/meta/Open Graph tags, and pages that render with content on first load
instead of an empty shell that fills in via JS).

## Setup

```bash
npm install
cp .env.example .env   # then edit values if needed
npm run dev             # http://localhost:3000
```

Production build:

```bash
npm run build
npm run preview
```

## What's here

- **`pages/index.vue`** — Live page: channel switcher, player, Meron/Wala vote bar, and the
  current-active-fight card that polls `GET /fightactive` every 10s.
- **`pages/videos/index.vue`** — Videos list. First page renders server-side (so it's indexable),
  then infinite-scrolls further pages client-side. "Today" filter is on by default.
- **`pages/videos/[id].vue`** — Video detail, fetched server-side so each video gets its own
  `<title>`/description/Open Graph image for sharing and SEO. Includes Telegram and Facebook
  share buttons.
- **`pages/fights/index.vue`** — List Fight page: same SSR-first-page + infinite-scroll pattern,
  "Today" filter, and the fighter-photo modal.
- **`server/api/`** — server-side proxy routes (`stream.post.ts`, `fightactive.get.ts`) that hide
  the live-stream resolver and admin-API URLs from the browser; called via same-origin `/api/*`.
- **`components/`** — `SiteHeader` (logo, Telegram button, language switch), `FooterNav`
  (floating pill nav, highlights the active route), `TodayFilterButton`, `ShareButtons`.
- **`composables/useLang.ts`** — Khmer/English switch. Uses a cookie instead of `localStorage`
  so the correct language renders on the very first server-rendered response (no
  English-then-Khmer flash, and consistent content for search engines).
- **`composables/useApi.ts`** — date helpers (`timeAgo`, `isTodayInPhnomPenh` — compares against
  Cambodia time, not the visitor's local time) and the API base URL helper.
- **`assets/css/main.css`** — all the site's visual design (design tokens, footer nav, vote bar,
  cards, fighter modal, etc.), ported as-is from the static version.

## Configuration

Everything environment-specific lives in `runtimeConfig.public` (`nuxt.config.ts`) and can be
overridden without a rebuild via env vars — see `.env.example`:

- `NUXT_PUBLIC_API_BASE` — cf88.me API base (defaults to `https://cf88.me/api`)
- `NUXT_PUBLIC_SITE_URL` — used to build absolute Open Graph URLs
- `NUXT_PUBLIC_TELEGRAM_URL` — header Telegram button target

## Notes / things worth deciding before deploying

- The live-stream resolver and the active-fight endpoint are now proxied through this app's own
  `server/api/stream.post.ts` and `server/api/fightactive.get.ts` — the browser calls same-origin
  `/api/stream` and `/api/fightactive`, and Nitro forwards those to the real upstreams
  (`NUXT_STREAM_RESOLVER_URL` / `NUXT_ADMIN_API_BASE`, both server-only runtime config — not
  exposed to the browser). That's the place to add caching or rate-limiting later if you want it.
- The channel list on the Live page is still a hard-coded array (as it was in the static site) —
  worth moving to an API call if you expect to change it often.
- Voting is still client-only / in-memory (matches the original — there's no backend to persist
  votes to yet).
