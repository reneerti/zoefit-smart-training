import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, Edit2, Play, Calendar, 
  ExternalLink, Sparkles, ChevronRight, MoreVertical,
  CheckCircle2, Circle, Dumbbell, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkoutProfile {
  id: string;
  name: string;
  description: string | null;
  start_month: string | null;
  end_month: string | null;
  is_active: boolean;
  is_ai_generated: boolean;
  created_at: string;
}

interface ProfileWorkout {
  id: string;
  name: string;
  day_of_week: number | null;
  youtube_url: string | null;
  notes: string | null;
  order_index: number;
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const WorkoutProfilesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<WorkoutProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<WorkoutProfile | null>(null);
  const [workouts, setWorkouts] = useState<ProfileWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    start_month: '',
    end_month: ''
  });
  
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    day_of_week: '',
    youtube_url: '',
    notes: '',
    exercises: [{ name: '', sets: '3', reps: '12' }] as Array<{ name: string; sets: string; reps: string }>
  });

  const addExerciseField = () => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: '3', reps: '12' }]
    }));
  };

  const removeExerciseField = (index: number) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const updateExercise = (index: number, field: 'name' | 'sets' | 'reps', value: string) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex)
    }));
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      fetchWorkouts(selectedProfile.id);
    }
  }, [selectedProfile]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
      
      if (data && data.length > 0 && !selectedProfile) {
        setSelectedProfile(data[0]);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os perfis',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkouts = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('profile_workouts')
        .select('*')
        .eq('profile_id', profileId)
        .order('order_index');

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const createProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workout_profiles')
        .insert({
          user_id: user.id,
          name: newProfile.name,
          description: newProfile.description || null,
          start_month: newProfile.start_month || null,
          end_month: newProfile.end_month || null
        })
        .select()
        .single();

      if (error) throw error;

      setProfiles(prev => [data, ...prev]);
      setSelectedProfile(data);
      setShowCreateDialog(false);
      setNewProfile({ name: '', description: '', start_month: '', end_month: '' });
      
      toast({
        title: 'Perfil criado!',
        description: 'Agora adicione seus treinos'
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o perfil',
        variant: 'destructive'
      });
    }
  };

  const createWorkout = async () => {
    if (!selectedProfile) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const youtubeUrl = newWorkout.youtube_url || 
        `https://www.youtube.com/results?search_query=${encodeURIComponent(newWorkout.name + ' treino')}`;

      const { data, error } = await supabase
        .from('profile_workouts')
        .insert({
          profile_id: selectedProfile.id,
          user_id: user.id,
          name: newWorkout.name,
          day_of_week: newWorkout.day_of_week ? parseInt(newWorkout.day_of_week) : null,
          youtube_url: youtubeUrl,
          notes: newWorkout.notes || null,
          order_index: workouts.length
        })
        .select()
        .single();

      if (error) throw error;

      // Criar exercícios se houver
      const validExercises = newWorkout.exercises.filter(ex => ex.name.trim());
      if (validExercises.length > 0) {
        for (let i = 0; i < validExercises.length; i++) {
          const ex = validExercises[i];
          await supabase
            .from('profile_exercises')
            .insert({
              workout_id: data.id,
              user_id: user.id,
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              order_index: i
            });
        }
      }

      setWorkouts(prev => [...prev, data]);
      setShowWorkoutDialog(false);
      setNewWorkout({ name: '', day_of_week: '', youtube_url: '', notes: '', exercises: [{ name: '', sets: '3', reps: '12' }] });
      
      toast({
        title: 'Treino adicionado!',
        description: validExercises.length > 0 ? `${validExercises.length} exercícios criados` : undefined
      });
    } catch (error) {
      console.error('Error creating workout:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o treino',
        variant: 'destructive'
      });
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('workout_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(prev => prev.filter(p => p.id !== profileId));
      if (selectedProfile?.id === profileId) {
        setSelectedProfile(profiles.find(p => p.id !== profileId) || null);
      }
      
      toast({
        title: 'Perfil excluído',
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o perfil',
        variant: 'destructive'
      });
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('profile_workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;

      setWorkouts(prev => prev.filter(w => w.id !== workoutId));
      
      toast({
        title: 'Treino excluído',
      });
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const toggleActiveProfile = async (profile: WorkoutProfile) => {
    try {
      // Desativar todos os perfis primeiro
      if (!profile.is_active) {
        await supabase
          .from('workout_profiles')
          .update({ is_active: false })
          .neq('id', profile.id);
      }

      const { error } = await supabase
        .from('workout_profiles')
        .update({ is_active: !profile.is_active })
        .eq('id', profile.id);

      if (error) throw error;

      setProfiles(prev => prev.map(p => ({
        ...p,
        is_active: p.id === profile.id ? !profile.is_active : false
      })));
      
      toast({
        title: profile.is_active ? 'Perfil desativado' : 'Perfil ativado!',
      });
    } catch (error) {
      console.error('Error toggling profile:', error);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Perfis de Treino</h1>
          <p className="text-muted-foreground text-sm">Organize seus treinos por período ou objetivo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/fit-ai')}>
            <Sparkles size={16} className="mr-2" />
            FIT IA
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} className="mr-2" />
                Novo Perfil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Perfil de Treino</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do Perfil *</Label>
                  <Input 
                    placeholder="Ex: Perfil Verão, Rotina, Férias..."
                    value={newProfile.name}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea 
                    placeholder="Objetivo ou detalhes do perfil..."
                    value={newProfile.description}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mês Início (opcional)</Label>
                    <Input 
                      type="date"
                      value={newProfile.start_month}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, start_month: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Mês Fim (opcional)</Label>
                    <Input 
                      type="date"
                      value={newProfile.end_month}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, end_month: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={createProfile} disabled={!newProfile.name} className="w-full">
                  Criar Perfil
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Profile List */}
      <div className="grid gap-3">
        {profiles.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              Nenhum perfil de treino criado ainda
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus size={16} className="mr-2" />
              Criar Primeiro Perfil
            </Button>
          </Card>
        ) : (
          profiles.map((profile) => (
            <Card 
              key={profile.id}
              className={`cursor-pointer transition-all ${
                selectedProfile?.id === profile.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-secondary/50'
              }`}
              onClick={() => setSelectedProfile(profile)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActiveProfile(profile);
                      }}
                      className="shrink-0"
                    >
                      {profile.is_active ? (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{profile.name}</span>
                        {profile.is_ai_generated && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles size={10} className="mr-1" />
                            IA
                          </Badge>
                        )}
                        {profile.is_active && (
                          <Badge className="text-xs">Ativo</Badge>
                        )}
                      </div>
                      {profile.description && (
                        <p className="text-sm text-muted-foreground">{profile.description}</p>
                      )}
                      {(profile.start_month || profile.end_month) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar size={12} />
                          {profile.start_month && format(new Date(profile.start_month), 'MMM/yy', { locale: ptBR })}
                          {profile.start_month && profile.end_month && ' - '}
                          {profile.end_month && format(new Date(profile.end_month), 'MMM/yy', { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight size={20} className="text-muted-foreground" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          deleteProfile(profile.id);
                        }}>
                          <Trash2 size={14} className="mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Selected Profile Workouts */}
      {selectedProfile && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Treinos - {selectedProfile.name}
            </h2>
            <Dialog open={showWorkoutDialog} onOpenChange={setShowWorkoutDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus size={14} className="mr-2" />
                  Adicionar Treino
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Treino</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Treino *</Label>
                    <Input 
                      placeholder="Ex: Treino A - Peito e Tríceps"
                      value={newWorkout.name}
                      onChange={(e) => setNewWorkout(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Um link do YouTube será gerado automaticamente para buscar este treino
                    </p>
                  </div>
                  <div>
                    <Label>Dia da Semana (opcional)</Label>
                    <select
                      className="w-full h-12 rounded-lg border border-border/50 bg-secondary/50 px-4"
                      value={newWorkout.day_of_week}
                      onChange={(e) => setNewWorkout(prev => ({ ...prev, day_of_week: e.target.value }))}
                    >
                      <option value="">Sem dia fixo</option>
                      {dayNames.map((day, i) => (
                        <option key={i} value={i}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Link YouTube (opcional)</Label>
                    <Input 
                      placeholder="Cole um link específico ou deixe vazio para busca automática"
                      value={newWorkout.youtube_url}
                      onChange={(e) => setNewWorkout(prev => ({ ...prev, youtube_url: e.target.value }))}
                    />
                  </div>
                  
                  {/* Exercícios */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Dumbbell size={14} />
                        Exercícios (opcional)
                      </Label>
                      <Button type="button" variant="ghost" size="sm" onClick={addExerciseField}>
                        <Plus size={14} className="mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {newWorkout.exercises.map((exercise, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                          <Input
                            placeholder="Nome do exercício"
                            value={exercise.name}
                            onChange={(e) => updateExercise(index, 'name', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Séries"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                            className="w-16 text-center"
                          />
                          <span className="text-muted-foreground">x</span>
                          <Input
                            placeholder="Reps"
                            value={exercise.reps}
                            onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                            className="w-16 text-center"
                          />
                          {newWorkout.exercises.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeExerciseField(index)}
                            >
                              <X size={14} className="text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deixe o nome em branco para pular o exercício
                    </p>
                  </div>
                  
                  <Button onClick={createWorkout} disabled={!newWorkout.name} className="w-full">
                    Adicionar Treino
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {workouts.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              Nenhum treino adicionado a este perfil ainda
            </Card>
          ) : (
            <div className="grid gap-2">
              {workouts.map((workout) => (
                <Card key={workout.id} className="hover:bg-secondary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Play size={18} className="text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{workout.name}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {workout.day_of_week !== null && (
                              <Badge variant="outline" className="text-xs">
                                {dayNames[workout.day_of_week]}
                              </Badge>
                            )}
                            {workout.notes && <span>{workout.notes}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {workout.youtube_url && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => window.open(workout.youtube_url!, '_blank')}
                          >
                            <ExternalLink size={16} className="text-red-500" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteWorkout(workout.id)}
                        >
                          <Trash2 size={16} className="text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
