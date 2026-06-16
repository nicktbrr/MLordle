-- Submit a daily result via an RPC instead of a direct table insert.
-- A direct PostgREST upsert asks for the row back (return=representation), which
-- triggers a SELECT the anon role isn't granted (rows are private). This function
-- runs as its owner, inserts, and returns nothing — no client SELECT involved.

create or replace function submit_result(
  p_client_id      text,
  p_date_key       text,
  p_round1_solved  boolean,
  p_round1_attempts int,
  p_round2_solved  boolean,
  p_round2_attempts int,
  p_round3_solved  boolean,
  p_round3_attempts int,
  p_rounds_solved  int
) returns void
language sql
security definer
set search_path = public
as $$
  insert into game_results (
    client_id, date_key,
    round1_solved, round1_attempts,
    round2_solved, round2_attempts,
    round3_solved, round3_attempts,
    rounds_solved
  ) values (
    p_client_id, p_date_key,
    p_round1_solved, p_round1_attempts,
    p_round2_solved, p_round2_attempts,
    p_round3_solved, p_round3_attempts,
    p_rounds_solved
  )
  on conflict (client_id, date_key) do nothing;
$$;

grant execute on function submit_result(
  text, text, boolean, int, boolean, int, boolean, int, int
) to anon, authenticated;

-- Remove the diagnostic row inserted while debugging the 401.
delete from game_results where client_id = 'diagnostic-test';
