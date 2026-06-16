-- MLordle schema: content tables for the daily ML-lifecycle game.
-- All tables are public-readable via the anon key (read-only RLS). Content is
-- written only via the Supabase dashboard / service_role key, never the client.

-- Lifecycle stages (e.g. problem-framing, data-gathering, deployment...).
create table if not exists stages (
  id              text primary key,            -- slug, e.g. 'data-augmentation'
  name            text not null,
  canonical_order int  not null,               -- nominal lifecycle position
  description     text not null default ''
);

-- A daily scenario: a real-ish ML project with a correct pipeline + decoy steps.
create table if not exists scenarios (
  id               text primary key,           -- slug
  title            text not null,
  domain           text not null default '',
  description      text not null default '',
  ordered_stage_ids text[] not null,           -- correct pipeline (stage slugs, in order)
  decoy_stage_ids   text[] not null default '{}' -- stages that do NOT belong here
);

-- Round 2 answers: techniques that belong to a stage, with attributes for feedback.
create table if not exists techniques (
  id         text primary key,                 -- slug
  name       text not null,                     -- display name, e.g. 'MixUp'
  stage_id   text not null references stages(id),
  aliases    text[] not null default '{}',      -- accepted alternate spellings
  attributes jsonb  not null                     -- {modality, when_applied, type, needs_labels}
);

-- Round 3 answers: root causes of failures, with attributes for warmth feedback.
create table if not exists causes (
  id         text primary key,                 -- slug
  name       text not null,                     -- e.g. 'Data drift'
  aliases    text[] not null default '{}',
  attributes jsonb  not null                     -- {lifecycle_stage, category}
);

-- Round 3 prompts: an observed symptom pointing at a cause.
create table if not exists symptoms (
  id          text primary key,                -- slug
  description text not null,                     -- the symptom shown to the player
  cause_id    text not null references causes(id),
  stage_id    text not null references stages(id) -- lifecycle stage the symptom surfaces in
);

create index if not exists techniques_stage_idx on techniques(stage_id);
create index if not exists symptoms_cause_idx    on symptoms(cause_id);

-- Read-only RLS: anon can SELECT everything, but cannot write.
alter table stages     enable row level security;
alter table scenarios  enable row level security;
alter table techniques enable row level security;
alter table causes     enable row level security;
alter table symptoms   enable row level security;

create policy "public read stages"     on stages     for select to anon, authenticated using (true);
create policy "public read scenarios"  on scenarios  for select to anon, authenticated using (true);
create policy "public read techniques" on techniques for select to anon, authenticated using (true);
create policy "public read causes"     on causes     for select to anon, authenticated using (true);
create policy "public read symptoms"   on symptoms   for select to anon, authenticated using (true);
