import { useState, useEffect, useCallback } from 'react';
import { 
  Target, Plus, Trash2, Check, TrendingUp, 
  TrendingDown, Calendar, AlertCircle, Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AutoGoalSuggestions } from '@/components/AutoGoalSuggestions';

interface Goal {
  id: string;
  type: string;
  target_value: number;
  start_value: number | null;
  deadline: string | null;
  achieved: boolean;
  achieved_at: string | null;
  created_at: string;
}

const GOAL_TYPES = [
  { id: 'weight_loss', label: 'Perder Peso', unit: 'kg', icon: TrendingDown },
  { id: 'weight_gain', label: 'Ganhar Peso', unit: 'kg', icon: TrendingUp },
  { id: 'waist', label: 'Reduzir Cintura', unit: 'cm', icon: TrendingDown },
  { id: 'chest', label: 'Aumentar Peito', unit: 'cm', icon: TrendingUp },
  { id: 'biceps', label: 'Aumentar Bíceps', unit: 'cm', icon: TrendingUp },
  { id: 'workouts', label: 'Treinos por Semana', unit: 'treinos', icon: Target },
];

export const GoalsPage = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentValues, setCurrentValues] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [newGoal, setNewGoal] = useState({
    type: '',
    target_value: '',
    start_value: '',
    deadline: ''
  });

  const fetchGoals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
    fetchCurrentValues();
  }, [fetchGoals]);

  const handleGoalCreated = () => {
    fetchGoals();
    setRefreshKey(prev => prev + 1);
  };

  const fetchCurrentValues = async () => {
    try {
      // Get latest weight
      const { data: weightData } = await supabase
        .from('weight_records')
        .select('weight')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get latest measurements
      const { data: measureData } = await supabase
        .from('body_measurements')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get workouts this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: workoutCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', weekAgo.toISOString());

      setCurrentValues({
        weight_loss: weightData?.weight || 0,
        weight_gain: weightData?.weight || 0,
        waist: measureData?.waist || 0,
        chest: measureData?.chest || 0,
        biceps: measureData?.biceps || 0,
        workouts: workoutCount || 0,
      });
    } catch (error) {
      console.error('Error fetching current values:', error);
    }
  };

  const createGoal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          type: newGoal.type,
          target_value: parseFloat(newGoal.target_value),
          start_value: newGoal.start_value ? parseFloat(newGoal.start_value) : null,
          deadline: newGoal.deadline || null
        })
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [data, ...prev]);
      setShowCreateDialog(false);
      setNewGoal({ type: '', target_value: '', start_value: '', deadline: '' });
      
      toast({
        title: '🎯 Meta criada!',
        description: 'Boa sorte na sua jornada!',
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a meta',
        variant: 'destructive'
      });
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== id));
      toast({ title: 'Meta excluída' });
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const toggleAchieved = async (goal: Goal) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ 
          achieved: !goal.achieved,
          achieved_at: !goal.achieved ? new Date().toISOString() : null
        })
        .eq('id', goal.id);

      if (error) throw error;

      setGoals(prev => prev.map(g => 
        g.id === goal.id 
          ? { ...g, achieved: !g.achieved, achieved_at: !g.achieved ? new Date().toISOString() : null }
          : g
      ));

      if (!goal.achieved) {
        toast({
          title: '🏆 Meta alcançada!',
          description: 'Parabéns pela conquista!',
        });
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const getProgress = (goal: Goal) => {
    const current = currentValues[goal.type] || 0;
    const start = goal.start_value || current;
    const target = goal.target_value;
    
    if (goal.type.includes('loss') || goal.type === 'waist') {
      // For reduction goals, progress is inverted
      if (start <= target) return 100;
      const progress = ((start - current) / (start - target)) * 100;
      return Math.min(100, Math.max(0, progress));
    } else {
      // For gain goals
      if (current >= target) return 100;
      const progress = ((current - start) / (target - start)) * 100;
      return Math.min(100, Math.max(0, progress));
    }
  };

  const getGoalTypeInfo = (type: string) => {
    return GOAL_TYPES.find(t => t.id === type) || GOAL_TYPES[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeGoals = goals.filter(g => !g.achieved);
  const achievedGoals = goals.filter(g => g.achieved);

  return (
    <div className="space-y-6 pb-20">
      {/* Auto Suggestions */}
      <AutoGoalSuggestions key={refreshKey} onGoalCreated={handleGoalCreated} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Metas</h1>
          <p className="text-muted-foreground text-sm">Defina e acompanhe seus objetivos</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Meta</Label>
                <Select
                  value={newGoal.type}
                  onValueChange={(v) => setNewGoal(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor Inicial (opcional)</Label>
                  <Input
                    type="number"
                    placeholder={`Ex: ${currentValues[newGoal.type] || '70'}`}
                    value={newGoal.start_value}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, start_value: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Valor Alvo *</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 65"
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label>Prazo (opcional)</Label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
              
              <Button 
                onClick={createGoal} 
                disabled={!newGoal.type || !newGoal.target_value}
                className="w-full"
              >
                Criar Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target size={20} className="text-primary" />
            Metas Ativas ({activeGoals.length})
          </h2>
          {activeGoals.map((goal) => {
            const typeInfo = getGoalTypeInfo(goal.type);
            const Icon = typeInfo.icon;
            const progress = getProgress(goal);
            const current = currentValues[goal.type] || 0;

            return (
              <Card key={goal.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{typeInfo.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          Atual: {current} {typeInfo.unit} → Meta: {goal.target_value} {typeInfo.unit}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAchieved(goal)}
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 size={16} className="text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {goal.deadline && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      Prazo: {format(new Date(goal.deadline), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Achieved Goals */}
      {achievedGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy size={20} className="text-yellow-500" />
            Metas Alcançadas ({achievedGoals.length})
          </h2>
          {achievedGoals.map((goal) => {
            const typeInfo = getGoalTypeInfo(goal.type);

            return (
              <Card key={goal.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <Trophy size={20} className="text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold line-through">{typeInfo.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          Meta: {goal.target_value} {typeInfo.unit}
                        </p>
                        {goal.achieved_at && (
                          <p className="text-xs text-green-500">
                            Alcançada em {format(new Date(goal.achieved_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 size={16} className="text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Nenhuma meta definida</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crie metas para acompanhar seu progresso
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus size={16} className="mr-2" />
            Criar Primeira Meta
          </Button>
        </Card>
      )}
    </div>
  );
};
