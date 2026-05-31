# ImmerseLog Vercel + Supabase Deployment Plan

## Goal

Deploy ImmerseLog as a production Vercel app with Supabase as the cloud backend for auth, cross-device sync, and cover storage.

The app may keep IndexedDB as its local cache/offline buffer, but production usage must not depend on a local development server, local-only data, or manual local commands after launch.

## Current Review

- Next.js 15, React 18, and the current `npm run build` flow are compatible with Vercel's Next.js preset.
- Supabase client configuration already uses public browser env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase schema exists at `supabase/migrations/0001_immerselog.sql`.
- The app already initializes local data and attempts Supabase sync on startup and `online` events.
- The deployment plan must be upgraded before launch because cloud sync is currently too manual after mutations, and deleted remote entities can be re-hidden incorrectly if sync state is reused as both a local queue marker and a remote deletion marker.

## Required Code Readiness Changes

1. Add automatic post-mutation sync.
   - Keep writes local-first for fast UI.
   - After a successful local mutation and cache invalidation, trigger `syncWithSupabase()` in the background.
   - Do not block the user's write on network availability.

2. Fix deletion sync semantics.
   - Use `deletedAt` as the durable deletion marker.
   - Use `syncState` only as local sync queue state.
   - Downloaded remote deletions should be stored as `syncState: "synced"` with `deletedAt` set, so they stay hidden without being re-pushed forever.

3. Filter deleted data by `deletedAt`.
   - List/get functions for works, sessions, languages, goals, vocabulary, settings-backed data, and progress helpers should exclude `deletedAt` records.
   - This keeps remote tombstones from reappearing after a successful sync.

4. Tighten production UX/data safety.
   - Import JSON backup failures should show an explicit error.
   - Timer save dialog should pause the timer when opened.
   - Work selection should reset when the selected work no longer belongs to the selected language/type filter.
   - Streak should not drop to zero early in the day when yesterday was active.
   - Vocabulary should distinguish reviewed and unreviewed items.

## Supabase Setup

The Supabase project must be created in the user's Supabase account unless an authenticated Supabase plugin/CLI session is available.

1. Create or choose a Supabase project.
2. Apply `supabase/migrations/0001_immerselog.sql`.
3. Confirm the following exists:
   - Table: `public.immerselog_entities`
   - RLS enabled on `public.immerselog_entities`
   - Policies scoped by `auth.uid() = user_id`
   - Storage bucket: `immerselog-covers`
   - Bucket visibility: public
4. Enable email magic-link auth.
5. Configure Auth URL settings:
   - Site URL: final Vercel production URL
   - Redirect URLs:
     - `https://<vercel-production-domain>/**`
     - `http://localhost:3000/**` for local validation
6. Capture project values for Vercel:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not commit Supabase service-role keys or private secrets.

## Vercel Setup

The Vercel project must be created in the user's Vercel account unless an authenticated Vercel plugin/CLI session is available.

1. Import the Git repository into Vercel or link the local repo with Vercel CLI.
2. Use Framework Preset: Next.js.
3. Use default commands:
   - Install: `npm install`
   - Build: `npm run build`
   - Output: Vercel-managed Next.js output
4. Add Production, Preview, and Development env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy.
6. Copy the final production URL back into Supabase Auth URL settings.
7. Redeploy if Supabase redirect URLs or env vars changed after the first deploy.

## Verification

Local verification before deployment:

```bash
npm run test
npm run lint
npm run build
```

Production verification after deployment:

1. Open the Vercel production URL.
2. Complete onboarding or initialize local seed data.
3. Sign in with magic link.
4. Create a language/work/session/vocabulary item.
5. Confirm Supabase receives rows in `public.immerselog_entities`.
6. Refresh the same browser and verify data remains visible.
7. Open a second browser/device, sign in with the same account, and verify data syncs down.
8. Delete a work/session locally, sync, then confirm it stays hidden after reload and on the second device.
9. Install/open as PWA and verify the production URL works without a local dev server.

## User Cooperation Required

I can prepare and verify the repository locally. To complete the real hosted deployment, I need one of these access paths:

- An authenticated Vercel/Supabase plugin tool exposed in this Codex session.
- Or authenticated local CLIs (`vercel` and `supabase`) already logged in.
- Or the user completes dashboard-only steps and provides the resulting production URL plus Supabase public env values.

The exact required values are:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

If direct deployment access is unavailable, the repository can still be made deployment-ready and the remaining blocker will be account authorization, not application code.

## Done Criteria

This deployment is complete only when:

- `npm run test` passes.
- `npm run lint` passes.
- `npm run build` passes.
- Vercel production deployment succeeds.
- Supabase env vars are configured on Vercel.
- Supabase migration and Auth URL settings are active.
- Magic-link login works on the production URL.
- A record created on production appears in Supabase and syncs to another browser/device.

## Deployment Record

Last updated: 2026-05-31

- Vercel project: `immerselog`
- Vercel production URL: `https://immerselog.vercel.app`
- Vercel production deployment: `dpl_9PrhfRDB86sMUMEc4kPnLeytEj9K`
- Vercel framework preset: `nextjs`
- Vercel deployment protection: SSO protection disabled for public access
- Supabase project: `immerselog`
- Supabase project ref: `oggsjjlhbzltefmptewl`
- Supabase project URL: `https://oggsjjlhbzltefmptewl.supabase.co`
- Supabase migration applied: `supabase/migrations/0001_immerselog.sql`
- Supabase Auth Site URL: `https://immerselog.vercel.app`
- Supabase Auth Redirect URLs: `https://immerselog.vercel.app/**`, `http://localhost:3000/**`
- Vercel Production env vars configured:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Verified:

```bash
npm run test
npm run lint
npm run build
curl https://immerselog.vercel.app
curl https://oggsjjlhbzltefmptewl.supabase.co/rest/v1/immerselog_entities?select=id&limit=1
```
