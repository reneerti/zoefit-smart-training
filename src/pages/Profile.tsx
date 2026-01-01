import { useState, useRef } from 'react';
import { 
  User, Mail, Calendar, Camera, Save, 
  Trophy, Dumbbell, Clock, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { useGamification, useWorkoutSessions } from '@/hooks/useWorkoutData';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export const ProfilePage = () => {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, uploadAvatar, isUpdating } = useProfile();
  const { data: gamification } = useGamification();
  const { data: sessions } = useWorkoutSessions();
  
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate stats
  const totalWorkouts = gamification?.total_workouts || 0;
  const totalMinutes = gamification?.total_minutes || 0;
  const currentLevel = gamification?.level || 1;
  const currentXP = gamification?.xp || 0;
  const bestStreak = gamification?.streak_best || 0;

  // Calculate current streak
  const calculateCurrentStreak = () => {
    if (!sessions || sessions.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
    
    let currentDate = today;
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.completed_at);
      sessionDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateCurrentStreak();

  const handleSave = () => {
    if (name.trim() && name !== profile?.name) {
      updateProfile({ name: name.trim() });
    }
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const handleEdit = () => {
    setName(profile?.name || '');
    setIsEditing(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {profile?.name ? getInitials(profile.name) : <User size={32} />}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={handleAvatarClick}
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          >
            <Camera size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="text-center"
              autoFocus
            />
            <Button size="sm" onClick={handleSave} disabled={isUpdating}>
              <Save size={16} />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <h1 
              onClick={handleEdit}
              className="text-2xl font-display font-bold cursor-pointer hover:text-primary transition-colors"
            >
              {profile?.name || 'Seu Nome'}
            </h1>
            <p className="text-sm text-muted-foreground">Clique para editar</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail size={14} />
          <span className="text-sm">{user?.email}</span>
        </div>

        {profile?.created_at && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={14} />
            <span className="text-sm">
              Membro desde {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
        )}
      </div>

      {/* Level Card */}
      <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Nível Atual</p>
              <p className="text-4xl font-display font-bold text-primary">{currentLevel}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">XP Total</p>
              <p className="text-2xl font-bold">{currentXP.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso para nível {currentLevel + 1}</span>
              <span>{currentXP % 1000} / 1000 XP</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(currentXP % 1000) / 10}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Dumbbell className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWorkouts}</p>
              <p className="text-xs text-muted-foreground">Treinos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Clock className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatHours(totalMinutes)}</p>
              <p className="text-xs text-muted-foreground">Tempo total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="text-orange-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Sequência atual</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Trophy className="text-purple-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{bestStreak}</p>
              <p className="text-xs text-muted-foreground">Melhor sequência</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-sm">Email</Label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Nome</Label>
            <p className="font-medium">{profile?.name || 'Não definido'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">ID do Usuário</Label>
            <p className="font-mono text-xs text-muted-foreground">{user?.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
