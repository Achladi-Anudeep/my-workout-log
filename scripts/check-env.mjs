// Build guard: stops a build that would connect to the wrong database.
// - Production (main branch) must use the production Supabase project.
// - Every other Netlify build (develop branch = test environment, PR previews) must NOT use it.
// Runs before `vite build` on Netlify. Outside Netlify (CI, local) it only warns.

export const PROD_SUPABASE_REF = 'anutvisbezcefrbkxplo';

const context = process.env.CONTEXT; // set by Netlify
const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const usesProd = url.includes(PROD_SUPABASE_REF);

function fail(msg) {
  console.error(`\n✖ Environment check failed: ${msg}\n`);
  process.exit(1);
}

if (!context) {
  if (usesProd) console.warn('⚠ This local build points at the PRODUCTION database.');
  console.log('Environment check: local/CI build, Supabase', url ? new URL(url).host : 'not configured');
} else if (context === 'production') {
  if (!usesProd) fail('the production build must use the production Supabase project. Set VITE_SUPABASE_URL in Netlify for Production.');
  if (!key) fail('VITE_SUPABASE_ANON_KEY is missing for the production build.');
  console.log('Environment check: production → production database ✓');
} else {
  if (usesProd) fail(`the "${context}" build (branch ${process.env.BRANCH}) points at the PRODUCTION database. Test builds must use the test Supabase project (see netlify.toml).`);
  console.log(`Environment check: ${context} (${process.env.BRANCH}) →`, url ? `${new URL(url).host} (test database) ✓` : 'no database, device-only mode');
}
