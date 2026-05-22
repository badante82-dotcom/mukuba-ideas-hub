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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string
          filename: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          suggestion_id: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          suggestion_id: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          suggestion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      mass_replies: {
        Row: {
          admin_id: string
          also_set_status:
            | Database["public"]["Enums"]["suggestion_status"]
            | null
          body: string
          created_at: string
          filter_snapshot: Json
          id: string
          recipients_count: number
        }
        Insert: {
          admin_id: string
          also_set_status?:
            | Database["public"]["Enums"]["suggestion_status"]
            | null
          body: string
          created_at?: string
          filter_snapshot?: Json
          id?: string
          recipients_count?: number
        }
        Update: {
          admin_id?: string
          also_set_status?:
            | Database["public"]["Enums"]["suggestion_status"]
            | null
          body?: string
          created_at?: string
          filter_snapshot?: Json
          id?: string
          recipients_count?: number
        }
        Relationships: []
      }
      mass_reply_targets: {
        Row: {
          mass_reply_id: string
          suggestion_id: string
        }
        Insert: {
          mass_reply_id: string
          suggestion_id: string
        }
        Update: {
          mass_reply_id?: string
          suggestion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mass_reply_targets_mass_reply_id_fkey"
            columns: ["mass_reply_id"]
            isOneToOne: false
            referencedRelation: "mass_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mass_reply_targets_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          full_name: string
          id: string
          status: Database["public"]["Enums"]["account_status"]
          student_id: string | null
          university_email: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          full_name: string
          id: string
          status?: Database["public"]["Enums"]["account_status"]
          student_id?: string | null
          university_email?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          full_name?: string
          id?: string
          status?: Database["public"]["Enums"]["account_status"]
          student_id?: string | null
          university_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_internal_note: boolean
          mass_reply_id: string | null
          suggestion_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          mass_reply_id?: string | null
          suggestion_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_internal_note?: boolean
          mass_reply_id?: string | null
          suggestion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_embeddings: {
        Row: {
          created_at: string
          embedding: Json
          suggestion_id: string
        }
        Insert: {
          created_at?: string
          embedding: Json
          suggestion_id: string
        }
        Update: {
          created_at?: string
          embedding?: Json
          suggestion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_embeddings_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: true
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          author_id: string | null
          body: string
          category: Database["public"]["Enums"]["suggestion_category"]
          created_at: string
          deleted_at: string | null
          department_id: string | null
          duplicate_of_id: string | null
          id: string
          is_anonymous: boolean
          is_public: boolean
          priority: Database["public"]["Enums"]["suggestion_priority"]
          resolved_at: string | null
          responses_count: number
          sentiment_label: Database["public"]["Enums"]["sentiment_label"] | null
          sentiment_score: number | null
          spam_score: number | null
          status: Database["public"]["Enums"]["suggestion_status"]
          tags: string[] | null
          title: string
          updated_at: string
          upvotes_count: number
        }
        Insert: {
          author_id?: string | null
          body: string
          category?: Database["public"]["Enums"]["suggestion_category"]
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          duplicate_of_id?: string | null
          id?: string
          is_anonymous?: boolean
          is_public?: boolean
          priority?: Database["public"]["Enums"]["suggestion_priority"]
          resolved_at?: string | null
          responses_count?: number
          sentiment_label?:
            | Database["public"]["Enums"]["sentiment_label"]
            | null
          sentiment_score?: number | null
          spam_score?: number | null
          status?: Database["public"]["Enums"]["suggestion_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          upvotes_count?: number
        }
        Update: {
          author_id?: string | null
          body?: string
          category?: Database["public"]["Enums"]["suggestion_category"]
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          duplicate_of_id?: string | null
          id?: string
          is_anonymous?: boolean
          is_public?: boolean
          priority?: Database["public"]["Enums"]["suggestion_priority"]
          resolved_at?: string | null
          responses_count?: number
          sentiment_label?:
            | Database["public"]["Enums"]["sentiment_label"]
            | null
          sentiment_score?: number | null
          spam_score?: number | null
          status?: Database["public"]["Enums"]["suggestion_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvotes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_duplicate_of_id_fkey"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      upvotes: {
        Row: {
          created_at: string
          suggestion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          suggestion_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          suggestion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upvotes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestions"
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      account_status: "pending" | "approved" | "rejected" | "banned"
      app_role: "student" | "staff" | "stakeholder" | "admin" | "super_admin"
      sentiment_label: "positive" | "neutral" | "negative"
      suggestion_category:
        | "academics"
        | "hostel"
        | "cafeteria"
        | "security"
        | "administration"
        | "ict"
        | "infrastructure"
        | "sports"
        | "other"
      suggestion_priority: "low" | "medium" | "high" | "urgent"
      suggestion_status:
        | "submitted"
        | "under_review"
        | "in_progress"
        | "resolved"
        | "rejected"
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
      account_status: ["pending", "approved", "rejected", "banned"],
      app_role: ["student", "staff", "stakeholder", "admin", "super_admin"],
      sentiment_label: ["positive", "neutral", "negative"],
      suggestion_category: [
        "academics",
        "hostel",
        "cafeteria",
        "security",
        "administration",
        "ict",
        "infrastructure",
        "sports",
        "other",
      ],
      suggestion_priority: ["low", "medium", "high", "urgent"],
      suggestion_status: [
        "submitted",
        "under_review",
        "in_progress",
        "resolved",
        "rejected",
      ],
    },
  },
} as const
