import { useState, useEffect } from 'react';
import { 
  Brain, Save, Check, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AI_MODELS = [
  { 
    id: 'google/gemini-2.5-flash', 
    name: 'Gemini Flash', 
    provider: 'Google',
    description: 'Rápido e eficiente. Ideal para uso diário.',
    speed: 'Rápido',
    quality: 'Boa'
  },
  { 
    id: 'google/gemini-2.5-flash-lite', 
    name: 'Gemini Flash Lite', 
    provider: 'Google',
    description: 'Mais rápido e econômico. Bom para tarefas simples.',
    speed: 'Muito Rápido',
    quality: 'Básica'
  },
  { 
    id: 'google/gemini-2.5-pro', 
    name: 'Gemini Pro', 
    provider: 'Google',
    description: 'Alta qualidade para análises complexas.',
    speed: 'Médio',
    quality: 'Excelente'
  },
  { 
    id: 'openai/gpt-5-nano', 
    name: 'GPT-5 Nano', 
    provider: 'OpenAI',
    description: 'Mais rápido da família GPT-5. Eficiente para tarefas simples.',
    speed: 'Muito Rápido',
    quality: 'Básica'
  },
  { 
    id: 'openai/gpt-5-mini', 
    name: 'GPT-5 Mini', 
    provider: 'OpenAI',
    description: 'Balanceado entre velocidade e qualidade.',
    speed: 'Rápido',
    quality: 'Boa'
  },
  { 
    id: 'openai/gpt-5', 
    name: 'GPT-5', 
    provider: 'OpenAI',
    description: 'Máxima qualidade. Recomendado para análises profundas.',
    speed: 'Lento',
    quality: 'Máxima'
  },
];

export const AISettingsPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    insights_model: 'google/gemini-2.5-flash',
    form_model: 'google/gemini-2.5-flash'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          insights_model: data.insights_model,
          form_model: data.form_model
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
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
        .from('user_ai_settings')
        .upsert({
          user_id: user.id,
          insights_model: settings.insights_model,
          form_model: settings.form_model,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: 'Configurações salvas!',
        description: 'Suas preferências de IA foram atualizadas',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const ModelSelector = ({ 
    value, 
    onChange, 
    title, 
    description 
  }: { 
    value: string; 
    onChange: (v: string) => void;
    title: string;
    description: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {AI_MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => onChange(model.id)}
            className={`w-full p-4 rounded-lg text-left transition-all ${
              value === model.id
                ? 'bg-primary/10 border-2 border-primary'
                : 'bg-secondary/50 border-2 border-transparent hover:bg-secondary'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Brain size={16} className={value === model.id ? 'text-primary' : 'text-muted-foreground'} />
                  <span className="font-semibold">{model.name}</span>
                  <Badge variant="outline" className="text-xs">{model.provider}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-6">
                  {model.description}
                </p>
                <div className="flex gap-4 mt-2 ml-6 text-xs">
                  <span className="text-muted-foreground">
                    Velocidade: <span className="text-foreground">{model.speed}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Qualidade: <span className="text-foreground">{model.quality}</span>
                  </span>
                </div>
              </div>
              {value === model.id && (
                <Check size={20} className="text-primary shrink-0" />
              )}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );

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
        <h1 className="text-2xl font-display font-bold">Configurações de IA</h1>
        <p className="text-muted-foreground text-sm">
          Escolha quais modelos de IA usar para diferentes funcionalidades
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info size={20} className="text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Sobre os modelos de IA</p>
              <p className="text-muted-foreground mt-1">
                Modelos mais rápidos são ideais para uso frequente, enquanto modelos de maior qualidade 
                oferecem análises mais detalhadas. Você pode usar modelos diferentes para cada funcionalidade.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Model */}
      <ModelSelector
        value={settings.insights_model}
        onChange={(v) => setSettings(prev => ({ ...prev, insights_model: v }))}
        title="IA para Insights"
        description="Modelo usado para analisar seu progresso e gerar recomendações"
      />

      {/* Form Model */}
      <ModelSelector
        value={settings.form_model}
        onChange={(v) => setSettings(prev => ({ ...prev, form_model: v }))}
        title="IA para Geração de Treinos"
        description="Modelo usado no FIT IA para criar treinos personalizados"
      />

      {/* Save Button */}
      <Button onClick={saveSettings} disabled={isSaving} className="w-full">
        {isSaving ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
            Salvando...
          </>
        ) : (
          <>
            <Save size={16} className="mr-2" />
            Salvar Configurações
          </>
        )}
      </Button>
    </div>
  );
};
