-- ============================================
-- PRODE MUNDIAL 2026 - Tablas en Supabase
-- Ejecutar en: Supabase > SQL Editor > New query
-- ============================================

-- 1. GRUPOS (uno por cada prode: Monos, Oro Verde)
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,                    -- Nombre visible: ""
  access_code text not null unique,      -- Clave de jugadores: ""
  admin_code text not null,              -- Clave de admin (secret)
  created_at timestamptz default now()
);

-- 2. JUGADORES
create table players (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  name text not null,           -- Nombre real: ""
  team_name text not null,      -- Nombre del equipo: ""
  saved boolean default false,  -- Si ya guardó sus pronósticos
  created_at timestamptz default now()
);

-- 3. PRONÓSTICOS (72 por jugador - fase de grupos)
create table predictions (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references players(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  match_key text not null,        -- Ej: "A0", "B3", "L5"
  group_key text not null,        -- Ej: "A", "B", "L"
  match_index int not null,       -- 0-5
  local_team text not null,
  visitor_team text not null,
  goals_local int not null,
  goals_visitor int not null,
  created_at timestamptz default now(),
  unique(player_id, match_key)
);

-- 4. RESULTADOS REALES (los carga el admin)
create table match_results (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  match_key text not null,        -- Ej: "A0", "B3"
  group_key text not null,
  match_index int not null,
  local_team text not null,
  visitor_team text not null,
  goals_local int not null,
  goals_visitor int not null,
  played_at timestamptz default now(),
  unique(group_id, match_key)
);

-- ============================================
-- SEGURIDAD: Row Level Security (RLS)
-- ============================================

alter table groups enable row level security;
alter table players enable row level security;
alter table predictions enable row level security;
alter table match_results enable row level security;

-- Grupos: cualquiera puede leer (para verificar clave)
create policy "groups_read" on groups for select using (true);

-- Jugadores: cualquiera puede insertar y leer del mismo grupo
create policy "players_read" on players for select using (true);
create policy "players_insert" on players for insert with check (true);
create policy "players_update" on players for update using (true);

-- Pronósticos: cualquiera puede insertar y leer
create policy "predictions_read" on predictions for select using (true);
create policy "predictions_insert" on predictions for insert with check (true);

-- Resultados: cualquiera puede leer, insertar desde admin
create policy "results_read" on match_results for select using (true);
create policy "results_insert" on match_results for insert with check (true);
create policy "results_update" on match_results for update using (true);

-- ============================================
-- DATOS INICIALES: Crear los 2 grupos
-- (Cambiar los códigos por los que quieras)
-- ============================================

insert into groups (name, access_code, admin_code) values
  ('Monos',     'MON01', 'ADMIN_MONOS'),    -- <-- cambiá ADMIN_MONOS por tu clave secreta
  ('Oro Verde', 'ORO001', 'ADMIN_ORO');      -- <-- cambiá ADMIN_ORO por tu clave secreta
