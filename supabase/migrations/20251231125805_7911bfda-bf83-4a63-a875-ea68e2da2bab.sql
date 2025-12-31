-- Criar tabela de perfis de treino
CREATE TABLE public.workout_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_month DATE,
  end_month DATE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_form_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de treinos dentro dos perfis
CREATE TABLE public.profile_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.workout_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  day_of_week INTEGER, -- 0=Domingo, 1=Segunda, etc. NULL para treinos sem dia fixo
  week_number INTEGER, -- Semana do mês (1-4)
  youtube_url TEXT,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de exercícios dentro dos treinos
CREATE TABLE public.profile_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.profile_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  sets TEXT,
  reps TEXT,
  notes TEXT,
  youtube_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de formulários FIT IA
CREATE TABLE public.fit_ai_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  available_days INTEGER NOT NULL,
  workout_duration INTEGER NOT NULL,
  focus_areas TEXT[],
  limitations TEXT,
  equipment TEXT[],
  ai_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  generated_profile_id UUID REFERENCES public.workout_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  ai_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de configurações de IA do usuário
CREATE TABLE public.user_ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  insights_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  form_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fit_ai_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies para workout_profiles
CREATE POLICY "Users can manage their own profiles" 
ON public.workout_profiles 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies para profile_workouts
CREATE POLICY "Users can manage their own workouts" 
ON public.profile_workouts 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies para profile_exercises
CREATE POLICY "Users can manage their own exercises" 
ON public.profile_exercises 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies para fit_ai_forms
CREATE POLICY "Users can manage their own forms" 
ON public.fit_ai_forms 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies para user_ai_settings
CREATE POLICY "Users can manage their own AI settings" 
ON public.user_ai_settings 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_workout_profiles_updated_at
  BEFORE UPDATE ON public.workout_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_ai_settings_updated_at
  BEFORE UPDATE ON public.user_ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();