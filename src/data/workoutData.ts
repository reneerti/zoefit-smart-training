import { WorkoutDay, WorkoutSession, DashboardStats } from '@/types/workout';

export const workoutPlan: WorkoutDay[] = [
  {
    id: 'seg',
    name: 'Segunda',
    title: 'Peito + Tríceps + Core',
    type: 'strength',
    duration: '50-55 min',
    blocks: [
      {
        id: 'aquec-seg',
        title: 'Aquecimento (5 min)',
        exercises: [
          { id: 'seg-1', name: 'Rotação de ombros + Flexão parede', sets: '2', reps: '15', notes: 'Ativar ombros e peito' },
          { id: 'seg-2', name: 'Prancha + Bird Dog', sets: '2', reps: '30seg', notes: 'Core ativado' }
        ]
      },
      {
        id: 'peito-seg',
        title: 'Peito (Força)',
        exercises: [
          { id: 'seg-3', name: 'Supino Reto com Barra', sets: '5', reps: '8-10', notes: 'Descanso: 90seg | Peso progressivo', priority: 'WHR', videoUrl: 'https://youtube.com/results?search_query=supino+reto+barra' },
          { id: 'seg-4', name: 'Supino Inclinado com Halteres', sets: '4', reps: '10-12', notes: 'Peitoral superior', videoUrl: 'https://youtube.com/results?search_query=supino+inclinado+halter' },
          { id: 'seg-5', name: 'Crossover na Polia', sets: '3', reps: '12-15', notes: 'Movimento lento e controlado', videoUrl: 'https://youtube.com/results?search_query=crossover+polia' }
        ]
      },
      {
        id: 'triceps-seg',
        title: 'Tríceps',
        exercises: [
          { id: 'seg-6', name: 'Tríceps Testa', sets: '3', reps: '10-12', videoUrl: 'https://youtube.com/results?search_query=triceps+testa' },
          { id: 'seg-7', name: 'Tríceps Polia', sets: '3', reps: '12-15', videoUrl: 'https://youtube.com/results?search_query=triceps+polia' }
        ]
      },
      {
        id: 'core-seg',
        title: 'Core',
        exercises: [
          { id: 'seg-8', name: 'Prancha', sets: '3', reps: '60seg', videoUrl: 'https://youtube.com/results?search_query=prancha+abdominal' },
          { id: 'seg-9', name: 'Prancha Lateral', sets: '3', reps: '45seg/lado', videoUrl: 'https://youtube.com/results?search_query=prancha+lateral' }
        ]
      }
    ]
  },
  {
    id: 'ter',
    name: 'Terça',
    title: 'HIIT + Core Intenso',
    type: 'hiit',
    duration: '60-70 min',
    blocks: [
      {
        id: 'aquec-ter',
        title: 'Aquecimento (5 min)',
        exercises: [
          { id: 'ter-1', name: 'Pular Corda', sets: '1', reps: '3 min', videoUrl: 'https://youtube.com/results?search_query=pular+corda' },
          { id: 'ter-2', name: 'High Knees + Butt Kicks', sets: '1', reps: '2 min alternados', videoUrl: 'https://youtube.com/results?search_query=high+knees' }
        ]
      },
      {
        id: 'circuito-ter',
        title: 'Circuito Metabólico - 4x',
        exercises: [
          { id: 'ter-3', name: 'Burpees', sets: '4', reps: '15', notes: 'Queima máxima', priority: 'BARRIGA', videoUrl: 'https://youtube.com/results?search_query=burpees' },
          { id: 'ter-4', name: 'Mountain Climbers', sets: '4', reps: '40seg', priority: 'BARRIGA', videoUrl: 'https://youtube.com/results?search_query=mountain+climbers' },
          { id: 'ter-5', name: 'Jump Squat', sets: '4', reps: '20', videoUrl: 'https://youtube.com/results?search_query=jump+squat' },
          { id: 'ter-6', name: 'Russian Twist', sets: '4', reps: '30 (15/lado)', videoUrl: 'https://youtube.com/results?search_query=russian+twist' }
        ]
      },
      {
        id: 'core-ter',
        title: 'Core Máximo - 3 séries',
        exercises: [
          { id: 'ter-7', name: 'Dead Bug', sets: '3', reps: '20 (10/lado)', videoUrl: 'https://youtube.com/results?search_query=dead+bug' },
          { id: 'ter-8', name: 'Bicycle Crunch', sets: '3', reps: '40 total', videoUrl: 'https://youtube.com/results?search_query=bicycle+crunch' },
          { id: 'ter-9', name: 'Leg Raises', sets: '3', reps: '15', notes: 'Abdômen inferior', videoUrl: 'https://youtube.com/results?search_query=leg+raises' }
        ]
      },
      {
        id: 'hiit-ter',
        title: 'Finalização HIIT',
        exercises: [
          { id: 'ter-10', name: 'Esteira/Bicicleta HIIT', sets: '1', reps: '15 min', notes: '30seg sprint + 90seg recuperação', priority: 'BARRIGA' }
        ]
      }
    ]
  },
  {
    id: 'qua',
    name: 'Quarta',
    title: 'Costas + Bíceps + Glúteos',
    type: 'strength',
    duration: '55-60 min',
    blocks: [
      {
        id: 'aquec-qua',
        title: 'Aquecimento (5 min)',
        exercises: [
          { id: 'qua-1', name: 'Remada elástico + Rotação', sets: '1', reps: '3 min', videoUrl: 'https://youtube.com/results?search_query=remada+elastico' },
          { id: 'qua-2', name: 'Agachamento sem peso', sets: '2', reps: '15', videoUrl: 'https://youtube.com/results?search_query=agachamento+livre' }
        ]
      },
      {
        id: 'costas-qua',
        title: 'Costas (Força)',
        exercises: [
          { id: 'qua-3', name: 'Remada Curvada (barra)', sets: '4', reps: '8-10', notes: 'Descanso: 90seg', videoUrl: 'https://youtube.com/results?search_query=remada+curvada' },
          { id: 'qua-4', name: 'Puxada Frente', sets: '4', reps: '8-12', videoUrl: 'https://youtube.com/results?search_query=puxada+frente' },
          { id: 'qua-5', name: 'Remada Unilateral', sets: '3', reps: '12/lado', videoUrl: 'https://youtube.com/results?search_query=remada+unilateral' }
        ]
      },
      {
        id: 'biceps-qua',
        title: 'Bíceps',
        exercises: [
          { id: 'qua-6', name: 'Rosca Direta (barra)', sets: '3', reps: '10-12', videoUrl: 'https://youtube.com/results?search_query=rosca+direta' },
          { id: 'qua-7', name: 'Rosca Martelo', sets: '3', reps: '12-15', videoUrl: 'https://youtube.com/results?search_query=rosca+martelo' }
        ]
      },
      {
        id: 'gluteos-qua',
        title: 'Glúteos (WHR)',
        exercises: [
          { id: 'qua-8', name: 'Hip Thrust', sets: '4', reps: '12-15', notes: 'PESO MÁXIMO!', priority: 'WHR', videoUrl: 'https://youtube.com/results?search_query=hip+thrust' },
          { id: 'qua-9', name: 'Abdução de Quadril', sets: '3', reps: '20', notes: 'Glúteo médio', videoUrl: 'https://youtube.com/results?search_query=abducao+quadril' }
        ]
      }
    ]
  },
  {
    id: 'qui',
    name: 'Quinta',
    title: 'Metabólico + Core',
    type: 'hiit',
    duration: '65-75 min',
    blocks: [
      {
        id: 'aquec-qui',
        title: 'Aquecimento (5 min)',
        exercises: [
          { id: 'qui-1', name: 'Burpees lentos', sets: '1', reps: '10', videoUrl: 'https://youtube.com/results?search_query=burpees' },
          { id: 'qui-2', name: 'Jumping Jacks', sets: '1', reps: '2 min', videoUrl: 'https://youtube.com/results?search_query=jumping+jacks' }
        ]
      },
      {
        id: 'tabata-qui',
        title: 'Circuito Tabata - 4 rodadas',
        exercises: [
          { id: 'qui-3', name: 'Sprint no lugar', sets: '4', reps: '20seg', priority: 'BARRIGA', videoUrl: 'https://youtube.com/results?search_query=sprint+no+lugar' },
          { id: 'qui-4', name: 'Squat Jump', sets: '4', reps: '20seg', videoUrl: 'https://youtube.com/results?search_query=squat+jump' },
          { id: 'qui-5', name: 'Mountain Climbers', sets: '4', reps: '20seg', priority: 'BARRIGA', videoUrl: 'https://youtube.com/results?search_query=mountain+climbers' },
          { id: 'qui-6', name: 'Burpees', sets: '4', reps: '20seg', priority: 'BARRIGA', videoUrl: 'https://youtube.com/results?search_query=burpees' }
        ]
      },
      {
        id: 'core-qui',
        title: 'Core Destruidor - 3x',
        exercises: [
          { id: 'qui-7', name: 'V-Up', sets: '3', reps: '15', notes: 'Abdômen completo', videoUrl: 'https://youtube.com/results?search_query=v+up+abdominal' },
          { id: 'qui-8', name: 'Prancha com toque ombro', sets: '3', reps: '20', videoUrl: 'https://youtube.com/results?search_query=prancha+toque+ombro' },
          { id: 'qui-9', name: 'Canivete', sets: '3', reps: '15/lado', videoUrl: 'https://youtube.com/results?search_query=canivete+abdominal' }
        ]
      }
    ]
  },
  {
    id: 'sex',
    name: 'Sexta',
    title: 'Pernas + Ombros + Glúteos',
    type: 'strength',
    duration: '60-70 min',
    blocks: [
      {
        id: 'aquec-sex',
        title: 'Aquecimento (5 min)',
        exercises: [
          { id: 'sex-1', name: 'Leg Swings + Rotação quadril', sets: '1', reps: '3 min', videoUrl: 'https://youtube.com/results?search_query=leg+swings' },
          { id: 'sex-2', name: 'Agachamento livre', sets: '2', reps: '20', videoUrl: 'https://youtube.com/results?search_query=agachamento+livre' }
        ]
      },
      {
        id: 'pernas-sex',
        title: 'Pernas (Força Máxima)',
        exercises: [
          { id: 'sex-3', name: 'Agachamento Livre', sets: '5', reps: '6-10', notes: 'Descanso: 2min | PESO MÁXIMO', priority: 'WHR', videoUrl: 'https://youtube.com/results?search_query=agachamento+livre+barra' },
          { id: 'sex-4', name: 'Stiff / Levantamento Terra', sets: '4', reps: '8-10', notes: 'Posterior + glúteos', videoUrl: 'https://youtube.com/results?search_query=stiff+levantamento+terra' },
          { id: 'sex-5', name: 'Leg Press 45°', sets: '4', reps: '12-15', notes: 'Pés afastados = mais glúteos', videoUrl: 'https://youtube.com/results?search_query=leg+press' },
          { id: 'sex-6', name: 'Afundo Búlgaro', sets: '3', reps: '12/perna', notes: 'Glúteos + equilíbrio', priority: 'WHR', videoUrl: 'https://youtube.com/results?search_query=afundo+bulgaro' }
        ]
      },
      {
        id: 'ombros-sex',
        title: 'Ombros',
        exercises: [
          { id: 'sex-7', name: 'Desenvolvimento Halteres', sets: '4', reps: '10-12', videoUrl: 'https://youtube.com/results?search_query=desenvolvimento+halteres' },
          { id: 'sex-8', name: 'Elevação Lateral', sets: '3', reps: '12-15', videoUrl: 'https://youtube.com/results?search_query=elevacao+lateral' }
        ]
      },
      {
        id: 'gluteos-sex',
        title: 'Glúteos Isolado',
        exercises: [
          { id: 'sex-9', name: 'Cadeira Abdutora', sets: '3', reps: '20', notes: 'Glúteo médio - essencial WHR', videoUrl: 'https://youtube.com/results?search_query=cadeira+abdutora' },
          { id: 'sex-10', name: 'Panturrilha', sets: '4', reps: '20', videoUrl: 'https://youtube.com/results?search_query=panturrilha' }
        ]
      },
      {
        id: 'core-sex',
        title: 'Core Final',
        exercises: [
          { id: 'sex-11', name: 'Hollow Hold', sets: '3', reps: '30-45seg', videoUrl: 'https://youtube.com/results?search_query=hollow+hold' }
        ]
      }
    ]
  }
];

// Demo data for sessions
export const demoSessions: WorkoutSession[] = [
  { id: '1', date: '2024-01-15', dayId: 'seg', dayName: 'Segunda', duration: 52, exercisesCompleted: 9, totalExercises: 9, notes: 'Treino completo!' },
  { id: '2', date: '2024-01-16', dayId: 'ter', dayName: 'Terça', duration: 65, exercisesCompleted: 10, totalExercises: 10 },
  { id: '3', date: '2024-01-17', dayId: 'qua', dayName: 'Quarta', duration: 58, exercisesCompleted: 9, totalExercises: 9 },
  { id: '4', date: '2024-01-18', dayId: 'qui', dayName: 'Quinta', duration: 70, exercisesCompleted: 9, totalExercises: 9 },
  { id: '5', date: '2024-01-19', dayId: 'sex', dayName: 'Sexta', duration: 62, exercisesCompleted: 11, totalExercises: 11 },
  { id: '6', date: '2024-01-22', dayId: 'seg', dayName: 'Segunda', duration: 55, exercisesCompleted: 9, totalExercises: 9 },
  { id: '7', date: '2024-01-23', dayId: 'ter', dayName: 'Terça', duration: 68, exercisesCompleted: 10, totalExercises: 10 },
];

export const demoStats: DashboardStats = {
  totalWorkouts: 24,
  thisWeekWorkouts: 4,
  totalMinutes: 1420,
  averageSessionTime: 59,
  streak: 7,
  exercisesCompleted: 216,
  weeklyProgress: [65, 85, 90, 75, 100, 0, 0]
};
