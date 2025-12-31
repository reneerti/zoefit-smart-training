import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Plus, Trash2, ChevronLeft, ChevronRight, 
  Calendar, Scale, X, ZoomIn, Upload, Filter, Grid, List,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  photo_date: string;
  weight: number | null;
  notes: string | null;
  created_at: string;
  category?: string;
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

const MAX_DAILY_PHOTOS = 3;

export const ProgressPhotosEnhancedPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [compareIndex, setCompareIndex] = useState({ left: 0, right: 1 });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'category'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newPhoto, setNewPhoto] = useState({
    file: null as File | null,
    preview: '',
    weight: '',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'geral'
  });

  const todayPhotosCount = photos.filter(p => 
    isToday(parseISO(p.photo_date))
  ).length;

  const canUploadMore = todayPhotosCount < MAX_DAILY_PHOTOS;

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .order('photo_date', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'Máximo de 5MB por foto',
          variant: 'destructive'
        });
        return;
      }
      
      const preview = URL.createObjectURL(file);
      setNewPhoto(prev => ({ ...prev, file, preview }));
    }
  };

  const uploadPhoto = async () => {
    if (!newPhoto.file) return;
    
    if (!canUploadMore && isToday(parseISO(newPhoto.date))) {
      toast({
        title: 'Limite diário atingido',
        description: `Máximo de ${MAX_DAILY_PHOTOS} fotos por dia`,
        variant: 'destructive'
      });
      return;
    }
    
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = newPhoto.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, newPhoto.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      // Store category in notes as JSON prefix for now
      const notesWithCategory = JSON.stringify({ 
        category: newPhoto.category, 
        text: newPhoto.notes 
      });

      const { data, error } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          photo_date: newPhoto.date,
          weight: newPhoto.weight ? parseFloat(newPhoto.weight) : null,
          notes: notesWithCategory
        })
        .select()
        .single();

      if (error) throw error;

      setPhotos(prev => [{ ...data, category: newPhoto.category }, ...prev]);
      setShowUploadDialog(false);
      setNewPhoto({ file: null, preview: '', weight: '', notes: '', date: format(new Date(), 'yyyy-MM-dd'), category: 'geral' });
      
      toast({
        title: '📸 Foto salva!',
        description: 'Continue registrando sua evolução',
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Erro ao enviar foto',
        description: 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async (photo: ProgressPhoto) => {
    try {
      const path = photo.photo_url.split('/progress-photos/')[1];
      if (path) {
        await supabase.storage.from('progress-photos').remove([path]);
      }

      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;

      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      setSelectedPhoto(null);
      toast({ title: 'Foto excluída' });
    } catch (error) {
      console.error('Error deleting photo:', error);
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

  const getPhotoNotes = (photo: ProgressPhoto): string => {
    try {
      if (photo.notes) {
        const parsed = JSON.parse(photo.notes);
        return parsed.text || photo.notes;
      }
    } catch {
      return photo.notes || '';
    }
    return '';
  };

  const filteredPhotos = photos.filter(photo => {
    if (filterCategory === 'all') return true;
    return getPhotoCategory(photo) === filterCategory;
  });

  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.photo_date).getTime() - new Date(a.photo_date).getTime();
    }
    return getPhotoCategory(a).localeCompare(getPhotoCategory(b));
  });

  // Group photos by date for social feed style
  const groupedPhotos = sortedPhotos.reduce((acc, photo) => {
    const date = photo.photo_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(photo);
    return acc;
  }, {} as Record<string, ProgressPhoto[]>);

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
          <h1 className="text-2xl font-display font-bold">Fotos de Progresso</h1>
          <p className="text-muted-foreground text-sm">
            {todayPhotosCount}/{MAX_DAILY_PHOTOS} fotos hoje
          </p>
        </div>
        <div className="flex gap-2">
          {photos.length >= 2 && (
            <Button variant="outline" onClick={() => navigate('/photo-comparison')}>
              <ZoomIn size={16} className="mr-2" />
              Comparar
            </Button>
          )}
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button disabled={!canUploadMore}>
                <Camera size={16} className="mr-2" />
                Nova Foto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Foto de Progresso</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                {newPhoto.preview ? (
                  <div className="relative">
                    <img 
                      src={newPhoto.preview} 
                      alt="Preview" 
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setNewPhoto(prev => ({ ...prev, file: null, preview: '' }))}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors"
                  >
                    <Upload size={32} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Clique para selecionar uma foto</span>
                    <span className="text-xs text-muted-foreground">Máximo 5MB</span>
                  </button>
                )}
                
                <div>
                  <Label>Categoria</Label>
                  <Select value={newPhoto.category} onValueChange={(v) => setNewPhoto(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PHOTO_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newPhoto.date}
                      onChange={(e) => setNewPhoto(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Peso (opcional)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 70.5"
                      value={newPhoto.weight}
                      onChange={(e) => setNewPhoto(prev => ({ ...prev, weight: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Observação (opcional)</Label>
                  <Textarea
                    placeholder="Como você está se sentindo? Observações..."
                    value={newPhoto.notes}
                    onChange={(e) => setNewPhoto(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                
                <Button 
                  onClick={uploadPhoto} 
                  disabled={!newPhoto.file || isUploading}
                  className="w-full"
                >
                  {isUploading ? 'Enviando...' : 'Salvar Foto'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filterCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory('all')}
        >
          Todas
        </Button>
        {PHOTO_CATEGORIES.map(cat => (
          <Button
            key={cat.value}
            variant={filterCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(cat.value)}
          >
            {cat.icon} {cat.label}
          </Button>
        ))}
      </div>

      {/* Sort & View Controls */}
      <div className="flex items-center justify-between">
        <Select value={sortBy} onValueChange={(v: 'date' | 'category') => setSortBy(v)}>
          <SelectTrigger className="w-40">
            <Filter size={14} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Por Data</SelectItem>
            <SelectItem value="category">Por Categoria</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid size={16} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Photo Feed */}
      {Object.keys(groupedPhotos).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedPhotos).map(([date, datePhotos]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">
                  {format(new Date(date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {datePhotos.length} foto{datePhotos.length > 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 gap-3' 
                : 'space-y-3'
              }>
                {datePhotos.map((photo) => {
                  const category = getPhotoCategory(photo);
                  const catInfo = PHOTO_CATEGORIES.find(c => c.value === category);
                  const notes = getPhotoNotes(photo);
                  
                  return viewMode === 'grid' ? (
                    <Card 
                      key={photo.id} 
                      className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <div className="aspect-square relative">
                        <img 
                          src={photo.photo_url} 
                          alt={`Progresso ${photo.photo_date}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs">
                            {catInfo?.icon} {catInfo?.label}
                          </Badge>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          {photo.weight && (
                            <p className="text-white text-xs">{photo.weight} kg</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card 
                      key={photo.id}
                      className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <CardContent className="p-3 flex gap-3">
                        <img 
                          src={photo.photo_url} 
                          alt={`Progresso ${photo.photo_date}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {catInfo?.icon} {catInfo?.label}
                            </Badge>
                            {photo.weight && (
                              <span className="text-xs text-muted-foreground">{photo.weight} kg</span>
                            )}
                          </div>
                          {notes && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{notes}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Nenhuma foto ainda</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tire fotos regularmente para acompanhar sua evolução
          </p>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Camera size={16} className="mr-2" />
            Adicionar Primeira Foto
          </Button>
        </Card>
      )}

      {/* Photo Detail Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-lg">
          {selectedPhoto && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{format(new Date(selectedPhoto.photo_date), 'dd MMMM yyyy', { locale: ptBR })}</span>
                  <Button variant="ghost" size="icon" onClick={() => deletePhoto(selectedPhoto)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </DialogTitle>
              </DialogHeader>
              <img 
                src={selectedPhoto.photo_url} 
                alt="Progresso"
                className="w-full rounded-lg"
              />
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">
                  {PHOTO_CATEGORIES.find(c => c.value === getPhotoCategory(selectedPhoto))?.icon}{' '}
                  {PHOTO_CATEGORIES.find(c => c.value === getPhotoCategory(selectedPhoto))?.label}
                </Badge>
                {selectedPhoto.weight && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Scale size={12} />
                    {selectedPhoto.weight} kg
                  </Badge>
                )}
              </div>
              {getPhotoNotes(selectedPhoto) && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <MessageSquare size={14} className="text-muted-foreground mt-0.5" />
                  <p className="text-sm">{getPhotoNotes(selectedPhoto)}</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Comparar Evolução</DialogTitle>
          </DialogHeader>
          {photos.length >= 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={compareIndex.left <= 0}
                    onClick={() => setCompareIndex(prev => ({ ...prev, left: prev.left - 1 }))}
                  >
                    <ChevronLeft size={20} />
                  </Button>
                  <span className="text-sm font-medium">
                    {format(new Date(photos[compareIndex.left]?.photo_date), 'dd/MM/yyyy')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={compareIndex.left >= photos.length - 1}
                    onClick={() => setCompareIndex(prev => ({ ...prev, left: prev.left + 1 }))}
                  >
                    <ChevronRight size={20} />
                  </Button>
                </div>
                <img 
                  src={photos[compareIndex.left]?.photo_url}
                  alt="Antes"
                  className="w-full aspect-square object-cover rounded-lg"
                />
                {photos[compareIndex.left]?.weight && (
                  <p className="text-center mt-2 text-sm text-muted-foreground">
                    {photos[compareIndex.left].weight} kg
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={compareIndex.right <= 0}
                    onClick={() => setCompareIndex(prev => ({ ...prev, right: prev.right - 1 }))}
                  >
                    <ChevronLeft size={20} />
                  </Button>
                  <span className="text-sm font-medium">
                    {format(new Date(photos[compareIndex.right]?.photo_date), 'dd/MM/yyyy')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={compareIndex.right >= photos.length - 1}
                    onClick={() => setCompareIndex(prev => ({ ...prev, right: prev.right + 1 }))}
                  >
                    <ChevronRight size={20} />
                  </Button>
                </div>
                <img 
                  src={photos[compareIndex.right]?.photo_url}
                  alt="Depois"
                  className="w-full aspect-square object-cover rounded-lg"
                />
                {photos[compareIndex.right]?.weight && (
                  <p className="text-center mt-2 text-sm text-muted-foreground">
                    {photos[compareIndex.right].weight} kg
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
