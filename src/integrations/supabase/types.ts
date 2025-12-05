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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          identity_id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          identity_id: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          identity_id?: string
          role?: string
        }
        Relationships: []
      }
      campaign_creators: {
        Row: {
          account_url: string | null
          campaign_id: string
          created_at: string
          deliverable_url: string | null
          id: string
          name: string
        }
        Insert: {
          account_url?: string | null
          campaign_id: string
          created_at?: string
          deliverable_url?: string | null
          id?: string
          name: string
        }
        Update: {
          account_url?: string | null
          campaign_id?: string
          created_at?: string
          deliverable_url?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          attachments: string[] | null
          client_name: string
          contact_email: string | null
          created_at: string
          deadline: string
          has_advertisement_appearance: boolean | null
          id: string
          image_materials: string[] | null
          is_th: boolean | null
          is_video_production_only: boolean | null
          management_sheet_url: string | null
          nda_template: string | null
          nda_url: string | null
          planned_post_date: string | null
          platform_deliverables: Json | null
          platforms: string[] | null
          report_url: string | null
          requirements: string | null
          requires_consent: boolean
          restrictions: string | null
          secondary_usage: Json | null
          slug: string
          status: string
          summary: string
          title: string
        }
        Insert: {
          attachments?: string[] | null
          client_name: string
          contact_email?: string | null
          created_at?: string
          deadline: string
          has_advertisement_appearance?: boolean | null
          id?: string
          image_materials?: string[] | null
          is_th?: boolean | null
          is_video_production_only?: boolean | null
          management_sheet_url?: string | null
          nda_template?: string | null
          nda_url?: string | null
          planned_post_date?: string | null
          platform_deliverables?: Json | null
          platforms?: string[] | null
          report_url?: string | null
          requirements?: string | null
          requires_consent?: boolean
          restrictions?: string | null
          secondary_usage?: Json | null
          slug: string
          status?: string
          summary: string
          title: string
        }
        Update: {
          attachments?: string[] | null
          client_name?: string
          contact_email?: string | null
          created_at?: string
          deadline?: string
          has_advertisement_appearance?: boolean | null
          id?: string
          image_materials?: string[] | null
          is_th?: boolean | null
          is_video_production_only?: boolean | null
          management_sheet_url?: string | null
          nda_template?: string | null
          nda_url?: string | null
          planned_post_date?: string | null
          platform_deliverables?: Json | null
          platforms?: string[] | null
          report_url?: string | null
          requirements?: string | null
          requires_consent?: boolean
          restrictions?: string | null
          secondary_usage?: Json | null
          slug?: string
          status?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      creator_list_items: {
        Row: {
          added_at: string
          id: string
          list_id: string
          submission_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          list_id: string
          submission_id: string
        }
        Update: {
          added_at?: string
          id?: string
          list_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "creator_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_list_items_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "influencer_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      influencer_submissions: {
        Row: {
          campaign_id: string
          contact_email: string | null
          contact_methods: string[] | null
          email: string | null
          follower_insight_screenshot: string | null
          id: string
          influencer_name: string
          instagram: Json | null
          notes: string | null
          other_platforms: string | null
          phone: string | null
          portfolio_files: string[] | null
          preferred_fee: string | null
          red: Json | null
          status: string
          submitted_at: string
          tiktok: Json | null
          youtube: Json | null
        }
        Insert: {
          campaign_id: string
          contact_email?: string | null
          contact_methods?: string[] | null
          email?: string | null
          follower_insight_screenshot?: string | null
          id?: string
          influencer_name: string
          instagram?: Json | null
          notes?: string | null
          other_platforms?: string | null
          phone?: string | null
          portfolio_files?: string[] | null
          preferred_fee?: string | null
          red?: Json | null
          status?: string
          submitted_at?: string
          tiktok?: Json | null
          youtube?: Json | null
        }
        Update: {
          campaign_id?: string
          contact_email?: string | null
          contact_methods?: string[] | null
          email?: string | null
          follower_insight_screenshot?: string | null
          id?: string
          influencer_name?: string
          instagram?: Json | null
          notes?: string | null
          other_platforms?: string | null
          phone?: string | null
          portfolio_files?: string[] | null
          preferred_fee?: string | null
          red?: Json | null
          status?: string
          submitted_at?: string
          tiktok?: Json | null
          youtube?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_submissions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
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
    }
    Enums: {
      app_role: "admin" | "member"
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
      app_role: ["admin", "member"],
    },
  },
} as const
