import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  ArrowRight, Dumbbell, Brain, BarChart3, 
  Shield, Zap, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuthStore } from '@/store/workoutStore';

const Feature = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string 
}) => (
  <div className="flex gap-4 p-4 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm hover:border-primary/30 transition-all">
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Icon size={24} className="text-primary" />
    </div>
    <div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/10" />
        <div className="absolute top-1/4 -left-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/3 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,170,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,170,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 max-w-lg mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center animate-float">
            <Logo size="lg" />
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight">
              Seu Treino.{' '}
              <span className="text-gradient-primary">Inteligente.</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-sm mx-auto">
              Registre, acompanhe e otimize seus treinos com análises de IA personalizadas.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              size="xl" 
              onClick={() => navigate('/auth')}
              className="group"
            >
              Começar Agora
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              onClick={() => navigate('/auth')}
            >
              Já tenho conta
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-primary border-2 border-background flex items-center justify-center"
                >
                  <Users size={14} className="text-primary-foreground" />
                </div>
              ))}
            </div>
            <span>+2.500 usuários ativos</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 py-16 bg-secondary/20">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold mb-2">
              Por que ZoeFIT?
            </h2>
            <p className="text-muted-foreground">
              Tudo que você precisa para treinar melhor
            </p>
          </div>

          <div className="space-y-3">
            <Feature 
              icon={Dumbbell}
              title="Treinos Estruturados"
              description="Protocolo 5x por semana com força e HIIT organizados por dia"
            />
            <Feature 
              icon={Brain}
              title="Insights com IA"
              description="Análise inteligente do seu desempenho com recomendações personalizadas"
            />
            <Feature 
              icon={BarChart3}
              title="Dashboard Completo"
              description="Acompanhe progresso, sequências e métricas em tempo real"
            />
            <Feature 
              icon={Zap}
              title="Timer Integrado"
              description="Cronômetro automático com registro preciso de duração"
            />
            <Feature 
              icon={Shield}
              title="Seus Dados Seguros"
              description="Privacidade garantida com armazenamento local seguro"
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-4 py-12 text-center">
        <div className="max-w-lg mx-auto space-y-6">
          <h2 className="text-xl font-display font-bold">
            Pronto para transformar seus treinos?
          </h2>
          <Button 
            size="xl" 
            onClick={() => navigate('/auth')}
            className="w-full sm:w-auto"
          >
            Criar Conta Grátis
            <ArrowRight size={20} />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 border-t border-border/30">
        <div className="max-w-lg mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <Logo size="sm" showText={false} />
          <span>© 2024 ZoeFIT. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
