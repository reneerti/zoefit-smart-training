import { Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo = ({ size = 'md', showText = true }: LogoProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 28, text: 'text-2xl' },
    lg: { icon: 40, text: 'text-4xl' },
  };

  const handleClick = () => {
    // Se está autenticado, vai para o dashboard, senão vai para a página inicial
    navigate(isAuthenticated ? '/dashboard' : '/');
  };

  return (
    <button 
      onClick={handleClick}
      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-pulse-slow" />
        <div className="relative bg-gradient-primary p-2 rounded-xl shadow-neon">
          <Dumbbell size={sizes[size].icon} className="text-primary-foreground" />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-display font-bold ${sizes[size].text} text-gradient-primary`}>
            ZoeFIT
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Treino Inteligente
            </span>
          )}
        </div>
      )}
    </button>
  );
};
