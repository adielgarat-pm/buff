
-- Add pet_state JSONB column to profiles for child pet data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pet_state jsonb DEFAULT '{"level": 1, "experience": 0, "energy_level": 50, "current_skin": "dragon", "last_interaction": null}'::jsonb;

-- Add reward_category to store_rewards for parent categorization
ALTER TABLE public.store_rewards
ADD COLUMN IF NOT EXISTS reward_category text NOT NULL DEFAULT 'real-world';
