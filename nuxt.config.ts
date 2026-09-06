// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-08-19',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Server-only — never exposed to the browser. Used by server/api/* routes
    // to proxy these upstreams so the browser calls same-origin /api/* paths.
    adminApiBase: 'https://admin.cf88.me/api',
    streamResolverUrl: 'https://live-strean-production.up.railway.app/channel',

    // Server-only — used by server/api/live-token.get.ts to fetch a fresh
    // p_token from the Go backend. Override with NUXT_STREAM_LOGIN_URL /
    // NUXT_SS24_USERNAME / NUXT_SS24_PASSWORD at deploy time.
    streamLoginUrl: 'https://live-strean-production.up.railway.app/login',
    ss24Username: '',
    ss24Password: '',

    public: {
      // Base URL for the cf88.me API — override with NUXT_PUBLIC_API_BASE at build/deploy time.
      apiBase: 'https://cf88.me/api',
      siteUrl: 'https://v168.example.com',
      telegramUrl: 'https://t.me/V_VDOVIP',
      telegramUsername: 'V_VDOVIP',
      // The ss24 socket.io endpoint the browser connects to directly once
      // it has a p_token from /api/live-token.
      liveSocketUrl: 'https://api.ss24.live',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'km' },
      link: [
        { rel: 'icon', type: 'image/png', href: '/v168.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&family=Noto+Sans+Khmer:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
})