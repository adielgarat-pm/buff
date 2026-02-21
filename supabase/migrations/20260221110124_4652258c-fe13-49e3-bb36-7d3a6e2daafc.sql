-- Update default pet_state to use 'puppy' instead of 'dragon'
ALTER TABLE public.profiles
  ALTER COLUMN pet_state SET DEFAULT '{"level": 1, "experience": 0, "current_skin": "puppy", "energy_level": 50, "last_interaction": null}'::jsonb;