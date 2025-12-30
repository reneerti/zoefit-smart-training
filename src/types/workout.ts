export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  notes?: string;
  videoUrl?: string;
  priority?: string;
  completed?: boolean;
}

export interface WorkoutBlock {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface WorkoutDay {
  id: string;
  name: string;
  title: string;
  type: 'strength' | 'hiit' | 'rest';
  duration: string;
  blocks: WorkoutBlock[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  dayId: string;
  dayName: string;
  duration: number;
  exercisesCompleted: number;
  totalExercises: number;
  notes?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  currentWeight?: number;
  targetWeight?: number;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  date: string;
  type: 'progress' | 'recommendation' | 'warning' | 'achievement';
  title: string;
  content: string;
  metrics?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  }[];
}

export interface DashboardStats {
  totalWorkouts: number;
  thisWeekWorkouts: number;
  totalMinutes: number;
  averageSessionTime: number;
  streak: number;
  exercisesCompleted: number;
  weeklyProgress: number[];
}
