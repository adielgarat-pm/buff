ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token text;

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS pause_mode_active boolean DEFAULT false;

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS last_child_activity timestamptz;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS proposed_by_child boolean DEFAULT false;

ALTER TABLE store_rewards ADD COLUMN IF NOT EXISTS proposed_by_child boolean DEFAULT false;

ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

ALTER TABLE daily_progress ADD COLUMN IF NOT EXISTS revoked_by_parent_id uuid;