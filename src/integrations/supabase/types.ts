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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      carts: {
        Row: {
          items: Json
          outlet_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          items?: Json
          outlet_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          items?: Json
          outlet_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dishes: {
        Row: {
          allergens: string[] | null
          available: boolean
          category: string
          description: string
          diet: string
          id: string
          name: string
          outlet_id: string
          popular: boolean
          prep_mins: number
          price_paise: number
          spice: number
          stock: number
        }
        Insert: {
          allergens?: string[] | null
          available?: boolean
          category: string
          description?: string
          diet: string
          id: string
          name: string
          outlet_id: string
          popular?: boolean
          prep_mins?: number
          price_paise: number
          spice?: number
          stock?: number
        }
        Update: {
          allergens?: string[] | null
          available?: boolean
          category?: string
          description?: string
          diet?: string
          id?: string
          name?: string
          outlet_id?: string
          popular?: boolean
          prep_mins?: number
          price_paise?: number
          spice?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "dishes_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor_id: string
          created_at: string
          event: string
          id: string
          order_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          event: string
          id?: string
          order_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          event?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          dish_id: string
          dish_name: string
          id: string
          order_id: string
          quantity: number
          unit_price_paise: number
        }
        Insert: {
          dish_id: string
          dish_name: string
          id?: string
          order_id: string
          quantity: number
          unit_price_paise: number
        }
        Update: {
          dish_id?: string
          dish_name?: string
          id?: string
          order_id?: string
          quantity?: number
          unit_price_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          fulfillment: string
          id: string
          idempotency_key: string
          notes: string
          outlet_id: string
          packaging_paise: number
          payment_method: string
          payment_status: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          subtotal_paise: number
          tax_paise: number
          total_paise: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fulfillment?: string
          id?: string
          idempotency_key: string
          notes?: string
          outlet_id: string
          packaging_paise: number
          payment_method?: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          subtotal_paise: number
          tax_paise?: number
          total_paise: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fulfillment?: string
          id?: string
          idempotency_key?: string
          notes?: string
          outlet_id?: string
          packaging_paise?: number
          payment_method?: string
          payment_status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          subtotal_paise?: number
          tax_paise?: number
          total_paise?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outlets: {
        Row: {
          accepting_orders: boolean
          closes: string
          counter_payments: boolean
          id: string
          location: string
          name: string
          opens: string
          tax_basis_points: number
        }
        Insert: {
          accepting_orders?: boolean
          closes: string
          counter_payments?: boolean
          id: string
          location: string
          name: string
          opens: string
          tax_basis_points?: number
        }
        Update: {
          accepting_orders?: boolean
          closes?: string
          counter_payments?: boolean
          id?: string
          location?: string
          name?: string
          opens?: string
          tax_basis_points?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      change_order: {
        Args: { p_action: string; p_order: string; p_user: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_counter_order: {
        Args: {
          p_items: Json
          p_key: string
          p_notes: string
          p_outlet: string
          p_packaging: number
          p_total: number
          p_user: string
        }
        Returns: string
      }
      sales_summary: {
        Args: { p_from: string; p_outlet: string; p_to: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "kitchen"
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
      app_role: ["admin", "kitchen"],
    },
  },
} as const
