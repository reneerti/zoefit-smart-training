-- Create goals table for weight and measurement targets
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('weight', 'chest', 'waist', 'hips', 'biceps', 'thighs')),
  target_value DECIMAL(5,2) NOT NULL,
  start_value DECIMAL(5,2),
  deadline DATE,
  achieved BOOLEAN NOT NULL DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- Create progress photos table
CREATE TABLE public.progress_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  weight DECIMAL(5,2),
  notes TEXT,
  photo_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own photos" ON public.progress_photos FOR ALL USING (auth.uid() = user_id);

-- Create supplements table
CREATE TABLE public.supplements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night', 'pre_workout', 'post_workout')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own supplements" ON public.supplements FOR ALL USING (auth.uid() = user_id);

-- Create supplement logs table
CREATE TABLE public.supplement_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES public.supplements(id) ON DELETE CASCADE,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own supplement logs" ON public.supplement_logs FOR ALL USING (auth.uid() = user_id);

-- Create gamification user stats table
CREATE TABLE public.user_gamification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_best INTEGER NOT NULL DEFAULT 0,
  total_workouts INTEGER NOT NULL DEFAULT 0,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own gamification" ON public.user_gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own gamification" ON public.user_gamification FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own gamification" ON public.user_gamification FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create achievements/badges table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  category TEXT NOT NULL CHECK (category IN ('workout', 'streak', 'goal', 'social', 'milestone'))
);

-- Create user achievements junction table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (key, name, description, icon, xp_reward, category) VALUES
('first_workout', 'Primeiro Passo', 'Complete seu primeiro treino', '🎯', 50, 'workout'),
('workout_10', 'Dedicação', 'Complete 10 treinos', '💪', 100, 'milestone'),
('workout_50', 'Atleta', 'Complete 50 treinos', '🏋️', 250, 'milestone'),
('workout_100', 'Lenda', 'Complete 100 treinos', '🏆', 500, 'milestone'),
('streak_7', 'Semana Perfeita', '7 dias seguidos de treino', '🔥', 150, 'streak'),
('streak_30', 'Mês de Ferro', '30 dias seguidos de treino', '⚡', 500, 'streak'),
('goal_achieved', 'Meta Alcançada', 'Alcance sua primeira meta', '🎯', 200, 'goal'),
('first_photo', 'Documentando Progresso', 'Adicione sua primeira foto de progresso', '📸', 50, 'milestone'),
('weight_loss_5', 'Transformação', 'Perca 5kg do peso inicial', '🔻', 300, 'goal'),
('supplement_streak', 'Disciplina Total', 'Registre suplementos por 7 dias seguidos', '💊', 100, 'streak');

-- Create trigger to auto-create gamification entry on user signup
CREATE OR REPLACE FUNCTION public.create_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_gamification (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_gamification
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user_gamification();

-- Storage bucket for progress photos
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', false);

-- Storage policies for progress photos
CREATE POLICY "Users can view their own photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);