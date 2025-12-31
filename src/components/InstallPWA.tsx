import { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    
    setIsIOS(isIOSDevice);
    
    // If already installed, don't show button
    if (isInStandaloneMode) {
      return;
    }

    // For iOS, show install instructions
    if (isIOSDevice) {
      setIsInstallable(true);
      return;
    }

    // For Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (!isInstallable) return null;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleInstallClick}
        className="w-full gap-2"
      >
        <Download size={18} />
        Instalar App
      </Button>

      {showIOSInstructions && (
        <div className="bg-card/80 backdrop-blur-lg border border-border/50 rounded-xl p-4 text-sm space-y-2">
          <div className="flex items-center gap-2 text-primary font-medium">
            <Smartphone size={16} />
            Como instalar no iOS
          </div>
          <ol className="text-muted-foreground space-y-1 ml-6 list-decimal">
            <li>Toque no botão de compartilhar (📤)</li>
            <li>Role e toque em "Adicionar à Tela de Início"</li>
            <li>Toque em "Adicionar"</li>
          </ol>
          <button
            onClick={() => setShowIOSInstructions(false)}
            className="text-xs text-primary hover:underline"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
};