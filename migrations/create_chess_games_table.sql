-- Create chess_games table
CREATE TABLE IF NOT EXISTS chess_games (
  id TEXT PRIMARY KEY,
  players JSONB DEFAULT '[]'::jsonb,
  moves JSONB DEFAULT '[]'::jsonb,
  lastUpdated BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chess_games_id ON chess_games(id);
