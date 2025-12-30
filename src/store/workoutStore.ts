import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WorkoutSession, DashboardStats } from '@/types/workout';
import { demoSessions, demoStats } from '@/data/workoutData';

interface AuthState {
  isAuthenticated: boolean;
  user: { email: string; name: string } | null;
  login: (email: string, name: string) => void;
  logout: () => void;
}

interface WorkoutState {
  sessions: WorkoutSession[];
  stats: DashboardStats;
  currentSession: {
    isActive: boolean;
    startTime: number | null;
    dayId: string | null;
    completedExercises: string[];
  };
  addSession: (session: WorkoutSession) => void;
  startWorkout: (dayId: string) => void;
  endWorkout: () => void;
  toggleExercise: (exerciseId: string) => void;
  updateStats: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (email, name) => set({ isAuthenticated: true, user: { email, name } }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    { name: 'zoefit-auth' }
  )
);

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      sessions: demoSessions,
      stats: demoStats,
      currentSession: {
        isActive: false,
        startTime: null,
        dayId: null,
        completedExercises: [],
      },
      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions],
        })),
      startWorkout: (dayId) =>
        set({
          currentSession: {
            isActive: true,
            startTime: Date.now(),
            dayId,
            completedExercises: [],
          },
        }),
      endWorkout: () => {
        const state = get();
        if (state.currentSession.isActive && state.currentSession.startTime) {
          const duration = Math.round((Date.now() - state.currentSession.startTime) / 60000);
          const newSession: WorkoutSession = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            dayId: state.currentSession.dayId || '',
            dayName: state.currentSession.dayId || '',
            duration,
            exercisesCompleted: state.currentSession.completedExercises.length,
            totalExercises: state.currentSession.completedExercises.length,
          };
          set((s) => ({
            sessions: [newSession, ...s.sessions],
            currentSession: {
              isActive: false,
              startTime: null,
              dayId: null,
              completedExercises: [],
            },
          }));
          get().updateStats();
        }
      },
      toggleExercise: (exerciseId) =>
        set((state) => {
          const completed = state.currentSession.completedExercises;
          const isCompleted = completed.includes(exerciseId);
          return {
            currentSession: {
              ...state.currentSession,
              completedExercises: isCompleted
                ? completed.filter((id) => id !== exerciseId)
                : [...completed, exerciseId],
            },
          };
        }),
      updateStats: () =>
        set((state) => {
          const sessions = state.sessions;
          const totalWorkouts = sessions.length;
          const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
          const exercisesCompleted = sessions.reduce((acc, s) => acc + s.exercisesCompleted, 0);
          
          // Calculate this week's workouts
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const thisWeekWorkouts = sessions.filter(
            (s) => new Date(s.date) >= weekStart
          ).length;

          return {
            stats: {
              ...state.stats,
              totalWorkouts,
              thisWeekWorkouts,
              totalMinutes,
              averageSessionTime: totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0,
              exercisesCompleted,
            },
          };
        }),
    }),
    { name: 'zoefit-workout' }
  )
);
