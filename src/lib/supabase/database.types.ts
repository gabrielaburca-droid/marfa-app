export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      attachments: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          expense_id: string | null;
          file_name: string;
          id: string;
          income_entry_id: string | null;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          expense_id?: string | null;
          file_name: string;
          id?: string;
          income_entry_id?: string | null;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          expense_id?: string | null;
          file_name?: string;
          id?: string;
          income_entry_id?: string | null;
          mime_type?: string;
          size_bytes?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_business_id_expense_id_fkey";
            columns: ["business_id", "expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "attachments_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_business_id_income_entry_id_fkey";
            columns: ["business_id", "income_entry_id"];
            isOneToOne: false;
            referencedRelation: "income_entries";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "attachments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          business_id: string | null;
          changes: NonNullable<Json>;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: number;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          business_id?: string | null;
          changes?: NonNullable<Json>;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          business_id?: string | null;
          changes?: NonNullable<Json>;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_memberships: {
        Row: {
          business_id: string;
          can_view_reports: boolean;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["member_role"];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          can_view_reports?: boolean;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["member_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          can_view_reports?: boolean;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["member_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_memberships_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_memberships_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          address: string | null;
          base_currency: string;
          created_at: string;
          enabled_currencies: string[];
          id: string;
          legal_name: string | null;
          name: string;
          registration_number: string | null;
          tax_id: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          base_currency?: string;
          created_at?: string;
          enabled_currencies?: string[];
          id?: string;
          legal_name?: string | null;
          name: string;
          registration_number?: string | null;
          tax_id?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          base_currency?: string;
          created_at?: string;
          enabled_currencies?: string[];
          id?: string;
          legal_name?: string | null;
          name?: string;
          registration_number?: string | null;
          tax_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      exchange_rates: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          currency: string;
          id: string;
          rate_date: string;
          rate_to_ron: number;
          source: string;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          currency: string;
          id?: string;
          rate_date: string;
          rate_to_ron: number;
          source?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          id?: string;
          rate_date?: string;
          rate_to_ron?: number;
          source?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exchange_rates_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exchange_rates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exchange_rates_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_categories: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          name: string;
          report_group: Database["public"]["Enums"]["expense_group"];
          sort_order: number;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          report_group: Database["public"]["Enums"]["expense_group"];
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          report_group?: Database["public"]["Enums"]["expense_group"];
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expense_categories_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_categories_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_categories_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          amount: number;
          amount_ron: number | null;
          business_id: string;
          category_id: string;
          channel_id: string | null;
          client_token: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string;
          exchange_rate: number;
          expense_date: string;
          id: string;
          market_location_id: string | null;
          notes: string | null;
          paid_on: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          reference: string | null;
          status: Database["public"]["Enums"]["expense_status"];
          supplier: string | null;
          trip_label: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          amount: number;
          amount_ron?: never;
          business_id: string;
          category_id: string;
          channel_id?: string | null;
          client_token?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string;
          exchange_rate?: number;
          expense_date: string;
          id?: string;
          market_location_id?: string | null;
          notes?: string | null;
          paid_on?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          reference?: string | null;
          status?: Database["public"]["Enums"]["expense_status"];
          supplier?: string | null;
          trip_label?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          amount?: number;
          amount_ron?: never;
          business_id?: string;
          category_id?: string;
          channel_id?: string | null;
          client_token?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string;
          exchange_rate?: number;
          expense_date?: string;
          id?: string;
          market_location_id?: string | null;
          notes?: string | null;
          paid_on?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          reference?: string | null;
          status?: Database["public"]["Enums"]["expense_status"];
          supplier?: string | null;
          trip_label?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_business_id_category_id_fkey";
            columns: ["business_id", "category_id"];
            isOneToOne: false;
            referencedRelation: "expense_categories";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "expenses_business_id_channel_id_fkey";
            columns: ["business_id", "channel_id"];
            isOneToOne: false;
            referencedRelation: "sales_channels";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "expenses_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_business_id_market_location_id_fkey";
            columns: ["business_id", "market_location_id"];
            isOneToOne: false;
            referencedRelation: "market_locations";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      income_categories: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "income_categories_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "income_categories_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "income_categories_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      income_entries: {
        Row: {
          business_id: string;
          card_amount: number | null;
          cash_amount: number | null;
          channel_id: string;
          client_token: string | null;
          commission_amount: number;
          created_at: string;
          created_by: string | null;
          currency: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string;
          discount_amount: number;
          entry_date: string;
          entry_kind: Database["public"]["Enums"]["income_entry_kind"];
          exchange_rate: number;
          gross_amount: number;
          gross_amount_ron: number | null;
          id: string;
          income_category_id: string | null;
          market_location_id: string | null;
          net_amount: number | null;
          net_amount_ron: number | null;
          notes: string | null;
          other_amount: number | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          period_end: string;
          period_start: string;
          product_category: string | null;
          product_name: string | null;
          received_on: string | null;
          reference: string | null;
          refund_amount: number;
          shipping_amount: number;
          status: Database["public"]["Enums"]["income_status"];
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          card_amount?: number | null;
          cash_amount?: number | null;
          channel_id: string;
          client_token?: string | null;
          commission_amount?: number;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string;
          discount_amount?: number;
          entry_date: string;
          entry_kind: Database["public"]["Enums"]["income_entry_kind"];
          exchange_rate?: number;
          gross_amount: number;
          gross_amount_ron?: never;
          id?: string;
          income_category_id?: string | null;
          market_location_id?: string | null;
          net_amount?: never;
          net_amount_ron?: never;
          notes?: string | null;
          other_amount?: number | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          period_end: string;
          period_start: string;
          product_category?: string | null;
          product_name?: string | null;
          received_on?: string | null;
          reference?: string | null;
          refund_amount?: number;
          shipping_amount?: number;
          status?: Database["public"]["Enums"]["income_status"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          business_id?: string;
          card_amount?: number | null;
          cash_amount?: number | null;
          channel_id?: string;
          client_token?: string | null;
          commission_amount?: number;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string;
          discount_amount?: number;
          entry_date?: string;
          entry_kind?: Database["public"]["Enums"]["income_entry_kind"];
          exchange_rate?: number;
          gross_amount?: number;
          gross_amount_ron?: never;
          id?: string;
          income_category_id?: string | null;
          market_location_id?: string | null;
          net_amount?: never;
          net_amount_ron?: never;
          notes?: string | null;
          other_amount?: number | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          period_end?: string;
          period_start?: string;
          product_category?: string | null;
          product_name?: string | null;
          received_on?: string | null;
          reference?: string | null;
          refund_amount?: number;
          shipping_amount?: number;
          status?: Database["public"]["Enums"]["income_status"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "income_entries_business_id_channel_id_fkey";
            columns: ["business_id", "channel_id"];
            isOneToOne: false;
            referencedRelation: "sales_channels";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "income_entries_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "income_entries_business_id_income_category_id_fkey";
            columns: ["business_id", "income_category_id"];
            isOneToOne: false;
            referencedRelation: "income_categories";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "income_entries_business_id_market_location_id_fkey";
            columns: ["business_id", "market_location_id"];
            isOneToOne: false;
            referencedRelation: "market_locations";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "income_entries_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "income_entries_deleted_by_fkey";
            columns: ["deleted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "income_entries_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      market_locations: {
        Row: {
          business_id: string;
          city: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          business_id?: string;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "market_locations_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "market_locations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "market_locations_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sales_channels: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          kind: Database["public"]["Enums"]["channel_kind"];
          market_location_id: string | null;
          name: string;
          sort_order: number;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          kind: Database["public"]["Enums"]["channel_kind"];
          market_location_id?: string | null;
          name: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["channel_kind"];
          market_location_id?: string | null;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sales_channels_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_channels_business_id_market_location_id_fkey";
            columns: ["business_id", "market_location_id"];
            isOneToOne: false;
            referencedRelation: "market_locations";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "sales_channels_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_channels_updated_by_fkey";
            columns: ["updated_by"];
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
      latest_activity_month: { Args: { p_business: string; p_until: string }; Returns: string };
      month_report: { Args: { p_business: string; p_from: string; p_to: string }; Returns: Json };
    };
    Enums: {
      channel_kind: "market" | "online" | "other";
      expense_group: "merchandise" | "transport_import" | "market" | "operating" | "fines";
      expense_status: "paid" | "unpaid";
      income_entry_kind: "aggregate" | "sale";
      income_status: "received" | "pending" | "cancelled";
      member_role: "admin" | "operator";
      payment_method: "cash" | "card" | "transfer" | "mixed" | "other";
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
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
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
      channel_kind: ["market", "online", "other"],
      expense_group: ["merchandise", "transport_import", "market", "operating", "fines"],
      expense_status: ["paid", "unpaid"],
      income_entry_kind: ["aggregate", "sale"],
      income_status: ["received", "pending", "cancelled"],
      member_role: ["admin", "operator"],
      payment_method: ["cash", "card", "transfer", "mixed", "other"],
    },
  },
} as const;
