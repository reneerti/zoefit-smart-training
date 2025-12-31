import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Target, Dumbbell, Clock, 
  AlertCircle, ArrowRight, Loader2, Settings,
  Brain, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AI_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini Flash', description: 'Rápido e eficiente' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini Pro', description: 'Alta qualidade' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', description: 'Balanceado' },
  { id: 'openai/gpt-5', name: 'GPT-5', description: 'Máxima qualidade' },
];

const GOALS = [
  'Perder peso',
  'Ganhar massa muscular',
  'Definição muscular',
  'Aumentar força',
  'Melhorar condicionamento',
  'Saúde geral',
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Iniciante', description: 'Menos de 6 meses de treino' },
  { id: 'intermediate', label: 'Intermediário', description: '6 meses a 2 anos' },
  { id: 'advanced', label: 'Avançado', description: 'Mais de 2 anos' },
];

const FOCUS_AREAS = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 
  'Pernas', 'Glúteos', 'Abdômen', 'Core', 'Cardio'
];

const EQUIPMENT = [
  'Academia completa',
  'Halteres',
  'Barras',
  'Máquinas',
  'Peso corporal',
  'Elásticos',
  'Kettlebell',
  'TRX',
];

export const FitAIPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [formData, setFormData] = useState({
    goal: '',
    experienceLevel: '',
    availableDays: 3,
    workoutDuration: 60,
    focusAreas: [] as string[],
    limitations: '',
    equipment: ['Academia completa'] as string[],
  });
  
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');

  const toggleFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const toggleEquipment = (item: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter(e => e !== item)
        : [...prev.equipment, item]
    }));
  };

  const generateWorkout = async () => {
    setIsGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado',
          variant: 'destructive'
        });
        return;
      }

      // Salvar formulário
      const { data: formRecord, error: formError } = await supabase
        .from('fit_ai_forms')
        .insert({
          user_id: user.id,
          goal: formData.goal,
          experience_level: formData.experienceLevel,
          available_days: formData.availableDays,
          workout_duration: formData.workoutDuration,
          focus_areas: formData.focusAreas,
          limitations: formData.limitations || null,
          equipment: formData.equipment,
          ai_model: selectedModel,
          status: 'processing'
        })
        .select()
        .single();

      if (formError) throw formError;

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('fit-ai-generator', {
        body: { formData, model: selectedModel }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const { workoutPlan } = data;

      // Criar perfil de treino
      const { data: profile, error: profileError } = await supabase
        .from('workout_profiles')
        .insert({
          user_id: user.id,
          name: `IA - ${workoutPlan.profileName}`,
          description: workoutPlan.description,
          is_ai_generated: true,
          ai_form_data: formData
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Criar treinos
      for (let i = 0; i < workoutPlan.workouts.length; i++) {
        const workout = workoutPlan.workouts[i];
        
        const youtubeUrl = workout.youtubeSearch 
          ? `https://www.youtube.com/results?search_query=${encodeURIComponent(workout.youtubeSearch)}`
          : null;

        const { data: workoutRecord, error: workoutError } = await supabase
          .from('profile_workouts')
          .insert({
            profile_id: profile.id,
            user_id: user.id,
            name: workout.name,
            day_of_week: workout.dayOfWeek,
            youtube_url: youtubeUrl,
            order_index: i
          })
          .select()
          .single();

        if (workoutError) throw workoutError;

        // Criar exercícios
        if (workout.exercises) {
          for (let j = 0; j < workout.exercises.length; j++) {
            const exercise = workout.exercises[j];
            const exerciseYoutubeUrl = exercise.youtubeSearch
              ? `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.youtubeSearch)}`
              : null;

            await supabase
              .from('profile_exercises')
              .insert({
                workout_id: workoutRecord.id,
                user_id: user.id,
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                notes: exercise.notes,
                youtube_url: exerciseYoutubeUrl,
                order_index: j
              });
          }
        }
      }

      // Atualizar formulário com perfil gerado
      await supabase
        .from('fit_ai_forms')
        .update({
          status: 'completed',
          generated_profile_id: profile.id,
          ai_response: workoutPlan
        })
        .eq('id', formRecord.id);

      toast({
        title: 'Treino gerado com sucesso!',
        description: 'Seu perfil de treino personalizado foi criado',
      });

      navigate('/workout-profiles');

    } catch (error) {
      console.error('Error generating workout:', error);
      toast({
        title: 'Erro ao gerar treino',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.goal !== '';
    if (step === 2) return formData.experienceLevel !== '';
    if (step === 3) return formData.availableDays > 0;
    return true;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold">FIT IA</h1>
        <p className="text-muted-foreground">
          Responda algumas perguntas e a IA criará um treino personalizado para você
        </p>
      </div>

      {/* Progress */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div 
            key={s}
            className={`w-3 h-3 rounded-full transition-colors ${
              s <= step ? 'bg-primary' : 'bg-secondary'
            }`}
          />
        ))}
      </div>

      {/* AI Model Settings */}
      <Collapsible open={showSettings} onOpenChange={setShowSettings}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Settings size={16} />
              <span>Modelo de IA</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {AI_MODELS.find(m => m.id === selectedModel)?.name}
              </Badge>
              <ChevronDown size={16} className={`transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent className="p-4 space-y-2">
              {AI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedModel === model.id
                      ? 'bg-primary/10 border border-primary'
                      : 'bg-secondary/50 hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Brain size={16} className={selectedModel === model.id ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="font-medium">{model.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">{model.description}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Step 1: Goal */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target size={20} className="text-primary" />
              Qual é seu objetivo principal?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {GOALS.map((goal) => (
              <button
                key={goal}
                onClick={() => setFormData(prev => ({ ...prev, goal }))}
                className={`p-4 rounded-lg text-left transition-colors ${
                  formData.goal === goal
                    ? 'bg-primary/10 border border-primary'
                    : 'bg-secondary/50 hover:bg-secondary'
                }`}
              >
                {goal}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Experience */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell size={20} className="text-primary" />
              Qual seu nível de experiência?
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setFormData(prev => ({ ...prev, experienceLevel: level.id }))}
                className={`p-4 rounded-lg text-left transition-colors ${
                  formData.experienceLevel === level.id
                    ? 'bg-primary/10 border border-primary'
                    : 'bg-secondary/50 hover:bg-secondary'
                }`}
              >
                <div className="font-medium">{level.label}</div>
                <div className="text-sm text-muted-foreground">{level.description}</div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Availability */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              Disponibilidade para treinar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Quantos dias por semana?</Label>
              <div className="flex gap-2 mt-2">
                {[2, 3, 4, 5, 6].map((days) => (
                  <button
                    key={days}
                    onClick={() => setFormData(prev => ({ ...prev, availableDays: days }))}
                    className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                      formData.availableDays === days
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Duração por treino (minutos)</Label>
              <div className="flex gap-2 mt-2">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setFormData(prev => ({ ...prev, workoutDuration: mins }))}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      formData.workoutDuration === mins
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                  >
                    {mins}min
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Details */}
      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Áreas de foco (opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleFocusArea(area)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      formData.focusAreas.includes(area)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 hover:bg-secondary'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipamentos disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary"
                  >
                    <Checkbox
                      checked={formData.equipment.includes(item)}
                      onCheckedChange={() => toggleEquipment(item)}
                    />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle size={16} className="text-yellow-500" />
                Limitações ou lesões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Descreva qualquer limitação física, lesão ou condição que devemos considerar..."
                value={formData.limitations}
                onChange={(e) => setFormData(prev => ({ ...prev, limitations: e.target.value }))}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button 
            variant="outline" 
            onClick={() => setStep(s => s - 1)}
            className="flex-1"
            disabled={isGenerating}
          >
            Voltar
          </Button>
        )}
        
        {step < 4 ? (
          <Button 
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="flex-1"
          >
            Próximo
            <ArrowRight size={16} className="ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={generateWorkout}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Gerando treino...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Gerar Meu Treino
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
