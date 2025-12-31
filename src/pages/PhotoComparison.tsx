import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Scale, Calendar,
  SplitSquareHorizontal, Move, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  photo_date: string;
  weight: number | null;
  notes: string | null;
}

const PHOTO_CATEGORIES = [
  { value: 'geral', label: 'Geral', icon: '📷' },
  { value: 'frente', label: 'Frente', icon: '🧍' },
  { value: 'costas', label: 'Costas', icon: '🔙' },
  { value: 'ombro', label: 'Ombro', icon: '💪' },
  { value: 'peito', label: 'Peito', icon: '🫁' },
  { value: 'abdomen', label: 'Abdômen', icon: '🎯' },
  { value: 'braco', label: 'Braço', icon: '💪' },
  { value: 'perna', label: 'Perna', icon: '🦵' },
];

export const PhotoComparisonPage = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(1);
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'slider'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .order('photo_date', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
      
      if (data && data.length >= 2) {
        setLeftIndex(0);
        setRightIndex(data.length - 1);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPhotoCategory = (photo: ProgressPhoto): string => {
    try {
      if (photo.notes) {
        const parsed = JSON.parse(photo.notes);
        return parsed.category || 'geral';
      }
    } catch {
      return 'geral';
    }
    return 'geral';
  };

  const filteredPhotos = photos.filter(photo => {
    if (filterCategory === 'all') return true;
    return getPhotoCategory(photo) === filterCategory;
  });

  const leftPhoto = filteredPhotos[leftIndex];
  const rightPhoto = filteredPhotos[rightIndex];

  const weightDiff = leftPhoto?.weight && rightPhoto?.weight 
    ? rightPhoto.weight - leftPhoto.weight 
    : null;

  const daysDiff = leftPhoto && rightPhoto
    ? Math.round((new Date(rightPhoto.photo_date).getTime() - new Date(leftPhoto.photo_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (photos.length < 2) {
    return (
      <div className="space-y-4 pb-20">
        <Button variant="ghost" onClick={() => navigate('/progress-photos')}>
          <ArrowLeft size={16} className="mr-2" />
          Voltar
        </Button>
        
        <Card className="p-8 text-center">
          <SplitSquareHorizontal className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Fotos insuficientes</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Você precisa de pelo menos 2 fotos para comparar
          </p>
          <Button onClick={() => navigate('/progress-photos')}>
            Adicionar Fotos
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/progress-photos')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-display font-bold">Comparativo</h1>
            <p className="text-muted-foreground text-sm">
              {daysDiff} dias de diferença
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={comparisonMode === 'side-by-side' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setComparisonMode('side-by-side')}
          >
            <SplitSquareHorizontal size={14} />
          </Button>
          <Button
            variant={comparisonMode === 'slider' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setComparisonMode('slider')}
          >
            <Move size={14} />
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <Select value={filterCategory} onValueChange={(v) => {
        setFilterCategory(v);
        setLeftIndex(0);
        setRightIndex(Math.min(1, filteredPhotos.length - 1));
      }}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Filtrar por categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">📷 Todas as categorias</SelectItem>
          {PHOTO_CATEGORIES.map(cat => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.icon} {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Weight Difference */}
      {weightDiff !== null && (
        <Card className="bg-gradient-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Antes</p>
                <p className="text-lg font-bold">{leftPhoto?.weight} kg</p>
              </div>
              <div className={`px-4 py-2 rounded-full font-bold ${
                weightDiff < 0 ? 'bg-primary/20 text-primary' : weightDiff > 0 ? 'bg-neon-orange/20 text-neon-orange' : 'bg-muted'
              }`}>
                {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Depois</p>
                <p className="text-lg font-bold">{rightPhoto?.weight} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison View */}
      {comparisonMode === 'side-by-side' ? (
        <div className="grid grid-cols-2 gap-2">
          {/* Left Photo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                disabled={leftIndex <= 0}
                onClick={() => setLeftIndex(prev => Math.max(0, prev - 1))}
              >
                <ChevronLeft size={18} />
              </Button>
              <Badge variant="secondary" className="text-xs">
                <Calendar size={10} className="mr-1" />
                {leftPhoto && format(new Date(leftPhoto.photo_date), 'dd/MM/yy')}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                disabled={leftIndex >= rightIndex - 1}
                onClick={() => setLeftIndex(prev => Math.min(rightIndex - 1, prev + 1))}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
            <div className="aspect-[3/4] rounded-lg overflow-hidden">
              {leftPhoto && (
                <img 
                  src={leftPhoto.photo_url}
                  alt="Antes"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground">ANTES</p>
          </div>

          {/* Right Photo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                disabled={rightIndex <= leftIndex + 1}
                onClick={() => setRightIndex(prev => Math.max(leftIndex + 1, prev - 1))}
              >
                <ChevronLeft size={18} />
              </Button>
              <Badge variant="secondary" className="text-xs">
                <Calendar size={10} className="mr-1" />
                {rightPhoto && format(new Date(rightPhoto.photo_date), 'dd/MM/yy')}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                disabled={rightIndex >= filteredPhotos.length - 1}
                onClick={() => setRightIndex(prev => Math.min(filteredPhotos.length - 1, prev + 1))}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
            <div className="aspect-[3/4] rounded-lg overflow-hidden">
              {rightPhoto && (
                <img 
                  src={rightPhoto.photo_url}
                  alt="Depois"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground">DEPOIS</p>
          </div>
        </div>
      ) : (
        /* Slider Mode */
        <div className="space-y-4">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
            {rightPhoto && (
              <img 
                src={rightPhoto.photo_url}
                alt="Depois"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {leftPhoto && (
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img 
                  src={leftPhoto.photo_url}
                  alt="Antes"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ width: `${(100 / sliderPosition) * 100}%` }}
                />
                <div className="absolute top-0 right-0 bottom-0 w-1 bg-primary shadow-lg" />
              </div>
            )}
            
            {/* Labels */}
            <div className="absolute top-2 left-2">
              <Badge className="bg-background/80 text-foreground">ANTES</Badge>
            </div>
            <div className="absolute top-2 right-2">
              <Badge className="bg-background/80 text-foreground">DEPOIS</Badge>
            </div>
          </div>

          <div className="px-4">
            <Slider
              value={[sliderPosition]}
              onValueChange={(v) => setSliderPosition(v[0])}
              min={5}
              max={95}
              step={1}
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{leftPhoto && format(new Date(leftPhoto.photo_date), 'dd MMM yyyy', { locale: ptBR })}</span>
            <span>{rightPhoto && format(new Date(rightPhoto.photo_date), 'dd MMM yyyy', { locale: ptBR })}</span>
          </div>
        </div>
      )}

      {/* Photo Selector */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Selecionar Fotos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filteredPhotos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => {
                  if (index < rightIndex) {
                    setLeftIndex(index);
                  } else if (index > leftIndex) {
                    setRightIndex(index);
                  }
                }}
                className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === leftIndex 
                    ? 'border-primary ring-2 ring-primary/30' 
                    : index === rightIndex 
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-border hover:border-muted-foreground'
                }`}
              >
                <img 
                  src={photo.photo_url}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary" /> Antes
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-accent" /> Depois
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};