CREATE TABLE IF NOT EXISTS accounts (
 id uuid PRIMARY KEY, username varchar(32) NOT NULL UNIQUE,
 password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS characters (
 id uuid PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 slot smallint NOT NULL CHECK(slot BETWEEN 1 AND 3), name varchar(24) NOT NULL,
 gender varchar(6) NOT NULL CHECK(gender IN ('male','female')),
 level integer NOT NULL DEFAULT 1 CHECK(level >= 1), xp integer NOT NULL DEFAULT 0 CHECK(xp >= 0),
 stones integer NOT NULL DEFAULT 0 CHECK(stones >= 0), kills integer NOT NULL DEFAULT 0,
 last_action_at timestamptz, chapter integer NOT NULL DEFAULT 1,
 map_id text NOT NULL DEFAULT 'village', created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(account_id,slot)
);
-- Bản 0.2.0: trạng thái bản đồ riêng cho từng nhân vật.
CREATE TABLE IF NOT EXISTS character_worlds (
 character_id uuid PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
 state jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
