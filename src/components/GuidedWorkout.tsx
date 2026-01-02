import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Check, X,
  Timer, Dumbbell, ChevronRight, Trophy, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Exercise, WorkoutDay } from '@/types/workout';
import { useSettingsStore } from '@/store/settingsStore';
import { playNotificationSound } from '@/utils/notifications';
import { cn } from '@/lib/utils';

interface GuidedWorkoutProps {
  day: WorkoutDay;
  onComplete: (completedExercises: string[], elapsedTime: number) => void;
  onExit: () => void;
}

type WorkoutPhase = 'ready' | 'exercise' | 'rest' | 'transition' | 'complete';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const GuidedWorkout = ({ day, onComplete, onExit }: GuidedWorkoutProps) => {
  const { soundEnabled, restTimerSeconds } = useSettingsStore();
  
  // Flatten all exercises
  const allExercises = day.blocks.flatMap(block => 
    block.exercises.map(ex => ({ ...ex, blockTitle: block.title }))
  );
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<WorkoutPhase>('ready');
  const [timer, setTimer] = useState(3); // Countdown for ready
  const [restTimer, setRestTimer] = useState(restTimerSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  const startTimeRef = useRef<number>(Date.now());
  const currentExercise = allExercises[currentIndex];
  
  // Total elapsed timer
  useEffect(() => {
    if (phase !== 'complete' && !isPaused) {
      const interval = setInterval(() => {
        setTotalElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, isPaused]);
  
  // Ready countdown
  useEffect(() => {
    if (phase === 'ready' && timer > 0 && !isPaused) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (soundEnabled) playNotificationSound('motivational');
            setPhase('exercise');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, timer, isPaused, soundEnabled]);
  
  // Rest timer
  useEffect(() => {
    if (phase === 'rest' && restTimer > 0 && !isPaused) {
      const interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            if (soundEnabled) playNotificationSound('motivational');
            handleNextExercise();
            return restTimerSeconds;
          }
          if (prev === 4 && soundEnabled) {
            playNotificationSound('success');
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, restTimer, isPaused, soundEnabled, restTimerSeconds]);
  
  const handleCompleteExercise = useCallback(() => {
    if (!completedExercises.includes(currentExercise.id)) {
      setCompletedExercises(prev => [...prev, currentExercise.id]);
    }
    
    if (currentIndex < allExercises.length - 1) {
      if (soundEnabled) playNotificationSound('success');
      setPhase('rest');
      setRestTimer(restTimerSeconds);
    } else {
      // Workout complete
      if (soundEnabled) playNotificationSound('achievement');
      setPhase('complete');
    }
  }, [currentExercise, currentIndex, allExercises.length, completedExercises, soundEnabled, restTimerSeconds]);
  
  const handleNextExercise = useCallback(() => {
    if (currentIndex < allExercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setPhase('transition');
      setTimeout(() => setPhase('exercise'), 500);
    }
  }, [currentIndex, allExercises.length]);
  
  const handlePrevExercise = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setPhase('transition');
      setTimeout(() => setPhase('exercise'), 500);
    }
  }, [currentIndex]);
  
  const handleSkipRest = () => {
    setRestTimer(restTimerSeconds);
    handleNextExercise();
  };
  
  const handleFinish = () => {
    onComplete(completedExercises, totalElapsed);
  };
  
  const handleExit = () => {
    setShowExitDialog(true);
  };
  
  const confirmExit = () => {
    onExit();
  };
  
  const progress = ((currentIndex + (phase === 'complete' ? 1 : 0)) / allExercises.length) * 100;
  
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Exit Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sair do treino guiado?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Seu progresso será salvo. Você completou {completedExercises.length} de {allExercises.length} exercícios.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowExitDialog(false)} className="flex-1">
              Continuar
            </Button>
            <Button variant="destructive" onClick={confirmExit} className="flex-1">
              Sair
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <button onClick={handleExit} className="p-2 hover:bg-secondary rounded-lg">
          <X size={24} />
        </button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">{day.title}</p>
          <p className="font-display font-bold text-primary">{formatTime(totalElapsed)}</p>
        </div>
        <div className="w-10" />
      </div>
      
      {/* Progress */}
      <div className="px-4 py-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Exercício {currentIndex + 1} de {allExercises.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
        {phase === 'ready' && (
          <div className="text-center animate-scale-in">
            <p className="text-muted-foreground mb-4">Prepare-se!</p>
            <div className="w-40 h-40 rounded-full border-4 border-primary flex items-center justify-center mb-6 animate-pulse">
              <span className="font-display text-6xl font-bold text-primary">{timer}</span>
            </div>
            <p className="text-lg font-semibold">Próximo: {currentExercise?.name}</p>
          </div>
        )}
        
        {phase === 'exercise' && currentExercise && (
          <div className={cn(
            "text-center w-full max-w-md transition-all duration-300",
            "animate-fade-in"
          )}>
            <div className="mb-2 text-xs text-primary font-semibold uppercase tracking-wider">
              {currentExercise.blockTitle}
            </div>
            
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 mb-6">
              <CardContent className="p-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Dumbbell className="text-primary" size={32} />
                </div>
                
                <h2 className="font-display text-2xl font-bold mb-2">{currentExercise.name}</h2>
                
                <div className="flex items-center justify-center gap-4 text-lg">
                  <span className="text-primary font-bold">{currentExercise.sets} séries</span>
                  <span className="text-muted-foreground">×</span>
                  <span className="text-primary font-bold">{currentExercise.reps} reps</span>
                </div>
                
                {currentExercise.notes && (
                  <p className="mt-4 text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">
                    {currentExercise.notes}
                  </p>
                )}
              </CardContent>
            </Card>
            
            <Button 
              size="xl" 
              className="w-full gap-2"
              onClick={handleCompleteExercise}
            >
              <Check size={24} />
              Concluir Exercício
            </Button>
          </div>
        )}
        
        {phase === 'rest' && (
          <div className="text-center animate-scale-in">
            <p className="text-muted-foreground mb-2">Descanse</p>
            
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-secondary"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-primary transition-all duration-1000"
                  strokeDasharray={2 * Math.PI * 88}
                  strokeDashoffset={2 * Math.PI * 88 * (1 - restTimer / restTimerSeconds)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-5xl font-bold">{restTimer}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Próximo: <span className="text-foreground font-medium">{allExercises[currentIndex + 1]?.name}</span>
              </p>
              
              <Button variant="outline" onClick={handleSkipRest} className="gap-2">
                <SkipForward size={18} />
                Pular descanso
              </Button>
            </div>
          </div>
        )}
        
        {phase === 'transition' && (
          <div className="flex items-center justify-center animate-pulse">
            <ChevronRight size={48} className="text-primary" />
          </div>
        )}
        
        {phase === 'complete' && (
          <div className="text-center animate-scale-in">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-glow">
              <Trophy className="text-primary" size={48} />
            </div>
            
            <h2 className="font-display text-3xl font-bold mb-2">Treino Completo!</h2>
            <p className="text-muted-foreground mb-6">
              Você completou {completedExercises.length} exercícios em {formatTime(totalElapsed)}
            </p>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleExit} className="flex-1">
                Ver Detalhes
              </Button>
              <Button onClick={handleFinish} className="flex-1 gap-2">
                <Flame size={18} />
                Finalizar
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Controls */}
      {(phase === 'exercise' || phase === 'rest') && (
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevExercise}
              disabled={currentIndex === 0}
              className="w-12 h-12"
            >
              <SkipBack size={24} />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPaused(!isPaused)}
              className="w-16 h-16 rounded-full"
            >
              {isPaused ? <Play size={28} /> : <Pause size={28} />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={phase === 'rest' ? handleSkipRest : handleNextExercise}
              disabled={currentIndex === allExercises.length - 1 && phase !== 'rest'}
              className="w-12 h-12"
            >
              <SkipForward size={24} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
