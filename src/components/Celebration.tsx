import { useState, useEffect } from 'react';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface CelebrationProps {
  type: 'level_up' | 'achievement';
  title: string;
  subtitle: string;
  onClose: () => void;
}

export const Celebration = ({ type, title, subtitle, onClose }: CelebrationProps) => {
  useEffect(() => {
    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
      <div className="relative bg-card border rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-scale-in">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onClose}
        >
          <X size={20} />
        </Button>

        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary/50 rounded-full flex items-center justify-center">
            {type === 'level_up' ? (
              <Star className="w-12 h-12 text-primary-foreground" />
            ) : (
              <Trophy className="w-12 h-12 text-primary-foreground" />
            )}
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-pulse" />
        </div>

        <h2 className="text-2xl font-display font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{subtitle}</p>

        <Button onClick={onClose} className="w-full">
          Continuar
        </Button>
      </div>
    </div>
  );
};

// Hook para gerenciar celebrações
export const useCelebration = () => {
  const [celebration, setCelebration] = useState<{
    type: 'level_up' | 'achievement';
    title: string;
    subtitle: string;
  } | null>(null);

  const celebrate = (type: 'level_up' | 'achievement', title: string, subtitle: string) => {
    setCelebration({ type, title, subtitle });
  };

  const closeCelebration = () => {
    setCelebration(null);
  };

  return { celebration, celebrate, closeCelebration };
};
