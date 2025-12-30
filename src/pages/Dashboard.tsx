import { useState, useEffect } from 'react';
import { 
  Flame, Timer, Trophy, Target, TrendingUp, Calendar, 
  Dumbbell, Activity, ChevronRight, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkoutStore } from '@/store/workoutStore';
import { workoutPlan } from '@/data/workoutData';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subtitle,
  color = 'primary'
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subtitle?: string;
  color?: 'primary' | 'accent' | 'orange' | 'cyan';
}) => {
  const colors = {
    primary: 'text-primary bg-primary/10',
    accent: 'text-accent bg-accent/10',
    orange: 'text-neon-orange bg-neon-orange/10',
    cyan: 'text-neon-cyan bg-neon-cyan/10',
  };

  return (
    <Card className="relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 ${colors[color]} rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity`} />
      <CardContent className="p-4 relative">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
          <Icon size={20} />
        </div>
        <p className="text-2xl font-display font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subtitle && <p className="text-xs text-primary mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
};

const TodayWorkout = () => {
  const navigate = useNavigate();
  const dayIndex = new Date().getDay();
  const dayMap: Record<number, string> = {
    1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex'
  };
  const todayId = dayMap[dayIndex];
  const todayWorkout = workoutPlan.find(d => d.id === todayId);
  const isRestDay = !todayWorkout;

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 ${isRestDay ? 'bg-secondary/30' : todayWorkout?.type === 'hiit' ? 'bg-neon-orange/5' : 'bg-primary/5'}`} />
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Treino de Hoje
          </CardTitle>
          {!isRestDay && (
            <span className={`text-xs px-2 py-1 rounded-full ${todayWorkout?.type === 'hiit' ? 'bg-neon-orange/20 text-neon-orange' : 'bg-primary/20 text-primary'}`}>
              {todayWorkout?.type === 'hiit' ? '🔥 HIIT' : '💪 Força'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative pt-0">
        {isRestDay ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">😴</p>
            <p className="text-lg font-semibold">Dia de Descanso</p>
            <p className="text-sm text-muted-foreground">Recupere-se para o próximo treino!</p>
          </div>
        ) : todayWorkout && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{todayWorkout.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Timer size={14} />
                  {todayWorkout.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Dumbbell size={14} />
                  {todayWorkout.blocks.reduce((acc, b) => acc + b.exercises.length, 0)} exercícios
                </span>
              </div>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/workout')}
            >
              Iniciar Treino
              <ChevronRight size={18} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const WeekProgress = () => {
  const { stats } = useWorkoutStore();
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date().getDay();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity size={18} className="text-primary" />
          Progresso Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between gap-1">
          {days.map((day, index) => {
            const progress = stats.weeklyProgress[index] || 0;
            const isToday = index === today;
            const isPast = index < today;
            
            return (
              <div key={day} className="flex flex-col items-center gap-2 flex-1">
                <div className="relative w-full h-20 bg-secondary/50 rounded-lg overflow-hidden">
                  <div 
                    className={`absolute bottom-0 w-full transition-all duration-500 rounded-lg ${
                      isToday ? 'bg-gradient-primary' : isPast ? 'bg-primary/60' : 'bg-muted'
                    }`}
                    style={{ height: `${progress}%` }}
                  />
                  {progress > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                      {progress}%
                    </span>
                  )}
                </div>
                <span className={`text-xs ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export const Dashboard = () => {
  const { stats, sessions } = useWorkoutStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Acompanhe seu progresso
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/insights')}>
          <Sparkles size={16} />
          Ver Insights IA
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard 
          icon={Flame} 
          label="Treinos" 
          value={stats.totalWorkouts}
          subtitle={`${stats.thisWeekWorkouts} esta semana`}
          color="orange"
        />
        <StatCard 
          icon={Timer} 
          label="Tempo Total" 
          value={`${Math.floor(stats.totalMinutes / 60)}h`}
          subtitle={`~${stats.averageSessionTime}min/sessão`}
          color="cyan"
        />
        <StatCard 
          icon={Trophy} 
          label="Sequência" 
          value={stats.streak}
          subtitle="dias seguidos"
          color="primary"
        />
        <StatCard 
          icon={Target} 
          label="Exercícios" 
          value={stats.exercisesCompleted}
          subtitle="completados"
          color="accent"
        />
      </div>

      {/* Today's Workout */}
      <TodayWorkout />

      {/* Week Progress */}
      <WeekProgress />

      {/* Recent Sessions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp size={18} className="text-primary" />
              Treinos Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
              Ver todos
              <ChevronRight size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {sessions.slice(0, 3).map((session, index) => (
            <div 
              key={session.id}
              className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Dumbbell size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{session.dayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{session.duration}min</p>
                <p className="text-xs text-primary">
                  {session.exercisesCompleted}/{session.totalExercises} exercícios
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
