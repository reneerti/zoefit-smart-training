import { useState } from 'react';
import { 
  Sparkles, TrendingUp, AlertTriangle, Award, 
  ChevronRight, Brain, Loader2, BarChart3,
  Zap, Target, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkoutStore } from '@/store/workoutStore';
import { AIInsight } from '@/types/workout';
import { useToast } from '@/hooks/use-toast';

const demoInsights: AIInsight[] = [
  {
    id: '1',
    date: new Date().toISOString(),
    type: 'achievement',
    title: '🏆 Sequência Incrível!',
    content: 'Você completou 7 dias seguidos de treino! Isso coloca você no top 5% dos usuários do ZoeFIT. Continue assim para resultados ainda melhores.',
    metrics: [
      { label: 'Treinos seguidos', value: '7', trend: 'up' },
      { label: 'Melhor sequência', value: '7 dias', trend: 'up' }
    ]
  },
  {
    id: '2',
    date: new Date().toISOString(),
    type: 'progress',
    title: '📈 Progresso nos Treinos HIIT',
    content: 'Seus treinos HIIT estão 15% mais longos que na semana passada. Isso indica melhor condicionamento cardiovascular e resistência.',
    metrics: [
      { label: 'Duração média HIIT', value: '68 min', trend: 'up' },
      { label: 'Exercícios concluídos', value: '100%', trend: 'stable' }
    ]
  },
  {
    id: '3',
    date: new Date().toISOString(),
    type: 'recommendation',
    title: '💡 Sugestão de Otimização',
    content: 'Notei que você completa treinos de força mais rápido nas segundas-feiras. Considere aumentar a carga em 5-10% no Supino Reto para maximizar hipertrofia.',
    metrics: [
      { label: 'Tempo médio segunda', value: '52 min', trend: 'down' },
      { label: 'Potencial de ganho', value: '+10%' }
    ]
  },
  {
    id: '4',
    date: new Date().toISOString(),
    type: 'warning',
    title: '⚠️ Atenção ao Core',
    content: 'Seus exercícios de core têm taxa de conclusão menor (85%). Fortalecer o core é essencial para prevenir lesões e melhorar a postura.',
    metrics: [
      { label: 'Taxa conclusão core', value: '85%', trend: 'down' },
      { label: 'Meta recomendada', value: '95%' }
    ]
  }
];

const InsightCard = ({ insight }: { insight: AIInsight }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const iconMap = {
    progress: TrendingUp,
    recommendation: Sparkles,
    warning: AlertTriangle,
    achievement: Award
  };
  
  const colorMap = {
    progress: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30',
    recommendation: 'text-primary bg-primary/10 border-primary/30',
    warning: 'text-neon-orange bg-neon-orange/10 border-neon-orange/30',
    achievement: 'text-accent bg-accent/10 border-accent/30'
  };

  const Icon = iconMap[insight.type];
  const colors = colorMap[insight.type];

  return (
    <Card 
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary/50' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${colors} flex items-center justify-center shrink-0`}>
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{insight.title}</h3>
            <p className={`text-xs text-muted-foreground mt-1 ${!isExpanded && 'line-clamp-2'}`}>
              {insight.content}
            </p>
            
            {isExpanded && insight.metrics && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {insight.metrics.map((metric, idx) => (
                  <div key={idx} className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-display font-bold">{metric.value}</span>
                      {metric.trend && (
                        <span className={`text-xs ${
                          metric.trend === 'up' ? 'text-primary' : 
                          metric.trend === 'down' ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <ChevronRight 
            size={18} 
            className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const InsightsPage = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { stats, sessions } = useWorkoutStore();
  const { toast } = useToast();

  const generateInsights = async () => {
    setIsGenerating(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, this would call an AI endpoint
    setInsights(demoInsights);
    setIsGenerating(false);
    
    toast({
      title: '✨ Insights Gerados!',
      description: 'Análise completa dos seus treinos.',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-neon">
            <Brain size={32} className="text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-display font-bold">Insights IA</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Análise inteligente do seu desempenho com recomendações personalizadas
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <CardContent className="p-3">
            <BarChart3 size={20} className="mx-auto text-primary mb-1" />
            <p className="text-lg font-display font-bold">{stats.totalWorkouts}</p>
            <p className="text-[10px] text-muted-foreground">Treinos</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <Zap size={20} className="mx-auto text-neon-orange mb-1" />
            <p className="text-lg font-display font-bold">{stats.streak}</p>
            <p className="text-[10px] text-muted-foreground">Sequência</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-3">
            <Target size={20} className="mx-auto text-accent mb-1" />
            <p className="text-lg font-display font-bold">{Math.round((stats.exercisesCompleted / Math.max(stats.totalWorkouts * 10, 1)) * 100)}%</p>
            <p className="text-[10px] text-muted-foreground">Conclusão</p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <Button 
        className="w-full" 
        size="xl"
        onClick={generateInsights}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Analisando dados...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Gerar Insights com IA
          </>
        )}
      </Button>

      {/* Insights List */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Análise de {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>
          {insights.map((insight, index) => (
            <div 
              key={insight.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className="animate-fade-in"
            >
              <InsightCard insight={insight} />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {insights.length === 0 && !isGenerating && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Sparkles size={40} className="mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Clique no botão acima para gerar<br />insights personalizados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
