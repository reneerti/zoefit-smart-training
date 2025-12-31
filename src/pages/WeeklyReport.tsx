import { useState, useEffect } from 'react';
import { 
  TrendingUp, Trophy, Target, Flame, Timer, 
  Calendar, ChevronLeft, ChevronRight, Loader2,
  Award, Zap, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeeklyStats {
  totalWorkouts: number;
  totalMinutes: number;
  totalExercises: number;
  xpGained: number;
  goalsAchieved: number;
  achievementsUnlocked: number;
  streak: number;
  bestDay: string | null;
}

export const WeeklyReportPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [stats, setStats] = useState<WeeklyStats>({
    totalWorkouts: 0,
    totalMinutes: 0,
    totalExercises: 0,
    xpGained: 0,
    goalsAchieved: 0,
    achievementsUnlocked: 0,
    streak: 0,
    bestDay: null
  });

  const currentWeekStart = startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 });

  useEffect(() => {
    fetchWeeklyStats();
  }, [weekOffset]);

  const fetchWeeklyStats = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekStart = currentWeekStart.toISOString();
      const weekEnd = currentWeekEnd.toISOString();

      // Fetch workout sessions for the week
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', weekStart)
        .lte('completed_at', weekEnd);

      // Fetch goals achieved
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('achieved', true)
        .gte('achieved_at', weekStart)
        .lte('achieved_at', weekEnd);

      // Fetch achievements unlocked
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .gte('unlocked_at', weekStart)
        .lte('unlocked_at', weekEnd);

      // Fetch gamification data
      const { data: gamification } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Calculate stats
      const totalWorkouts = sessions?.length || 0;
      const totalMinutes = sessions?.reduce((acc, s) => acc + (s.duration || 0), 0) || 0;
      const totalExercises = sessions?.reduce((acc, s) => acc + (s.exercises_completed || 0), 0) || 0;
      
      // XP gained approximation (50 base + 5 per minute)
      const xpGained = sessions?.reduce((acc, s) => acc + 50 + (s.duration * 5), 0) || 0;

      // Find best day
      const dayCount: Record<string, number> = {};
      sessions?.forEach(s => {
        const day = format(new Date(s.completed_at), 'EEEE', { locale: ptBR });
        dayCount[day] = (dayCount[day] || 0) + 1;
      });
      const bestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

      setStats({
        totalWorkouts,
        totalMinutes,
        totalExercises,
        xpGained,
        goalsAchieved: goals?.length || 0,
        achievementsUnlocked: achievements?.length || 0,
        streak: gamification?.streak_best || 0,
        bestDay
      });
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const weekProgress = Math.min((stats.totalWorkouts / 5) * 100, 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Relatório Semanal</h1>
          <p className="text-muted-foreground text-sm">
            {format(currentWeekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(currentWeekEnd, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset(prev => prev + 1)}>
            <ChevronLeft size={20} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
            disabled={weekOffset === 0}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* Week Summary Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-primary p-6">
          <div className="flex items-center justify-between text-primary-foreground">
            <div>
              <p className="text-sm opacity-80">Treinos Completados</p>
              <p className="text-4xl font-display font-bold">{stats.totalWorkouts}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Meta Semanal</p>
              <p className="text-2xl font-display font-bold">5 treinos</p>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={weekProgress} className="h-2 bg-primary-foreground/20" />
            <p className="text-xs text-primary-foreground/80 mt-1">{weekProgress.toFixed(0)}% concluído</p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-orange/10 flex items-center justify-center">
                <Timer size={20} className="text-neon-orange" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo Total</p>
                <p className="text-xl font-display font-bold">{stats.totalMinutes}min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Flame size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Exercícios</p>
                <p className="text-xl font-display font-bold">{stats.totalExercises}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Zap size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">XP Ganho</p>
                <p className="text-xl font-display font-bold">+{stats.xpGained}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                <Star size={20} className="text-neon-cyan" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Melhor Streak</p>
                <p className="text-xl font-display font-bold">{stats.streak} dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements & Goals */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-neon-orange mx-auto mb-2" />
            <p className="text-2xl font-display font-bold">{stats.achievementsUnlocked}</p>
            <p className="text-xs text-muted-foreground">Conquistas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-display font-bold">{stats.goalsAchieved}</p>
            <p className="text-xs text-muted-foreground">Metas Atingidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Best Day */}
      {stats.bestDay && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Calendar size={24} className="text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Melhor dia da semana</p>
                <p className="text-lg font-semibold capitalize">{stats.bestDay}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {stats.totalWorkouts === 0 && (
        <Card className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Nenhum treino nesta semana</h3>
          <p className="text-sm text-muted-foreground">
            {weekOffset === 0 
              ? 'Comece a treinar para ver suas estatísticas aqui!'
              : 'Não há registros de treino para esta semana.'
            }
          </p>
        </Card>
      )}
    </div>
  );
};
