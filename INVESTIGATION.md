# Cross-Property Leak in "View All Rooms (Beta)"

## Root Cause

The bug exists. `app/api/rooms/all/route.ts` used `createServiceClient()`, which authenticates with `SUPABASE_SERVICE_ROLE_KEY` and bypasses row-level security. The route also had no `auth.getUser()` check, so a direct request to `/api/rooms/all` could read every room assignment for the current day across all hotels.

The regular board endpoint did not have the same issue because `app/api/rooms/route.ts` uses the session-aware Supabase server client and rejects unauthenticated requests.

## Evidence

Before the fix, unauthenticated `GET /api/rooms/all` returned `200` with 60 rows: 30 Hyatt rows and 30 Marriott rows. Sample rows included `Hyatt Sample` data, which matches the Marriott manager's report.

In the same local environment, unauthenticated `GET /api/rooms` returned `401 Unauthorized`, showing the normal board endpoint was protected.

A direct Supabase query as `manager-b@marriott.example` using the anon/session client returned exactly 30 rows, all with Marriott hotel id `22222222-2222-2222-2222-222222222222`. That confirms the database RLS policy was correctly scoped and the leak came from the service-role API route.

## Fix

`/api/rooms/all` now uses `createSupabaseServerClient()`, calls `supabase.auth.getUser()`, and returns `401 { "error": "Unauthorized" }` when no user is present.

The room query still returns today's `room_assignments` with `hotels(name)`, but it now runs through the authenticated session client so existing RLS policies restrict rows to the user's hotel memberships. The beta page remains available to authenticated hotel members; it no longer exposes cross-property data.

## Regression Test

Added a route-level Vitest test for `/api/rooms/all` that verifies unauthenticated requests return `401`, verifies the route uses the session Supabase client, and installs a throwing mock for the service client so any regression back to service-role access fails the test.

Extended the RLS smoke tests to assert `manager-b@marriott.example` only sees Marriott room assignments through the anon/session client, alongside the existing Hyatt isolation test.
