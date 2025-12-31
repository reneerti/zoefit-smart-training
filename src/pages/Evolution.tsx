import { useState, useEffect } from 'react';
import { 
  Scale, Ruler, Plus, ArrowUpRight, ArrowDownRight, Minus, Loader2,
  Activity, Droplets, Flame, Heart, TrendingUp, Calendar, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area, ResponsiveContainer, Legend
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface BioimpedanceRecord {
  id: string;
  muscle_mass: number | null;
  body_fat: number | null;
  body_water: number | null;
  bone_mass: number | null;
  visceral_fat: number | null;
  metabolic_age: number | null;
  recorded_at: string;
}

const chartConfig = {
  weight: { label: "Peso", color: "hsl(var(--primary))" },
  chest: { label: "Peitoral", color: "hsl(var(--primary))" },
  waist: { label: "Cintura", color: "hsl(var(--accent))" },
  hips: { label: "Quadril", color: "hsl(var(--neon-cyan))" },
  biceps: { label: "Bíceps", color: "hsl(25 100% 55%)" },
  thighs: { label: "Coxas", color: "hsl(280 70% 55%)" },
  muscle_mass: { label: "Massa Muscular", color: "hsl(var(--primary))" },
  body_fat: { label: "Gordura", color: "hsl(25 100% 55%)" },
  body_water: { label: "Água", color: "hsl(180 100% 45%)" },
};

// Separate chart for each measurement
const MeasurementChart = ({ 
  data, 
  dataKey, 
  color, 
  label, 
  unit 
}: { 
  data: any[]; 
  dataKey: string; 
  color: string; 
  label: string; 
  unit: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredData = data.filter(d => d[dataKey] !== null && d[dataKey] !== undefined);
  
  if (filteredData.length === 0) return null;
  
  const latest = filteredData[filteredData.length - 1]?.[dataKey];
  const first = filteredData[0]?.[dataKey];
  const diff = latest - first;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{filteredData.length} registros</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold">{latest}{unit}</p>
                  {diff !== 0 && (
                    <p className={`text-xs flex items-center justify-end gap-0.5 ${
                      diff < 0 ? 'text-primary' : 'text-neon-orange'
                    }`}>
                      {diff > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                      {Math.abs(diff).toFixed(1)}{unit}
                    </p>
                  )}
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0">
            <ChartContainer config={chartConfig} className="h-[160px] w-full">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(value) => value}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(value) => `${value}${unit}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke={color} 
                  fill={`url(#gradient-${dataKey})`}
                  strokeWidth={2} 
                  dot={{ r: 3, fill: color }}
                />
              </AreaChart>
            </ChartContainer>
            
            {/* History list */}
            <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
              {[...filteredData].reverse().map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{item.date}</span>
                  <span className="font-medium">{item[dataKey]}{unit}</span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export const EvolutionPage = () => {
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [bioRecords, setBioRecords] = useState<BioimpedanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingWeight, setIsAddingWeight] = useState(false);
  const [isAddingMeasurements, setIsAddingMeasurements] = useState(false);
  const [isAddingBio, setIsAddingBio] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newMeasurements, setNewMeasurements] = useState({
    chest: '', waist: '', hips: '', biceps: '', thighs: ''
  });
  const [newBio, setNewBio] = useState({
    muscle_mass: '', body_fat: '', body_water: '', bone_mass: '', visceral_fat: '', metabolic_age: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [weightRes, measurementsRes, bioRes] = await Promise.all([
        supabase.from('weight_records').select('*').eq('user_id', user.id).order('recorded_at', { ascending: true }),
        supabase.from('body_measurements').select('*').eq('user_id', user.id).order('recorded_at', { ascending: true }),
        supabase.from('bioimpedance_records').select('*').eq('user_id', user.id).order('recorded_at', { ascending: true })
      ]);

      if (weightRes.data) setWeightRecords(weightRes.data);
      if (measurementsRes.data) setMeasurements(measurementsRes.data as BodyMeasurement[]);
      if (bioRes.data) setBioRecords(bioRes.data as BioimpedanceRecord[]);
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
      await supabase.from('weight_records').insert({ user_id: user.id, weight });
      toast({ title: 'Peso registrado!' });
      setNewWeight('');
      fetchData();
    } catch (error) {
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setIsAddingWeight(false);
    }
  };

  const addMeasurements = async () => {
    setIsAddingMeasurements(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      await supabase.from('body_measurements').insert({
        user_id: user.id,
        chest: newMeasurements.chest ? parseFloat(newMeasurements.chest) : null,
        waist: newMeasurements.waist ? parseFloat(newMeasurements.waist) : null,
        hips: newMeasurements.hips ? parseFloat(newMeasurements.hips) : null,
        biceps: newMeasurements.biceps ? parseFloat(newMeasurements.biceps) : null,
        thighs: newMeasurements.thighs ? parseFloat(newMeasurements.thighs) : null,
      });
      toast({ title: 'Medidas registradas!' });
      setNewMeasurements({ chest: '', waist: '', hips: '', biceps: '', thighs: '' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setIsAddingMeasurements(false);
    }
  };

  const addBioimpedance = async () => {
    setIsAddingBio(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      await supabase.from('bioimpedance_records').insert({
        user_id: user.id,
        muscle_mass: newBio.muscle_mass ? parseFloat(newBio.muscle_mass) : null,
        body_fat: newBio.body_fat ? parseFloat(newBio.body_fat) : null,
        body_water: newBio.body_water ? parseFloat(newBio.body_water) : null,
        bone_mass: newBio.bone_mass ? parseFloat(newBio.bone_mass) : null,
        visceral_fat: newBio.visceral_fat ? parseInt(newBio.visceral_fat) : null,
        metabolic_age: newBio.metabolic_age ? parseInt(newBio.metabolic_age) : null,
      });
      toast({ title: 'Bioimpedância registrada!' });
      setNewBio({ muscle_mass: '', body_fat: '', body_water: '', bone_mass: '', visceral_fat: '', metabolic_age: '' });
      fetchData();
    } catch (error) {
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setIsAddingBio(false);
    }
  };

  const getWeightChange = () => {
    if (weightRecords.length < 2) return null;
    return weightRecords[weightRecords.length - 1].weight - weightRecords[weightRecords.length - 2].weight;
  };

  const weightChange = getWeightChange();
  const latestBio = bioRecords[bioRecords.length - 1];

  const weightChartData = weightRecords.map(r => ({
    date: new Date(r.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    weight: r.weight
  }));

  const measurementChartData = measurements.map(m => ({
    date: new Date(m.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    chest: m.chest, waist: m.waist, hips: m.hips, biceps: m.biceps, thighs: m.thighs
  }));

  const bioChartData = bioRecords.map(b => ({
    date: new Date(b.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    muscle_mass: b.muscle_mass, body_fat: b.body_fat, body_water: b.body_water
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      <div>
        <h1 className="text-2xl font-display font-bold">Evolução</h1>
        <p className="text-muted-foreground text-sm">Acompanhe seu progresso físico</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scale size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Peso</p>
                <div className="flex items-center gap-1">
                  <p className="text-lg font-display font-bold">
                    {weightRecords.length > 0 ? `${weightRecords[weightRecords.length - 1].weight}` : '--'}
                  </p>
                  <span className="text-xs">kg</span>
                  {weightChange !== null && (
                    <span className={`flex items-center text-[10px] ${weightChange < 0 ? 'text-primary' : weightChange > 0 ? 'text-neon-orange' : ''}`}>
                      {weightChange < 0 ? <ArrowDownRight size={10} /> : weightChange > 0 ? <ArrowUpRight size={10} /> : <Minus size={10} />}
                      {Math.abs(weightChange).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neon-orange/10 flex items-center justify-center">
                <Flame size={16} className="text-neon-orange" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Gordura</p>
                <p className="text-lg font-display font-bold">
                  {latestBio?.body_fat ? `${latestBio.body_fat}%` : '--%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Massa Muscular</p>
                <p className="text-lg font-display font-bold">
                  {latestBio?.muscle_mass ? `${latestBio.muscle_mass}kg` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                <Droplets size={16} className="text-neon-cyan" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Água</p>
                <p className="text-lg font-display font-bold">
                  {latestBio?.body_water ? `${latestBio.body_water}%` : '--%'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weight" className="text-xs">Peso</TabsTrigger>
          <TabsTrigger value="measurements" className="text-xs">Medidas</TabsTrigger>
          <TabsTrigger value="bio" className="text-xs">Bioimpedância</TabsTrigger>
        </TabsList>

        {/* Weight Tab */}
        <TabsContent value="weight" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Scale size={16} className="text-primary" />
                  Histórico de Peso
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Plus size={14} /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Registrar Peso</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Peso (kg)</Label>
                        <Input type="number" step="0.1" placeholder="70.5" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
                      </div>
                      <Button className="w-full" onClick={addWeight} disabled={isAddingWeight}>
                        {isAddingWeight ? <Loader2 className="animate-spin" /> : 'Salvar'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {weightChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <AreaChart data={weightChartData}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} 
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tickFormatter={(v) => `${v}kg`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" fill="url(#weightGradient)" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                  Nenhum registro
                </div>
              )}
              
              {/* Weight History */}
              {weightRecords.length > 0 && (
                <div className="mt-4 max-h-40 overflow-y-auto space-y-1 border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Histórico completo</p>
                  {[...weightRecords].reverse().map((record, i) => (
                    <div key={record.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-muted-foreground">
                        {format(new Date(record.recorded_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                      <span className="font-bold">{record.weight} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="measurements" className="mt-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Ruler size={16} className="text-accent" />
              Fita Métrica (cm)
            </h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm"><Plus size={14} className="mr-1" /> Registrar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Medidas (cm)</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Peitoral</Label><Input type="number" step="0.1" placeholder="cm" value={newMeasurements.chest} onChange={(e) => setNewMeasurements(prev => ({ ...prev, chest: e.target.value }))} /></div>
                    <div><Label>Cintura</Label><Input type="number" step="0.1" placeholder="cm" value={newMeasurements.waist} onChange={(e) => setNewMeasurements(prev => ({ ...prev, waist: e.target.value }))} /></div>
                    <div><Label>Quadril</Label><Input type="number" step="0.1" placeholder="cm" value={newMeasurements.hips} onChange={(e) => setNewMeasurements(prev => ({ ...prev, hips: e.target.value }))} /></div>
                    <div><Label>Bíceps</Label><Input type="number" step="0.1" placeholder="cm" value={newMeasurements.biceps} onChange={(e) => setNewMeasurements(prev => ({ ...prev, biceps: e.target.value }))} /></div>
                    <div className="col-span-2"><Label>Coxas</Label><Input type="number" step="0.1" placeholder="cm" value={newMeasurements.thighs} onChange={(e) => setNewMeasurements(prev => ({ ...prev, thighs: e.target.value }))} /></div>
                  </div>
                  <Button className="w-full" onClick={addMeasurements} disabled={isAddingMeasurements}>
                    {isAddingMeasurements ? <Loader2 className="animate-spin" /> : 'Salvar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Individual measurement charts */}
          <MeasurementChart 
            data={measurementChartData}
            dataKey="chest"
            color="hsl(var(--primary))"
            label="Peitoral"
            unit="cm"
          />
          <MeasurementChart 
            data={measurementChartData}
            dataKey="waist"
            color="hsl(var(--accent))"
            label="Cintura"
            unit="cm"
          />
          <MeasurementChart 
            data={measurementChartData}
            dataKey="hips"
            color="hsl(180 100% 45%)"
            label="Quadril"
            unit="cm"
          />
          <MeasurementChart 
            data={measurementChartData}
            dataKey="biceps"
            color="hsl(25 100% 55%)"
            label="Bíceps"
            unit="cm"
          />
          <MeasurementChart 
            data={measurementChartData}
            dataKey="thighs"
            color="hsl(280 70% 55%)"
            label="Coxas"
            unit="cm"
          />

          {measurementChartData.length === 0 && (
            <Card className="p-6 text-center">
              <Ruler className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma medida registrada</p>
            </Card>
          )}
        </TabsContent>

        {/* Bioimpedance Tab */}
        <TabsContent value="bio" className="mt-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Bioimpedância
            </h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm"><Plus size={14} className="mr-1" /> Registrar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Bioimpedância</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Massa Muscular (kg)</Label><Input type="number" step="0.1" value={newBio.muscle_mass} onChange={(e) => setNewBio(prev => ({ ...prev, muscle_mass: e.target.value }))} /></div>
                    <div><Label>Gordura Corporal (%)</Label><Input type="number" step="0.1" value={newBio.body_fat} onChange={(e) => setNewBio(prev => ({ ...prev, body_fat: e.target.value }))} /></div>
                    <div><Label>Água Corporal (%)</Label><Input type="number" step="0.1" value={newBio.body_water} onChange={(e) => setNewBio(prev => ({ ...prev, body_water: e.target.value }))} /></div>
                    <div><Label>Massa Óssea (kg)</Label><Input type="number" step="0.1" value={newBio.bone_mass} onChange={(e) => setNewBio(prev => ({ ...prev, bone_mass: e.target.value }))} /></div>
                    <div><Label>Gordura Visceral</Label><Input type="number" value={newBio.visceral_fat} onChange={(e) => setNewBio(prev => ({ ...prev, visceral_fat: e.target.value }))} /></div>
                    <div><Label>Idade Metabólica</Label><Input type="number" value={newBio.metabolic_age} onChange={(e) => setNewBio(prev => ({ ...prev, metabolic_age: e.target.value }))} /></div>
                  </div>
                  <Button className="w-full" onClick={addBioimpedance} disabled={isAddingBio}>
                    {isAddingBio ? <Loader2 className="animate-spin" /> : 'Salvar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Individual bio charts */}
          <MeasurementChart 
            data={bioChartData}
            dataKey="muscle_mass"
            color="hsl(var(--primary))"
            label="Massa Muscular"
            unit="kg"
          />
          <MeasurementChart 
            data={bioChartData}
            dataKey="body_fat"
            color="hsl(25 100% 55%)"
            label="Gordura Corporal"
            unit="%"
          />
          <MeasurementChart 
            data={bioChartData}
            dataKey="body_water"
            color="hsl(180 100% 45%)"
            label="Água Corporal"
            unit="%"
          />
              
          {/* Latest bio values */}
          {latestBio && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Outros Indicadores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Gordura Visceral</p>
                    <p className="text-lg font-bold">{latestBio.visceral_fat || '--'}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Massa Óssea</p>
                    <p className="text-lg font-bold">{latestBio.bone_mass ? `${latestBio.bone_mass}kg` : '--'}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Idade Metab.</p>
                    <p className="text-lg font-bold">{latestBio.metabolic_age || '--'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {bioChartData.length === 0 && (
            <Card className="p-6 text-center">
              <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum registro de bioimpedância</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
