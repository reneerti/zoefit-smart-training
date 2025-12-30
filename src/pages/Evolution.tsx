import { useState, useEffect } from 'react';
import { 
  Scale, Ruler, TrendingUp, Plus, Calendar,
  ArrowUpRight, ArrowDownRight, Minus, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WeightRecord {
  id: string;
  weight: number;
  recorded_at: string;
}

interface BodyMeasurement {
  id: string;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  biceps: number | null;
  thighs: number | null;
  recorded_at: string;
}

const chartConfig = {
  weight: {
    label: "Peso",
    color: "hsl(var(--primary))",
  },
  chest: {
    label: "Peitoral",
    color: "hsl(var(--primary))",
  },
  waist: {
    label: "Cintura",
    color: "hsl(var(--accent))",
  },
  hips: {
    label: "Quadril",
    color: "hsl(var(--neon-cyan))",
  },
  biceps: {
    label: "Bíceps",
    color: "hsl(var(--neon-orange))",
  },
  thighs: {
    label: "Coxas",
    color: "hsl(var(--chart-5))",
  },
};

export const EvolutionPage = () => {
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const [isAddingMeasurements, setIsAddingMeasurements] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newMeasurements, setNewMeasurements] = useState({
    chest: '', waist: '', hips: '', biceps: '', thighs: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [weightRes, measurementsRes] = await Promise.all([
        supabase
          .from('weight_records')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: true }),
        supabase
          .from('body_measurements')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: true })
      ]);

      if (weightRes.data) setWeightRecords(weightRes.data);
      if (measurementsRes.data) setMeasurements(measurementsRes.data as BodyMeasurement[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      toast({ title: 'Erro', description: 'Informe um peso válido', variant: 'destructive' });
      return;
    }

    setIsAddingWeight(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('weight_records').insert({
        user_id: user.id,
        weight
      });

      if (error) throw error;

      toast({ title: 'Peso registrado!', description: `${weight} kg adicionado` });
      setNewWeight('');
      fetchData();
    } catch (error) {
      console.error('Error adding weight:', error);
      toast({ title: 'Erro', description: 'Falha ao registrar peso', variant: 'destructive' });
    } finally {
      setIsAddingWeight(false);
    }
  };

  const addMeasurements = async () => {
    setIsAddingMeasurements(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('body_measurements').insert({
        user_id: user.id,
        chest: newMeasurements.chest ? parseFloat(newMeasurements.chest) : null,
        waist: newMeasurements.waist ? parseFloat(newMeasurements.waist) : null,
        hips: newMeasurements.hips ? parseFloat(newMeasurements.hips) : null,
        biceps: newMeasurements.biceps ? parseFloat(newMeasurements.biceps) : null,
        thighs: newMeasurements.thighs ? parseFloat(newMeasurements.thighs) : null,
      });

      if (error) throw error;

      toast({ title: 'Medidas registradas!', description: 'Suas medidas foram salvas' });
      setNewMeasurements({ chest: '', waist: '', hips: '', biceps: '', thighs: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding measurements:', error);
      toast({ title: 'Erro', description: 'Falha ao registrar medidas', variant: 'destructive' });
    } finally {
      setIsAddingMeasurements(false);
    }
  };

  const getWeightChange = () => {
    if (weightRecords.length < 2) return null;
    const latest = weightRecords[weightRecords.length - 1].weight;
    const previous = weightRecords[weightRecords.length - 2].weight;
    return latest - previous;
  };

  const weightChange = getWeightChange();

  const weightChartData = weightRecords.map(r => ({
    date: new Date(r.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    weight: r.weight
  }));

  const measurementChartData = measurements.map(m => ({
    date: new Date(m.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    chest: m.chest,
    waist: m.waist,
    hips: m.hips,
    biceps: m.biceps,
    thighs: m.thighs
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Evolução</h1>
          <p className="text-muted-foreground text-sm">Acompanhe seu progresso físico</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scale size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peso Atual</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-display font-bold">
                    {weightRecords.length > 0 ? `${weightRecords[weightRecords.length - 1].weight} kg` : '-- kg'}
                  </p>
                  {weightChange !== null && (
                    <span className={`flex items-center text-xs ${weightChange < 0 ? 'text-primary' : weightChange > 0 ? 'text-neon-orange' : 'text-muted-foreground'}`}>
                      {weightChange < 0 ? <ArrowDownRight size={14} /> : weightChange > 0 ? <ArrowUpRight size={14} /> : <Minus size={14} />}
                      {Math.abs(weightChange).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Ruler size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registros</p>
                <p className="text-xl font-display font-bold">{measurements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weight Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale size={18} className="text-primary" />
              Evolução de Peso
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus size={16} />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Peso</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 70.5"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={addWeight} 
                    disabled={isAddingWeight}
                  >
                    {isAddingWeight ? <Loader2 className="animate-spin" /> : 'Salvar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {weightChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <AreaChart data={weightChartData}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#weightGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Scale size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum registro de peso</p>
                <p className="text-xs">Adicione seu primeiro registro</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Body Measurements Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ruler size={18} className="text-accent" />
              Medidas Corporais
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus size={16} />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Medidas (cm)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Peitoral</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={newMeasurements.chest}
                        onChange={(e) => setNewMeasurements(prev => ({ ...prev, chest: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Cintura</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={newMeasurements.waist}
                        onChange={(e) => setNewMeasurements(prev => ({ ...prev, waist: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Quadril</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={newMeasurements.hips}
                        onChange={(e) => setNewMeasurements(prev => ({ ...prev, hips: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Bíceps</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={newMeasurements.biceps}
                        onChange={(e) => setNewMeasurements(prev => ({ ...prev, biceps: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Coxas</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="cm"
                        value={newMeasurements.thighs}
                        onChange={(e) => setNewMeasurements(prev => ({ ...prev, thighs: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={addMeasurements} 
                    disabled={isAddingMeasurements}
                  >
                    {isAddingMeasurements ? <Loader2 className="animate-spin" /> : 'Salvar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {measurementChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={measurementChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="chest" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="waist" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="hips" stroke="hsl(174 100% 50%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="biceps" stroke="hsl(25 100% 55%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="thighs" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Ruler size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma medida registrada</p>
                <p className="text-xs">Adicione suas medidas corporais</p>
              </div>
            </div>
          )}

          {/* Legend */}
          {measurementChartData.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {Object.entries(chartConfig).filter(([k]) => k !== 'weight').map(([key, config]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-muted-foreground">{config.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
