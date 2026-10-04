-- =====================================================================
-- PALTI FX — Skema Data Pengguna: Progres Edukasi, Pencapaian, & Jurnal
-- =====================================================================

-- 1. Progres Bab Edukasi (Lesson Completion)
create table if not exists public.user_lesson_progress (
  user_id       uuid not null references auth.users (id) on delete cascade,
  lesson_id     text not null,
  completed     boolean not null default true,
  completed_at  timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- 2. Pencapaian / Medali (Achievements)
create table if not exists public.user_achievements (
  user_id         uuid not null references auth.users (id) on delete cascade,
  achievement_id  text not null,
  unlocked_at     timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- 3. Jurnal Transaksi Pengguna (User Trading Journal)
create table if not exists public.user_trades (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        text not null, -- YYYY-MM-DD
  symbol      text not null,
  direction   text not null check (direction in ('BUY', 'SELL')),
  lot         numeric not null default 0.01,
  entry       numeric,
  exit        numeric,
  sl          numeric,
  tp          numeric,
  pl          numeric not null default 0,
  pips        numeric,
  setup       text,
  emotion     text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- 4. Row Level Security (RLS)
alter table public.user_lesson_progress enable row level security;
alter table public.user_achievements    enable row level security;
alter table public.user_trades          enable row level security;

-- Policies untuk user_lesson_progress
drop policy if exists "user_lesson_progress_own" on public.user_lesson_progress;
create policy "user_lesson_progress_own" on public.user_lesson_progress
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policies untuk user_achievements
drop policy if exists "user_achievements_own" on public.user_achievements;
create policy "user_achievements_own" on public.user_achievements
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Policies untuk user_trades
drop policy if exists "user_trades_own" on public.user_trades;
create policy "user_trades_own" on public.user_trades
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Grants
grant all on public.user_lesson_progress to authenticated;
grant all on public.user_achievements    to authenticated;
grant all on public.user_trades          to authenticated;
