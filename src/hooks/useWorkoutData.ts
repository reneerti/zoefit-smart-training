import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Workout Sessions
export const useWorkoutSessions = (limit?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workout-sessions', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Weight Records
export const useWeightRecords = (limit?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weight-records', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('weight_records')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

// Body Measurements
export const useBodyMeasurements = (limit?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['body-measurements', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

// Bioimpedance Records
export const useBioimpedanceRecords = (limit?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bioimpedance-records', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('bioimpedance_records')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

// Gamification
export const useGamification = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['gamification', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
};

// Goals
export const useGoals = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Workout Profiles
export const useWorkoutProfiles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['workout-profiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('workout_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

// Supplements
export const useSupplements = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['supplements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('supplements')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('time_of_day');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

// Hook to invalidate all workout-related queries
export const useInvalidateWorkoutData = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['workout-sessions', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['gamification', user?.id] });
  };
};
