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
      campaign_creators: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          status: string | null
          submission_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          status?: string | null
          submission_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          status?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_creators_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_creators_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "influencer_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ad_appearance: boolean | null
          attachments: string[] | null
          client_name: string
          contact_email: string | null
          created_at: string
          deliverables: Json | null
          description: string | null
          id: string
          image_materials: string[] | null
          management_sheet_url: string | null
          nda_template: string | null
          nda_url: string | null
          ng_items: string | null
          posting_date: string | null
          report_url: string | null
          requires_consent: boolean | null
          secondary_usage: boolean | null
          secondary_usage_period: string | null
          secondary_usage_purpose: string | null
          slug: string
          status: string | null
          target_platforms: string[] | null
          title: string
          updated_at: string
          video_production_only: boolean | null
        }
        Insert: {
          ad_appearance?: boolean | null
          attachments?: string[] | null
          client_name: string
          contact_email?: string | null
          created_at?: string
          deliverables?: Json | null
          description?: string | null
          id?: string
          image_materials?: string[] | null
          management_sheet_url?: string | null
          nda_template?: string | null
          nda_url?: string | null
          ng_items?: string | null
          posting_date?: string | null
          report_url?: string | null
          requires_consent?: boolean | null
          secondary_usage?: boolean | null
          secondary_usage_period?: string | null
          secondary_usage_purpose?: string | null
          slug: string
          status?: string | null
          target_platforms?: string[] | null
          title: string
          updated_at?: string
          video_production_only?: boolean | null
        }
        Update: {
          ad_appearance?: boolean | null
          attachments?: string[] | null
          client_name?: string
          contact_email?: string | null
          created_at?: string
          deliverables?: Json | null
          description?: string | null
          id?: string
          image_materials?: string[] | null
          management_sheet_url?: string | null
          nda_template?: string | null
          nda_url?: string | null
          ng_items?: string | null
          posting_date?: string | null
          report_url?: string | null
          requires_consent?: boolean | null
          secondary_usage?: boolean | null
          secondary_usage_period?: string | null
          secondary_usage_purpose?: string | null
          slug?: string
          status?: string | null
          target_platforms?: string[] | null
          title?: string
          updated_at?: string
          video_production_only?: boolean | null
        }
        Relationships: []
      }
      creator_list_items: {
        Row: {
          created_at: string
          id: string
          list_id: string
          submission_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_id: string
          submission_id: string
        }
        Update: {
          created_at?: string
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
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      influencer_submissions: {
        Row: {
          campaign_id: string
          can_participate: boolean | null
          created_at: string
          desired_fee: string | null
          email: string
          id: string
          insight_screenshots: string[] | null
          instagram: string | null
          line_id: string | null
          main_account: string | null
          main_sns: string | null
          name: string
          notes: string | null
          other_sns: Json | null
          phone: string | null
          portfolio_urls: string[] | null
          preferred_contact: string | null
          red: string | null
          status: string | null
          tiktok: string | null
          updated_at: string
          x_twitter: string | null
          youtube: string | null
        }
        Insert: {
          campaign_id: string
          can_participate?: boolean | null
          created_at?: string
          desired_fee?: string | null
          email: string
          id?: string
          insight_screenshots?: string[] | null
          instagram?: string | null
          line_id?: string | null
          main_account?: string | null
          main_sns?: string | null
          name: string
          notes?: string | null
          other_sns?: Json | null
          phone?: string | null
          portfolio_urls?: string[] | null
          preferred_contact?: string | null
          red?: string | null
          status?: string | null
          tiktok?: string | null
          updated_at?: string
          x_twitter?: string | null
          youtube?: string | null
        }
        Update: {
          campaign_id?: string
          can_participate?: boolean | null
          created_at?: string
          desired_fee?: string | null
          email?: string
          id?: string
          insight_screenshots?: string[] | null
          instagram?: string | null
          line_id?: string | null
          main_account?: string | null
          main_sns?: string | null
          name?: string
          notes?: string | null
          other_sns?: Json | null
          phone?: string | null
          portfolio_urls?: string[] | null
          preferred_contact?: string | null
          red?: string | null
          status?: string | null
          tiktok?: string | null
          updated_at?: string
          x_twitter?: string | null
          youtube?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      is_admin_or_member: { Args: { _user_id: string }; Returns: boolean }
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
