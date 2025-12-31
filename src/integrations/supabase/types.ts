export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          description: string
          icon: string
          id: string
          key: string
          name: string
          xp_reward: number
        }
        Insert: {
          category: string
          description: string
          icon: string
          id?: string
          key: string
          name: string
          xp_reward?: number
        }
        Update: {
          category?: string
          description?: string
          icon?: string
          id?: string
          key?: string
          name?: string
          xp_reward?: number
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          content: string
          created_at: string
          id: string
          metrics: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metrics?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metrics?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          biceps: number | null
          chest: number | null
          created_at: string
          hips: number | null
          id: string
          recorded_at: string
          thighs: number | null
          user_id: string
          waist: number | null
        }
        Insert: {
          biceps?: number | null
          chest?: number | null
          created_at?: string
          hips?: number | null
          id?: string
          recorded_at?: string
          thighs?: number | null
          user_id: string
          waist?: number | null
        }
        Update: {
          biceps?: number | null
          chest?: number | null
          created_at?: string
          hips?: number | null
          id?: string
          recorded_at?: string
          thighs?: number | null
          user_id?: string
          waist?: number | null
        }
        Relationships: []
      }
      fit_ai_forms: {
        Row: {
          ai_model: string
          ai_response: Json | null
          available_days: number
          created_at: string
          equipment: string[] | null
          experience_level: string
          focus_areas: string[] | null
          generated_profile_id: string | null
          goal: string
          id: string
          limitations: string | null
          status: string
          user_id: string
          workout_duration: number
        }
        Insert: {
          ai_model?: string
          ai_response?: Json | null
          available_days: number
          created_at?: string
          equipment?: string[] | null
          experience_level: string
          focus_areas?: string[] | null
          generated_profile_id?: string | null
          goal: string
          id?: string
          limitations?: string | null
          status?: string
          user_id: string
          workout_duration: number
        }
        Update: {
          ai_model?: string
          ai_response?: Json | null
          available_days?: number
          created_at?: string
          equipment?: string[] | null
          experience_level?: string
          focus_areas?: string[] | null
          generated_profile_id?: string | null
          goal?: string
          id?: string
          limitations?: string | null
          status?: string
          user_id?: string
          workout_duration?: number
        }
        Relationships: [
          {
            foreignKeyName: "fit_ai_forms_generated_profile_id_fkey"
            columns: ["generated_profile_id"]
            isOneToOne: false
            referencedRelation: "workout_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          achieved: boolean
          achieved_at: string | null
          created_at: string
          deadline: string | null
          id: string
          start_value: number | null
          target_value: number
          type: string
          user_id: string
        }
        Insert: {
          achieved?: boolean
          achieved_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          start_value?: number | null
          target_value: number
          type: string
          user_id: string
        }
        Update: {
          achieved?: boolean
          achieved_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          start_value?: number | null
          target_value?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_exercises: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          order_index: number
          reps: string | null
          sets: string | null
          user_id: string
          workout_id: string
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          order_index?: number
          reps?: string | null
          sets?: string | null
          user_id: string
          workout_id: string
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          order_index?: number
          reps?: string | null
          sets?: string | null
          user_id?: string
          workout_id?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "profile_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_workouts: {
        Row: {
          created_at: string
          day_of_week: number | null
          id: string
          name: string
          notes: string | null
          order_index: number
          profile_id: string
          user_id: string
          week_number: number | null
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          name: string
          notes?: string | null
          order_index?: number
          profile_id: string
          user_id: string
          week_number?: number | null
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          name?: string
          notes?: string | null
          order_index?: number
          profile_id?: string
          user_id?: string
          week_number?: number | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_workouts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "workout_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          photo_date: string
          photo_url: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_date?: string
          photo_url: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_date?: string
          photo_url?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      supplement_logs: {
        Row: {
          created_at: string
          id: string
          supplement_id: string
          taken_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          supplement_id: string
          taken_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          supplement_id?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_logs_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements: {
        Row: {
          active: boolean
          created_at: string
          dosage: string | null
          id: string
          name: string
          time_of_day: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          id?: string
          name: string
          time_of_day: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          id?: string
          name?: string
          time_of_day?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_settings: {
        Row: {
          created_at: string
          form_model: string
          id: string
          insights_model: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          form_model?: string
          id?: string
          insights_model?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          form_model?: string
          id?: string
          insights_model?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gamification: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_public: boolean
          level: number
          streak_best: number
          total_minutes: number
          total_workouts: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_public?: boolean
          level?: number
          streak_best?: number
          total_minutes?: number
          total_workouts?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_public?: boolean
          level?: number
          streak_best?: number
          total_minutes?: number
          total_workouts?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      weight_records: {
        Row: {
          created_at: string
          id: string
          recorded_at: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          recorded_at?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          recorded_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      workout_profiles: {
        Row: {
          ai_form_data: Json | null
          created_at: string
          description: string | null
          end_month: string | null
          id: string
          is_active: boolean
          is_ai_generated: boolean
          name: string
          start_month: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_form_data?: Json | null
          created_at?: string
          description?: string | null
          end_month?: string | null
          id?: string
          is_active?: boolean
          is_ai_generated?: boolean
          name: string
          start_month?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_form_data?: Json | null
          created_at?: string
          description?: string | null
          end_month?: string | null
          id?: string
          is_active?: boolean
          is_ai_generated?: boolean
          name?: string
          start_month?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string
          created_at: string
          day_id: string
          day_name: string
          duration: number
          exercises_completed: number
          id: string
          notes: string | null
          total_exercises: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          day_id: string
          day_name: string
          duration?: number
          exercises_completed?: number
          id?: string
          notes?: string | null
          total_exercises?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          day_id?: string
          day_name?: string
          duration?: number
          exercises_completed?: number
          id?: string
          notes?: string | null
          total_exercises?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
