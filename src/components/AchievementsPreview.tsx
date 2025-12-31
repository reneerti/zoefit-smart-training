import { useState, useEffect } from 'react';
import { Trophy, ChevronRight, Lock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

export const AchievementsPreview = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [achievementsRes, userAchievementsRes] = await Promise.all([
        supabase.from('achievements').select('*').limit(6),
        supabase.from('user_achievements').select('*').eq('user_id', user.id)
      ]);

      if (achievementsRes.data) setAchievements(achievementsRes.data);
      if (userAchievementsRes.data) setUserAchievements(userAchievementsRes.data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const unlockedCount = userAchievements.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse flex gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-12 h-12 rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy size={18} className="text-neon-orange" />
            Conquistas
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/achievements')}>
            Ver todas
            <ChevronRight size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-display font-bold text-primary">{unlockedCount}</span>
          <span className="text-sm text-muted-foreground">desbloqueadas</span>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {achievements.slice(0, 5).map((achievement) => {
            const unlocked = isUnlocked(achievement.id);
            return (
              <div 
                key={achievement.id}
                className={`flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center text-2xl relative transition-all ${
                  unlocked 
                    ? 'bg-primary/10 ring-2 ring-primary' 
                    : 'bg-muted/50 opacity-50 grayscale'
                }`}
              >
                {achievement.icon}
                {!unlocked && (
                  <Lock size={12} className="absolute bottom-1 right-1 text-muted-foreground" />
                )}
                {unlocked && (
                  <Sparkles size={10} className="absolute -top-1 -right-1 text-primary" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
