# MLordle 🧠

A daily, Wordle-style study game for the **full machine-learning lifecycle**.
Built to spend 5–10 minutes a day, three short rounds:

1. **Round 1 — Pipeline.** Drag the lifecycle stages into the right order for the
   day's scenario. 🟩 right step + position · 🟨 valid step, wrong position ·
   ⬛ decoy that doesn't belong.
2. **Round 2 — Technique.** Guess the technique that fits a given stage (e.g.
   MixUp, SMOTE). Each guess reveals attribute comparisons (modality, when it's
   applied, type, needs-labels): 🟩 match · 🟨 partial · ⬛ off.
3. **Round 3 — What breaks?** Read a production symptom and guess the root cause
   (e.g. data drift). Feedback gives attribute matches + a warmth reading
   (🔥 / 🌤️ / 🧊).

Puzzles are **deterministic by date** — the same day always yields the same
puzzle. Progress and streaks live in `localStorage` (no login).

## Stack
- **Vite + React + TypeScript** SPA (no custom backend).
- **Supabase** for content, read at runtime via the public **anon key** with
  read-only RLS. If no Supabase env vars are set, the app falls back to bundled
  demo content (`src/data/fallbackContent.ts`), so it's fully playable offline.
- **Vercel** for hosting.
- **Vitest** for the game-logic unit tests.

## Local development
```bash
npm install
npm run dev      # http://localhost:5173 (runs on bundled demo content by default)
npm run test     # game-logic unit tests
npm run build    # type-check + production build
```

## Connect Supabase (optional for local, used in prod)
1. Create a project at https://supabase.com (note the **Project URL** and **anon
   public key** under Settings → API).
2. Run the schema + seed against it — either paste the files into the dashboard
   **SQL editor**, or via the CLI:
   ```bash
   npx supabase link --project-ref <your-ref>
   npx supabase db push          # applies supabase/migrations/0001_init.sql
   # then run supabase/seed.sql in the SQL editor (or psql with the seed file)
   ```
3. Copy `.env.example` to `.env.local` and fill in:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```
> The anon key is public-safe (RLS allows SELECT only). **Never** commit the
> `service_role` key.

Content is edited in the Supabase dashboard. Keep `src/data/fallbackContent.ts`
in sync with `supabase/seed.sql` if you want the offline fallback to match.

## Deploy to Vercel
1. Push this repo to GitHub.
2. Import it at https://vercel.com/new — framework preset **Vite** (build
   `npm run build`, output `dist`).
3. Add Environment Variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy.

## Project layout
```
supabase/migrations/0001_init.sql   schema + read-only RLS
supabase/seed.sql                   starter content
src/data/                           types, Supabase repository, offline fallback
src/game/                           daily selection + per-round scoring (unit-tested)
src/components/                     Round1Order, Round2Technique, Round3Diagnose, Results, Header
src/state/progress.ts               localStorage streak + day results
```
