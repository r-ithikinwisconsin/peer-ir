export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string;
          disclaimer_acked_at: string | null;
          display_name: string | null;
          id: string;
          is_admin: boolean;
          is_anonymous_public: boolean;
          practice_setting: Database["public"]["Enums"]["practice_setting"] | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          updated_at: string;
          years_out_of_training: number | null;
        };
        Insert: {
          created_at?: string;
          disclaimer_acked_at?: string | null;
          display_name?: string | null;
          id: string;
          is_admin?: boolean;
          is_anonymous_public?: boolean;
          practice_setting?:
            | Database["public"]["Enums"]["practice_setting"]
            | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          updated_at?: string;
          years_out_of_training?: number | null;
        };
        Update: {
          created_at?: string;
          disclaimer_acked_at?: string | null;
          display_name?: string | null;
          id?: string;
          is_admin?: boolean;
          is_anonymous_public?: boolean;
          practice_setting?:
            | Database["public"]["Enums"]["practice_setting"]
            | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          updated_at?: string;
          years_out_of_training?: number | null;
        };
        Relationships: [];
      };
      case_templates: {
        Row: {
          category: Database["public"]["Enums"]["case_category"];
          clinical_vignette_structured: Json;
          created_at: string;
          decision_options: Json;
          id: string;
          is_active: boolean;
          reason_options: Json;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          category: Database["public"]["Enums"]["case_category"];
          clinical_vignette_structured?: Json;
          created_at?: string;
          decision_options?: Json;
          id?: string;
          is_active?: boolean;
          reason_options?: Json;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["case_category"];
          clinical_vignette_structured?: Json;
          created_at?: string;
          decision_options?: Json;
          id?: string;
          is_active?: boolean;
          reason_options?: Json;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cases: {
        Row: {
          id: string;
          case_number: number;
          submitter_id: string;
          case_template_id: string;
          patient_age: number;
          patient_gender: Database["public"]["Enums"]["patient_gender"];
          case_variables: Json;
          submitter_decision_id: string;
          submitter_other_text: string | null;
          submitter_reason_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_number?: number;
          submitter_id: string;
          case_template_id: string;
          patient_age: number;
          patient_gender: Database["public"]["Enums"]["patient_gender"];
          case_variables?: Json;
          submitter_decision_id: string;
          submitter_other_text?: string | null;
          submitter_reason_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_number?: number;
          submitter_id?: string;
          case_template_id?: string;
          patient_age?: number;
          patient_gender?: Database["public"]["Enums"]["patient_gender"];
          case_variables?: Json;
          submitter_decision_id?: string;
          submitter_other_text?: string | null;
          submitter_reason_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cases_case_template_id_fkey";
            columns: ["case_template_id"];
            isOneToOne: false;
            referencedRelation: "case_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cases_submitter_id_fkey";
            columns: ["submitter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      case_votes: {
        Row: {
          id: string;
          case_id: string;
          voter_id: string;
          decision_id: string;
          other_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          voter_id: string;
          decision_id: string;
          other_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          voter_id?: string;
          decision_id?: string;
          other_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_votes_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_votes_voter_id_fkey";
            columns: ["voter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin_self: { Args: Record<string, never>; Returns: boolean };
      create_case: {
        Args: {
          p_age: number;
          p_gender: Database["public"]["Enums"]["patient_gender"];
          p_case_variables: Json;
          p_decision_id: string;
          p_other_text?: string | null;
          p_reason_ids?: string[];
        };
        Returns: Json;
      };
      get_case_vote_aggregate: {
        Args: { p_case_id: string };
        Returns: Json;
      };
    };
    Enums: {
      case_category:
        | "oncology"
        | "vascular"
        | "gi_bleed"
        | "venous"
        | "biliary"
        | "other";
      practice_setting:
        | "academic"
        | "community"
        | "hybrid"
        | "private_practice"
        | "other";
      user_role:
        | "attending"
        | "fellow"
        | "resident"
        | "medical_student"
        | "other";
      patient_gender: "male" | "female" | "other";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      case_category: [
        "oncology",
        "vascular",
        "gi_bleed",
        "venous",
        "biliary",
        "other",
      ],
      practice_setting: [
        "academic",
        "community",
        "hybrid",
        "private_practice",
        "other",
      ],
      user_role: [
        "attending",
        "fellow",
        "resident",
        "medical_student",
        "other",
      ],
      patient_gender: ["male", "female", "other"],
    },
  },
} as const;
