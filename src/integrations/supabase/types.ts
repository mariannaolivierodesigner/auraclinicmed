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
      appointments: {
        Row: {
          confirmation_sent_at: string | null
          created_at: string
          ends_at: string
          id: string
          kind: string
          note: string | null
          patient_id: string | null
          reminder_sent_at: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          confirmation_sent_at?: string | null
          created_at?: string
          ends_at: string
          id?: string
          kind?: string
          note?: string | null
          patient_id?: string | null
          reminder_sent_at?: string | null
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          confirmation_sent_at?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          kind?: string
          note?: string | null
          patient_id?: string | null
          reminder_sent_at?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      case_photos: {
        Row: {
          after_path: string | null
          after_public_path: string | null
          before_path: string | null
          before_public_path: string | null
          category: string
          consent_at: string | null
          consent_document_id: string | null
          consent_revoked_at: string | null
          consent_signer: string | null
          created_at: string
          created_by: string | null
          description: string | null
          face_anonymized: boolean
          id: string
          meta: string | null
          patient_id: string | null
          publication_consent: boolean
          published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          after_path?: string | null
          after_public_path?: string | null
          before_path?: string | null
          before_public_path?: string | null
          category?: string
          consent_at?: string | null
          consent_document_id?: string | null
          consent_revoked_at?: string | null
          consent_signer?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          face_anonymized?: boolean
          id?: string
          meta?: string | null
          patient_id?: string | null
          publication_consent?: boolean
          published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          after_path?: string | null
          after_public_path?: string | null
          before_path?: string | null
          before_public_path?: string | null
          category?: string
          consent_at?: string | null
          consent_document_id?: string | null
          consent_revoked_at?: string | null
          consent_signer?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          face_anonymized?: boolean
          id?: string
          meta?: string | null
          patient_id?: string | null
          publication_consent?: boolean
          published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_photos_consent_document_id_fkey"
            columns: ["consent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_photos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          kind: string
          patient_id: string | null
          signature_name: string | null
          signed_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          kind?: string
          patient_id?: string | null
          signature_name?: string | null
          signed_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          kind?: string
          patient_id?: string | null
          signature_name?: string | null
          signed_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          lead_id: string
          note: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          lead_id: string
          note: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          converted_at: string | null
          converted_patient_id: string | null
          created_at: string
          email: string
          id: string
          interest: string | null
          internal_note: string | null
          marketing_consent: boolean
          name: string
          note: string | null
          phone: string
          privacy_consent: boolean
          slot: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_patient_id?: string | null
          created_at?: string
          email: string
          id?: string
          interest?: string | null
          internal_note?: string | null
          marketing_consent?: boolean
          name: string
          note?: string | null
          phone: string
          privacy_consent?: boolean
          slot?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          converted_at?: string | null
          converted_patient_id?: string | null
          created_at?: string
          email?: string
          id?: string
          interest?: string | null
          internal_note?: string | null
          marketing_consent?: boolean
          name?: string
          note?: string | null
          phone?: string
          privacy_consent?: boolean
          slot?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_patient_id_fkey"
            columns: ["converted_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          fiscal_code: string | null
          health_data_consent: boolean
          health_data_consent_at: string | null
          id: string
          last_name: string
          note: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          fiscal_code?: string | null
          health_data_consent?: boolean
          health_data_consent_at?: string | null
          id?: string
          last_name: string
          note?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          fiscal_code?: string | null
          health_data_consent?: boolean
          health_data_consent_at?: string | null
          id?: string
          last_name?: string
          note?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clinical_role: Database["public"]["Enums"]["clinical_role"] | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          clinical_role?: Database["public"]["Enums"]["clinical_role"] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          clinical_role?: Database["public"]["Enums"]["clinical_role"] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_log: {
        Row: {
          appointment_id: string | null
          channel: string
          created_at: string
          id: string
          kind: string
          phone: string
          provider_response: string | null
          sent_by: string | null
          status: string
        }
        Insert: {
          appointment_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          kind: string
          phone: string
          provider_response?: string | null
          sent_by?: string | null
          status?: string
        }
        Update: {
          appointment_id?: string | null
          channel?: string
          created_at?: string
          id?: string
          kind?: string
          phone?: string
          provider_response?: string | null
          sent_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_log_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_absences: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          end_time: string | null
          id: string
          reason: string | null
          staff_id: string
          start_date: string
          start_time: string | null
          type: Database["public"]["Enums"]["absence_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          end_time?: string | null
          id?: string
          reason?: string | null
          staff_id: string
          start_date: string
          start_time?: string | null
          type: Database["public"]["Enums"]["absence_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          end_time?: string | null
          id?: string
          reason?: string | null
          staff_id?: string
          start_date?: string
          start_time?: string | null
          type?: Database["public"]["Enums"]["absence_type"]
          updated_at?: string
        }
        Relationships: []
      }
      treatment_categories: {
        Row: {
          blurb: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          blurb?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          blurb?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      treatments: {
        Row: {
          anesthesia: string | null
          category_id: string
          created_at: string
          duration: string | null
          faq: Json
          id: string
          is_active: boolean
          name: string
          recovery: string | null
          slug: string
          sort_order: number
          steps: Json
          summary: string | null
          updated_at: string
          what: string | null
          who: string | null
        }
        Insert: {
          anesthesia?: string | null
          category_id: string
          created_at?: string
          duration?: string | null
          faq?: Json
          id?: string
          is_active?: boolean
          name: string
          recovery?: string | null
          slug: string
          sort_order?: number
          steps?: Json
          summary?: string | null
          updated_at?: string
          what?: string | null
          who?: string | null
        }
        Update: {
          anesthesia?: string | null
          category_id?: string
          created_at?: string
          duration?: string | null
          faq?: Json
          id?: string
          is_active?: boolean
          name?: string
          recovery?: string | null
          slug?: string
          sort_order?: number
          steps?: Json
          summary?: string | null
          updated_at?: string
          what?: string | null
          who?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "treatment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          note: string | null
          role_label: string | null
          staff_id: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          note?: string | null
          role_label?: string | null
          staff_id: string
          starts_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          note?: string | null
          role_label?: string | null
          staff_id?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
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
      convert_lead_to_patient: { Args: { _lead_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      absence_type: "ferie" | "malattia" | "permesso"
      app_role: "admin" | "staff"
      clinical_role: "medico" | "infermiera" | "assistente" | "segreteria" | "altro"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      absence_type: ["ferie", "malattia", "permesso"],
      app_role: ["admin", "staff"],
      clinical_role: ["medico", "infermiera", "assistente", "segreteria", "altro"],
    },
  },
} as const
