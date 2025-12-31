-- Add color column to workout_profiles
ALTER TABLE public.workout_profiles
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'green';

-- Create bioimpedance table
CREATE TABLE IF NOT EXISTS public.bioimpedance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  muscle_mass NUMERIC,
  body_fat NUMERIC,
  body_water NUMERIC,
  bone_mass NUMERIC,
  visceral_fat INTEGER,
  metabolic_age INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bioimpedance_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own bioimpedance records"
ON public.bioimpedance_records
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);