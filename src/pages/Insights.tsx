import { useState, useEffect } from 'react';
import { 
  Sparkles, TrendingUp, AlertTriangle, Award, 
  ChevronRight, Brain, Loader2, BarChart3,
  Zap, Target, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIInsight } from '@/types/workout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const InsightCard = ({ insight }: { insight: AIInsight }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const iconMap = {
    progress: TrendingUp,
    recommendation: Sparkles,
    warning: AlertTriangle,
    achievement: Award
  };
  
  const colorMap = {
    progress: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30',
    recommendation: 'text-primary bg-primary/10 border-primary/30',
    warning: 'text-neon-orange bg-neon-orange/10 border-neon-orange/30',
    achievement: 'text-accent bg-accent/10 border-accent/30'
  };

  const Icon = iconMap[insight.type];
  const colors = colorMap[insight.type];

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary/50' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${colors} flex items-center justify-center shrink-0`}>
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{insight.title}</h3>
            <p className={`text-xs text-muted-foreground mt-1 ${!isExpanded && 'line-clamp-2'}`}>
              {insight.content}
            </p>
            
            {isExpanded && insight.metrics && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {insight.metrics.map((metric, idx) => (
                  <div key={idx} className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-display font-bold">{metric.value}</span>
                      {metric.trend && (
                        <span className={`text-xs ${
                          metric.trend === 'up' ? 'text-primary' : 
                          metric.trend === 'down' ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <ChevronRight 
            size={18} 
            className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const InsightsPage = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeekWorkouts: 0,
    totalMinutes: 0,
    averageSessionTime: 0,
    streak: 0,
    exercisesCompleted: 0,
    weeklyProgress: [0, 0, 0, 0, 0, 0, 0]
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    fetchSavedInsights();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (sessions && sessions.length > 0) {
        const totalWorkouts = sessions.length;
        const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
        const exercisesCompleted = sessions.reduce((acc, s) => acc + s.exercises_completed, 0);
        
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        
        const thisWeekWorkouts = sessions.filter(
          s => new Date(s.completed_at) >= weekStart
        ).length;

        setStats({
          totalWorkouts,
          thisWeekWorkouts,
          totalMinutes,
          averageSessionTime: totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0,
          streak: calculateStreak(sessions),
          exercisesCompleted,
          weeklyProgress: calculateWeeklyProgress(sessions)
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const calculateStreak = (sessions: any[]) => {
    if (!sessions.length) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasWorkout = sessions.some(s => 
        s.completed_at.split('T')[0] === dateStr
      );
      
      if (hasWorkout) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  };

  const calculateWeeklyProgress = (sessions: any[]) => {
    const progress = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    sessions.forEach(session => {
      const sessionDate = new Date(session.completed_at);
      if (sessionDate >= weekStart) {
        const dayIndex = sessionDate.getDay();
        progress[dayIndex] = Math.min(100, progress[dayIndex] + 50);
      }
    });

    return progress;
  };

  const fetchSavedInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setInsights(data.map(d => ({
          id: d.id,
          date: d.created_at,
          type: d.type as any,
          title: d.title,
          content: d.content,
          metrics: d.metrics as any
        })));
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const generateInsights = async () => {
    setIsGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(20);

      const workoutData = {
        ...stats,
        recentSessions: sessions?.map(s => ({
          dayName: s.day_name,
          duration: s.duration,
          exercisesCompleted: s.exercises_completed,
          date: s.completed_at
        })) || []
      };

      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { workoutData }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data.error) {
        if (data.error.includes('Rate limit')) {
          toast({
            title: 'Limite atingido',
            description: 'Tente novamente em alguns segundos',
            variant: 'destructive',
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      const newInsights: AIInsight[] = data.insights.map((insight: any, idx: number) => ({
        id: `${Date.now()}-${idx}`,
        date: new Date().toISOString(),
        type: insight.type,
        title: insight.title,
        content: insight.content,
        metrics: insight.metrics
      }));

      // Save insights to database
      for (const insight of newInsights) {
        await supabase.from('ai_insights').insert({
          user_id: user.id,
          type: insight.type,
          title: insight.title,
          content: insight.content,
          metrics: insight.metrics
        });
      }

      setInsights(newInsights);
      
      toast({
        title: '✨ Insights Gerados!',
        description: 'Análise completa dos seus treinos.',
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao gerar insights. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-neon">
            <Brain size={32} className="text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-display font-bold">Insights IA</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Análise inteligente do seu desempenho com recomendações personalizadas
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="p-3">
            <BarChart3 size={20} className="mx-auto text-primary mb-1" />
            <p className="text-lg font-display font-bold">{stats.totalWorkouts}</p>
            <p className="text-[10px] text-muted-foreground">Treinos</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <Zap size={20} className="mx-auto text-neon-orange mb-1" />
            <p className="text-lg font-display font-bold">{stats.streak}</p>
            <p className="text-[10px] text-muted-foreground">Sequência</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <Target size={20} className="mx-auto text-accent mb-1" />
            <p className="text-lg font-display font-bold">{Math.round((stats.exercisesCompleted / Math.max(stats.totalWorkouts * 10, 1)) * 100)}%</p>
            <p className="text-[10px] text-muted-foreground">Conclusão</p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <Button 
        className="w-full" 
        size="xl"
        onClick={generateInsights}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Analisando dados...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Gerar Insights com IA
          </>
        )}
      </Button>

      {/* Insights List */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Análise de {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
          {insights.map((insight, index) => (
            <div 
              key={insight.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className="animate-fade-in"
            >
              <InsightCard insight={insight} />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {insights.length === 0 && !isGenerating && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Sparkles size={40} className="mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Clique no botão acima para gerar<br />insights personalizados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
