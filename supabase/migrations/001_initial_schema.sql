-- Gaming Decisions - Initial Schema
-- Run this in the Supabase SQL editor for the new project

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  steam_id TEXT UNIQUE NOT NULL,
  steam_profile_url TEXT NOT NULL,
  avatar_url TEXT,
  is_primary BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Games table (cached game metadata)
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_app_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  header_image_url TEXT,
  description TEXT,
  is_multiplayer BOOLEAN DEFAULT false,
  max_players INTEGER,
  min_players INTEGER,
  supports_linux BOOLEAN DEFAULT false,
  protondb_rating TEXT,
  has_active_servers BOOLEAN DEFAULT true,
  servers_deprecated BOOLEAN DEFAULT false,
  steam_review_score INTEGER,
  steam_review_desc TEXT,
  opencritic_score INTEGER,
  opencritic_tier TEXT,
  steam_price_cents INTEGER,
  best_price_cents INTEGER,
  best_price_store TEXT,
  best_price_url TEXT,
  is_free BOOLEAN DEFAULT false,
  is_on_sale BOOLEAN DEFAULT false,
  sale_percent INTEGER,
  release_date DATE,
  is_coming_soon BOOLEAN DEFAULT false,
  steam_tags TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  trending_score INTEGER,
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Player-Game ownership junction table
CREATE TABLE player_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  playtime_hours DECIMAL DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  UNIQUE(player_id, game_id)
);

-- Game sessions (track what we played)
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  played_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  players UUID[] DEFAULT '{}'
);

-- Sync log (track sync health)
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  error TEXT,
  games_updated INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_games_steam_app_id ON games(steam_app_id);
CREATE INDEX idx_games_multiplayer_linux ON games(is_multiplayer, supports_linux) WHERE is_multiplayer = true AND supports_linux = true;
CREATE INDEX idx_player_games_player ON player_games(player_id);
CREATE INDEX idx_player_games_game ON player_games(game_id);
CREATE INDEX idx_sync_log_type ON sync_log(sync_type, started_at DESC);

-- RLS Policies (public read, service role write)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read games" ON games FOR SELECT USING (true);
CREATE POLICY "Public read player_games" ON player_games FOR SELECT USING (true);
CREATE POLICY "Public read game_sessions" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Public read sync_log" ON sync_log FOR SELECT USING (true);

-- Service role write access (for cron functions)
CREATE POLICY "Service write players" ON players FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write games" ON games FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write player_games" ON player_games FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write game_sessions" ON game_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service write sync_log" ON sync_log FOR ALL USING (auth.role() = 'service_role');

-- Seed the 4 players
INSERT INTO players (name, steam_id, steam_profile_url, is_primary) VALUES
  ('Ben', '76561197985288680', 'https://steamcommunity.com/id/Bendomac/', true),
  ('Craig', '76561198054776519', 'https://steamcommunity.com/profiles/76561198054776519', true),
  ('Matt', '76561197977197499', 'https://steamcommunity.com/id/Opstutating', true),
  ('Joe', '76561198002285716', 'https://steamcommunity.com/profiles/76561198002285716', false);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE player_games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
