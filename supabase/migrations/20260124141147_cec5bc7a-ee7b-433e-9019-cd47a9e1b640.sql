-- Add strategy_id column to tasks table for Cog-Fun strategy boosters
ALTER TABLE public.tasks 
ADD COLUMN strategy_id text DEFAULT NULL;