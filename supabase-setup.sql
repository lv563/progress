-- Run this in your Supabase project → SQL Editor

CREATE TABLE IF NOT EXISTS user_store_data (
  user_id    TEXT        NOT NULL,
  store_key  TEXT        NOT NULL,
  data       TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, store_key)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_store_data_user_id ON user_store_data (user_id);
