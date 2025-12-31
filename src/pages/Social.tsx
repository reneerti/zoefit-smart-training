import { useState, useEffect } from 'react';
import { 
  Users, Trophy, Crown, Medal, Star, Eye, EyeOff, 
  TrendingUp, Flame, Target, ChevronRight, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RankingUser {
  user_id: string;
  display_name: string | null;
  xp: number;
  level: number;
  total_workouts: number;
  streak_best: number;
}

const getRankIcon = (position: number) => {
  if (position === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (position === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{position}</span>;
};

const getLevelTitle = (level: number): string => {
  const titles = [
    'Iniciante', 'Aprendiz', 'Determinado', 'Focado', 'Dedicado',
    'Avançado', 'Atleta', 'Campeão', 'Mestre', 'Lenda', 'Elite', 'Supremo'
  ];
  return titles[Math.min(level - 1, titles.length - 1)] || 'Supremo';
};

export const SocialPage = () => {
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [myPosition, setMyPosition] = useState<number | null>(null);
  const [myStats, setMyStats] = useState<RankingUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar configurações do usuário
      const { data: myData } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (myData) {
        setIsPublic(myData.is_public || false);
        setDisplayName(myData.display_name || '');
        setMyStats(myData);
      }

      // Buscar ranking público
      const { data: publicRanking } = await supabase
        .from('user_gamification')
        .select('user_id, display_name, xp, level, total_workouts, streak_best')
        .eq('is_public', true)
        .order('xp', { ascending: false })
        .limit(50);

      if (publicRanking) {
        setRanking(publicRanking);
        
        // Encontrar minha posição
        const myPos = publicRanking.findIndex(r => r.user_id === user.id);
        if (myPos !== -1) {
          setMyPosition(myPos + 1);
        }
      }
    } catch (error) {
      console.error('Error fetching social data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_gamification')
        .update({
          is_public: isPublic,
          display_name: displayName || null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Configurações salvas!',
        description: isPublic ? 'Seu perfil agora é público no ranking' : 'Seu perfil está privado'
      });

      fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Users className="text-primary" />
          Social
        </h1>
        <p className="text-muted-foreground text-sm">
          Compare seu progresso com outros atletas
        </p>
      </div>

      <Tabs defaultValue="ranking" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="ranking" className="flex-1">
            <Trophy size={16} className="mr-2" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">
            <Settings size={16} className="mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4 mt-4">
          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Ranking Público</p>
                  <p className="text-xs text-muted-foreground">
                    Apenas usuários que autorizaram aparecem aqui. 
                    {!isPublic && ' Ative seu perfil público nas configurações para participar.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Position */}
          {myPosition && myStats && (
            <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                      <span className="text-xl font-bold text-primary">#{myPosition}</span>
                    </div>
                    <div>
                      <p className="font-semibold">Sua Posição</p>
                      <p className="text-sm text-muted-foreground">
                        {myStats.xp} XP • Nível {myStats.level}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{getLevelTitle(myStats.level)}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ranking List */}
          <div className="space-y-2">
            {ranking.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Nenhum participante ainda</h3>
                <p className="text-sm text-muted-foreground">
                  Seja o primeiro a tornar seu perfil público!
                </p>
              </Card>
            ) : (
              ranking.map((user, index) => (
                <Card 
                  key={user.user_id}
                  className={`${index < 3 ? 'border-primary/30 bg-primary/5' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.display_name || `Atleta #${user.user_id.slice(0, 4)}`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Star size={10} />
                              {user.xp} XP
                            </span>
                            <span className="flex items-center gap-1">
                              <Target size={10} />
                              {user.total_workouts} treinos
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame size={10} />
                              {user.streak_best} streak
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Nível {user.level}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          {/* Privacy Toggle */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Eye className="w-5 h-5 text-primary" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Perfil Público</p>
                    <p className="text-sm text-muted-foreground">
                      {isPublic 
                        ? 'Seu progresso aparece no ranking' 
                        : 'Seu progresso está privado'}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={isPublic} 
                  onCheckedChange={setIsPublic}
                />
              </div>

              {isPublic && (
                <div className="pt-4 border-t">
                  <Label>Nome de Exibição</Label>
                  <Input
                    placeholder="Como você quer aparecer no ranking?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Se não preencher, será exibido como "Atleta #XXXX"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={saveSettings} 
            className="w-full"
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>

          {/* Warning */}
          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                ⚠️ Ao tornar seu perfil público, outros usuários poderão ver seu XP, 
                nível, número de treinos e melhor sequência. Seu email e dados pessoais 
                nunca serão compartilhados.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
