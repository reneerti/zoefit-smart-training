import { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, Check, Timer, Dumbbell, ChevronDown, 
  ChevronUp, ExternalLink, Flame, Trophy, Pause
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWorkoutStore } from '@/store/workoutStore';
import { workoutPlan } from '@/data/workoutData';
import { WorkoutDay, Exercise } from '@/types/workout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { updateGamificationAfterWorkout } from '@/utils/achievements';
import { Celebration, useCelebration } from '@/components/Celebration';

const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const MOTIVATIONAL_MESSAGES = {
  start: [
    "💪 Vamos nessa! Cada rep conta!",
    "🔥 Hora de transformar suor em resultados!",
    "⚡ Seu futuro eu vai agradecer!",
  ],
  fifteen: [
    "🏃 15 minutos já! Continue firme, você está indo muito bem!",
    "💪 Quase na metade! Sua dedicação está fazendo diferença!",
    "🔥 15 min de pura determinação! Mantenha o ritmo!",
  ],
  fifty: [
    "🏆 50 minutos de treino! Você é uma máquina!",
    "⭐ Uau! 50 min e ainda firme! Reta final!",
    "🎯 Quase 1 hora! Poucos chegam aqui, você é diferente!",
  ],
  complete: [
    "🏆 TREINO COMPLETO! Você deu tudo de si!",
    "⭐ EXCELENTE! 100% dos exercícios concluídos!",
    "🎉 PERFEITO! Você é imparável!",
  ],
  partial: [
    "✅ Bom treino! Cada exercício feito é uma vitória!",
    "💪 Treino finalizado! Amanhã você volta mais forte!",
    "👏 Parabéns por treinar! Consistência é a chave!",
  ]
};

const getRandomMessage = (type: keyof typeof MOTIVATIONAL_MESSAGES) => {
  const messages = MOTIVATIONAL_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
};

const ExerciseItem = ({ 
  exercise, 
  isCompleted, 
  onToggle,
  isActive
}: { 
  exercise: Exercise; 
  isCompleted: boolean; 
  onToggle: () => void;
  isActive: boolean;
}) => {
  return (
    <div 
      className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
        isCompleted 
          ? 'bg-primary/10 border border-primary/30' 
          : 'bg-secondary/30 hover:bg-secondary/50'
      }`}
    >
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${
          isCompleted 
            ? 'bg-primary border-primary' 
            : 'border-muted-foreground/50 hover:border-primary'
        }`}
      >
        {isCompleted && <Check size={14} className="text-primary-foreground" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium text-sm ${isCompleted && 'line-through opacity-60'}`}>
            {exercise.name}
          </span>
          {exercise.priority && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              exercise.priority === 'WHR' 
                ? 'bg-accent/20 text-accent' 
                : 'bg-neon-orange/20 text-neon-orange'
            }`}>
              {exercise.priority}
            </span>
          )}
          {exercise.videoUrl && (
            <a 
              href={exercise.videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
        <p className="text-xs text-primary font-semibold mt-0.5">
          {exercise.sets}x {exercise.reps}
        </p>
        {exercise.notes && (
          <p className="text-xs text-muted-foreground mt-0.5">{exercise.notes}</p>
        )}
      </div>
    </div>
  );
};

const WorkoutBlock = ({ 
  block, 
  completedExercises, 
  onToggle,
  isActive
}: { 
  block: { id: string; title: string; exercises: Exercise[] }; 
  completedExercises: string[];
  onToggle: (id: string) => void;
  isActive: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const completedCount = block.exercises.filter(e => completedExercises.includes(e.id)).length;
  const allCompleted = completedCount === block.exercises.length;

  return (
    <div className="border border-border/30 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-4 transition-colors ${
          allCompleted ? 'bg-primary/10' : 'bg-secondary/20 hover:bg-secondary/30'
        }`}
      >
        <div className="flex items-center gap-3">
          {allCompleted && (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check size={14} className="text-primary-foreground" />
            </div>
          )}
          <span className="font-semibold text-sm">{block.title}</span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{block.exercises.length}
          </span>
        </div>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      
      {isExpanded && (
        <div className="p-3 space-y-2 bg-card/50">
          {block.exercises.map((exercise) => (
            <ExerciseItem
              key={exercise.id}
              exercise={exercise}
              isCompleted={completedExercises.includes(exercise.id)}
              onToggle={() => onToggle(exercise.id)}
              isActive={isActive}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const WorkoutPage = () => {
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionMessage, setCompletionMessage] = useState({ title: '', description: '' });
  
  const shown15minRef = useRef(false);
  const shown50minRef = useRef(false);
  
  const { currentSession, startWorkout, endWorkout, toggleExercise } = useWorkoutStore();
  const { toast } = useToast();
  const { celebration, celebrate, closeCelebration } = useCelebration();

  // Set initial day based on current weekday
  useEffect(() => {
    const dayIndex = new Date().getDay();
    const dayMap: Record<number, string> = {
      1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex'
    };
    const todayId = dayMap[dayIndex] || 'seg';
    const day = workoutPlan.find(d => d.id === todayId) || workoutPlan[0];
    setSelectedDay(day);
  }, []);

  // Timer with pause support
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession.isActive && currentSession.startTime && !isPaused) {
      interval = setInterval(() => {
        const newElapsed = Math.floor((Date.now() - currentSession.startTime! - pausedTime) / 1000);
        setElapsedTime(newElapsed);
        
        // Check for 15 minutes milestone
        if (newElapsed >= 900 && !shown15minRef.current) {
          shown15minRef.current = true;
          toast({
            title: getRandomMessage('fifteen'),
            duration: 5000,
          });
        }
        
        // Check for 50 minutes milestone
        if (newElapsed >= 3000 && !shown50minRef.current) {
          shown50minRef.current = true;
          toast({
            title: getRandomMessage('fifty'),
            duration: 5000,
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession.isActive, currentSession.startTime, isPaused, pausedTime, toast]);

  const handleStartWorkout = () => {
    if (selectedDay) {
      startWorkout(selectedDay.id);
      shown15minRef.current = false;
      shown50minRef.current = false;
      setPausedTime(0);
      setIsPaused(false);
      toast({
        title: getRandomMessage('start'),
        duration: 3000,
      });
    }
  };

  const handleToggleExercise = (exerciseId: string) => {
    // Se o treino não foi iniciado, inicia automaticamente
    if (!currentSession.isActive && selectedDay) {
      startWorkout(selectedDay.id);
      shown15minRef.current = false;
      shown50minRef.current = false;
      setPausedTime(0);
      setIsPaused(false);
      toast({
        title: '⏱️ Treino iniciado automaticamente!',
        description: 'Bora treinar!',
        duration: 2000,
      });
    }
    
    toggleExercise(exerciseId);
  };

  const handlePauseWorkout = () => {
    if (isPaused) {
      // Retomando - adiciona o tempo pausado
      setPausedTime(prev => prev + (Date.now() - (window as any).__pauseStartTime));
      setIsPaused(false);
      toast({
        title: '▶️ Treino retomado!',
        description: 'Continue de onde parou',
        duration: 2000,
      });
    } else {
      // Pausando
      (window as any).__pauseStartTime = Date.now();
      setIsPaused(true);
      toast({
        title: '⏸️ Treino pausado',
        description: 'Descanse um pouco',
        duration: 2000,
      });
    }
  };

  const handleEndWorkout = async () => {
    const totalExercises = selectedDay?.blocks.reduce((acc, b) => acc + b.exercises.length, 0) || 0;
    const completed = currentSession.completedExercises.length;
    const isComplete = completed === totalExercises;
    const percentage = Math.round((completed / totalExercises) * 100);
    
    // Preparar mensagem de conclusão
    const message = isComplete ? getRandomMessage('complete') : getRandomMessage('partial');
    
    let evaluation = '';
    if (percentage === 100) {
      evaluation = '⭐⭐⭐⭐⭐ Treino Perfeito!';
    } else if (percentage >= 80) {
      evaluation = '⭐⭐⭐⭐ Excelente treino!';
    } else if (percentage >= 60) {
      evaluation = '⭐⭐⭐ Bom treino!';
    } else if (percentage >= 40) {
      evaluation = '⭐⭐ Treino OK. Tente fazer mais amanhã!';
    } else {
      evaluation = '⭐ Todo treino conta! Volte amanhã!';
    }

    setCompletionMessage({
      title: message,
      description: `${completed}/${totalExercises} exercícios (${percentage}%) em ${formatTime(elapsedTime)}\n\n${evaluation}`
    });
    setShowCompletionDialog(true);
    
    endWorkout();
    
    // Atualizar gamificação
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const workoutMinutes = Math.floor(elapsedTime / 60);
        const result = await updateGamificationAfterWorkout(user.id, workoutMinutes);
        
        // Mostrar celebração se subiu de nível
        if (result.leveledUp) {
          setTimeout(() => {
            setShowCompletionDialog(false);
            celebrate('level_up', `Nível ${result.newLevel}!`, `Você subiu de nível! Continue evoluindo!`);
          }, 1500);
        }
        
        // Mostrar conquistas desbloqueadas
        if (result.newAchievements.length > 0 && !result.leveledUp) {
          setTimeout(() => {
            setShowCompletionDialog(false);
            const achievement = result.newAchievements[0];
            celebrate('achievement', achievement.name, `+${achievement.xp_reward} XP conquistado!`);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error updating gamification:', error);
    }
    
    setElapsedTime(0);
    setPausedTime(0);
    setIsPaused(false);
    shown15minRef.current = false;
    shown50minRef.current = false;
  };

  const totalExercises = selectedDay?.blocks.reduce((acc, b) => acc + b.exercises.length, 0) || 0;
  const completedCount = currentSession.completedExercises.length;
  const progress = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  return (
    <>
      {/* Celebration Animation */}
      {celebration && (
        <Celebration
          type={celebration.type}
          title={celebration.title}
          subtitle={celebration.subtitle}
          onClose={closeCelebration}
        />
      )}
      
    <div className="space-y-4 animate-fade-in pb-24">
      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl">{completionMessage.title}</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Trophy size={40} className="text-primary" />
            </div>
            <p className="text-muted-foreground whitespace-pre-line">
              {completionMessage.description}
            </p>
          </div>
          <Button onClick={() => setShowCompletionDialog(false)} className="w-full">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {workoutPlan.map((day) => (
          <button
            key={day.id}
            onClick={() => !currentSession.isActive && setSelectedDay(day)}
            disabled={currentSession.isActive}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedDay?.id === day.id
                ? day.type === 'hiit' 
                  ? 'bg-neon-orange text-primary-foreground shadow-lg'
                  : 'bg-primary text-primary-foreground shadow-neon'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            } ${currentSession.isActive && 'opacity-50 cursor-not-allowed'}`}
          >
            {day.name}
          </button>
        ))}
      </div>

      {selectedDay && (
        <>
          {/* Workout Header */}
          <Card className={`relative overflow-hidden ${selectedDay.type === 'hiit' ? 'border-neon-orange/50' : ''}`}>
            <div className={`absolute inset-0 ${selectedDay.type === 'hiit' ? 'bg-neon-orange/5' : 'bg-primary/5'}`} />
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {selectedDay.type === 'hiit' ? (
                    <Flame className="text-neon-orange" size={24} />
                  ) : (
                    <Dumbbell className="text-primary" size={24} />
                  )}
                  <div>
                    <h2 className="font-display font-bold text-lg">{selectedDay.title}</h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Timer size={12} />
                      {selectedDay.duration}
                      <span>•</span>
                      {totalExercises} exercícios
                    </p>
                  </div>
                </div>
                {currentSession.isActive && (
                  <div className="text-right">
                    <p className={`font-display text-2xl font-bold ${isPaused ? 'text-yellow-500 animate-pulse' : 'text-primary'}`}>
                      {formatTime(elapsedTime)}
                    </p>
                    {isPaused && (
                      <span className="text-xs text-yellow-500">PAUSADO</span>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {currentSession.isActive && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="text-primary font-semibold">
                      {completedCount}/{totalExercises}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary transition-all duration-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exercise Blocks */}
          <div className="space-y-3">
            {selectedDay.blocks.map((block) => (
              <WorkoutBlock
                key={block.id}
                block={block}
                completedExercises={currentSession.completedExercises}
                onToggle={handleToggleExercise}
                isActive={true}
              />
            ))}
          </div>
        </>
      )}

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border/50 z-50">
        <div className="max-w-lg mx-auto">
          {!currentSession.isActive ? (
            <Button 
              className="w-full" 
              size="xl"
              onClick={handleStartWorkout}
            >
              <Play size={20} />
              Iniciar Treino
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="lg"
                onClick={handlePauseWorkout}
                className={isPaused ? 'border-yellow-500 text-yellow-500' : ''}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
              </Button>
              <Button 
                variant="destructive" 
                size="lg"
                className="flex-1"
                onClick={handleEndWorkout}
              >
                <Square size={18} />
                Finalizar
              </Button>
              {completedCount === totalExercises && totalExercises > 0 && (
                <Button 
                  size="lg"
                  className="flex-1"
                  onClick={handleEndWorkout}
                >
                  <Trophy size={18} />
                  Concluir!
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};
