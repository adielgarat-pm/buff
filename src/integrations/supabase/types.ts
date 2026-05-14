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
      app_settings: {
        Row: {
          app_title: string
          daily_goal: number
          family_id: string
          friday_enabled: boolean
          id: string
          last_child_activity: string | null
          lesson_reminders_enabled: boolean
          pause_mode_active: boolean | null
          updated_at: string
        }
        Insert: {
          app_title?: string
          daily_goal?: number
          family_id: string
          friday_enabled?: boolean
          id?: string
          last_child_activity?: string | null
          lesson_reminders_enabled?: boolean
          pause_mode_active?: boolean | null
          updated_at?: string
        }
        Update: {
          app_title?: string
          daily_goal?: number
          family_id?: string
          friday_enabled?: boolean
          id?: string
          last_child_activity?: string | null
          lesson_reminders_enabled?: boolean
          pause_mode_active?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: true
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      child_vibes: {
        Row: {
          child_id: string
          created_at: string
          date: string
          family_id: string
          id: string
          low_power_mode: boolean
          parent_sos_sent: boolean
          vibe_level: number
          vibe_type: string
        }
        Insert: {
          child_id: string
          created_at?: string
          date: string
          family_id: string
          id?: string
          low_power_mode?: boolean
          parent_sos_sent?: boolean
          vibe_level: number
          vibe_type?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          date?: string
          family_id?: string
          id?: string
          low_power_mode?: boolean
          parent_sos_sent?: boolean
          vibe_level?: number
          vibe_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_vibes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_vibes_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_vault: {
        Row: {
          child_id: string | null
          family_id: string
          id: string
          last_updated_date: string | null
          total_balance: number
          updated_at: string
        }
        Insert: {
          child_id?: string | null
          family_id: string
          id?: string
          last_updated_date?: string | null
          total_balance?: number
          updated_at?: string
        }
        Update: {
          child_id?: string | null
          family_id?: string
          id?: string
          last_updated_date?: string | null
          total_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_vault_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_vault_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_progress: {
        Row: {
          child_id: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          date: string
          family_id: string
          id: string
          revoked_at: string | null
          revoked_by_parent_id: string | null
          task_id: string
        }
        Insert: {
          child_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date: string
          family_id: string
          id?: string
          revoked_at?: string | null
          revoked_by_parent_id?: string | null
          task_id: string
        }
        Update: {
          child_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          family_id?: string
          id?: string
          revoked_at?: string | null
          revoked_by_parent_id?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_progress_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          email_to: string
          error_message: string | null
          id: string
          language: string
          profile_id: string | null
          sent_at: string
          status: string
          template_key: string
          user_id: string | null
        }
        Insert: {
          email_to: string
          error_message?: string | null
          id?: string
          language?: string
          profile_id?: string | null
          sent_at?: string
          status?: string
          template_key: string
          user_id?: string | null
        }
        Update: {
          email_to?: string
          error_message?: string | null
          id?: string
          language?: string
          profile_id?: string | null
          sent_at?: string
          status?: string
          template_key?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          id: string
          name: string
          preferred_language: string
          short_code: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          preferred_language?: string
          short_code?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          preferred_language?: string
          short_code?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          child_id: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          credits: number
          date: string
          family_id: string
          id: string
          lesson_key: string
        }
        Insert: {
          child_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          credits?: number
          date: string
          family_id: string
          id?: string
          lesson_key: string
        }
        Update: {
          child_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          credits?: number
          date?: string
          family_id?: string
          id?: string
          lesson_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reflections: {
        Row: {
          child_id: string
          created_at: string
          date: string
          difficulty_rating: number | null
          family_id: string
          id: string
          lesson_key: string
          reflection: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          date: string
          difficulty_rating?: number | null
          family_id: string
          id?: string
          lesson_key: string
          reflection?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          date?: string
          difficulty_rating?: number | null
          family_id?: string
          id?: string
          lesson_key?: string
          reflection?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          child_id: string | null
          child_name: string
          created_at: string
          entity_id: string | null
          entity_name: string
          family_id: string
          id: string
          is_read: boolean
          parent_id: string
          type: string
        }
        Insert: {
          child_id?: string | null
          child_name?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string
          family_id: string
          id?: string
          is_read?: boolean
          parent_id: string
          type?: string
        }
        Update: {
          child_id?: string | null
          child_name?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string
          family_id?: string
          id?: string
          is_read?: boolean
          parent_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          bag_prep_credits: number
          bag_prep_enabled: boolean
          birth_date: string | null
          buff_boost_dismissed_at: string | null
          buff_boost_supported: boolean
          child_preferences: Json | null
          created_at: string
          daily_goal: number
          daily_win_reward: number
          display_name: string
          family_id: string | null
          fcm_token: string | null
          id: string
          is_activated: boolean
          is_lifetime_access: boolean
          is_pro: boolean
          marketing_consent: boolean
          onboarding_data: Json | null
          onboarding_step: number | null
          pet_state: Json | null
          preferred_language: string
          pro_settings: Json | null
          role: string
          school_quest_enabled: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar?: string | null
          bag_prep_credits?: number
          bag_prep_enabled?: boolean
          birth_date?: string | null
          buff_boost_dismissed_at?: string | null
          buff_boost_supported?: boolean
          child_preferences?: Json | null
          created_at?: string
          daily_goal?: number
          daily_win_reward?: number
          display_name: string
          family_id?: string | null
          fcm_token?: string | null
          id?: string
          is_activated?: boolean
          is_lifetime_access?: boolean
          is_pro?: boolean
          marketing_consent?: boolean
          onboarding_data?: Json | null
          onboarding_step?: number | null
          pet_state?: Json | null
          preferred_language?: string
          pro_settings?: Json | null
          role?: string
          school_quest_enabled?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar?: string | null
          bag_prep_credits?: number
          bag_prep_enabled?: boolean
          birth_date?: string | null
          buff_boost_dismissed_at?: string | null
          buff_boost_supported?: boolean
          child_preferences?: Json | null
          created_at?: string
          daily_goal?: number
          daily_win_reward?: number
          display_name?: string
          family_id?: string | null
          fcm_token?: string | null
          id?: string
          is_activated?: boolean
          is_lifetime_access?: boolean
          is_pro?: boolean
          marketing_consent?: boolean
          onboarding_data?: Json | null
          onboarding_step?: number | null
          pet_state?: Json | null
          preferred_language?: string
          pro_settings?: Json | null
          role?: string
          school_quest_enabled?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          family_id: string
          id: string
          p256dh: string
          profile_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          family_id: string
          id?: string
          p256dh: string
          profile_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          family_id?: string
          id?: string
          p256dh?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pwa_events: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          event_type: string
          family_id: string | null
          id: string
          message_type: string | null
          os: string | null
          template_index: number | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          family_id?: string | null
          id?: string
          message_type?: string | null
          os?: string | null
          template_index?: number | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          family_id?: string | null
          id?: string
          message_type?: string | null
          os?: string | null
          template_index?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pwa_events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          detected_lang: string
          display_name: string
          display_name_en: string | null
          family_id: string
          id: string
          rating: number
          review_text: string
          status: string
          translated_text_en: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detected_lang?: string
          display_name?: string
          display_name_en?: string | null
          family_id: string
          id?: string
          rating?: number
          review_text?: string
          status?: string
          translated_text_en?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detected_lang?: string
          display_name?: string
          display_name_en?: string | null
          family_id?: string
          id?: string
          rating?: number
          review_text?: string
          status?: string
          translated_text_en?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      stickers: {
        Row: {
          created_at: string
          family_id: string
          from_parent_id: string
          id: string
          is_seen: boolean
          message: string | null
          sticker_type: string
          to_child_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          from_parent_id: string
          id?: string
          is_seen?: boolean
          message?: string | null
          sticker_type?: string
          to_child_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          from_parent_id?: string
          id?: string
          is_seen?: boolean
          message?: string | null
          sticker_type?: string
          to_child_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stickers_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stickers_from_parent_id_fkey"
            columns: ["from_parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stickers_to_child_id_fkey"
            columns: ["to_child_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_rewards: {
        Row: {
          assigned_to: string | null
          claimed: boolean
          claimed_at: string | null
          created_at: string
          emoji: string
          family_id: string
          id: string
          price: number
          proposed_by_child: boolean | null
          reward_category: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          emoji?: string
          family_id: string
          id?: string
          price: number
          proposed_by_child?: boolean | null
          reward_category?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          emoji?: string
          family_id?: string
          id?: string
          price?: number
          proposed_by_child?: boolean | null
          reward_category?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_rewards_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_rewards_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          credits: number
          description: string | null
          family_id: string
          icon: string | null
          id: string
          is_system_generated: boolean
          proposed_by_child: boolean | null
          schedule_days: number[]
          strategy_id: string | null
          time: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          credits?: number
          description?: string | null
          family_id: string
          icon?: string | null
          id?: string
          is_system_generated?: boolean
          proposed_by_child?: boolean | null
          schedule_days?: number[]
          strategy_id?: string | null
          time: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          credits?: number
          description?: string | null
          family_id?: string
          icon?: string | null
          id?: string
          is_system_generated?: boolean
          proposed_by_child?: boolean | null
          schedule_days?: number[]
          strategy_id?: string | null
          time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          assigned_to: string | null
          data: Json
          family_id: string
          id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          data?: Json
          family_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          data?: Json
          family_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetables_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_reviews: {
        Row: {
          created_at: string | null
          display_name: string | null
          display_name_en: string | null
          id: string | null
          rating: number | null
          review_text: string | null
          status: string | null
          translated_text_en: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          display_name_en?: string | null
          id?: string | null
          rating?: number | null
          review_text?: string | null
          status?: string | null
          translated_text_en?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          display_name_en?: string | null
          id?: string | null
          rating?: number | null
          review_text?: string | null
          status?: string | null
          translated_text_en?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_set_pro_status: {
        Args: {
          p_is_lifetime_access?: boolean
          p_is_pro?: boolean
          p_profile_id: string
        }
        Returns: Json
      }
      delete_child_profile: { Args: { p_child_id: string }; Returns: Json }
      generate_family_short_code: { Args: never; Returns: string }
      get_admin_app_pulse: { Args: never; Returns: Json }
      get_admin_app_pulse_v2: {
        Args: {
          p_end_date?: string
          p_exclude_test_accounts?: boolean
          p_start_date?: string
        }
        Returns: Json
      }
      get_admin_families_overview: {
        Args: never
        Returns: {
          child_count: number
          children_info: Json
          family_code: string
          family_created_at: string
          family_id: string
          family_name: string
          parent_count: number
          parents_info: Json
        }[]
      }
      get_admin_family_drilldown: {
        Args: { p_family_id: string }
        Returns: Json
      }
      get_admin_orphaned_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          last_sign_in_at: string
          user_id: string
        }[]
      }
      get_admin_profiles_overview: { Args: never; Returns: Json }
      get_my_family_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      switch_user_family: { Args: { p_new_family_code: string }; Returns: Json }
      update_child_credits: {
        Args: {
          p_child_id: string
          p_credit_change: number
          p_is_completion?: boolean
        }
        Returns: number
      }
      update_child_profile_settings: {
        Args: {
          p_avatar?: string
          p_birth_date?: string
          p_child_id: string
          p_daily_goal?: number
          p_school_quest_enabled?: boolean
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
