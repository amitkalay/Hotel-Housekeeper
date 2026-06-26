# Room Cleaning Status Propagation Investigation

## Root Cause

The report is valid for the current board refresh path. `app/board/board-client.tsx` only refreshes rooms from other users through a `setInterval` polling `/api/rooms` every `10_000` ms, so another open board can wait almost a full polling cycle before seeing a room update.

Supabase realtime was already enabled for `room_assignments` in the initial migration, but the client never subscribed to those database changes. The local app also currently displays status only; it does not include a mark-clean button or status update API.

## Evidence

`BoardClient` had this polling loop:

```ts
setInterval(() => {
  fetch("/api/rooms")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((d) => setRooms(d.rooms ?? []))
    .catch(() => {});
}, 10_000);
```

The running dev server showed repeated `GET /api/rooms 200` calls, matching that polling model. The database migration already contains `alter publication supabase_realtime add table room_assignments;`, so the missing piece was client subscription rather than a schema change.

## Fix

The board now subscribes to Supabase Postgres realtime `UPDATE` events for `public.room_assignments`. When an update event arrives, the matching room in local React state is replaced immediately. The existing 10-second `/api/rooms` poll remains as a fallback for reconnects or environments where realtime is unavailable.

No public API changed and no database migration was required.

## Regression Test

Added `tests/room-realtime.test.ts` to verify that the realtime helper subscribes to `UPDATE` events on `public.room_assignments`, passes updated rows to the board replacement callback, and removes the channel during cleanup.

The existing RLS and route tests remain in place to protect hotel scoping and API behavior.
