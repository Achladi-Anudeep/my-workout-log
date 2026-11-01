import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Netlify sets CONTEXT ("production", "branch-deploy", "deploy-preview") and COMMIT_REF during builds.
 * Production = the main branch; everything else Netlify builds is the test environment.
 */
const context = process.env.CONTEXT;
const appEnv: 'prod' | 'test' | 'local' = context === 'production' ? 'prod' : context ? 'test' : 'local';
const sha = (process.env.COMMIT_REF || process.env.GITHUB_SHA || 'local').slice(0, 40);

/** Emits /version.json so the pipeline can tell exactly which commit and database a deploy is running. */
function versionFile(supabaseUrl: string | undefined): Plugin {
  return {
    name: 'version-file',
    generateBundle() {
      let supabaseHost: string | null = null;
      try { supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : null; } catch { supabaseHost = null; }
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ sha, env: appEnv, context: context ?? null, branch: process.env.BRANCH ?? null, supabaseHost, builtAt: new Date().toISOString() }, null, 2),
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env };
  const label = appEnv === 'prod' ? '' : appEnv === 'test' ? ' (Test)' : ' (Local)';

  return {
    define: {
      __APP_ENV__: JSON.stringify(appEnv),
      __APP_VERSION__: JSON.stringify(sha.slice(0, 7)),
    },
    plugins: [
      react(),
      versionFile(env.VITE_SUPABASE_URL),
      VitePWA({
        // 'prompt' lets the app decide when to reload into a new version (never in the middle of typing).
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon-32.png'],
        manifest: {
          name: `My Workout Log${label}`,
          short_name: appEnv === 'prod' ? 'Workout Log' : appEnv === 'test' ? 'Workout TEST' : 'Workout Local',
          description: 'Log the 6-day Push/Pull/Legs/Arms plan, track progress and sync across devices.',
          theme_color: '#0D0F13',
          background_color: '#0D0F13',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/version\.json$/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
          ],
        },
      }),
    ],
    preview: { port: 4173, strictPort: true },
  };
});
