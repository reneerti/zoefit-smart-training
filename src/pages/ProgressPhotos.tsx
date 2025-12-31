import { useState, useEffect, useRef } from 'react';
import { 
  Camera, Plus, Trash2, ChevronLeft, ChevronRight, 
  Calendar, Scale, X, ZoomIn, Upload
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  photo_date: string;
  weight: number | null;
  notes: string | null;
  created_at: string;
}

export const ProgressPhotosPage = () => {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [compareIndex, setCompareIndex] = useState({ left: 0, right: 1 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newPhoto, setNewPhoto] = useState({
    file: null as File | null,
    preview: '',
    weight: '',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

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
    
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload file to storage
      const fileExt = newPhoto.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, newPhoto.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      // Save to database
      const { data, error } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          photo_url: publicUrl,
          photo_date: newPhoto.date,
          weight: newPhoto.weight ? parseFloat(newPhoto.weight) : null,
          notes: newPhoto.notes || null
        })
        .select()
        .single();

      if (error) throw error;

      setPhotos(prev => [data, ...prev]);
      setShowUploadDialog(false);
      setNewPhoto({ file: null, preview: '', weight: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
      
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
      // Delete from storage
      const path = photo.photo_url.split('/progress-photos/')[1];
      if (path) {
        await supabase.storage.from('progress-photos').remove([path]);
      }

      // Delete from database
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
          <p className="text-muted-foreground text-sm">Acompanhe sua evolução visual</p>
        </div>
        <div className="flex gap-2">
          {photos.length >= 2 && (
            <Button variant="outline" onClick={() => setShowCompareDialog(true)}>
              <ZoomIn size={16} className="mr-2" />
              Comparar
            </Button>
          )}
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
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
                  <Label>Notas (opcional)</Label>
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

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo) => (
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
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-medium">
                    {format(new Date(photo.photo_date), 'dd MMM yyyy', { locale: ptBR })}
                  </p>
                  {photo.weight && (
                    <p className="text-white/80 text-xs">{photo.weight} kg</p>
                  )}
                </div>
              </div>
            </Card>
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
              <div className="flex gap-4">
                {selectedPhoto.weight && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Scale size={12} />
                    {selectedPhoto.weight} kg
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar size={12} />
                  {format(new Date(selectedPhoto.photo_date), 'dd/MM/yyyy')}
                </Badge>
              </div>
              {selectedPhoto.notes && (
                <p className="text-sm text-muted-foreground">{selectedPhoto.notes}</p>
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
