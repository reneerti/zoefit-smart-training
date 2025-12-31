import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Trash2, AlertTriangle, LogOut, 
  ChevronRight, User, Database, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const resetAllData = async () => {
    setIsResetting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Deletar todos os dados do usuário em ordem (respeitando foreign keys)
      await supabase.from('profile_exercises').delete().eq('user_id', user.id);
      await supabase.from('profile_workouts').delete().eq('user_id', user.id);
      await supabase.from('workout_profiles').delete().eq('user_id', user.id);
      await supabase.from('fit_ai_forms').delete().eq('user_id', user.id);
      await supabase.from('workout_sessions').delete().eq('user_id', user.id);
      await supabase.from('weight_records').delete().eq('user_id', user.id);
      await supabase.from('body_measurements').delete().eq('user_id', user.id);
      await supabase.from('ai_insights').delete().eq('user_id', user.id);
      await supabase.from('supplement_logs').delete().eq('user_id', user.id);
      await supabase.from('supplements').delete().eq('user_id', user.id);
      await supabase.from('progress_photos').delete().eq('user_id', user.id);
      await supabase.from('goals').delete().eq('user_id', user.id);
      await supabase.from('user_achievements').delete().eq('user_id', user.id);
      
      // Resetar gamificação
      await supabase
        .from('user_gamification')
        .update({
          xp: 0,
          level: 1,
          total_workouts: 0,
          total_minutes: 0,
          streak_best: 0
        })
        .eq('user_id', user.id);

      toast({
        title: 'Dados resetados',
        description: 'Todo seu histórico e progresso foi zerado',
      });

    } catch (error) {
      console.error('Error resetting data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível resetar os dados',
        variant: 'destructive'
      });
    } finally {
      setIsResetting(false);
    }
  };

  const MenuItem = ({ 
    icon: Icon, 
    label, 
    description, 
    onClick, 
    danger = false 
  }: { 
    icon: React.ElementType; 
    label: string; 
    description?: string;
    onClick: () => void;
    danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
        danger 
          ? 'bg-destructive/10 hover:bg-destructive/20' 
          : 'bg-secondary/50 hover:bg-secondary'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          danger ? 'bg-destructive/20' : 'bg-primary/10'
        }`}>
          <Icon size={20} className={danger ? 'text-destructive' : 'text-primary'} />
        </div>
        <div className="text-left">
          <div className={`font-medium ${danger ? 'text-destructive' : ''}`}>{label}</div>
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>
      </div>
      <ChevronRight size={20} className="text-muted-foreground" />
    </button>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie sua conta e preferências</p>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        <MenuItem
          icon={Brain}
          label="Configurações de IA"
          description="Escolha os modelos de IA para análises"
          onClick={() => navigate('/ai-settings')}
        />
        
        <MenuItem
          icon={Sparkles}
          label="Perfis de Treino"
          description="Gerencie seus treinos personalizados"
          onClick={() => navigate('/workout-profiles')}
        />
      </div>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={20} />
            <span className="font-semibold">Zona de Perigo</span>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center justify-between p-4 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors"
                disabled={isResetting}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                    <Database size={20} className="text-destructive" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-destructive">Zerar Histórico e Progresso</div>
                    <div className="text-sm text-muted-foreground">
                      Remove todos os treinos, medidas e dados
                    </div>
                  </div>
                </div>
                <Trash2 size={20} className="text-destructive" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso irá deletar permanentemente:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Histórico de treinos</li>
                    <li>Registros de peso e medidas</li>
                    <li>Fotos de progresso</li>
                    <li>Insights da IA</li>
                    <li>Perfis de treino</li>
                    <li>Suplementos e registros</li>
                    <li>Metas e conquistas</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={resetAllData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isResetting ? 'Resetando...' : 'Sim, resetar tudo'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button 
        variant="outline" 
        onClick={handleLogout}
        className="w-full"
      >
        <LogOut size={16} className="mr-2" />
        Sair da Conta
      </Button>
    </div>
  );
};
