import { useState, useEffect } from 'react';
import { 
  Pill, Plus, Trash2, Check, Clock, Bell, 
  History, Calendar, Sun, Moon, Dumbbell, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { format, isToday, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { requestNotificationPermission, sendDeviceNotification, scheduleNotification } from '@/utils/notifications';

interface Supplement {
  id: string;
  name: string;
  dosage: string | null;
  time_of_day: string;
  active: boolean;
  created_at: string;
}

interface SupplementLog {
  id: string;
  supplement_id: string;
  taken_at: string;
  created_at: string;
}

const TIME_OPTIONS = [
  { id: 'morning', label: 'Manhã', icon: Sun, description: 'Ao acordar' },
  { id: 'pre_workout', label: 'Pré-treino', icon: Dumbbell, description: '30min antes' },
  { id: 'post_workout', label: 'Pós-treino', icon: Dumbbell, description: 'Após treinar' },
  { id: 'night', label: 'Noite', icon: Moon, description: 'Antes de dormir' },
  { id: 'custom', label: 'Horário específico', icon: Clock, description: 'Escolher hora' },
];

export const SupplementsPage = () => {
  const { toast } = useToast();
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [logs, setLogs] = useState<SupplementLog[]>([]);
  const [todayLogs, setTodayLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const [newSupplement, setNewSupplement] = useState({
    name: '',
    dosage: '',
    time_of_day: 'morning'
  });

  useEffect(() => {
    fetchSupplements();
    fetchLogs();
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      toast({
        title: '🔔 Notificações ativadas!',
        description: 'Você receberá lembretes de suplementação',
      });
    }
  };

  const fetchSupplements = async () => {
    try {
      const { data, error } = await supabase
        .from('supplements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSupplements(data || []);
    } catch (error) {
      console.error('Error fetching supplements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const today = new Date();
      const { data, error } = await supabase
        .from('supplement_logs')
        .select('*')
        .gte('taken_at', startOfDay(today).toISOString())
        .lte('taken_at', endOfDay(today).toISOString());

      if (error) throw error;
      setTodayLogs((data || []).map(l => l.supplement_id));

      // Fetch all logs for history
      const { data: allLogs } = await supabase
        .from('supplement_logs')
        .select('*')
        .order('taken_at', { ascending: false })
        .limit(100);
      
      setLogs(allLogs || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const addSupplement = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('supplements')
        .insert({
          user_id: user.id,
          name: newSupplement.name,
          dosage: newSupplement.dosage || null,
          time_of_day: newSupplement.time_of_day
        })
        .select()
        .single();

      if (error) throw error;

      setSupplements(prev => [data, ...prev]);
      setShowAddDialog(false);
      setNewSupplement({ name: '', dosage: '', time_of_day: 'morning' });
      
      toast({
        title: '💊 Suplemento adicionado!',
      });
    } catch (error) {
      console.error('Error adding supplement:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar',
        variant: 'destructive'
      });
    }
  };

  const deleteSupplement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('supplements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSupplements(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Suplemento removido' });
    } catch (error) {
      console.error('Error deleting supplement:', error);
    }
  };

  const toggleTaken = async (supplement: Supplement) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isTaken = todayLogs.includes(supplement.id);

      if (isTaken) {
        // Remove log
        const { error } = await supabase
          .from('supplement_logs')
          .delete()
          .eq('supplement_id', supplement.id)
          .gte('taken_at', startOfDay(new Date()).toISOString())
          .lte('taken_at', endOfDay(new Date()).toISOString());

        if (error) throw error;
        setTodayLogs(prev => prev.filter(id => id !== supplement.id));
      } else {
        // Add log
        const { data, error } = await supabase
          .from('supplement_logs')
          .insert({
            user_id: user.id,
            supplement_id: supplement.id
          })
          .select()
          .single();

        if (error) throw error;
        setTodayLogs(prev => [...prev, supplement.id]);
        setLogs(prev => [data, ...prev]);
        
        toast({
          title: '✅ Suplemento registrado!',
        });
      }
    } catch (error) {
      console.error('Error toggling supplement:', error);
    }
  };

  const getTimeIcon = (timeOfDay: string) => {
    const option = TIME_OPTIONS.find(t => t.id === timeOfDay);
    return option?.icon || Clock;
  };

  const getTimeLabel = (timeOfDay: string) => {
    const option = TIME_OPTIONS.find(t => t.id === timeOfDay);
    return option?.label || timeOfDay;
  };

  const groupedSupplements = supplements.reduce((acc, supp) => {
    const key = supp.time_of_day;
    if (!acc[key]) acc[key] = [];
    acc[key].push(supp);
    return acc;
  }, {} as Record<string, Supplement[]>);

  const takenToday = todayLogs.length;
  const totalActive = supplements.filter(s => s.active).length;
  const completionPercentage = totalActive > 0 ? Math.round((takenToday / totalActive) * 100) : 0;

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
          <h1 className="text-2xl font-display font-bold">Suplementação</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus suplementos</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Suplemento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Whey Protein, Creatina..."
                  value={newSupplement.name}
                  onChange={(e) => setNewSupplement(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Dosagem (opcional)</Label>
                <Input
                  placeholder="Ex: 30g, 5g, 1 cápsula..."
                  value={newSupplement.dosage}
                  onChange={(e) => setNewSupplement(prev => ({ ...prev, dosage: e.target.value }))}
                />
              </div>
              <div>
                <Label>Horário</Label>
                <Select
                  value={newSupplement.time_of_day}
                  onValueChange={(v) => setNewSupplement(prev => ({ ...prev, time_of_day: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-2">
                          <option.icon size={14} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addSupplement} disabled={!newSupplement.name} className="w-full">
                Adicionar Suplemento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Progresso de Hoje</p>
              <p className="text-2xl font-bold">{takenToday}/{totalActive}</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center">
              <span className="text-lg font-bold">{completionPercentage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-primary" />
              <div>
                <p className="font-medium">Lembretes</p>
                <p className="text-sm text-muted-foreground">Receba notificações nos horários</p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={() => !notificationsEnabled && enableNotifications()}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">Hoje</TabsTrigger>
          <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4 mt-4">
          {Object.entries(groupedSupplements).map(([timeOfDay, supps]) => {
            const TimeIcon = getTimeIcon(timeOfDay);
            return (
              <div key={timeOfDay} className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TimeIcon size={16} />
                  <span>{getTimeLabel(timeOfDay)}</span>
                </div>
                {supps.filter(s => s.active).map((supp) => {
                  const isTaken = todayLogs.includes(supp.id);
                  return (
                    <Card 
                      key={supp.id}
                      className={`cursor-pointer transition-all ${isTaken ? 'bg-primary/10 border-primary/30' : ''}`}
                      onClick={() => toggleTaken(supp)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isTaken ? 'bg-primary border-primary' : 'border-muted-foreground'
                            }`}>
                              {isTaken && <Check size={14} className="text-primary-foreground" />}
                            </div>
                            <div>
                              <p className={`font-medium ${isTaken ? 'line-through opacity-60' : ''}`}>
                                {supp.name}
                              </p>
                              {supp.dosage && (
                                <p className="text-sm text-muted-foreground">{supp.dosage}</p>
                              )}
                            </div>
                          </div>
                          <Pill size={20} className="text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })}
          
          {supplements.length === 0 && (
            <Card className="p-8 text-center">
              <Pill className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhum suplemento cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione seus suplementos para acompanhar a ingestão
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus size={16} className="mr-2" />
                Adicionar Suplemento
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-4">
          {supplements.map((supp) => (
            <Card key={supp.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Pill size={20} className="text-primary" />
                    <div>
                      <p className="font-medium">{supp.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {supp.dosage && <span>{supp.dosage}</span>}
                        <Badge variant="outline" className="text-xs">
                          {getTimeLabel(supp.time_of_day)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSupplement(supp.id)}
                  >
                    <Trash2 size={16} className="text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="space-y-3 mt-4">
          {logs.slice(0, 30).map((log) => {
            const supp = supplements.find(s => s.id === log.supplement_id);
            return (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Check size={16} className="text-primary" />
                      <div>
                        <p className="font-medium">{supp?.name || 'Suplemento removido'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.taken_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {logs.length === 0 && (
            <Card className="p-8 text-center">
              <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Sem histórico</h3>
              <p className="text-sm text-muted-foreground">
                Comece a marcar seus suplementos para ver o histórico
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
