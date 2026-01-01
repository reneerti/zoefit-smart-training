import { useState, useEffect } from 'react';
import { 
  Sparkles, TrendingDown, TrendingUp, Target, 
  Plus, ChevronRight, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SuggestedGoal {
  type: string;
  label: string;
  targetValue: number;
  currentValue: number;
  startValue: number;
  unit: string;
  reason: string;
  icon: typeof TrendingDown;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
}

interface HistoricalData {
  weights: { weight: number; recorded_at: string }[];
  measurements: { 
    chest?: number; 
    waist?: number; 
    biceps?: number; 
    hips?: number;
    recorded_at: string;
  }[];
  workouts: { completed_at: string }[];
}

export const AutoGoalSuggestions = ({ 
  onGoalCreated 
}: { 
  onGoalCreated: () => void 
}) => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<SuggestedGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState<string | null>(null);

  useEffect(() => {
    analyzeTrendsAndGenerateSuggestions();
  }, []);

  const analyzeTrendsAndGenerateSuggestions = async () => {
    try {
      // Fetch historical data
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const [weightsRes, measurementsRes, workoutsRes, existingGoalsRes] = await Promise.all([
        supabase
          .from('weight_records')
          .select('weight, recorded_at')
          .gte('recorded_at', threeMonthsAgo.toISOString())
          .order('recorded_at', { ascending: true }),
        supabase
          .from('body_measurements')
          .select('chest, waist, biceps, hips, recorded_at')
          .gte('recorded_at', threeMonthsAgo.toISOString())
          .order('recorded_at', { ascending: true }),
        supabase
          .from('workout_sessions')
          .select('completed_at')
          .gte('completed_at', threeMonthsAgo.toISOString())
          .order('completed_at', { ascending: true }),
        supabase
          .from('goals')
          .select('type, achieved')
          .eq('achieved', false)
      ]);

      const historicalData: HistoricalData = {
        weights: weightsRes.data || [],
        measurements: measurementsRes.data || [],
        workouts: workoutsRes.data || []
      };

      const existingGoalTypes = (existingGoalsRes.data || []).map(g => g.type);
      const generatedSuggestions = generateSuggestions(historicalData, existingGoalTypes);
      setSuggestions(generatedSuggestions);
    } catch (error) {
      console.error('Error analyzing trends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestions = (
    data: HistoricalData, 
    existingGoalTypes: string[]
  ): SuggestedGoal[] => {
    const suggestions: SuggestedGoal[] = [];
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    const defaultDeadline = threeMonthsFromNow.toISOString().split('T')[0];

    // Analyze weight trend
    if (data.weights.length >= 2) {
      const firstWeight = data.weights[0].weight;
      const lastWeight = data.weights[data.weights.length - 1].weight;
      const weightChange = lastWeight - firstWeight;
      const avgWeeklyChange = weightChange / Math.max(1, data.weights.length);

      // If losing weight and not already have a weight loss goal
      if (weightChange < 0 && !existingGoalTypes.includes('weight_loss')) {
        const targetWeight = Math.max(lastWeight - 5, lastWeight * 0.95);
        suggestions.push({
          type: 'weight_loss',
          label: 'Perder Peso',
          targetValue: Math.round(targetWeight * 10) / 10,
          currentValue: lastWeight,
          startValue: lastWeight,
          unit: 'kg',
          reason: `Você já perdeu ${Math.abs(weightChange).toFixed(1)}kg. Continue o bom trabalho!`,
          icon: TrendingDown,
          priority: 'high',
          deadline: defaultDeadline
        });
      }

      // If gaining weight steadily
      if (weightChange > 0 && !existingGoalTypes.includes('weight_gain')) {
        const targetWeight = lastWeight + 3;
        suggestions.push({
          type: 'weight_gain',
          label: 'Ganhar Massa',
          targetValue: Math.round(targetWeight * 10) / 10,
          currentValue: lastWeight,
          startValue: lastWeight,
          unit: 'kg',
          reason: `Tendência de ganho detectada (+${weightChange.toFixed(1)}kg). Defina uma meta!`,
          icon: TrendingUp,
          priority: 'medium',
          deadline: defaultDeadline
        });
      }
    }

    // Analyze measurements
    if (data.measurements.length >= 2) {
      const firstMeasure = data.measurements[0];
      const lastMeasure = data.measurements[data.measurements.length - 1];

      // Waist reduction
      if (firstMeasure.waist && lastMeasure.waist) {
        const waistChange = (lastMeasure.waist as number) - (firstMeasure.waist as number);
        if (waistChange < 0 && !existingGoalTypes.includes('waist')) {
          suggestions.push({
            type: 'waist',
            label: 'Reduzir Cintura',
            targetValue: Math.round(((lastMeasure.waist as number) - 3) * 10) / 10,
            currentValue: lastMeasure.waist as number,
            startValue: lastMeasure.waist as number,
            unit: 'cm',
            reason: `Cintura reduziu ${Math.abs(waistChange).toFixed(1)}cm. Mantenha o ritmo!`,
            icon: TrendingDown,
            priority: 'high',
            deadline: defaultDeadline
          });
        }
      }

      // Biceps growth
      if (firstMeasure.biceps && lastMeasure.biceps) {
        const bicepsChange = (lastMeasure.biceps as number) - (firstMeasure.biceps as number);
        if (bicepsChange > 0 && !existingGoalTypes.includes('biceps')) {
          suggestions.push({
            type: 'biceps',
            label: 'Aumentar Bíceps',
            targetValue: Math.round(((lastMeasure.biceps as number) + 2) * 10) / 10,
            currentValue: lastMeasure.biceps as number,
            startValue: lastMeasure.biceps as number,
            unit: 'cm',
            reason: `Bíceps cresceu ${bicepsChange.toFixed(1)}cm. Continue evoluindo!`,
            icon: TrendingUp,
            priority: 'medium',
            deadline: defaultDeadline
          });
        }
      }

      // Chest growth
      if (firstMeasure.chest && lastMeasure.chest) {
        const chestChange = (lastMeasure.chest as number) - (firstMeasure.chest as number);
        if (chestChange > 0 && !existingGoalTypes.includes('chest')) {
          suggestions.push({
            type: 'chest',
            label: 'Aumentar Peito',
            targetValue: Math.round(((lastMeasure.chest as number) + 3) * 10) / 10,
            currentValue: lastMeasure.chest as number,
            startValue: lastMeasure.chest as number,
            unit: 'cm',
            reason: `Peito aumentou ${chestChange.toFixed(1)}cm. Defina uma meta!`,
            icon: TrendingUp,
            priority: 'medium',
            deadline: defaultDeadline
          });
        }
      }
    }

    // Analyze workout frequency
    if (data.workouts.length >= 4 && !existingGoalTypes.includes('workouts')) {
      const weeklyAverage = calculateWeeklyWorkoutAverage(data.workouts);
      if (weeklyAverage >= 2) {
        suggestions.push({
          type: 'workouts',
          label: 'Treinos por Semana',
          targetValue: Math.min(Math.ceil(weeklyAverage) + 1, 6),
          currentValue: Math.round(weeklyAverage),
          startValue: Math.round(weeklyAverage),
          unit: 'treinos',
          reason: `Média de ${weeklyAverage.toFixed(1)} treinos/semana. Aumente o ritmo!`,
          icon: Target,
          priority: 'low',
          deadline: defaultDeadline
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  const calculateWeeklyWorkoutAverage = (workouts: { completed_at: string }[]): number => {
    if (workouts.length === 0) return 0;
    
    const firstDate = new Date(workouts[0].completed_at);
    const lastDate = new Date(workouts[workouts.length - 1].completed_at);
    const weeks = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    return workouts.length / weeks;
  };

  const createGoalFromSuggestion = async (suggestion: SuggestedGoal) => {
    try {
      setIsCreating(suggestion.type);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          type: suggestion.type,
          target_value: suggestion.targetValue,
          start_value: suggestion.startValue,
          deadline: suggestion.deadline
        });

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.type !== suggestion.type));
      onGoalCreated();
      
      toast({
        title: '🎯 Meta criada automaticamente!',
        description: `${suggestion.label}: ${suggestion.targetValue} ${suggestion.unit}`,
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a meta',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">Analisando seus dados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          Metas Sugeridas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Baseadas no seu progresso recente
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <div
              key={suggestion.type}
              className="flex items-center justify-between p-3 rounded-lg bg-background border"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  suggestion.priority === 'high' 
                    ? 'bg-green-500/10 text-green-500'
                    : suggestion.priority === 'medium'
                    ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{suggestion.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.targetValue} {suggestion.unit}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {suggestion.reason}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0"
                disabled={isCreating === suggestion.type}
                onClick={() => createGoalFromSuggestion(suggestion)}
              >
                {isCreating === suggestion.type ? (
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Plus size={16} className="mr-1" />
                    Criar
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
