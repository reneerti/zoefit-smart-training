import { Trophy } from 'lucide-react';
import { AchievementsGrid } from '@/components/Gamification';

export const AchievementsPage = () => {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Trophy className="text-primary" />
          Conquistas
        </h1>
        <p className="text-muted-foreground text-sm">
          Desbloqueie conquistas completando desafios
        </p>
      </div>

      {/* Achievements Grid */}
      <AchievementsGrid />
    </div>
  );
};
