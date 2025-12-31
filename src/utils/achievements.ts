import { supabase } from '@/integrations/supabase/client';

interface AchievementCheck {
  totalWorkouts: number;
  streakBest: number;
  totalMinutes: number;
  hasGoals: boolean;
  hasAchievedGoal: boolean;
}

const ACHIEVEMENT_CRITERIA: Record<string, (stats: AchievementCheck) => boolean> = {
  'first_workout': (stats) => stats.totalWorkouts >= 1,
  'streak_3': (stats) => stats.streakBest >= 3,
  'streak_7': (stats) => stats.streakBest >= 7,
  'streak_30': (stats) => stats.streakBest >= 30,
  'workouts_10': (stats) => stats.totalWorkouts >= 10,
  'workouts_50': (stats) => stats.totalWorkouts >= 50,
  'workouts_100': (stats) => stats.totalWorkouts >= 100,
  'hours_10': (stats) => stats.totalMinutes >= 600,
  'hours_50': (stats) => stats.totalMinutes >= 3000,
  'first_goal': (stats) => stats.hasGoals,
  'goal_achieved': (stats) => stats.hasAchievedGoal,
};

export const checkAndUnlockAchievements = async (userId: string): Promise<{
  newAchievements: Array<{ name: string; xp_reward: number }>;
  leveledUp: boolean;
  newLevel: number;
}> => {
  const result = {
    newAchievements: [] as Array<{ name: string; xp_reward: number }>,
    leveledUp: false,
    newLevel: 0
  };

  try {
    // Buscar dados do usuário
    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!gamification) return result;

    // Buscar todas as conquistas
    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*');

    if (!allAchievements) return result;

    // Buscar conquistas já desbloqueadas
    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const unlockedIds = new Set((userAchievements || []).map(a => a.achievement_id));

    // Buscar metas do usuário
    const { data: goals } = await supabase
      .from('goals')
      .select('id, achieved')
      .eq('user_id', userId);

    const hasGoals = (goals || []).length > 0;
    const hasAchievedGoal = (goals || []).some(g => g.achieved);

    // Verificar estatísticas
    const stats: AchievementCheck = {
      totalWorkouts: gamification.total_workouts,
      streakBest: gamification.streak_best,
      totalMinutes: gamification.total_minutes,
      hasGoals,
      hasAchievedGoal
    };

    // Verificar cada conquista
    let totalNewXP = 0;

    for (const achievement of allAchievements) {
      // Pular se já desbloqueada
      if (unlockedIds.has(achievement.id)) continue;

      // Verificar critério
      const checkFn = ACHIEVEMENT_CRITERIA[achievement.key];
      if (!checkFn || !checkFn(stats)) continue;

      // Desbloquear conquista
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id
        });

      if (!error) {
        result.newAchievements.push({
          name: achievement.name,
          xp_reward: achievement.xp_reward
        });
        totalNewXP += achievement.xp_reward;
      }
    }

    // Atualizar XP se houver novas conquistas
    if (totalNewXP > 0) {
      const newXP = gamification.xp + totalNewXP;
      const newLevel = calculateLevel(newXP);
      
      if (newLevel > gamification.level) {
        result.leveledUp = true;
        result.newLevel = newLevel;
      }

      await supabase
        .from('user_gamification')
        .update({
          xp: newXP,
          level: newLevel
        })
        .eq('user_id', userId);
    }

    return result;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return result;
  }
};

export const updateGamificationAfterWorkout = async (
  userId: string,
  workoutMinutes: number
): Promise<{
  newAchievements: Array<{ name: string; xp_reward: number }>;
  leveledUp: boolean;
  newLevel: number;
  xpGained: number;
}> => {
  const result = {
    newAchievements: [] as Array<{ name: string; xp_reward: number }>,
    leveledUp: false,
    newLevel: 0,
    xpGained: 0
  };

  try {
    // Buscar dados atuais
    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!gamification) return result;

    // Calcular XP do treino (10 XP por minuto)
    const workoutXP = Math.floor(workoutMinutes / 6) * 10;
    result.xpGained = workoutXP;

    // Calcular streak atual
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(30);

    const currentStreak = calculateCurrentStreak(sessions || []);
    const newStreakBest = Math.max(gamification.streak_best, currentStreak);

    // Atualizar gamificação
    const newXP = gamification.xp + workoutXP;
    const newLevel = calculateLevel(newXP);

    if (newLevel > gamification.level) {
      result.leveledUp = true;
      result.newLevel = newLevel;
    }

    await supabase
      .from('user_gamification')
      .update({
        xp: newXP,
        level: newLevel,
        total_workouts: gamification.total_workouts + 1,
        total_minutes: gamification.total_minutes + workoutMinutes,
        streak_best: newStreakBest
      })
      .eq('user_id', userId);

    // Verificar conquistas
    const achievementResult = await checkAndUnlockAchievements(userId);
    result.newAchievements = achievementResult.newAchievements;

    // Se level up veio das conquistas
    if (achievementResult.leveledUp) {
      result.leveledUp = true;
      result.newLevel = achievementResult.newLevel;
    }

    return result;
  } catch (error) {
    console.error('Error updating gamification:', error);
    return result;
  }
};

const calculateLevel = (xp: number): number => {
  const levels = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000, 10000];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i]) {
      return i + 1;
    }
  }
  return 1;
};

const calculateCurrentStreak = (sessions: Array<{ completed_at: string }>): number => {
  if (sessions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedDates = sessions
    .map(s => {
      const date = new Date(s.completed_at);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .filter((date, index, self) => self.indexOf(date) === index)
    .sort((a, b) => b - a);

  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = today.getTime() - (i * oneDayMs);
    
    if (sortedDates[i] === expectedDate) {
      streak++;
    } else if (i === 0 && sortedDates[i] === expectedDate - oneDayMs) {
      // Permitir que o streak continue se treinou ontem mas não hoje ainda
      streak++;
    } else {
      break;
    }
  }

  return streak;
};
