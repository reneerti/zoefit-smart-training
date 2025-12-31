import { useState, useEffect } from 'react';
import { Trophy, Star, Flame, Zap, Target, Medal, Crown, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface GamificationData {
  xp: number;
  level: number;
  total_workouts: number;
  total_minutes: number;
  streak_best: number;
}

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

const LEVEL_XP = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000, 10000];

const getIconComponent = (iconName: string) => {
  const icons: Record<string, React.ElementType> = {
    trophy: Trophy,
    star: Star,
    flame: Flame,
    zap: Zap,
    target: Target,
    medal: Medal,
    crown: Crown,
    award: Award,
  };
  return icons[iconName] || Trophy;
};

const getLevelTitle = (level: number): string => {
  const titles = [
    'Iniciante', 'Aprendiz', 'Determinado', 'Focado', 'Dedicado',
    'Avançado', 'Atleta', 'Campeão', 'Mestre', 'Lenda', 'Elite', 'Supremo'
  ];
  return titles[Math.min(level - 1, titles.length - 1)] || 'Supremo';
};

export const GamificationCard = () => {
  const [data, setData] = useState<GamificationData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch gamification data
      const { data: gamData } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (gamData) {
        setData(gamData);
      }

      // Fetch all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*');

      if (allAchievements) {
        setAchievements(allAchievements);
      }

      // Fetch user achievements
      const { data: userAch } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (userAch) {
        setUserAchievements(userAch);
      }
    } catch (error) {
      console.error('Error fetching gamification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return null;
  }

  const currentLevelXP = LEVEL_XP[data.level - 1] || 0;
  const nextLevelXP = LEVEL_XP[data.level] || LEVEL_XP[LEVEL_XP.length - 1];
  const xpInCurrentLevel = data.xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100);

  const unlockedCount = userAchievements.length;
  const totalAchievements = achievements.length;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4">
        <div className="flex items-center gap-4">
          {/* Level Badge */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
              <span className="text-2xl font-bold text-primary">{data.level}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
              <Star size={12} />
            </div>
          </div>
          
          {/* Level Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{getLevelTitle(data.level)}</span>
              <Badge variant="secondary" className="text-xs">
                Nível {data.level}
              </Badge>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{xpInCurrentLevel} XP</span>
                <span>{xpNeededForNextLevel} XP</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4 pt-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Zap size={16} className="text-yellow-500" />
            </div>
            <p className="text-lg font-bold">{data.xp}</p>
            <p className="text-xs text-muted-foreground">XP Total</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Target size={16} className="text-blue-500" />
            </div>
            <p className="text-lg font-bold">{data.total_workouts}</p>
            <p className="text-xs text-muted-foreground">Treinos</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Flame size={16} className="text-orange-500" />
            </div>
            <p className="text-lg font-bold">{data.streak_best}</p>
            <p className="text-xs text-muted-foreground">Melhor Streak</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Trophy size={16} className="text-primary" />
            </div>
            <p className="text-lg font-bold">{unlockedCount}/{totalAchievements}</p>
            <p className="text-xs text-muted-foreground">Conquistas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AchievementsGrid = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('xp_reward');

      if (allAchievements) {
        setAchievements(allAchievements);
      }

      const { data: userAch } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      if (userAch) {
        setUserAchievements(userAch.map(a => a.achievement_id));
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {achievements.map((achievement) => {
        const isUnlocked = userAchievements.includes(achievement.id);
        const Icon = getIconComponent(achievement.icon);
        
        return (
          <div
            key={achievement.id}
            className={`relative p-3 rounded-xl border text-center transition-all ${
              isUnlocked
                ? 'bg-primary/10 border-primary/30'
                : 'bg-secondary/30 border-border/50 opacity-50 grayscale'
            }`}
          >
            <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
              isUnlocked ? 'bg-primary/20' : 'bg-muted'
            }`}>
              <Icon size={20} className={isUnlocked ? 'text-primary' : 'text-muted-foreground'} />
            </div>
            <p className="text-xs font-medium mt-2 line-clamp-2">{achievement.name}</p>
            {isUnlocked && (
              <Badge variant="secondary" className="text-xs mt-1">
                +{achievement.xp_reward} XP
              </Badge>
            )}
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg">🔒</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
