import tailwindcss from '@tailwindcss/vite';

import './server/lib/env';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/google-fonts',
    'nuxt-auth-utils',
  ],
  eslint: {
    config: {
      standalone: false,
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
      {
        apply: 'build',
        name: 'vite-plugin-ignore-sourcemap-warnings',
        configResolved(config) {
          const originalOnWarn = config.build.rollupOptions.onwarn;
          config.build.rollupOptions.onwarn = (warning, warn) => {
            if (
              warning.code === 'SOURCEMAP_BROKEN'
              && warning.plugin === '@tailwindcss/vite:generate:build'
            ) {
              return;
            }

            if (originalOnWarn) {
              originalOnWarn(
                warning,
                warn,
              );
            }
            else {
              warn(
                warning,
              );
            }
          };
        },
      },
    ],
  },
  googleFonts: {
    families: {
      Poppins: [100, 300, 400, 500, 600, 700, 800, 900],
    },
    display: 'swap',
    prefetch: true,
    preconnect: true,
    preload: true,
  },
});
