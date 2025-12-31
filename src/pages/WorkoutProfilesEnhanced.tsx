import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, Calendar, Sparkles, ChevronDown, ChevronUp,
  CheckCircle2, Circle, Dumbbell, Play, Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  color: string;
}

interface ProfileWorkout {
  id: string;
  name: string;
  day_of_week: number | null;
  youtube_url: string | null;
  notes: string | null;
  order_index: number;
}

interface ProfileExercise {
  id: string;
  name: string;
  sets: string | null;
  reps: string | null;
}

const PROFILE_COLORS = [
  { value: 'green', label: 'Verde', class: 'bg-profile-green/20 border-profile-green', activeClass: 'ring-profile-green bg-profile-green/30' },
  { value: 'blue', label: 'Azul', class: 'bg-profile-blue/20 border-profile-blue', activeClass: 'ring-profile-blue bg-profile-blue/30' },
  { value: 'purple', label: 'Roxo', class: 'bg-profile-purple/20 border-profile-purple', activeClass: 'ring-profile-purple bg-profile-purple/30' },
  { value: 'orange', label: 'Laranja', class: 'bg-profile-orange/20 border-profile-orange', activeClass: 'ring-profile-orange bg-profile-orange/30' },
  { value: 'pink', label: 'Rosa', class: 'bg-profile-pink/20 border-profile-pink', activeClass: 'ring-profile-pink bg-profile-pink/30' },
  { value: 'cyan', label: 'Ciano', class: 'bg-profile-cyan/20 border-profile-cyan', activeClass: 'ring-profile-cyan bg-profile-cyan/30' },
];

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const WorkoutProfilesEnhancedPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<WorkoutProfile[]>([]);
  const [workoutsByProfile, setWorkoutsByProfile] = useState<Record<string, ProfileWorkout[]>>({});
  const [exercisesByWorkout, setExercisesByWorkout] = useState<Record<string, ProfileExercise[]>>({});
  const [expandedProfiles, setExpandedProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    start_month: '',
    end_month: '',
    color: 'green'
  });
  
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    day_of_week: '',
    notes: '',
    exercises: [{ name: '', sets: '3', reps: '12' }] as Array<{ name: string; sets: string; reps: string }>
  });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_profiles')
        .select('*')
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const profilesData = (data || []).map(p => ({
        ...p,
        color: p.color || 'green'
      }));
      
      setProfiles(profilesData);
      
      // Fetch workouts for all profiles
      for (const profile of profilesData) {
        fetchWorkouts(profile.id);
      }
      
      // Auto-expand active profile
      const activeProfile = profilesData.find(p => p.is_active);
      if (activeProfile) {
        setExpandedProfiles([activeProfile.id]);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkouts = async (profileId: string) => {
    try {
      const { data: workoutsData, error } = await supabase
        .from('profile_workouts')
        .select('*')
        .eq('profile_id', profileId)
        .order('day_of_week');

      if (error) throw error;
      
      setWorkoutsByProfile(prev => ({
        ...prev,
        [profileId]: workoutsData || []
      }));

      // Fetch exercises for each workout
      for (const workout of workoutsData || []) {
        const { data: exercisesData } = await supabase
          .from('profile_exercises')
          .select('*')
          .eq('workout_id', workout.id)
          .order('order_index');
        
        if (exercisesData) {
          setExercisesByWorkout(prev => ({
            ...prev,
            [workout.id]: exercisesData
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    }
  };

  const toggleProfileExpansion = (profileId: string) => {
    setExpandedProfiles(prev => 
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const toggleActiveProfile = async (profile: WorkoutProfile) => {
    try {
      // Deactivate all profiles first
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

  const updateProfileColor = async (profileId: string, color: string) => {
    try {
      const { error } = await supabase
        .from('workout_profiles')
        .update({ color })
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(prev => prev.map(p => 
        p.id === profileId ? { ...p, color } : p
      ));
    } catch (error) {
      console.error('Error updating color:', error);
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
          end_month: newProfile.end_month || null,
          color: newProfile.color
        })
        .select()
        .single();

      if (error) throw error;

      setProfiles(prev => [{ ...data, color: data.color || 'green' }, ...prev]);
      setShowCreateDialog(false);
      setNewProfile({ name: '', description: '', start_month: '', end_month: '', color: 'green' });
      
      toast({ title: 'Perfil criado!' });
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({ title: 'Erro ao criar perfil', variant: 'destructive' });
    }
  };

  const createWorkout = async () => {
    if (!selectedProfileId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profile_workouts')
        .insert({
          profile_id: selectedProfileId,
          user_id: user.id,
          name: newWorkout.name,
          day_of_week: newWorkout.day_of_week ? parseInt(newWorkout.day_of_week) : null,
          notes: newWorkout.notes || null,
          order_index: (workoutsByProfile[selectedProfileId]?.length || 0)
        })
        .select()
        .single();

      if (error) throw error;

      // Create exercises
      const validExercises = newWorkout.exercises.filter(ex => ex.name.trim());
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

      fetchWorkouts(selectedProfileId);
      setShowWorkoutDialog(false);
      setNewWorkout({ name: '', day_of_week: '', notes: '', exercises: [{ name: '', sets: '3', reps: '12' }] });
      
      toast({ title: 'Treino adicionado!' });
    } catch (error) {
      console.error('Error creating workout:', error);
      toast({ title: 'Erro ao criar treino', variant: 'destructive' });
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
      toast({ title: 'Perfil excluído' });
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const getColorClass = (color: string, isActive: boolean) => {
    const colorConfig = PROFILE_COLORS.find(c => c.value === color) || PROFILE_COLORS[0];
    return isActive ? colorConfig.activeClass : colorConfig.class;
  };

  const addExerciseField = () => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: '3', reps: '12' }]
    }));
  };

  const updateExercise = (index: number, field: 'name' | 'sets' | 'reps', value: string) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex)
    }));
  };

  // Group workouts by day of week
  const getWorkoutsByDay = (workouts: ProfileWorkout[]) => {
    const grouped: Record<number, ProfileWorkout[]> = {};
    workouts.forEach(w => {
      const day = w.day_of_week ?? 0;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(w);
    });
    return grouped;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Perfis de Treino</h1>
          <p className="text-muted-foreground text-sm">Organize seus treinos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/fit-ai')}>
            <Sparkles size={16} />
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus size={16} className="mr-1" />
                Novo
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
                    placeholder="Ex: Hipertrofia, Cutting, Férias..."
                    value={newProfile.name}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>Cor do Perfil</Label>
                  <div className="flex gap-2 mt-2">
                    {PROFILE_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setNewProfile(prev => ({ ...prev, color: color.value }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newProfile.color === color.value 
                            ? 'ring-2 ring-offset-2 ring-offset-background' 
                            : ''
                        }`}
                        style={{ 
                          backgroundColor: `hsl(var(--profile-${color.value}))`,
                          borderColor: `hsl(var(--profile-${color.value}))`
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Descrição</Label>
                  <Textarea 
                    placeholder="Objetivo ou detalhes..."
                    value={newProfile.description}
                    onChange={(e) => setNewProfile(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Início (opcional)</Label>
                    <Input 
                      type="date"
                      value={newProfile.start_month}
                      onChange={(e) => setNewProfile(prev => ({ ...prev, start_month: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Fim (opcional)</Label>
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

      {/* Profile Cards */}
      {profiles.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground mb-4">Nenhum perfil criado ainda</div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus size={16} className="mr-2" />
            Criar Primeiro Perfil
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {profiles.map(profile => {
            const isExpanded = expandedProfiles.includes(profile.id);
            const workouts = workoutsByProfile[profile.id] || [];
            const workoutsByDay = getWorkoutsByDay(workouts);
            
            return (
              <Collapsible
                key={profile.id}
                open={isExpanded}
                onOpenChange={() => toggleProfileExpansion(profile.id)}
              >
                <Card className={`border-2 transition-all ${getColorClass(profile.color, profile.is_active)} ${
                  profile.is_active ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                }`}>
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-4 cursor-pointer">
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
                                <Badge variant="secondary" className="text-[10px]">
                                  <Sparkles size={8} className="mr-1" />
                                  IA
                                </Badge>
                              )}
                              {profile.is_active && (
                                <Badge className="text-[10px]">ATIVO</Badge>
                              )}
                            </div>
                            {profile.description && (
                              <p className="text-xs text-muted-foreground">{profile.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Dumbbell size={12} />
                              <span>{workouts.length} treinos</span>
                              {(profile.start_month || profile.end_month) && (
                                <>
                                  <span>•</span>
                                  <Calendar size={12} />
                                  {profile.start_month && format(new Date(profile.start_month), 'MMM/yy', { locale: ptBR })}
                                  {profile.start_month && profile.end_month && ' - '}
                                  {profile.end_month && format(new Date(profile.end_month), 'MMM/yy', { locale: ptBR })}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t border-border/50 p-4 pt-3 space-y-3">
                      {/* Color Picker */}
                      <div className="flex items-center gap-2">
                        <Palette size={14} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Cor:</span>
                        {PROFILE_COLORS.map(color => (
                          <button
                            key={color.value}
                            onClick={() => updateProfileColor(profile.id, color.value)}
                            className={`w-5 h-5 rounded-full border transition-all ${
                              profile.color === color.value ? 'ring-2 ring-offset-1' : ''
                            }`}
                            style={{ 
                              backgroundColor: `hsl(var(--profile-${color.value}))`,
                              borderColor: `hsl(var(--profile-${color.value}))`
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Workouts by Day */}
                      {Object.entries(workoutsByDay).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(workoutsByDay).map(([day, dayWorkouts]) => (
                            <div key={day} className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {dayNames[parseInt(day)] || 'Sem dia'}
                              </p>
                              {dayWorkouts.map(workout => (
                                <div 
                                  key={workout.id}
                                  className="p-3 rounded-lg bg-background/50 border border-border/50"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-sm">{workout.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {exercisesByWorkout[workout.id]?.length || 0} exercícios
                                      </p>
                                    </div>
                                    {profile.is_active && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => navigate('/workout')}
                                      >
                                        <Play size={14} />
                                      </Button>
                                    )}
                                  </div>
                                  {exercisesByWorkout[workout.id]?.length > 0 && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      {exercisesByWorkout[workout.id].slice(0, 3).map(ex => ex.name).join(', ')}
                                      {exercisesByWorkout[workout.id].length > 3 && ` +${exercisesByWorkout[workout.id].length - 3}`}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum treino adicionado
                        </p>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedProfileId(profile.id);
                            setShowWorkoutDialog(true);
                          }}
                        >
                          <Plus size={14} className="mr-1" />
                          Treino
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive"
                          onClick={() => deleteProfile(profile.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Add Workout Dialog */}
      <Dialog open={showWorkoutDialog} onOpenChange={setShowWorkoutDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Treino</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Treino *</Label>
              <Input 
                placeholder="Ex: Peito e Tríceps"
                value={newWorkout.name}
                onChange={(e) => setNewWorkout(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Dia da Semana</Label>
              <select
                value={newWorkout.day_of_week}
                onChange={(e) => setNewWorkout(prev => ({ ...prev, day_of_week: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Selecione...</option>
                {dayNames.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Exercícios</Label>
                <Button size="sm" variant="ghost" onClick={addExerciseField}>
                  <Plus size={14} />
                </Button>
              </div>
              <div className="space-y-2">
                {newWorkout.exercises.map((ex, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Nome do exercício"
                      value={ex.name}
                      onChange={(e) => updateExercise(i, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Séries"
                      value={ex.sets}
                      onChange={(e) => updateExercise(i, 'sets', e.target.value)}
                      className="w-16"
                    />
                    <Input
                      placeholder="Reps"
                      value={ex.reps}
                      onChange={(e) => updateExercise(i, 'reps', e.target.value)}
                      className="w-16"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <Button onClick={createWorkout} disabled={!newWorkout.name} className="w-full">
              Adicionar Treino
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
