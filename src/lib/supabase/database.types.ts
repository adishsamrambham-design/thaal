export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      chapter_versions: {
        Row: {
          chapter_id: string;
          content: NonNullable<Json>;
          created_at: string;
          id: number;
          owner_id: string;
          title: string;
          version: number;
          word_count: number;
        };
        ComputedFields: never;
        Insert: {
          chapter_id: string;
          content: NonNullable<Json>;
          created_at?: string;
          id?: never;
          owner_id: string;
          title: string;
          version: number;
          word_count: number;
        };
        Update: {
          chapter_id?: string;
          content?: NonNullable<Json>;
          created_at?: string;
          id?: never;
          owner_id?: string;
          title?: string;
          version?: number;
          word_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "chapter_versions_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chapter_versions_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chapters: {
        Row: {
          content: NonNullable<Json>;
          created_at: string;
          id: string;
          owner_id: string;
          position: number;
          title: string;
          updated_at: string;
          version: number;
          word_count: number;
          work_id: string;
        };
        ComputedFields: never;
        Insert: {
          content?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          owner_id?: string;
          position: number;
          title?: string;
          updated_at?: string;
          version?: number;
          word_count?: number;
          work_id: string;
        };
        Update: {
          content?: NonNullable<Json>;
          created_at?: string;
          id?: string;
          owner_id?: string;
          position?: number;
          title?: string;
          updated_at?: string;
          version?: number;
          word_count?: number;
          work_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chapters_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chapters_work_id_fkey";
            columns: ["work_id"];
            isOneToOne: false;
            referencedRelation: "works";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      works: {
        Row: {
          created_at: string;
          id: string;
          language: string;
          owner_id: string;
          status: Database["public"]["Enums"]["work_status"];
          title: string;
          type: Database["public"]["Enums"]["work_type"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          language: string;
          owner_id?: string;
          status?: Database["public"]["Enums"]["work_status"];
          title: string;
          type: Database["public"]["Enums"]["work_type"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          language?: string;
          owner_id?: string;
          status?: Database["public"]["Enums"]["work_status"];
          title?: string;
          type?: Database["public"]["Enums"]["work_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "works_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_chapter: {
        Args: {
          p_chapter_id: string;
          p_content: Json;
          p_expected_version: number;
          p_title: string;
          p_word_count: number;
        };
        Returns: number;
      };
      snapshot_chapter: { Args: { p_chapter_id: string }; Returns: undefined };
    };
    Enums: {
      work_status: "draft" | "published" | "unpublished";
      work_type: "novel" | "short_story" | "poem" | "serial" | "comic";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      work_status: ["draft", "published", "unpublished"],
      work_type: ["novel", "short_story", "poem", "serial", "comic"],
    },
  },
} as const;
