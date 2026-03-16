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
      activity_log: {
        Row: {
          action: string
          business_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          business_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics: {
        Row: {
          business_id: string
          count: number | null
          entity_id: string
          entity_type: string
          event: string | null
          id: string
          last_at: string | null
        }
        Insert: {
          business_id: string
          count?: number | null
          entity_id: string
          entity_type: string
          event?: string | null
          id?: string
          last_at?: string | null
        }
        Update: {
          business_id?: string
          count?: number | null
          entity_id?: string
          entity_type?: string
          event?: string | null
          id?: string
          last_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          business_id: string | null
          created_at: string | null
          entity_id: string | null
          event_type: string
          id: string
          session_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          event_type: string
          id?: string
          session_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          event_type?: string
          id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_configs: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string | null
          source_form_id: string | null
          trigger_type: string
          webhook_url: string | null
          workflow_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string | null
          source_form_id?: string | null
          trigger_type: string
          webhook_url?: string | null
          workflow_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string | null
          source_form_id?: string | null
          trigger_type?: string
          webhook_url?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_configs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_configs_source_form_id_fkey"
            columns: ["source_form_id"]
            isOneToOne: false
            referencedRelation: "eforms"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprints: {
        Row: {
          business_id: string
          content: Json
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blueprints_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_currencies: {
        Row: {
          business_id: string
          created_at: string | null
          currency_code: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          currency_code: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          currency_code?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "business_currencies_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          admin_notes: string | null
          beta_features: Json | null
          brand_color: string | null
          category: string | null
          city: string
          contact: Json | null
          cover_url: string | null
          created_at: string | null
          csd_password: string | null
          description: string | null
          facturama_api_password: string | null
          facturama_api_user: string | null
          google_place_id: string | null
          id: string
          is_visible: boolean | null
          landing_page_theme: string | null
          location: Json | null
          logo_url: string | null
          name: string
          rating: number | null
          regimen_fiscal: string | null
          review_count: number | null
          rfc: string | null
          slug: string
          stripe_customer_id: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          beta_features?: Json | null
          brand_color?: string | null
          category?: string | null
          city: string
          contact?: Json | null
          cover_url?: string | null
          created_at?: string | null
          csd_password?: string | null
          description?: string | null
          facturama_api_password?: string | null
          facturama_api_user?: string | null
          google_place_id?: string | null
          id?: string
          is_visible?: boolean | null
          landing_page_theme?: string | null
          location?: Json | null
          logo_url?: string | null
          name: string
          rating?: number | null
          regimen_fiscal?: string | null
          review_count?: number | null
          rfc?: string | null
          slug: string
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          beta_features?: Json | null
          brand_color?: string | null
          category?: string | null
          city?: string
          contact?: Json | null
          cover_url?: string | null
          created_at?: string | null
          csd_password?: string | null
          description?: string | null
          facturama_api_password?: string | null
          facturama_api_user?: string | null
          google_place_id?: string | null
          id?: string
          is_visible?: boolean | null
          landing_page_theme?: string | null
          location?: Json | null
          logo_url?: string | null
          name?: string
          rating?: number | null
          regimen_fiscal?: string | null
          review_count?: number | null
          rfc?: string | null
          slug?: string
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_customers: {
        Row: {
          ai_summary: string | null
          auth_user_id: string | null
          business_id: string
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          intent_category: string | null
          last_name: string
          last_whatsapp_sent_at: string | null
          lead_score: number | null
          loyalty_points: number | null
          metadata: Json | null
          phone: string | null
          status: string
          total_points_earned: number | null
          updated_at: string | null
          whatsapp_opt_in: boolean | null
        }
        Insert: {
          ai_summary?: string | null
          auth_user_id?: string | null
          business_id: string
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          intent_category?: string | null
          last_name: string
          last_whatsapp_sent_at?: string | null
          lead_score?: number | null
          loyalty_points?: number | null
          metadata?: Json | null
          phone?: string | null
          status?: string
          total_points_earned?: number | null
          updated_at?: string | null
          whatsapp_opt_in?: boolean | null
        }
        Update: {
          ai_summary?: string | null
          auth_user_id?: string | null
          business_id?: string
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          intent_category?: string | null
          last_name?: string
          last_whatsapp_sent_at?: string | null
          lead_score?: number | null
          loyalty_points?: number | null
          metadata?: Json | null
          phone?: string | null
          status?: string
          total_points_earned?: number | null
          updated_at?: string | null
          whatsapp_opt_in?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          author_id: string | null
          business_id: string
          content: string
          created_at: string | null
          customer_id: string
          id: string
        }
        Insert: {
          author_id?: string | null
          business_id: string
          content: string
          created_at?: string | null
          customer_id: string
          id?: string
        }
        Update: {
          author_id?: string | null
          business_id?: string
          content?: string
          created_at?: string | null
          customer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      eforms: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          fields_schema: Json
          id: string
          is_active: boolean | null
          json_schema: Json | null
          linked_workflow_ids: string[] | null
          redirect_url: string | null
          submit_button_label: string | null
          success_message: string | null
          title: string
          ui_schema: Json | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          fields_schema?: Json
          id?: string
          is_active?: boolean | null
          json_schema?: Json | null
          linked_workflow_ids?: string[] | null
          redirect_url?: string | null
          submit_button_label?: string | null
          success_message?: string | null
          title: string
          ui_schema?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          fields_schema?: Json
          id?: string
          is_active?: boolean | null
          json_schema?: Json | null
          linked_workflow_ids?: string[] | null
          redirect_url?: string | null
          submit_button_label?: string | null
          success_message?: string | null
          title?: string
          ui_schema?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "eforms_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          business_id: string | null
          created_at: string | null
          delivery_status: string
          error_message: string | null
          id: string
          recipient_email: string
          subject: string
          template_name: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          delivery_status: string
          error_message?: string | null
          id?: string
          recipient_email: string
          subject: string
          template_name: string
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          delivery_status?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          subject?: string
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          business_id: string
          created_at: string | null
          data: Json
          id: string
          is_active: boolean | null
          sort_order: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          data?: Json
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          data?: Json
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          from_currency: string
          id: string
          provider: string | null
          rate: number
          to_currency: string
          updated_at: string | null
        }
        Insert: {
          from_currency: string
          id?: string
          provider?: string | null
          rate: number
          to_currency?: string
          updated_at?: string | null
        }
        Update: {
          from_currency?: string
          id?: string
          provider?: string | null
          rate?: number
          to_currency?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          business_id: string | null
          created_at: string | null
          file_path: string
          id: string
          report_type: string
          schedule_id: string | null
          status: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          file_path: string
          id?: string
          report_type: string
          schedule_id?: string | null
          status?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          file_path?: string
          id?: string
          report_type?: string
          schedule_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "report_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_card_ledger: {
        Row: {
          amount: number
          created_at: string | null
          gift_card_id: string
          id: string
          transaction_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          gift_card_id: string
          id?: string
          transaction_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          gift_card_id?: string
          id?: string
          transaction_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_ledger_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_ledger_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          business_id: string
          code: string
          created_at: string | null
          current_balance: number
          customer_id: string | null
          expires_at: string | null
          id: string
          initial_balance: number
          status: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          code: string
          created_at?: string | null
          current_balance?: number
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          initial_balance?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          code?: string
          created_at?: string | null
          current_balance?: number
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          initial_balance?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          business_id: string
          cfdi_status: string | null
          created_at: string | null
          id: string
          regimen_fiscal: string
          rfc_receptor: string
          transaction_id: string
          uso_cfdi: string
          uuid_sat: string | null
        }
        Insert: {
          business_id: string
          cfdi_status?: string | null
          created_at?: string | null
          id?: string
          regimen_fiscal: string
          rfc_receptor: string
          transaction_id: string
          uso_cfdi: string
          uuid_sat?: string | null
        }
        Update: {
          business_id?: string
          cfdi_status?: string | null
          created_at?: string | null
          id?: string
          regimen_fiscal?: string
          rfc_receptor?: string
          transaction_id?: string
          uso_cfdi?: string
          uuid_sat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_configs: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          min_points_to_redeem: number | null
          points_per_currency: number | null
          redemption_ratio: number | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_points_to_redeem?: number | null
          points_per_currency?: number | null
          redemption_ratio?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_points_to_redeem?: number | null
          points_per_currency?: number | null
          redemption_ratio?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_configs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          business_id: string
          created_at: string | null
          customer_id: string
          description: string | null
          id: string
          points_change: number
          transaction_id: string | null
          type: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          customer_id: string
          description?: string | null
          id?: string
          points_change: number
          transaction_id?: string | null
          type: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          points_change?: number
          transaction_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          business_id: string
          config: Json
          id: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          config?: Json
          id?: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          config?: Json
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      nfc_tags: {
        Row: {
          business_id: string | null
          claim_pin: string
          created_at: string | null
          guid: string
          id: string
          status: string | null
          target_type: string | null
          target_url: string | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          claim_pin: string
          created_at?: string | null
          guid: string
          id?: string
          status?: string | null
          target_type?: string | null
          target_url?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          claim_pin?: string
          created_at?: string | null
          guid?: string
          id?: string
          status?: string | null
          target_type?: string | null
          target_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfc_tags_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          currency: string | null
          features: Json | null
          id: string
          name: string
          price: number
        }
        Insert: {
          currency?: string | null
          features?: Json | null
          id: string
          name: string
          price: number
        }
        Update: {
          currency?: string | null
          features?: Json | null
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      platform_notifications: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          priority: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          priority?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          business_id: string
          category: string | null
          clave_prod_serv: string | null
          clave_unidad: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          low_stock_threshold: number | null
          name: string
          predicted_out_of_stock_date: string | null
          price: number
          restock_recommendation: string | null
          sales_velocity_7d: number | null
          sku: string | null
          sort_order: number | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          business_id: string
          category?: string | null
          clave_prod_serv?: string | null
          clave_unidad?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name: string
          predicted_out_of_stock_date?: string | null
          price: number
          restock_recommendation?: string | null
          sales_velocity_7d?: number | null
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          business_id?: string
          category?: string | null
          clave_prod_serv?: string | null
          clave_unidad?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          predicted_out_of_stock_date?: string | null
          price?: number
          restock_recommendation?: string | null
          sales_velocity_7d?: number | null
          sku?: string | null
          sort_order?: number | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      report_schedules: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_report_sent: string | null
          recipient_email: string | null
          report_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_report_sent?: string | null
          recipient_email?: string | null
          report_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_report_sent?: string | null
          recipient_email?: string | null
          report_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_configs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          business_id: string
          created_at: string | null
          current_period_end: string
          external_subscription_id: string | null
          id: string
          plan_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          current_period_end: string
          external_subscription_id?: string | null
          id?: string
          plan_id: string
          status: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          current_period_end?: string
          external_subscription_id?: string | null
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_items: {
        Row: {
          entity_id: string
          id: string
          item_name: string
          price_at_time: number
          quantity: number
          transaction_id: string
        }
        Insert: {
          entity_id: string
          id?: string
          item_name: string
          price_at_time: number
          quantity: number
          transaction_id: string
        }
        Update: {
          entity_id?: string
          id?: string
          item_name?: string
          price_at_time?: number
          quantity?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          business_id: string
          created_at: string | null
          currency: string | null
          customer_id: string | null
          exchange_rate_at_time: number | null
          external_payment_id: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          payment_status: string | null
          processed_by_automation: boolean | null
          receipt_token: string | null
          status: string
          total: number
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          exchange_rate_at_time?: number | null
          external_payment_id?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          processed_by_automation?: boolean | null
          receipt_token?: string | null
          status: string
          total?: number
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          exchange_rate_at_time?: number | null
          external_payment_id?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          processed_by_automation?: boolean | null
          receipt_token?: string | null
          status?: string
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          business_id: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_superadmin: boolean | null
          permissions: Json | null
          pin_hash: string | null
          role: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_superadmin?: boolean | null
          permissions?: Json | null
          pin_hash?: string | null
          role: string
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_superadmin?: boolean | null
          permissions?: Json | null
          pin_hash?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_submissions: {
        Row: {
          ai_processed: boolean | null
          business_id: string
          created_at: string | null
          form_id: string | null
          id: string
          payload: Json
          status: string | null
        }
        Insert: {
          ai_processed?: boolean | null
          business_id: string
          created_at?: string | null
          form_id?: string | null
          id?: string
          payload?: Json
          status?: string | null
        }
        Update: {
          ai_processed?: boolean | null
          business_id?: string
          created_at?: string | null
          form_id?: string | null
          id?: string
          payload?: Json
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_submissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "eforms"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_logs: {
        Row: {
          business_id: string
          created_at: string | null
          customer_id: string | null
          error_message: string | null
          external_id: string | null
          id: string
          message_type: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_type: string
          status?: string
          transaction_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_type?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_execution_logs: {
        Row: {
          business_id: string
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_payload: Json | null
          output_payload: Json | null
          record_id: string | null
          status: string
          trigger_event: string
          workflow_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          record_id?: string | null
          status?: string
          trigger_event: string
          workflow_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          record_id?: string | null
          status?: string
          trigger_event?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_execution_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          actions: Json | null
          business_id: string
          canvas_state: Json | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          business_id: string
          canvas_state?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          business_id?: string
          canvas_state?: Json | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      category_revenue_analytics: {
        Row: {
          business_id: string | null
          category: string | null
          total_revenue: number | null
          total_units_sold: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      hourly_sales_analytics: {
        Row: {
          business_id: string | null
          day_of_week: number | null
          hour_of_day: number | null
          total_revenue: number | null
          transaction_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_health_summary: {
        Row: {
          avg_sales_velocity: number | null
          business_id: string | null
          critical_restock_count: number | null
          low_stock_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_monthly_revenue: {
        Row: {
          month: string | null
          revenue: number | null
        }
        Relationships: []
      }
      platform_summary_stats: {
        Row: {
          total_customers: number | null
          total_owners: number | null
          total_platform_revenue_mxn: number | null
          total_tenants: number | null
          total_transactions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_get_business_context: {
        Args: { target_business_id: string }
        Returns: Json
      }
      am_i_superadmin: { Args: never; Returns: boolean }
      check_for_critical_restock: { Args: never; Returns: undefined }
      deduct_product_stock: {
        Args: { quantity_to_deduct: number; row_id: string }
        Returns: undefined
      }
      get_auth_business_id: { Args: never; Returns: string }
      get_directory_rankings: {
        Args: never
        Returns: {
          business_id: string
          total_score: number
        }[]
      }
      get_my_business_id: { Args: never; Returns: string }
      has_permission: { Args: { required_perm: string }; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
