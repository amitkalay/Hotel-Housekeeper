# Lance Take-Home — Room Board

Welcome! This take-home is a stripped-down version of one of our internal tools — a housekeeping board hotel managers use to assign rooms to attendants and track status through the day.

**Target time: 4–6 hours, in one sitting.** Don't optimize past that — we care more about how you think than how much you ship.

## What's here

A working Next.js + Supabase app that:
- Logs you in via email + password (local dev only — production uses magic links)
- Shows a board of rooms for your hotel
- Refreshes the board periodically

Two seeded hotels (`Hyatt Sample`, `Marriott Sample`), two test users each. Credentials are in `scripts/seed.ts` (and printed when you run `pnpm seed`).

## Setup

```bash
pnpm install
supabase start                # requires Supabase CLI + Docker
cp .env.example .env.local    # then paste values from `supabase status`
pnpm seed                     # creates auth users + seeds hotels/staff/rooms
pnpm dev
```

Visit http://localhost:3000 and log in as `manager-a@hyatt.example` / `password123`.

## Troubleshooting

A few small things that have tripped people up:

- **`pnpm dev` says "Port 3000 is in use, using port 3001 instead."** Some other dev server is already on 3000 (often a stray `next dev` from another project). Either kill that process or just use the URL the CLI prints — every login link in the README still works on 3001.
- **`supabase start` errors about port conflicts (`address already in use 0.0.0.0:54321` or similar).** You have another local Supabase project running. Find its directory and `supabase stop` there first, then come back here.
- **`.env.local` keys: use the JWT-format `ANON_KEY` and `SERVICE_ROLE_KEY`** from `supabase status -o env` — *not* the newer `PUBLISHABLE_KEY` (`sb_publishable_…`) or `SECRET_KEY` (`sb_secret_…`). The Supabase JS SDK in this scaffold expects the JWT-format keys for now.
- **`pnpm seed` fails with "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local."** You skipped the `cp .env.example .env.local` + paste step. Run it before `pnpm seed`.

## Your tasks

### 1. Build a feature: "Assign attendant" (~1.5h)

On each room card, add a dropdown that lets the manager reassign the room to a different attendant at the same hotel. Persist to the database. Show a toast on success/failure. Handle the case where someone else updates the same room while the dropdown is open.

### 2. Investigate ONE of two concerning reports (~2–2.5h)

We've had two unrelated reports come in. Pick **one** to investigate in depth. Write up your findings in `INVESTIGATION.md` (root cause, evidence, fix, regression test), then ship the fix.

**Report 1 (from a Marriott manager):**
> "I clicked the 'View all rooms (beta)' link in the header and I'm seeing room numbers I don't recognize. Some of them say 'Hyatt' in the data. Are we leaking data between properties?"

**Report 2 (from a Hyatt night auditor):**
> "When my morning shift and I both have the board open, I'll mark a room clean and it takes up to 10 seconds before they see it. Sometimes we walk to the same room twice. Can we make it faster?"

You don't need to do both. Depth and quality of fix matter more than breadth.

### 3. Stretch (optional, ~1h)

Pick one if you have time:
- Tackle the other report
- Bulk reassign UI (multi-select rooms → assign to one attendant)
- Mobile-responsive board
- Filter bar (by status / floor / VIP)

## What we look for

- **Correctness.** It works. It doesn't break anything else.
- **Judgment.** What did you do vs not do, and why?
- **Communication.** Your `INVESTIGATION.md` and submission notes tell us how you think.
- **Code you'd be proud to land at a 5-person startup.** Readable, tested where it matters, no obvious foot-guns.

## Submitting

**Please work locally — do not push to the GitHub repo we sent you.** We grade each submission independently and the shared repo stays pristine.

Commit your work locally (one commit or many, whatever feels right), then package the whole repo as a single file:

```bash
git add -A && git commit -m "your work"
git bundle create lance-takehome-<your-name>.bundle --all
```

The `.bundle` file is git-native, contains the full history (scaffold + your commits), and is small enough to email. Send it to <reviewer email> with a short note covering:
- Which report you picked (Report 1 or Report 2) and why
- What you'd do with another 4 hours
- Anything you cut or compromised on
- How long it actually took

(If git bundles are unfamiliar, you can `tar -czf lance-takehome-<your-name>.tar.gz --exclude=node_modules --exclude=.next --exclude=.env.local .` and attach the tarball instead — just leave the `.git/` directory intact so we can see your commits.)

Good luck — have fun with it.
