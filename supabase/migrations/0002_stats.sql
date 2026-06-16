-- Anonymous, cross-user game stats.
-- Clients INSERT their own daily result (no auth; identified by a random
-- localStorage client_id). Raw rows are NOT readable by anon — aggregate numbers
-- are exposed only through the SECURITY DEFINER function get_daily_stats().

create table if not exists game_results (
  id              uuid primary key default gen_random_uuid(),
  client_id       text not null,
  date_key        text not null,
  round1_solved   boolean not null,
  round1_attempts int     not null,
  round2_solved   boolean not null,
  round2_attempts int     not null,
  round3_solved   boolean not null,
  round3_attempts int     not null,
  rounds_solved   int     not null,
  created_at      timestamptz not null default now(),
  unique (client_id, date_key)
);

create index if not exists game_results_date_idx on game_results(date_key);

alter table game_results enable row level security;

-- anon may insert results, but has no SELECT/UPDATE/DELETE policy (rows are private).
create policy "anon insert results" on game_results
  for insert to anon, authenticated with check (true);

grant insert on game_results to anon, authenticated;

-- Aggregate stats for a given day. Runs as the function owner so it can read the
-- table while raw rows stay hidden from anon. Dedupes to the latest row per client.
create or replace function get_daily_stats(p_date_key text)
returns json
language sql
security definer
set search_path = public
as $$
  with latest as (
    select distinct on (client_id) *
    from game_results
    where date_key = p_date_key
    order by client_id, created_at desc
  )
  select json_build_object(
    'players',             count(*),
    'round1_solve_rate',   coalesce(avg(case when round1_solved then 1.0 else 0 end), 0),
    'round2_solve_rate',   coalesce(avg(case when round2_solved then 1.0 else 0 end), 0),
    'round3_solve_rate',   coalesce(avg(case when round3_solved then 1.0 else 0 end), 0),
    'avg_round1_attempts', coalesce(avg(round1_attempts), 0),
    'avg_round2_attempts', coalesce(avg(round2_attempts), 0),
    'avg_round3_attempts', coalesce(avg(round3_attempts), 0),
    'dist_rounds_solved',  (
      select json_object_agg(rounds_solved, c)
      from (select rounds_solved, count(*) c from latest group by rounds_solved) d
    )
  )
  from latest;
$$;

grant execute on function get_daily_stats(text) to anon, authenticated;
