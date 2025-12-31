-- Adicionar campo de visibilidade pública na tabela user_gamification
ALTER TABLE public.user_gamification ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE public.user_gamification ADD COLUMN IF NOT EXISTS display_name text;

-- Criar política para permitir que usuários vejam perfis públicos
CREATE POLICY "Anyone can view public gamification profiles"
ON public.user_gamification
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- Inserir conquistas padrão
INSERT INTO public.achievements (key, name, description, icon, category, xp_reward) VALUES
('first_workout', 'Primeiro Passo', 'Complete seu primeiro treino', 'star', 'milestone', 50),
('streak_3', 'Consistente', '3 dias seguidos de treino', 'flame', 'streak', 75),
('streak_7', 'Determinado', '7 dias seguidos de treino', 'flame', 'streak', 150),
('streak_30', 'Imparável', '30 dias seguidos de treino', 'crown', 'streak', 500),
('workouts_10', 'Dedicado', 'Complete 10 treinos', 'target', 'milestone', 100),
('workouts_50', 'Atleta', 'Complete 50 treinos', 'medal', 'milestone', 300),
('workouts_100', 'Lenda', 'Complete 100 treinos', 'trophy', 'milestone', 500),
('hours_10', 'Foco Total', '10 horas de treino', 'zap', 'workout', 150),
('hours_50', 'Guerreiro', '50 horas de treino', 'zap', 'workout', 400),
('first_goal', 'Objetivo Definido', 'Crie sua primeira meta', 'target', 'goal', 25),
('goal_achieved', 'Meta Batida', 'Alcance uma meta', 'award', 'goal', 100)
ON CONFLICT (key) DO NOTHING;