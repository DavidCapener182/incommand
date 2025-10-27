export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      _healthy: {
        Row: {
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        timestamp: string | null // format: timestamp with time zone
        }
        Insert: {
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        timestamp?: string | null // format: timestamp with time zone
        }
        Update: {
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        timestamp?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      accreditation_access_levels: {
        Row: {
        created_at: string // format: timestamp with time zone
        description: string | null // format: text
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        }
        Insert: {
        created_at?: string // format: timestamp with time zone
        description?: string | null // format: text
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        }
        Update: {
        created_at?: string // format: timestamp with time zone
        description?: string | null // format: text
        event_id?: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name?: string // format: text
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
        action_type: string // format: text
        admin_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        created_at: string | null // format: timestamp with time zone
        details: Json | null // format: jsonb
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        status: string // format: text
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        action_type: string // format: text
        admin_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        created_at?: string | null // format: timestamp with time zone
        details?: Json | null // format: jsonb
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        status?: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        action_type?: string // format: text
        admin_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        created_at?: string | null // format: timestamp with time zone
        details?: Json | null // format: jsonb
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        status?: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
        action_type: string // format: text
        admin_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        changes: Json | null // format: jsonb
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        record_id: string // format: text
        table_name: string // format: text
        }
        Insert: {
        action_type: string // format: text
        admin_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        changes?: Json | null // format: jsonb
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        record_id: string // format: text
        table_name: string // format: text
        }
        Update: {
        action_type?: string // format: text
        admin_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        changes?: Json | null // format: jsonb
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        record_id?: string // format: text
        table_name?: string // format: text
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
        context: Json | null // format: jsonb
        ended_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        messages: Json // format: jsonb
        session_id: string // format: text
        started_at: string | null // format: timestamp with time zone
        user_id: string // format: uuid
        }
        Insert: {
        context?: Json | null // format: jsonb
        ended_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        messages: Json // format: jsonb
        session_id: string // format: text
        started_at?: string | null // format: timestamp with time zone
        user_id: string // format: uuid
        }
        Update: {
        context?: Json | null // format: jsonb
        ended_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        messages?: Json // format: jsonb
        session_id?: string // format: text
        started_at?: string | null // format: timestamp with time zone
        user_id?: string // format: uuid
        }
        Relationships: []
      }
      ai_insights_cache: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        event_id: string // format: uuid
        hour: string // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        insights: Json // format: jsonb
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        event_id: string // format: uuid
        hour: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        insights: Json // format: jsonb
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        event_id?: string // format: uuid
        hour?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        insights?: Json // format: jsonb
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
        cost: number // format: numeric
        created_at: string | null // format: timestamp with time zone
        date: string // format: date
        description: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        service: string | null // format: character varying
        tokens_used: number | null // format: integer
        usage_type: string | null // format: character varying
        }
        Insert: {
        cost: number // format: numeric
        created_at?: string | null // format: timestamp with time zone
        date: string // format: date
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        service?: string | null // format: character varying
        tokens_used?: number | null // format: integer
        usage_type?: string | null // format: character varying
        }
        Update: {
        cost?: number // format: numeric
        created_at?: string | null // format: timestamp with time zone
        date?: string // format: date
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        service?: string | null // format: character varying
        tokens_used?: number | null // format: integer
        usage_type?: string | null // format: character varying
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
        cost_usd: number | null // format: numeric
        created_at: string | null // format: timestamp with time zone
        endpoint: string // format: text
        event_id: string | null // format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        model: string // format: text
        tokens_used: number | null // format: integer
        user_id: string | null // format: uuid
        }
        Insert: {
        cost_usd?: number | null // format: numeric
        created_at?: string | null // format: timestamp with time zone
        endpoint: string // format: text
        event_id?: string | null // format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        model: string // format: text
        tokens_used?: number | null // format: integer
        user_id?: string | null // format: uuid
        }
        Update: {
        cost_usd?: number | null // format: numeric
        created_at?: string | null // format: timestamp with time zone
        endpoint?: string // format: text
        event_id?: string | null // format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        model?: string // format: text
        tokens_used?: number | null // format: integer
        user_id?: string | null // format: uuid
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
        count: number // format: integer
        created_at: string // format: timestamp with time zone
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        timestamp: string // format: timestamp with time zone
        updated_at: string // format: timestamp with time zone
        }
        Insert: {
        count: number // format: integer
        created_at?: string // format: timestamp with time zone
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        timestamp?: string // format: timestamp with time zone
        updated_at?: string // format: timestamp with time zone
        }
        Update: {
        count?: number // format: integer
        created_at?: string // format: timestamp with time zone
        event_id?: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        timestamp?: string // format: timestamp with time zone
        updated_at?: string // format: timestamp with time zone
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
        action: string // format: text
        action_type: string // format: text
        created_at: string | null // format: timestamp with time zone
        details: Json | null // format: jsonb
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        performed_by: string | null // format: uuid
        profile_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        record_id: string | null // format: uuid
        table_name: string | null // format: text
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        action: string // format: text
        action_type: string // format: text
        created_at?: string | null // format: timestamp with time zone
        details?: Json | null // format: jsonb
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        performed_by?: string | null // format: uuid
        profile_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        record_id?: string | null // format: uuid
        table_name?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        action?: string // format: text
        action_type?: string // format: text
        created_at?: string | null // format: timestamp with time zone
        details?: Json | null // format: jsonb
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        performed_by?: string | null // format: uuid
        profile_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        record_id?: string | null // format: uuid
        table_name?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      automation_workflows: {
        Row: {
        actions: Json | null // format: jsonb
        conditions: Json | null // format: jsonb
        created_at: string | null // format: timestamp with time zone
        description: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active: boolean | null // format: boolean
        name: string // format: text
        priority: number | null // format: integer
        trigger_config: Json | null // format: jsonb
        trigger_type: string // format: text
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        actions?: Json | null // format: jsonb
        conditions?: Json | null // format: jsonb
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        name: string // format: text
        priority?: number | null // format: integer
        trigger_config?: Json | null // format: jsonb
        trigger_type: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        actions?: Json | null // format: jsonb
        conditions?: Json | null // format: jsonb
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        name?: string // format: text
        priority?: number | null // format: integer
        trigger_config?: Json | null // format: jsonb
        trigger_type?: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      base_events: {
        Row: {
        created_at: string | null // format: text
        created_by: string | null // format: uuid
        description: string | null // format: text
        end_datetime: string // format: text
        event_manager_contact: Json | null // format: jsonb
        event_manager_name: string | null // format: text
        event_name: string // format: text
        event_type: string // format: text
        expected_attendance: number | null // format: integer
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_current: boolean | null // format: boolean
        start_datetime: string // format: text
        updated_at: string | null // format: text
        venue_address: string // format: text
        venue_name: string // format: text
        }
        Insert: {
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        description?: string | null // format: text
        end_datetime: string // format: text
        event_manager_contact?: Json | null // format: jsonb
        event_manager_name?: string | null // format: text
        event_name: string // format: text
        event_type: string // format: text
        expected_attendance?: number | null // format: integer
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_current?: boolean | null // format: boolean
        start_datetime: string // format: text
        updated_at?: string | null // format: text
        venue_address: string // format: text
        venue_name: string // format: text
        }
        Update: {
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        description?: string | null // format: text
        end_datetime?: string // format: text
        event_manager_contact?: Json | null // format: jsonb
        event_manager_name?: string | null // format: text
        event_name?: string // format: text
        event_type?: string // format: text
        expected_attendance?: number | null // format: integer
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_current?: boolean | null // format: boolean
        start_datetime?: string // format: text
        updated_at?: string | null // format: text
        venue_address?: string // format: text
        venue_name?: string // format: text
        }
        Relationships: []
      }
      benchmarking_results: {
        Row: {
        analyzed_at: string | null // format: timestamp with time zone
        analyzed_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        benchmarking_data: Json // format: jsonb
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        provider_used: string | null // format: character varying
        }
        Insert: {
        analyzed_at?: string | null // format: timestamp with time zone
        analyzed_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        benchmarking_data: Json // format: jsonb
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        provider_used?: string | null // format: character varying
        }
        Update: {
        analyzed_at?: string | null // format: timestamp with time zone
        analyzed_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        benchmarking_data?: Json // format: jsonb
        event_id?: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        provider_used?: string | null // format: character varying
        }
        Relationships: []
      }
      best_practice_cache: {
        Row: {
        best_practice: Json // format: jsonb
        created_at: string // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_hash: string // format: text
        incident_type: string // format: text
        occurrence_excerpt: string // format: text
        ttl_expires_at: string // format: timestamp with time zone
        }
        Insert: {
        best_practice: Json // format: jsonb
        created_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_hash: string // format: text
        incident_type: string // format: text
        occurrence_excerpt: string // format: text
        ttl_expires_at: string // format: timestamp with time zone
        }
        Update: {
        best_practice?: Json // format: jsonb
        created_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_hash?: string // format: text
        incident_type?: string // format: text
        occurrence_excerpt?: string // format: text
        ttl_expires_at?: string // format: timestamp with time zone
        }
        Relationships: []
      }
      blockchain_audit: {
        Row: {
        block_index: number // format: integer
        created_at: string | null // format: timestamp with time zone
        data: Json // format: jsonb
        data_hash: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        nonce: number // format: integer
        previous_hash: string // format: text
        timestamp: string // format: timestamp with time zone
        }
        Insert: {
        block_index: number // format: integer
        created_at?: string | null // format: timestamp with time zone
        data: Json // format: jsonb
        data_hash: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        nonce: number // format: integer
        previous_hash: string // format: text
        timestamp: string // format: timestamp with time zone
        }
        Update: {
        block_index?: number // format: integer
        created_at?: string | null // format: timestamp with time zone
        data?: Json // format: jsonb
        data_hash?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        nonce?: number // format: integer
        previous_hash?: string // format: text
        timestamp?: string // format: timestamp with time zone
        }
        Relationships: []
      }
      callsign_assignments: {
        Row: {
        assigned_at: string | null // format: timestamp with time zone
        assigned_name: string | null // format: text
        callsign_role_id: string | null // format: uuid
        created_at: string | null // format: timestamp with time zone
        event_id: string | null // format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        position_id: string | null // Note: This is a Foreign Key to `callsign_positions.id`.<fk table='callsign_positions' column='id'/> | format: uuid
        unassigned_at: string | null // format: timestamp with time zone
        updated_at: string | null // format: timestamp with time zone
        user_id: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        }
        Insert: {
        assigned_at?: string | null // format: timestamp with time zone
        assigned_name?: string | null // format: text
        callsign_role_id?: string | null // format: uuid
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        position_id?: string | null // Note: This is a Foreign Key to `callsign_positions.id`.<fk table='callsign_positions' column='id'/> | format: uuid
        unassigned_at?: string | null // format: timestamp with time zone
        updated_at?: string | null // format: timestamp with time zone
        user_id?: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        }
        Update: {
        assigned_at?: string | null // format: timestamp with time zone
        assigned_name?: string | null // format: text
        callsign_role_id?: string | null // format: uuid
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        position_id?: string | null // Note: This is a Foreign Key to `callsign_positions.id`.<fk table='callsign_positions' column='id'/> | format: uuid
        unassigned_at?: string | null // format: timestamp with time zone
        updated_at?: string | null // format: timestamp with time zone
        user_id?: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        }
        Relationships: []
      }
      callsign_positions: {
        Row: {
        area: string | null // format: text
        callsign: string // format: text
        category_id: number | null // format: integer
        created_at: string | null // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        position: string | null // format: text
        post: string | null // format: text
        required: boolean | null // format: boolean
        short_code: string | null // format: text
        skills_required: string[] | null // format: text[]
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        area?: string | null // format: text
        callsign: string // format: text
        category_id?: number | null // format: integer
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        position?: string | null // format: text
        post?: string | null // format: text
        required?: boolean | null // format: boolean
        short_code?: string | null // format: text
        skills_required?: string[] | null // format: text[]
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        area?: string | null // format: text
        callsign?: string // format: text
        category_id?: number | null // format: integer
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        position?: string | null // format: text
        post?: string | null // format: text
        required?: boolean | null // format: boolean
        short_code?: string | null // format: text
        skills_required?: string[] | null // format: text[]
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      camera_feeds: {
        Row: {
        ai_detection_enabled: boolean | null // format: boolean
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active: boolean | null // format: boolean
        location: string | null // format: text
        name: string // format: text
        stream_url: string // format: text
        }
        Insert: {
        ai_detection_enabled?: boolean | null // format: boolean
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        location?: string | null // format: text
        name: string // format: text
        stream_url: string // format: text
        }
        Update: {
        ai_detection_enabled?: boolean | null // format: boolean
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        location?: string | null // format: text
        name?: string // format: text
        stream_url?: string // format: text
        }
        Relationships: []
      }
      companies: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name?: string // format: text
        }
        Relationships: []
      }
      compliance_reports: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        rating: string | null // format: text
        report_data: Json // format: jsonb
        score: number | null // format: numeric
        standard: string // format: text
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        rating?: string | null // format: text
        report_data: Json // format: jsonb
        score?: number | null // format: numeric
        standard: string // format: text
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        rating?: string | null // format: text
        report_data?: Json // format: jsonb
        score?: number | null // format: numeric
        standard?: string // format: text
        }
        Relationships: []
      }
      corporate_events: {
        Row: {
        av_requirements: Json | null // format: jsonb
        branding_requirements: string | null // format: text
        catering_details: Json | null // format: jsonb
        client_company: string | null // format: text
        client_contact: Json | null // format: jsonb
        created_at: string | null // format: text
        created_by: string | null // format: uuid
        deployment_plan: string | null // format: text
        description: string | null // format: text
        documents: unknown[] | null // format: jsonb[]
        end_datetime: string // format: text
        event_manager_contact: Json | null // format: jsonb
        event_manager_name: string | null // format: text
        event_name: string // format: text
        event_purpose: string | null // format: text
        event_type: string // format: text
        expected_attendance: number | null // format: integer
        guest_list_management: string | null // format: text
        id: string // format: uuid
        is_current: boolean | null // format: boolean
        other_contacts: unknown[] | null // format: jsonb[]
        parking_arrangements: string | null // format: text
        room_layout: string | null // format: text
        schedule: Json | null // format: jsonb
        security_staff_required: Json | null // format: jsonb
        security_supervisor_contact: Json | null // format: jsonb
        security_supervisor_name: string | null // format: text
        special_instructions: string | null // format: text
        start_datetime: string // format: text
        updated_at: string | null // format: text
        venue_address: string // format: text
        venue_contact: Json | null // format: jsonb
        venue_name: string // format: text
        website: string | null // format: text
        wifi_details: Json | null // format: jsonb
        }
        Insert: {
        av_requirements?: Json | null // format: jsonb
        branding_requirements?: string | null // format: text
        catering_details?: Json | null // format: jsonb
        client_company?: string | null // format: text
        client_contact?: Json | null // format: jsonb
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        deployment_plan?: string | null // format: text
        description?: string | null // format: text
        documents?: unknown[] | null // format: jsonb[]
        end_datetime: string // format: text
        event_manager_contact?: Json | null // format: jsonb
        event_manager_name?: string | null // format: text
        event_name: string // format: text
        event_purpose?: string | null // format: text
        event_type: string // format: text
        expected_attendance?: number | null // format: integer
        guest_list_management?: string | null // format: text
        id?: string // format: uuid
        is_current?: boolean | null // format: boolean
        other_contacts?: unknown[] | null // format: jsonb[]
        parking_arrangements?: string | null // format: text
        room_layout?: string | null // format: text
        schedule?: Json | null // format: jsonb
        security_staff_required?: Json | null // format: jsonb
        security_supervisor_contact?: Json | null // format: jsonb
        security_supervisor_name?: string | null // format: text
        special_instructions?: string | null // format: text
        start_datetime: string // format: text
        updated_at?: string | null // format: text
        venue_address: string // format: text
        venue_contact?: Json | null // format: jsonb
        venue_name: string // format: text
        website?: string | null // format: text
        wifi_details?: Json | null // format: jsonb
        }
        Update: {
        av_requirements?: Json | null // format: jsonb
        branding_requirements?: string | null // format: text
        catering_details?: Json | null // format: jsonb
        client_company?: string | null // format: text
        client_contact?: Json | null // format: jsonb
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        deployment_plan?: string | null // format: text
        description?: string | null // format: text
        documents?: unknown[] | null // format: jsonb[]
        end_datetime?: string // format: text
        event_manager_contact?: Json | null // format: jsonb
        event_manager_name?: string | null // format: text
        event_name?: string // format: text
        event_purpose?: string | null // format: text
        event_type?: string // format: text
        expected_attendance?: number | null // format: integer
        guest_list_management?: string | null // format: text
        id?: string // format: uuid
        is_current?: boolean | null // format: boolean
        other_contacts?: unknown[] | null // format: jsonb[]
        parking_arrangements?: string | null // format: text
        room_layout?: string | null // format: text
        schedule?: Json | null // format: jsonb
        security_staff_required?: Json | null // format: jsonb
        security_supervisor_contact?: Json | null // format: jsonb
        security_supervisor_name?: string | null // format: text
        special_instructions?: string | null // format: text
        start_datetime?: string // format: text
        updated_at?: string | null // format: text
        venue_address?: string // format: text
        venue_contact?: Json | null // format: jsonb
        venue_name?: string // format: text
        website?: string | null // format: text
        wifi_details?: Json | null // format: jsonb
        }
        Relationships: []
      }
      debriefs: {
        Row: {
        ai_summary: string | null // format: text
        callsign_sheet: Json | null // format: jsonb
        created_at: string // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: number // Note: This is a Primary Key.<pk/> | format: bigint
        learning_points: Json | null // format: jsonb
        manual_notes: string | null // format: text
        }
        Insert: {
        ai_summary?: string | null // format: text
        callsign_sheet?: Json | null // format: jsonb
        created_at?: string // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: bigint
        learning_points?: Json | null // format: jsonb
        manual_notes?: string | null // format: text
        }
        Update: {
        ai_summary?: string | null // format: text
        callsign_sheet?: Json | null // format: jsonb
        created_at?: string // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: bigint
        learning_points?: Json | null // format: jsonb
        manual_notes?: string | null // format: text
        }
        Relationships: []
      }
      dev_sessions: {
        Row: {
        category: string | null // format: character varying
        created_at: string | null // format: timestamp with time zone
        date: string // format: date
        description: string | null // format: text
        duration_hours: number // format: numeric
        end_time: string // format: time without time zone
        hourly_rate: number // format: numeric
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        start_time: string // format: time without time zone
        total_cost: number // format: numeric
        }
        Insert: {
        category?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        date: string // format: date
        description?: string | null // format: text
        duration_hours: number // format: numeric
        end_time: string // format: time without time zone
        hourly_rate: number // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        start_time: string // format: time without time zone
        total_cost: number // format: numeric
        }
        Update: {
        category?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        date?: string // format: date
        description?: string | null // format: text
        duration_hours?: number // format: numeric
        end_time?: string // format: time without time zone
        hourly_rate?: number // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        start_time?: string // format: time without time zone
        total_cost?: number // format: numeric
        }
        Relationships: []
      }
      dev_settings: {
        Row: {
        description: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        setting_name: string // format: character varying
        setting_value: number // format: numeric
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        setting_name: string // format: character varying
        setting_value: number // format: numeric
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        setting_name?: string // format: character varying
        setting_value?: number // format: numeric
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      dim_date: {
        Row: {
        date_key: number // Note: This is a Primary Key.<pk/> | format: integer
        day: number | null // format: integer
        day_of_week: number | null // format: integer
        full_date: string // format: date
        is_weekend: boolean | null // format: boolean
        month: number | null // format: integer
        year: number | null // format: integer
        }
        Insert: {
        date_key?: number // Note: This is a Primary Key.<pk/> | format: integer
        day?: number | null // format: integer
        day_of_week?: number | null // format: integer
        full_date: string // format: date
        is_weekend?: boolean | null // format: boolean
        month?: number | null // format: integer
        year?: number | null // format: integer
        }
        Update: {
        date_key?: number // Note: This is a Primary Key.<pk/> | format: integer
        day?: number | null // format: integer
        day_of_week?: number | null // format: integer
        full_date?: string // format: date
        is_weekend?: boolean | null // format: boolean
        month?: number | null // format: integer
        year?: number | null // format: integer
        }
        Relationships: []
      }
      dim_time: {
        Row: {
        hour: number | null // format: integer
        minute: number | null // format: integer
        time_key: number // Note: This is a Primary Key.<pk/> | format: integer
        time_of_day: string | null // format: text
        }
        Insert: {
        hour?: number | null // format: integer
        minute?: number | null // format: integer
        time_key?: number // Note: This is a Primary Key.<pk/> | format: integer
        time_of_day?: string | null // format: text
        }
        Update: {
        hour?: number | null // format: integer
        minute?: number | null // format: integer
        time_key?: number // Note: This is a Primary Key.<pk/> | format: integer
        time_of_day?: string | null // format: text
        }
        Relationships: []
      }
      error_logs: {
        Row: {
        action: string | null // format: text
        component: string | null // format: text
        context: Json | null // format: jsonb
        created_at: string // format: timestamp with time zone
        error_id: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        level: string // format: text
        message: string // format: text
        session_id: string | null // format: text
        stack: string | null // format: text
        timestamp: string // format: timestamp with time zone
        url: string | null // format: text
        user_agent: string | null // format: text
        user_id: string | null // format: uuid
        }
        Insert: {
        action?: string | null // format: text
        component?: string | null // format: text
        context?: Json | null // format: jsonb
        created_at?: string // format: timestamp with time zone
        error_id: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        level: string // format: text
        message: string // format: text
        session_id?: string | null // format: text
        stack?: string | null // format: text
        timestamp?: string // format: timestamp with time zone
        url?: string | null // format: text
        user_agent?: string | null // format: text
        user_id?: string | null // format: uuid
        }
        Update: {
        action?: string | null // format: text
        component?: string | null // format: text
        context?: Json | null // format: jsonb
        created_at?: string // format: timestamp with time zone
        error_id?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        level?: string // format: text
        message?: string // format: text
        session_id?: string | null // format: text
        stack?: string | null // format: text
        timestamp?: string // format: timestamp with time zone
        url?: string | null // format: text
        user_agent?: string | null // format: text
        user_id?: string | null // format: uuid
        }
        Relationships: []
      }
      escalation_sla_config: {
        Row: {
        auto_escalate: boolean | null // format: boolean
        created_at: string | null // format: timestamp with time zone
        escalation_levels: number | null // format: integer
        escalation_timeout_minutes: number // format: integer
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_type: string // format: character varying
        priority_level: string // format: character varying
        supervisor_roles: string[] | null // format: text[]
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        auto_escalate?: boolean | null // format: boolean
        created_at?: string | null // format: timestamp with time zone
        escalation_levels?: number | null // format: integer
        escalation_timeout_minutes: number // format: integer
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_type: string // format: character varying
        priority_level: string // format: character varying
        supervisor_roles?: string[] | null // format: text[]
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        auto_escalate?: boolean | null // format: boolean
        created_at?: string | null // format: timestamp with time zone
        escalation_levels?: number | null // format: integer
        escalation_timeout_minutes?: number // format: integer
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_type?: string // format: character varying
        priority_level?: string // format: character varying
        supervisor_roles?: string[] | null // format: text[]
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      event_chat_members: {
        Row: {
        chat_id: string | null // Note: This is a Foreign Key to `event_chats.id`.<fk table='event_chats' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        joined_at: string | null // format: timestamp with time zone
        user_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Insert: {
        chat_id?: string | null // Note: This is a Foreign Key to `event_chats.id`.<fk table='event_chats' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        joined_at?: string | null // format: timestamp with time zone
        user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Update: {
        chat_id?: string | null // Note: This is a Foreign Key to `event_chats.id`.<fk table='event_chats' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        joined_at?: string | null // format: timestamp with time zone
        user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Relationships: []
      }
      event_chat_messages: {
        Row: {
        chat_id: string | null // Note: This is a Foreign Key to `event_chats.id`.<fk table='event_chats' column='id'/> | format: uuid
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        message: string // format: text
        sender_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        user_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Insert: {
        chat_id?: string | null // Note: This is a Foreign Key to `event_chats.id`.<fk table='event_chats' column='id'/> | format: uuid
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        message: string // format: text
        sender_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Update: {
        chat_id?: string | null // Note: This is a Foreign Key to `event_chats.id`.<fk table='event_chats' column='id'/> | format: uuid
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        message?: string // format: text
        sender_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Relationships: []
      }
      event_chats: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        description: string | null // format: text
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        type: string // format: text
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        type: string // format: text
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name?: string // format: text
        type?: string // format: text
        }
        Relationships: []
      }
      event_invites: {
        Row: {
        allow_multiple: boolean | null // format: boolean
        created_at: string | null // format: timestamp with time zone
        created_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        expires_at: string // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        intended_email: string | null // format: text
        last_used_at: string | null // format: timestamp with time zone
        max_uses: number | null // format: integer
        metadata: Json | null // format: jsonb
        role: string // format: text
        status: string // format: text
        token_hash: string // format: text
        used_count: number | null // format: integer
        }
        Insert: {
        allow_multiple?: boolean | null // format: boolean
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        expires_at: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        intended_email?: string | null // format: text
        last_used_at?: string | null // format: timestamp with time zone
        max_uses?: number | null // format: integer
        metadata?: Json | null // format: jsonb
        role: string // format: text
        status?: string // format: text
        token_hash: string // format: text
        used_count?: number | null // format: integer
        }
        Update: {
        allow_multiple?: boolean | null // format: boolean
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        event_id?: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        expires_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        intended_email?: string | null // format: text
        last_used_at?: string | null // format: timestamp with time zone
        max_uses?: number | null // format: integer
        metadata?: Json | null // format: jsonb
        role?: string // format: text
        status?: string // format: text
        token_hash?: string // format: text
        used_count?: number | null // format: integer
        }
        Relationships: []
      }
      event_members: {
        Row: {
        email: string | null // format: text
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        expires_at: string | null // format: timestamp with time zone
        full_name: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        invite_id: string | null // Note: This is a Foreign Key to `event_invites.id`.<fk table='event_invites' column='id'/> | format: uuid
        is_temporary: boolean | null // format: boolean
        joined_at: string | null // format: timestamp with time zone
        last_seen_at: string | null // format: timestamp with time zone
        role: string // format: text
        status: string // format: text
        user_id: string // format: uuid
        }
        Insert: {
        email?: string | null // format: text
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        expires_at?: string | null // format: timestamp with time zone
        full_name?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        invite_id?: string | null // Note: This is a Foreign Key to `event_invites.id`.<fk table='event_invites' column='id'/> | format: uuid
        is_temporary?: boolean | null // format: boolean
        joined_at?: string | null // format: timestamp with time zone
        last_seen_at?: string | null // format: timestamp with time zone
        role: string // format: text
        status?: string // format: text
        user_id: string // format: uuid
        }
        Update: {
        email?: string | null // format: text
        event_id?: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        expires_at?: string | null // format: timestamp with time zone
        full_name?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        invite_id?: string | null // Note: This is a Foreign Key to `event_invites.id`.<fk table='event_invites' column='id'/> | format: uuid
        is_temporary?: boolean | null // format: boolean
        joined_at?: string | null // format: timestamp with time zone
        last_seen_at?: string | null // format: timestamp with time zone
        role?: string // format: text
        status?: string // format: text
        user_id?: string // format: uuid
        }
        Relationships: []
      }
      event_staff_assignments: {
        Row: {
        assigned_at: string | null // format: timestamp with time zone
        assigned_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        callsign: string // format: text
        created_at: string | null // format: timestamp with time zone
        department: string // format: text
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        position_id: string // format: text
        position_name: string // format: text
        staff_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        assigned_at?: string | null // format: timestamp with time zone
        assigned_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        callsign: string // format: text
        created_at?: string | null // format: timestamp with time zone
        department: string // format: text
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        position_id: string // format: text
        position_name: string // format: text
        staff_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        assigned_at?: string | null // format: timestamp with time zone
        assigned_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        callsign?: string // format: text
        created_at?: string | null // format: timestamp with time zone
        department?: string // format: text
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        position_id?: string // format: text
        position_name?: string // format: text
        staff_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      event_summaries: {
        Row: {
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        generated_at: string | null // format: timestamp with time zone
        generated_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        summary_data: Json // format: jsonb
        }
        Insert: {
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        generated_at?: string | null // format: timestamp with time zone
        generated_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        summary_data: Json // format: jsonb
        }
        Update: {
        event_id?: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        generated_at?: string | null // format: timestamp with time zone
        generated_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        summary_data?: Json // format: jsonb
        }
        Relationships: []
      }
      events: {
        Row: {
        artist_name: string | null // format: text
        assistant_head_of_security: string | null // format: text
        assistant_head_of_security_name: string | null // format: text
        company_id: string | null // format: text
        created_at: string | null // format: text
        created_by: string | null // format: uuid
        curfew_time: string | null // format: text
        description: string | null // format: text
        doors_open_time: string | null // format: text
        duty_manager: string | null // format: text
        end_datetime: string | null // format: text
        event_brief: string | null // format: text
        event_control: string | null // format: text
        event_date: string | null // format: date
        event_description: string | null // format: text
        event_end_time: string | null // format: text
        event_manager_name: string | null // format: text
        event_name: string // format: text
        event_type: "Concert" | "Parade" | "Festival" | "Corporate" | "Other" // format: public.event_type
        expected_attendance: number | null // format: integer
        head_of_security: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_current: boolean | null // format: boolean
        main_act_start_time: string | null // format: text
        main_act_times: string | null // format: text
        normalised_artist_name: string | null // format: text
        production_manager: string | null // format: text
        security_call_time: string | null // format: text
        security_call_times: string[] | null // format: text[]
        show_down_time: string | null // format: text
        show_stop_meeting_time: string | null // format: text
        start_datetime: string | null // format: text
        support_act_times: Json | null // format: jsonb
        support_acts: string | null // format: text
        updated_at: string | null // format: text
        venue_address: string // format: text
        venue_capacity: number | null // format: integer
        venue_name: string // format: text
        venue_opening_time: string | null // format: text
        venue_type: string | null // format: character varying
        }
        Insert: {
        artist_name?: string | null // format: text
        assistant_head_of_security?: string | null // format: text
        assistant_head_of_security_name?: string | null // format: text
        company_id?: string | null // format: text
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        curfew_time?: string | null // format: text
        description?: string | null // format: text
        doors_open_time?: string | null // format: text
        duty_manager?: string | null // format: text
        end_datetime?: string | null // format: text
        event_brief?: string | null // format: text
        event_control?: string | null // format: text
        event_date?: string | null // format: date
        event_description?: string | null // format: text
        event_end_time?: string | null // format: text
        event_manager_name?: string | null // format: text
        event_name: string // format: text
        event_type: "Concert" | "Parade" | "Festival" | "Corporate" | "Other" // format: public.event_type
        expected_attendance?: number | null // format: integer
        head_of_security?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_current?: boolean | null // format: boolean
        main_act_start_time?: string | null // format: text
        main_act_times?: string | null // format: text
        normalised_artist_name?: string | null // format: text
        production_manager?: string | null // format: text
        security_call_time?: string | null // format: text
        security_call_times?: string[] | null // format: text[]
        show_down_time?: string | null // format: text
        show_stop_meeting_time?: string | null // format: text
        start_datetime?: string | null // format: text
        support_act_times?: Json | null // format: jsonb
        support_acts?: string | null // format: text
        updated_at?: string | null // format: text
        venue_address: string // format: text
        venue_capacity?: number | null // format: integer
        venue_name: string // format: text
        venue_opening_time?: string | null // format: text
        venue_type?: string | null // format: character varying
        }
        Update: {
        artist_name?: string | null // format: text
        assistant_head_of_security?: string | null // format: text
        assistant_head_of_security_name?: string | null // format: text
        company_id?: string | null // format: text
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        curfew_time?: string | null // format: text
        description?: string | null // format: text
        doors_open_time?: string | null // format: text
        duty_manager?: string | null // format: text
        end_datetime?: string | null // format: text
        event_brief?: string | null // format: text
        event_control?: string | null // format: text
        event_date?: string | null // format: date
        event_description?: string | null // format: text
        event_end_time?: string | null // format: text
        event_manager_name?: string | null // format: text
        event_name?: string // format: text
        event_type?: "Concert" | "Parade" | "Festival" | "Corporate" | "Other" // format: public.event_type
        expected_attendance?: number | null // format: integer
        head_of_security?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_current?: boolean | null // format: boolean
        main_act_start_time?: string | null // format: text
        main_act_times?: string | null // format: text
        normalised_artist_name?: string | null // format: text
        production_manager?: string | null // format: text
        security_call_time?: string | null // format: text
        security_call_times?: string[] | null // format: text[]
        show_down_time?: string | null // format: text
        show_stop_meeting_time?: string | null // format: text
        start_datetime?: string | null // format: text
        support_act_times?: Json | null // format: jsonb
        support_acts?: string | null // format: text
        updated_at?: string | null // format: text
        venue_address?: string // format: text
        venue_capacity?: number | null // format: integer
        venue_name?: string // format: text
        venue_opening_time?: string | null // format: text
        venue_type?: string | null // format: character varying
        }
        Relationships: []
      }
      executive_summaries: {
        Row: {
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        generated_at: string | null // format: timestamp with time zone
        generated_by: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        summary_data: Json // format: jsonb
        }
        Insert: {
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        generated_at?: string | null // format: timestamp with time zone
        generated_by?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        summary_data: Json // format: jsonb
        }
        Update: {
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        generated_at?: string | null // format: timestamp with time zone
        generated_by?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        summary_data?: Json // format: jsonb
        }
        Relationships: []
      }
      fact_incidents: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        date_key: number | null // format: integer
        event_id: string | null // format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id: number | null // format: integer
        incident_type_key: string | null // format: text
        priority_key: string | null // format: text
        quality_score: number | null // format: numeric
        resolution_time_minutes: number | null // format: integer
        response_time_minutes: number | null // format: integer
        time_key: number | null // format: integer
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        date_key?: number | null // format: integer
        event_id?: string | null // format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id?: number | null // format: integer
        incident_type_key?: string | null // format: text
        priority_key?: string | null // format: text
        quality_score?: number | null // format: numeric
        resolution_time_minutes?: number | null // format: integer
        response_time_minutes?: number | null // format: integer
        time_key?: number | null // format: integer
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        date_key?: number | null // format: integer
        event_id?: string | null // format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id?: number | null // format: integer
        incident_type_key?: string | null // format: text
        priority_key?: string | null // format: text
        quality_score?: number | null // format: numeric
        resolution_time_minutes?: number | null // format: integer
        response_time_minutes?: number | null // format: integer
        time_key?: number | null // format: integer
        }
        Relationships: []
      }
      feature_adoption: {
        Row: {
        created_at: string // format: timestamp with time zone
        feature_name: string // format: text
        first_use: string // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_use: string // format: timestamp with time zone
        metadata: Json | null // format: jsonb
        updated_at: string // format: timestamp with time zone
        use_count: number // format: integer
        user_id: string | null // format: uuid
        }
        Insert: {
        created_at?: string // format: timestamp with time zone
        feature_name: string // format: text
        first_use?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_use?: string // format: timestamp with time zone
        metadata?: Json | null // format: jsonb
        updated_at?: string // format: timestamp with time zone
        use_count?: number // format: integer
        user_id?: string | null // format: uuid
        }
        Update: {
        created_at?: string // format: timestamp with time zone
        feature_name?: string // format: text
        first_use?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_use?: string // format: timestamp with time zone
        metadata?: Json | null // format: jsonb
        updated_at?: string // format: timestamp with time zone
        use_count?: number // format: integer
        user_id?: string | null // format: uuid
        }
        Relationships: []
      }
      festival_events: {
        Row: {
        camping_available: boolean | null // format: boolean
        camping_details: Json | null // format: jsonb
        created_at: string | null // format: text
        created_by: string | null // format: uuid
        deployment_plan: string | null // format: text
        description: string | null // format: text
        documents: unknown[] | null // format: jsonb[]
        duration_days: number | null // format: integer
        end_datetime: string // format: text
        event_manager_contact: Json | null // format: jsonb
        event_manager_name: string | null // format: text
        event_name: string // format: text
        event_type: string // format: text
        expected_attendance: number | null // format: integer
        facility_locations: unknown[] | null // format: jsonb[]
        id: string // format: uuid
        is_current: boolean | null // format: boolean
        lost_child_procedure: string | null // format: text
        medical_provision_details: Json | null // format: jsonb
        noise_monitoring_points: unknown[] | null // format: jsonb[]
        other_contacts: unknown[] | null // format: jsonb[]
        performance_schedule: Json | null // format: jsonb
        security_staff_required: Json | null // format: jsonb
        security_supervisor_contact: Json | null // format: jsonb
        security_supervisor_name: string | null // format: text
        site_map: Json | null // format: jsonb
        special_instructions: string | null // format: text
        stage_locations: unknown[] | null // format: jsonb[]
        start_datetime: string // format: text
        updated_at: string | null // format: text
        vendor_locations: unknown[] | null // format: jsonb[]
        venue_address: string // format: text
        venue_contact: Json | null // format: jsonb
        venue_name: string // format: text
        weather_contingency_plan: string | null // format: text
        website: string | null // format: text
        }
        Insert: {
        camping_available?: boolean | null // format: boolean
        camping_details?: Json | null // format: jsonb
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        deployment_plan?: string | null // format: text
        description?: string | null // format: text
        documents?: unknown[] | null // format: jsonb[]
        duration_days?: number | null // format: integer
        end_datetime: string // format: text
        event_manager_contact?: Json | null // format: jsonb
        event_manager_name?: string | null // format: text
        event_name: string // format: text
        event_type: string // format: text
        expected_attendance?: number | null // format: integer
        facility_locations?: unknown[] | null // format: jsonb[]
        id?: string // format: uuid
        is_current?: boolean | null // format: boolean
        lost_child_procedure?: string | null // format: text
        medical_provision_details?: Json | null // format: jsonb
        noise_monitoring_points?: unknown[] | null // format: jsonb[]
        other_contacts?: unknown[] | null // format: jsonb[]
        performance_schedule?: Json | null // format: jsonb
        security_staff_required?: Json | null // format: jsonb
        security_supervisor_contact?: Json | null // format: jsonb
        security_supervisor_name?: string | null // format: text
        site_map?: Json | null // format: jsonb
        special_instructions?: string | null // format: text
        stage_locations?: unknown[] | null // format: jsonb[]
        start_datetime: string // format: text
        updated_at?: string | null // format: text
        vendor_locations?: unknown[] | null // format: jsonb[]
        venue_address: string // format: text
        venue_contact?: Json | null // format: jsonb
        venue_name: string // format: text
        weather_contingency_plan?: string | null // format: text
        website?: string | null // format: text
        }
        Update: {
        camping_available?: boolean | null // format: boolean
        camping_details?: Json | null // format: jsonb
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        deployment_plan?: string | null // format: text
        description?: string | null // format: text
        documents?: unknown[] | null // format: jsonb[]
        duration_days?: number | null // format: integer
        end_datetime?: string // format: text
        event_manager_contact?: Json | null // format: jsonb
        event_manager_name?: string | null // format: text
        event_name?: string // format: text
        event_type?: string // format: text
        expected_attendance?: number | null // format: integer
        facility_locations?: unknown[] | null // format: jsonb[]
        id?: string // format: uuid
        is_current?: boolean | null // format: boolean
        lost_child_procedure?: string | null // format: text
        medical_provision_details?: Json | null // format: jsonb
        noise_monitoring_points?: unknown[] | null // format: jsonb[]
        other_contacts?: unknown[] | null // format: jsonb[]
        performance_schedule?: Json | null // format: jsonb
        security_staff_required?: Json | null // format: jsonb
        security_supervisor_contact?: Json | null // format: jsonb
        security_supervisor_name?: string | null // format: text
        site_map?: Json | null // format: jsonb
        special_instructions?: string | null // format: text
        stage_locations?: unknown[] | null // format: jsonb[]
        start_datetime?: string // format: text
        updated_at?: string | null // format: text
        vendor_locations?: unknown[] | null // format: jsonb[]
        venue_address?: string // format: text
        venue_contact?: Json | null // format: jsonb
        venue_name?: string // format: text
        weather_contingency_plan?: string | null // format: text
        website?: string | null // format: text
        }
        Relationships: []
      }
      found_items: {
        Row: {
        created_at: string // format: timestamp with time zone
        deleted_at: string | null // format: timestamp with time zone
        description: string // format: text
        found_at: string // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        keywords: string[] | null // format: text[]
        location: string | null // format: text
        logged_by_profile_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        photo_url: string | null // format: text
        retention_expires_at: string | null // format: date
        status: string // format: text
        storage_location: string | null // format: text
        updated_at: string // format: timestamp with time zone
        }
        Insert: {
        created_at?: string // format: timestamp with time zone
        deleted_at?: string | null // format: timestamp with time zone
        description: string // format: text
        found_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        keywords?: string[] | null // format: text[]
        location?: string | null // format: text
        logged_by_profile_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        photo_url?: string | null // format: text
        retention_expires_at?: string | null // format: date
        status?: string // format: text
        storage_location?: string | null // format: text
        updated_at?: string // format: timestamp with time zone
        }
        Update: {
        created_at?: string // format: timestamp with time zone
        deleted_at?: string | null // format: timestamp with time zone
        description?: string // format: text
        found_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        keywords?: string[] | null // format: text[]
        location?: string | null // format: text
        logged_by_profile_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        photo_url?: string | null // format: text
        retention_expires_at?: string | null // format: date
        status?: string // format: text
        storage_location?: string | null // format: text
        updated_at?: string // format: timestamp with time zone
        }
        Relationships: []
      }
      green_guide_chunks: {
        Row: {
        content: string // format: text
        created_at: string // format: timestamp with time zone
        embedding: string | null // format: public.vector(1536)
        heading: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        page: number | null // format: integer
        }
        Insert: {
        content: string // format: text
        created_at?: string // format: timestamp with time zone
        embedding?: string | null // format: public.vector(1536)
        heading?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        page?: number | null // format: integer
        }
        Update: {
        content?: string // format: text
        created_at?: string // format: timestamp with time zone
        embedding?: string | null // format: public.vector(1536)
        heading?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        page?: number | null // format: integer
        }
        Relationships: []
      }
      incident_attachments: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        file_type: string | null // format: text
        file_url: string // format: text
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        uploaded_by: string | null // format: text
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        file_type?: string | null // format: text
        file_url: string // format: text
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        uploaded_by?: string | null // format: text
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        file_type?: string | null // format: text
        file_url?: string // format: text
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        uploaded_by?: string | null // format: text
        }
        Relationships: []
      }
      incident_escalations: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        escalated_at: string | null // format: timestamp with time zone
        escalated_by: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        escalation_level: number // format: integer
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        notes: string | null // format: text
        resolution_time: number | null // format: interval
        supervisor_notified: boolean | null // format: boolean
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        escalated_at?: string | null // format: timestamp with time zone
        escalated_by?: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        escalation_level: number // format: integer
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        notes?: string | null // format: text
        resolution_time?: number | null // format: interval
        supervisor_notified?: boolean | null // format: boolean
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        escalated_at?: string | null // format: timestamp with time zone
        escalated_by?: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        escalation_level?: number // format: integer
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        notes?: string | null // format: text
        resolution_time?: number | null // format: interval
        supervisor_notified?: boolean | null // format: boolean
        }
        Relationships: []
      }
      incident_events: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        created_by: string | null // format: text
        event_data: Json | null // format: jsonb
        event_type: string // format: text
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // format: text
        event_data?: Json | null // format: jsonb
        event_type: string // format: text
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // format: text
        event_data?: Json | null // format: jsonb
        event_type?: string // format: text
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        }
        Relationships: []
      }
      incident_links: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        linked_incident_id: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        linked_incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        linked_incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        }
        Relationships: []
      }
      incident_log_revision_history: {
        Row: {
        change_reason: string | null // format: text
        change_type: string | null // format: character varying
        changed_at: string | null // format: timestamp with time zone
        changed_by_callsign: string | null // format: character varying
        changed_by_name: string | null // format: text
        changed_by_user_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        email: string | null // format: text
        entry_type: string | null // format: character varying
        field_changed: string | null // format: character varying
        id: string | null // Note: This is a Primary Key.<pk/> | format: uuid
        incident_log_id: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        incident_type: string | null // format: text
        log_number: string | null // format: text
        new_value: Json | null // format: jsonb
        old_value: Json | null // format: jsonb
        revision_number: number | null // format: integer
        time_logged: string | null // format: timestamp with time zone
        time_of_occurrence: string | null // format: timestamp with time zone
        }
        Insert: {
        change_reason?: string | null // format: text
        change_type?: string | null // format: character varying
        changed_at?: string | null // format: timestamp with time zone
        changed_by_callsign?: string | null // format: character varying
        changed_by_name?: string | null // format: text
        changed_by_user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        email?: string | null // format: text
        entry_type?: string | null // format: character varying
        field_changed?: string | null // format: character varying
        id?: string | null // Note: This is a Primary Key.<pk/> | format: uuid
        incident_log_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        incident_type?: string | null // format: text
        log_number?: string | null // format: text
        new_value?: Json | null // format: jsonb
        old_value?: Json | null // format: jsonb
        revision_number?: number | null // format: integer
        time_logged?: string | null // format: timestamp with time zone
        time_of_occurrence?: string | null // format: timestamp with time zone
        }
        Update: {
        change_reason?: string | null // format: text
        change_type?: string | null // format: character varying
        changed_at?: string | null // format: timestamp with time zone
        changed_by_callsign?: string | null // format: character varying
        changed_by_name?: string | null // format: text
        changed_by_user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        email?: string | null // format: text
        entry_type?: string | null // format: character varying
        field_changed?: string | null // format: character varying
        id?: string | null // Note: This is a Primary Key.<pk/> | format: uuid
        incident_log_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        incident_type?: string | null // format: text
        log_number?: string | null // format: text
        new_value?: Json | null // format: jsonb
        old_value?: Json | null // format: jsonb
        revision_number?: number | null // format: integer
        time_logged?: string | null // format: timestamp with time zone
        time_of_occurrence?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      incident_log_revisions: {
        Row: {
        change_reason: string // format: text
        change_type: string // format: character varying
        changed_at: string // format: timestamp with time zone
        changed_by_callsign: string | null // format: character varying
        changed_by_user_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        field_changed: string // format: character varying
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_log_id: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        new_value: Json | null // format: jsonb
        old_value: Json | null // format: jsonb
        revision_number: number // format: integer
        }
        Insert: {
        change_reason: string // format: text
        change_type: string // format: character varying
        changed_at?: string // format: timestamp with time zone
        changed_by_callsign?: string | null // format: character varying
        changed_by_user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        field_changed: string // format: character varying
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_log_id: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        new_value?: Json | null // format: jsonb
        old_value?: Json | null // format: jsonb
        revision_number: number // format: integer
        }
        Update: {
        change_reason?: string // format: text
        change_type?: string // format: character varying
        changed_at?: string // format: timestamp with time zone
        changed_by_callsign?: string | null // format: character varying
        changed_by_user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        field_changed?: string // format: character varying
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_log_id?: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        new_value?: Json | null // format: jsonb
        old_value?: Json | null // format: jsonb
        revision_number?: number // format: integer
        }
        Relationships: []
      }
      incident_logs: {
        Row: {
        action_taken: string // format: text
        ai_input: string | null // format: text
        assigned_staff_ids: string[] | null // Array of staff IDs assigned to this incident | format: uuid[]
        assignment_notes: string | null // format: text
        auto_assigned: boolean | null // Whether staff were auto-assigned | format: boolean
        callsign_from: string // format: text
        callsign_to: string // format: text
        created_at: string // format: timestamp with time zone
        dependencies: number[] | null // Array of incident IDs this incident depends on | format: integer[]
        entry_type: string // format: character varying
        escalate_at: string | null // Timestamp when incident should escalate | format: timestamp with time zone
        escalated: boolean | null // Whether incident has been escalated | format: boolean
        escalation_level: number | null // Current escalation level (0 = normal, 1+ = escalated) | format: integer
        escalation_notes: string | null // format: text
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        gps_accuracy: number | null // GPS accuracy in meters | format: numeric
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_type: string // format: text
        is_amended: boolean | null // format: boolean
        is_closed: boolean // format: boolean
        latitude: number | null // GPS latitude coordinate (decimal degrees) | format: numeric
        location: string | null // format: text
        location_timestamp: string | null // Timestamp when GPS location was captured | format: timestamp with time zone
        log_number: string // format: text
        logged_by_callsign: string | null // format: character varying
        logged_by_user_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        longitude: number | null // GPS longitude coordinate (decimal degrees) | format: numeric
        occurrence: string // format: text
        original_entry_id: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        photo_url: string | null // format: text
        priority: string // format: text
        resolved_at: string | null // format: timestamp with time zone
        responded_at: string | null // format: timestamp with time zone
        retrospective_justification: string | null // format: text
        status: string | null // format: text
        time_logged: string // format: timestamp with time zone
        time_of_occurrence: string // format: timestamp with time zone
        timestamp: string // format: timestamp with time zone
        title: string | null // format: text
        updated_at: string // format: timestamp with time zone
        what3words: string | null // format: text
        }
        Insert: {
        action_taken: string // format: text
        ai_input?: string | null // format: text
        assigned_staff_ids?: string[] | null // Array of staff IDs assigned to this incident | format: uuid[]
        assignment_notes?: string | null // format: text
        auto_assigned?: boolean | null // Whether staff were auto-assigned | format: boolean
        callsign_from: string // format: text
        callsign_to: string // format: text
        created_at?: string // format: timestamp with time zone
        dependencies?: number[] | null // Array of incident IDs this incident depends on | format: integer[]
        entry_type?: string // format: character varying
        escalate_at?: string | null // Timestamp when incident should escalate | format: timestamp with time zone
        escalated?: boolean | null // Whether incident has been escalated | format: boolean
        escalation_level?: number | null // Current escalation level (0 = normal, 1+ = escalated) | format: integer
        escalation_notes?: string | null // format: text
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        gps_accuracy?: number | null // GPS accuracy in meters | format: numeric
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_type: string // format: text
        is_amended?: boolean | null // format: boolean
        is_closed?: boolean // format: boolean
        latitude?: number | null // GPS latitude coordinate (decimal degrees) | format: numeric
        location?: string | null // format: text
        location_timestamp?: string | null // Timestamp when GPS location was captured | format: timestamp with time zone
        log_number: string // format: text
        logged_by_callsign?: string | null // format: character varying
        logged_by_user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        longitude?: number | null // GPS longitude coordinate (decimal degrees) | format: numeric
        occurrence: string // format: text
        original_entry_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        photo_url?: string | null // format: text
        priority?: string // format: text
        resolved_at?: string | null // format: timestamp with time zone
        responded_at?: string | null // format: timestamp with time zone
        retrospective_justification?: string | null // format: text
        status?: string | null // format: text
        time_logged: string // format: timestamp with time zone
        time_of_occurrence: string // format: timestamp with time zone
        timestamp?: string // format: timestamp with time zone
        title?: string | null // format: text
        updated_at?: string // format: timestamp with time zone
        what3words?: string | null // format: text
        }
        Update: {
        action_taken?: string // format: text
        ai_input?: string | null // format: text
        assigned_staff_ids?: string[] | null // Array of staff IDs assigned to this incident | format: uuid[]
        assignment_notes?: string | null // format: text
        auto_assigned?: boolean | null // Whether staff were auto-assigned | format: boolean
        callsign_from?: string // format: text
        callsign_to?: string // format: text
        created_at?: string // format: timestamp with time zone
        dependencies?: number[] | null // Array of incident IDs this incident depends on | format: integer[]
        entry_type?: string // format: character varying
        escalate_at?: string | null // Timestamp when incident should escalate | format: timestamp with time zone
        escalated?: boolean | null // Whether incident has been escalated | format: boolean
        escalation_level?: number | null // Current escalation level (0 = normal, 1+ = escalated) | format: integer
        escalation_notes?: string | null // format: text
        event_id?: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        gps_accuracy?: number | null // GPS accuracy in meters | format: numeric
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_type?: string // format: text
        is_amended?: boolean | null // format: boolean
        is_closed?: boolean // format: boolean
        latitude?: number | null // GPS latitude coordinate (decimal degrees) | format: numeric
        location?: string | null // format: text
        location_timestamp?: string | null // Timestamp when GPS location was captured | format: timestamp with time zone
        log_number?: string // format: text
        logged_by_callsign?: string | null // format: character varying
        logged_by_user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        longitude?: number | null // GPS longitude coordinate (decimal degrees) | format: numeric
        occurrence?: string // format: text
        original_entry_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        photo_url?: string | null // format: text
        priority?: string // format: text
        resolved_at?: string | null // format: timestamp with time zone
        responded_at?: string | null // format: timestamp with time zone
        retrospective_justification?: string | null // format: text
        status?: string | null // format: text
        time_logged?: string // format: timestamp with time zone
        time_of_occurrence?: string // format: timestamp with time zone
        timestamp?: string // format: timestamp with time zone
        title?: string | null // format: text
        updated_at?: string // format: timestamp with time zone
        what3words?: string | null // format: text
        }
        Relationships: []
      }
      incident_photos: {
        Row: {
        captured_at: string // format: timestamp with time zone
        created_at: string // format: timestamp with time zone
        description: string | null // format: text
        file_name: string // format: text
        file_size: number // format: integer
        file_type: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        latitude: number | null // format: numeric
        longitude: number | null // format: numeric
        photo_url: string // format: text
        updated_at: string // format: timestamp with time zone
        uploaded_at: string // format: timestamp with time zone
        uploaded_by: string | null // format: uuid
        }
        Insert: {
        captured_at?: string // format: timestamp with time zone
        created_at?: string // format: timestamp with time zone
        description?: string | null // format: text
        file_name: string // format: text
        file_size: number // format: integer
        file_type: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        latitude?: number | null // format: numeric
        longitude?: number | null // format: numeric
        photo_url: string // format: text
        updated_at?: string // format: timestamp with time zone
        uploaded_at?: string // format: timestamp with time zone
        uploaded_by?: string | null // format: uuid
        }
        Update: {
        captured_at?: string // format: timestamp with time zone
        created_at?: string // format: timestamp with time zone
        description?: string | null // format: text
        file_name?: string // format: text
        file_size?: number // format: integer
        file_type?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id?: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        latitude?: number | null // format: numeric
        longitude?: number | null // format: numeric
        photo_url?: string // format: text
        updated_at?: string // format: timestamp with time zone
        uploaded_at?: string // format: timestamp with time zone
        uploaded_by?: string | null // format: uuid
        }
        Relationships: []
      }
      incident_sops: {
        Row: {
        created_at: string // format: timestamp with time zone
        description: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_type: string // format: text
        is_required: boolean // format: boolean
        linked_action_id: string | null // Optional reference to guided action templates or playbooks. | format: uuid
        step_order: number // format: integer
        updated_at: string // format: timestamp with time zone
        }
        Insert: {
        created_at?: string // format: timestamp with time zone
        description: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_type: string // format: text
        is_required?: boolean // format: boolean
        linked_action_id?: string | null // Optional reference to guided action templates or playbooks. | format: uuid
        step_order: number // format: integer
        updated_at?: string // format: timestamp with time zone
        }
        Update: {
        created_at?: string // format: timestamp with time zone
        description?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_type?: string // format: text
        is_required?: boolean // format: boolean
        linked_action_id?: string | null // Optional reference to guided action templates or playbooks. | format: uuid
        step_order?: number // format: integer
        updated_at?: string // format: timestamp with time zone
        }
        Relationships: []
      }
      incident_tags: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        created_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        tag: string // format: character varying
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        tag: string // format: character varying
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id?: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        tag?: string // format: character varying
        }
        Relationships: []
      }
      incident_updates: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        update_text: string // format: text
        updated_by: string // format: text
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        update_text: string // format: text
        updated_by: string // format: text
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incident_id?: number // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        update_text?: string // format: text
        updated_by?: string // format: text
        }
        Relationships: []
      }
      incidents: {
        Row: {
        action_taken: string | null // format: text
        assigned_to: string | null // format: uuid
        callsign_from: string | null // format: text
        callsign_to: string | null // format: text
        created_at: string | null // format: timestamp with time zone
        created_by: string | null // format: uuid
        description: string | null // format: text
        event_id: string | null // format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_type: string | null // format: text
        is_closed: boolean | null // format: boolean
        occurrence: string | null // format: text
        priority: string // format: text
        status: string // format: text
        title: string | null // format: text
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        action_taken?: string | null // format: text
        assigned_to?: string | null // format: uuid
        callsign_from?: string | null // format: text
        callsign_to?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // format: uuid
        description?: string | null // format: text
        event_id?: string | null // format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_type?: string | null // format: text
        is_closed?: boolean | null // format: boolean
        occurrence?: string | null // format: text
        priority?: string // format: text
        status?: string // format: text
        title?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        action_taken?: string | null // format: text
        assigned_to?: string | null // format: uuid
        callsign_from?: string | null // format: text
        callsign_to?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // format: uuid
        description?: string | null // format: text
        event_id?: string | null // format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_type?: string | null // format: text
        is_closed?: boolean | null // format: boolean
        occurrence?: string | null // format: text
        priority?: string // format: text
        status?: string // format: text
        title?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      inquest_contacts: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        email: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_primary: boolean | null // format: boolean
        mobile: string | null // format: text
        name: string // format: text
        notes: string | null // format: text
        organization_id: string | null // Note: This is a Foreign Key to `inquest_organizations.id`.<fk table='inquest_organizations' column='id'/> | format: uuid
        phone: string | null // format: text
        role: string | null // format: text
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        email?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_primary?: boolean | null // format: boolean
        mobile?: string | null // format: text
        name: string // format: text
        notes?: string | null // format: text
        organization_id?: string | null // Note: This is a Foreign Key to `inquest_organizations.id`.<fk table='inquest_organizations' column='id'/> | format: uuid
        phone?: string | null // format: text
        role?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        email?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_primary?: boolean | null // format: boolean
        mobile?: string | null // format: text
        name?: string // format: text
        notes?: string | null // format: text
        organization_id?: string | null // Note: This is a Foreign Key to `inquest_organizations.id`.<fk table='inquest_organizations' column='id'/> | format: uuid
        phone?: string | null // format: text
        role?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      inquest_daily_reports: {
        Row: {
        activities: string | null // format: text
        created_at: string | null // format: timestamp with time zone
        end_time: string | null // format: time without time zone
        equipment_used: string[] | null // format: text[]
        event_id: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        handler_id: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incidents_noted: string | null // format: text
        notes: string | null // format: text
        report_date: string // format: date
        start_time: string | null // format: time without time zone
        submitted_at: string | null // format: timestamp with time zone
        submitted_by: string | null // format: uuid
        updated_at: string | null // format: timestamp with time zone
        weather_conditions: string | null // format: text
        }
        Insert: {
        activities?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        end_time?: string | null // format: time without time zone
        equipment_used?: string[] | null // format: text[]
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incidents_noted?: string | null // format: text
        notes?: string | null // format: text
        report_date: string // format: date
        start_time?: string | null // format: time without time zone
        submitted_at?: string | null // format: timestamp with time zone
        submitted_by?: string | null // format: uuid
        updated_at?: string | null // format: timestamp with time zone
        weather_conditions?: string | null // format: text
        }
        Update: {
        activities?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        end_time?: string | null // format: time without time zone
        equipment_used?: string[] | null // format: text[]
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incidents_noted?: string | null // format: text
        notes?: string | null // format: text
        report_date?: string // format: date
        start_time?: string | null // format: time without time zone
        submitted_at?: string | null // format: timestamp with time zone
        submitted_by?: string | null // format: uuid
        updated_at?: string | null // format: timestamp with time zone
        weather_conditions?: string | null // format: text
        }
        Relationships: []
      }
      inquest_event_requirements: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        description: string | null // format: text
        event_id: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_confirmed: boolean | null // format: boolean
        notes: string | null // format: text
        quantity: number | null // format: integer
        requirement_type: string // format: text
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_confirmed?: boolean | null // format: boolean
        notes?: string | null // format: text
        quantity?: number | null // format: integer
        requirement_type: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_confirmed?: boolean | null // format: boolean
        notes?: string | null // format: text
        quantity?: number | null // format: integer
        requirement_type?: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      inquest_event_services: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        quantity: number | null // format: integer
        service_id: string | null // Note: This is a Foreign Key to `inquest_services.id`.<fk table='inquest_services' column='id'/> | format: uuid
        total_price: number | null // format: numeric
        unit_price: number | null // format: numeric
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        quantity?: number | null // format: integer
        service_id?: string | null // Note: This is a Foreign Key to `inquest_services.id`.<fk table='inquest_services' column='id'/> | format: uuid
        total_price?: number | null // format: numeric
        unit_price?: number | null // format: numeric
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        quantity?: number | null // format: integer
        service_id?: string | null // Note: This is a Foreign Key to `inquest_services.id`.<fk table='inquest_services' column='id'/> | format: uuid
        total_price?: number | null // format: numeric
        unit_price?: number | null // format: numeric
        }
        Relationships: []
      }
      inquest_events: {
        Row: {
        budget: number | null // format: numeric
        client_name: string | null // format: text
        client_reference: string | null // format: text
        created_at: string | null // format: timestamp with time zone
        created_by: string | null // format: uuid
        description: string | null // format: text
        end_date: string | null // format: date
        end_datetime: string | null // format: timestamp with time zone
        end_time: string | null // format: time without time zone
        estimated_handlers: number | null // format: integer
        event_name: string // format: text
        event_type: string | null // format: text
        expected_attendance: number | null // format: integer
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        internal_reference: string | null // format: text
        organization_id: string | null // Note: This is a Foreign Key to `inquest_organizations.id`.<fk table='inquest_organizations' column='id'/> | format: uuid
        postcode: string | null // format: text
        request_source: string[] | null // format: text[]
        risk_level: string | null // format: text
        special_instructions: string | null // format: text
        special_requirements: string | null // format: text
        start_date: string | null // format: date
        start_datetime: string | null // format: timestamp with time zone
        start_time: string | null // format: time without time zone
        status: "LEAD_PLANNING" | "BOOKING_PREPARATION" | "LIVE_OPERATIONS" | "CLOSE_OUT" | "ON_HOLD" | "COMPLETE" | "CANCELLED" | "ARCHIVED" | null // format: public.inquest_event_status
        updated_at: string | null // format: timestamp with time zone
        venue_address: string | null // format: text
        venue_name: string | null // format: text
        }
        Insert: {
        budget?: number | null // format: numeric
        client_name?: string | null // format: text
        client_reference?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // format: uuid
        description?: string | null // format: text
        end_date?: string | null // format: date
        end_datetime?: string | null // format: timestamp with time zone
        end_time?: string | null // format: time without time zone
        estimated_handlers?: number | null // format: integer
        event_name: string // format: text
        event_type?: string | null // format: text
        expected_attendance?: number | null // format: integer
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        internal_reference?: string | null // format: text
        organization_id?: string | null // Note: This is a Foreign Key to `inquest_organizations.id`.<fk table='inquest_organizations' column='id'/> | format: uuid
        postcode?: string | null // format: text
        request_source?: string[] | null // format: text[]
        risk_level?: string | null // format: text
        special_instructions?: string | null // format: text
        special_requirements?: string | null // format: text
        start_date?: string | null // format: date
        start_datetime?: string | null // format: timestamp with time zone
        start_time?: string | null // format: time without time zone
        status?: "LEAD_PLANNING" | "BOOKING_PREPARATION" | "LIVE_OPERATIONS" | "CLOSE_OUT" | "ON_HOLD" | "COMPLETE" | "CANCELLED" | "ARCHIVED" | null // format: public.inquest_event_status
        updated_at?: string | null // format: timestamp with time zone
        venue_address?: string | null // format: text
        venue_name?: string | null // format: text
        }
        Update: {
        budget?: number | null // format: numeric
        client_name?: string | null // format: text
        client_reference?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // format: uuid
        description?: string | null // format: text
        end_date?: string | null // format: date
        end_datetime?: string | null // format: timestamp with time zone
        end_time?: string | null // format: time without time zone
        estimated_handlers?: number | null // format: integer
        event_name?: string // format: text
        event_type?: string | null // format: text
        expected_attendance?: number | null // format: integer
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        internal_reference?: string | null // format: text
        organization_id?: string | null // Note: This is a Foreign Key to `inquest_organizations.id`.<fk table='inquest_organizations' column='id'/> | format: uuid
        postcode?: string | null // format: text
        request_source?: string[] | null // format: text[]
        risk_level?: string | null // format: text
        special_instructions?: string | null // format: text
        special_requirements?: string | null // format: text
        start_date?: string | null // format: date
        start_datetime?: string | null // format: timestamp with time zone
        start_time?: string | null // format: time without time zone
        status?: "LEAD_PLANNING" | "BOOKING_PREPARATION" | "LIVE_OPERATIONS" | "CLOSE_OUT" | "ON_HOLD" | "COMPLETE" | "CANCELLED" | "ARCHIVED" | null // format: public.inquest_event_status
        updated_at?: string | null // format: timestamp with time zone
        venue_address?: string | null // format: text
        venue_name?: string | null // format: text
        }
        Relationships: []
      }
      inquest_feedback: {
        Row: {
        areas_for_improvement: string | null // format: text
        comments: string | null // format: text
        created_at: string | null // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        feedback_type: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        rating: number | null // format: integer
        submitted_at: string | null // format: timestamp with time zone
        submitted_by: string | null // format: uuid
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        areas_for_improvement?: string | null // format: text
        comments?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        feedback_type: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        rating?: number | null // format: integer
        submitted_at?: string | null // format: timestamp with time zone
        submitted_by?: string | null // format: uuid
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        areas_for_improvement?: string | null // format: text
        comments?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        feedback_type?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        rating?: number | null // format: integer
        submitted_at?: string | null // format: timestamp with time zone
        submitted_by?: string | null // format: uuid
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      inquest_files: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        file_name: string // format: text
        file_path: string // format: text
        file_size: number | null // format: integer
        file_type: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        mime_type: string | null // format: text
        uploaded_at: string | null // format: timestamp with time zone
        uploaded_by: string | null // format: uuid
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        file_name: string // format: text
        file_path: string // format: text
        file_size?: number | null // format: integer
        file_type?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        mime_type?: string | null // format: text
        uploaded_at?: string | null // format: timestamp with time zone
        uploaded_by?: string | null // format: uuid
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        file_name?: string // format: text
        file_path?: string // format: text
        file_size?: number | null // format: integer
        file_type?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        mime_type?: string | null // format: text
        uploaded_at?: string | null // format: timestamp with time zone
        uploaded_by?: string | null // format: uuid
        }
        Relationships: []
      }
      inquest_handler_assignments: {
        Row: {
        assigned_at: string | null // format: timestamp with time zone
        assigned_by: string | null // format: uuid
        call_time: string | null // format: time without time zone
        confirmed_at: string | null // format: timestamp with time zone
        created_at: string | null // format: timestamp with time zone
        daily_rate: number | null // format: numeric
        dog_id: string | null // Note: This is a Foreign Key to `inquest_handler_dogs.id`.<fk table='inquest_handler_dogs' column='id'/> | format: uuid
        event_id: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        finish_time: string | null // format: time without time zone
        handler_id: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        hourly_rate: number | null // format: numeric
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes: string | null // format: text
        status: "ASSIGNED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | null // format: public.inquest_assignment_status
        travel_allowance: number | null // format: numeric
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        assigned_at?: string | null // format: timestamp with time zone
        assigned_by?: string | null // format: uuid
        call_time?: string | null // format: time without time zone
        confirmed_at?: string | null // format: timestamp with time zone
        created_at?: string | null // format: timestamp with time zone
        daily_rate?: number | null // format: numeric
        dog_id?: string | null // Note: This is a Foreign Key to `inquest_handler_dogs.id`.<fk table='inquest_handler_dogs' column='id'/> | format: uuid
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        finish_time?: string | null // format: time without time zone
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        hourly_rate?: number | null // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes?: string | null // format: text
        status?: "ASSIGNED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | null // format: public.inquest_assignment_status
        travel_allowance?: number | null // format: numeric
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        assigned_at?: string | null // format: timestamp with time zone
        assigned_by?: string | null // format: uuid
        call_time?: string | null // format: time without time zone
        confirmed_at?: string | null // format: timestamp with time zone
        created_at?: string | null // format: timestamp with time zone
        daily_rate?: number | null // format: numeric
        dog_id?: string | null // Note: This is a Foreign Key to `inquest_handler_dogs.id`.<fk table='inquest_handler_dogs' column='id'/> | format: uuid
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        finish_time?: string | null // format: time without time zone
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        hourly_rate?: number | null // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes?: string | null // format: text
        status?: "ASSIGNED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | null // format: public.inquest_assignment_status
        travel_allowance?: number | null // format: numeric
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      inquest_handler_availability: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        date: string // format: date
        end_time: string | null // format: time without time zone
        handler_id: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes: string | null // format: text
        reason: string | null // format: text
        start_time: string | null // format: time without time zone
        status: string // format: text
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        date: string // format: date
        end_time?: string | null // format: time without time zone
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes?: string | null // format: text
        reason?: string | null // format: text
        start_time?: string | null // format: time without time zone
        status: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        date?: string // format: date
        end_time?: string | null // format: time without time zone
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes?: string | null // format: text
        reason?: string | null // format: text
        start_time?: string | null // format: time without time zone
        status?: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      inquest_handler_dogs: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        detection_specialties: string[] | null // format: text[]
        dog_age: number | null // format: integer
        dog_breed: string | null // format: text
        dog_gender: string | null // format: text
        dog_name: string // format: text
        handler_id: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        health_notes: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active: boolean | null // format: boolean
        is_primary_dog: boolean | null // format: boolean
        last_vaccination_date: string | null // format: date
        microchip_number: string | null // format: text
        next_vaccination_due: string | null // format: date
        training_level: string | null // format: text
        updated_at: string | null // format: timestamp with time zone
        vaccination_status: string | null // format: text
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        detection_specialties?: string[] | null // format: text[]
        dog_age?: number | null // format: integer
        dog_breed?: string | null // format: text
        dog_gender?: string | null // format: text
        dog_name: string // format: text
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        health_notes?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        is_primary_dog?: boolean | null // format: boolean
        last_vaccination_date?: string | null // format: date
        microchip_number?: string | null // format: text
        next_vaccination_due?: string | null // format: date
        training_level?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        vaccination_status?: string | null // format: text
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        detection_specialties?: string[] | null // format: text[]
        dog_age?: number | null // format: integer
        dog_breed?: string | null // format: text
        dog_gender?: string | null // format: text
        dog_name?: string // format: text
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        health_notes?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        is_primary_dog?: boolean | null // format: boolean
        last_vaccination_date?: string | null // format: date
        microchip_number?: string | null // format: text
        next_vaccination_due?: string | null // format: date
        training_level?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        vaccination_status?: string | null // format: text
        }
        Relationships: []
      }
      inquest_handler_feedback: {
        Row: {
        areas_for_improvement: string[] | null // format: text[]
        areas_of_strength: string[] | null // format: text[]
        created_at: string | null // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        feedback_text: string | null // format: text
        feedback_type: string // format: text
        handler_id: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_anonymous: boolean | null // format: boolean
        rating: number | null // format: integer
        submitted_at: string | null // format: timestamp with time zone
        submitted_by: string | null // format: uuid
        would_recommend: boolean | null // format: boolean
        }
        Insert: {
        areas_for_improvement?: string[] | null // format: text[]
        areas_of_strength?: string[] | null // format: text[]
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        feedback_text?: string | null // format: text
        feedback_type: string // format: text
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_anonymous?: boolean | null // format: boolean
        rating?: number | null // format: integer
        submitted_at?: string | null // format: timestamp with time zone
        submitted_by?: string | null // format: uuid
        would_recommend?: boolean | null // format: boolean
        }
        Update: {
        areas_for_improvement?: string[] | null // format: text[]
        areas_of_strength?: string[] | null // format: text[]
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        feedback_text?: string | null // format: text
        feedback_type?: string // format: text
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_anonymous?: boolean | null // format: boolean
        rating?: number | null // format: integer
        submitted_at?: string | null // format: timestamp with time zone
        submitted_by?: string | null // format: uuid
        would_recommend?: boolean | null // format: boolean
        }
        Relationships: []
      }
      inquest_handler_performance: {
        Row: {
        assignment_id: string | null // Note: This is a Foreign Key to `inquest_handler_assignments.id`.<fk table='inquest_handler_assignments' column='id'/> | format: uuid
        created_at: string | null // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        handler_id: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        metric_description: string | null // format: text
        metric_type: string // format: text
        metric_value: number | null // format: numeric
        notes: string | null // format: text
        recorded_at: string | null // format: timestamp with time zone
        recorded_by: string | null // format: uuid
        }
        Insert: {
        assignment_id?: string | null // Note: This is a Foreign Key to `inquest_handler_assignments.id`.<fk table='inquest_handler_assignments' column='id'/> | format: uuid
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        metric_description?: string | null // format: text
        metric_type: string // format: text
        metric_value?: number | null // format: numeric
        notes?: string | null // format: text
        recorded_at?: string | null // format: timestamp with time zone
        recorded_by?: string | null // format: uuid
        }
        Update: {
        assignment_id?: string | null // Note: This is a Foreign Key to `inquest_handler_assignments.id`.<fk table='inquest_handler_assignments' column='id'/> | format: uuid
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        metric_description?: string | null // format: text
        metric_type?: string // format: text
        metric_value?: number | null // format: numeric
        notes?: string | null // format: text
        recorded_at?: string | null // format: timestamp with time zone
        recorded_by?: string | null // format: uuid
        }
        Relationships: []
      }
      inquest_handler_qualifications: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        document_path: string | null // format: text
        expiry_date: string | null // format: date
        handler_id: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        issue_date: string | null // format: date
        issuing_authority: string | null // format: text
        notes: string | null // format: text
        qualification_name: string // format: text
        qualification_number: string | null // format: text
        qualification_type: string // format: text
        status: string | null // format: text
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        document_path?: string | null // format: text
        expiry_date?: string | null // format: date
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        issue_date?: string | null // format: date
        issuing_authority?: string | null // format: text
        notes?: string | null // format: text
        qualification_name: string // format: text
        qualification_number?: string | null // format: text
        qualification_type: string // format: text
        status?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        document_path?: string | null // format: text
        expiry_date?: string | null // format: date
        handler_id?: string | null // Note: This is a Foreign Key to `inquest_handlers.id`.<fk table='inquest_handlers' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        issue_date?: string | null // format: date
        issuing_authority?: string | null // format: text
        notes?: string | null // format: text
        qualification_name?: string // format: text
        qualification_number?: string | null // format: text
        qualification_type?: string // format: text
        status?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      inquest_handlers: {
        Row: {
        address: string | null // format: text
        availability_status: string | null // format: text
        certification_date: string | null // format: date
        certification_expiry: string | null // format: date
        certification_level: string | null // format: text
        completed_assignments: number | null // format: integer
        created_at: string | null // format: timestamp with time zone
        daily_rate: number | null // format: numeric
        dog_age: number | null // format: integer
        dog_breed: string | null // format: text
        dog_name: string | null // format: text
        email: string | null // format: text
        emergency_contact_name: string | null // format: text
        emergency_contact_phone: string | null // format: text
        handler_name: string // format: text
        hourly_rate: number | null // format: numeric
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        insurance_expiry: string | null // format: date
        last_assignment_date: string | null // format: date
        last_training_date: string | null // format: date
        license_expiry: string | null // format: date
        license_number: string | null // format: text
        max_daily_hours: number | null // format: integer
        mobile: string | null // format: text
        notes: string | null // format: text
        performance_rating: number | null // format: numeric
        phone: string | null // format: text
        preferred_work_areas: string[] | null // format: text[]
        skills: string[] | null // format: text[]
        specializations: string[] | null // format: text[]
        status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | null // format: public.inquest_handler_status
        total_assignments: number | null // format: integer
        total_hours_worked: number | null // format: numeric
        training_hours: number | null // format: integer
        travel_radius_km: number | null // format: integer
        travel_rate: number | null // format: numeric
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        address?: string | null // format: text
        availability_status?: string | null // format: text
        certification_date?: string | null // format: date
        certification_expiry?: string | null // format: date
        certification_level?: string | null // format: text
        completed_assignments?: number | null // format: integer
        created_at?: string | null // format: timestamp with time zone
        daily_rate?: number | null // format: numeric
        dog_age?: number | null // format: integer
        dog_breed?: string | null // format: text
        dog_name?: string | null // format: text
        email?: string | null // format: text
        emergency_contact_name?: string | null // format: text
        emergency_contact_phone?: string | null // format: text
        handler_name: string // format: text
        hourly_rate?: number | null // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        insurance_expiry?: string | null // format: date
        last_assignment_date?: string | null // format: date
        last_training_date?: string | null // format: date
        license_expiry?: string | null // format: date
        license_number?: string | null // format: text
        max_daily_hours?: number | null // format: integer
        mobile?: string | null // format: text
        notes?: string | null // format: text
        performance_rating?: number | null // format: numeric
        phone?: string | null // format: text
        preferred_work_areas?: string[] | null // format: text[]
        skills?: string[] | null // format: text[]
        specializations?: string[] | null // format: text[]
        status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | null // format: public.inquest_handler_status
        total_assignments?: number | null // format: integer
        total_hours_worked?: number | null // format: numeric
        training_hours?: number | null // format: integer
        travel_radius_km?: number | null // format: integer
        travel_rate?: number | null // format: numeric
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        address?: string | null // format: text
        availability_status?: string | null // format: text
        certification_date?: string | null // format: date
        certification_expiry?: string | null // format: date
        certification_level?: string | null // format: text
        completed_assignments?: number | null // format: integer
        created_at?: string | null // format: timestamp with time zone
        daily_rate?: number | null // format: numeric
        dog_age?: number | null // format: integer
        dog_breed?: string | null // format: text
        dog_name?: string | null // format: text
        email?: string | null // format: text
        emergency_contact_name?: string | null // format: text
        emergency_contact_phone?: string | null // format: text
        handler_name?: string // format: text
        hourly_rate?: number | null // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        insurance_expiry?: string | null // format: date
        last_assignment_date?: string | null // format: date
        last_training_date?: string | null // format: date
        license_expiry?: string | null // format: date
        license_number?: string | null // format: text
        max_daily_hours?: number | null // format: integer
        mobile?: string | null // format: text
        notes?: string | null // format: text
        performance_rating?: number | null // format: numeric
        phone?: string | null // format: text
        preferred_work_areas?: string[] | null // format: text[]
        skills?: string[] | null // format: text[]
        specializations?: string[] | null // format: text[]
        status?: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | null // format: public.inquest_handler_status
        total_assignments?: number | null // format: integer
        total_hours_worked?: number | null // format: numeric
        training_hours?: number | null // format: integer
        travel_radius_km?: number | null // format: integer
        travel_rate?: number | null // format: numeric
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      inquest_incidents: {
        Row: {
        assigned_to: string | null // format: uuid
        created_at: string | null // format: timestamp with time zone
        description: string | null // format: text
        event_id: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_number: string | null // format: text
        incident_type: string | null // format: text
        location: string | null // format: text
        occurred_at: string | null // format: timestamp with time zone
        priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null // format: public.inquest_priority
        reported_by: string | null // format: uuid
        resolution_notes: string | null // format: text
        resolved_at: string | null // format: timestamp with time zone
        status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | null // format: public.inquest_incident_status
        title: string // format: text
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        assigned_to?: string | null // format: uuid
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_number?: string | null // format: text
        incident_type?: string | null // format: text
        location?: string | null // format: text
        occurred_at?: string | null // format: timestamp with time zone
        priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null // format: public.inquest_priority
        reported_by?: string | null // format: uuid
        resolution_notes?: string | null // format: text
        resolved_at?: string | null // format: timestamp with time zone
        status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | null // format: public.inquest_incident_status
        title: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        assigned_to?: string | null // format: uuid
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_number?: string | null // format: text
        incident_type?: string | null // format: text
        location?: string | null // format: text
        occurred_at?: string | null // format: timestamp with time zone
        priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null // format: public.inquest_priority
        reported_by?: string | null // format: uuid
        resolution_notes?: string | null // format: text
        resolved_at?: string | null // format: timestamp with time zone
        status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | null // format: public.inquest_incident_status
        title?: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      inquest_invoice_items: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        description: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        invoice_id: string | null // Note: This is a Foreign Key to `inquest_invoices.id`.<fk table='inquest_invoices' column='id'/> | format: uuid
        line_total: number // format: numeric
        quantity: number | null // format: numeric
        unit_price: number // format: numeric
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        description: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        invoice_id?: string | null // Note: This is a Foreign Key to `inquest_invoices.id`.<fk table='inquest_invoices' column='id'/> | format: uuid
        line_total: number // format: numeric
        quantity?: number | null // format: numeric
        unit_price: number // format: numeric
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        description?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        invoice_id?: string | null // Note: This is a Foreign Key to `inquest_invoices.id`.<fk table='inquest_invoices' column='id'/> | format: uuid
        line_total?: number // format: numeric
        quantity?: number | null // format: numeric
        unit_price?: number // format: numeric
        }
        Relationships: []
      }
      inquest_invoices: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        created_by: string | null // format: uuid
        due_date: string | null // format: date
        event_id: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        invoice_number: string // format: text
        issue_date: string | null // format: date
        notes: string | null // format: text
        organization_id: string | null // Note: This is a Foreign Key to `inquest_organizations.id`.<fk table='inquest_organizations' column='id'/> | format: uuid
        payment_terms: string | null // format: text
        status: string | null // format: text
        subtotal: number | null // format: numeric
        total_amount: number | null // format: numeric
        updated_at: string | null // format: timestamp with time zone
        vat_amount: number | null // format: numeric
        vat_rate: number | null // format: numeric
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // format: uuid
        due_date?: string | null // format: date
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        invoice_number: string // format: text
        issue_date?: string | null // format: date
        notes?: string | null // format: text
        organization_id?: string | null // Note: This is a Foreign Key to `inquest_organizations.id`.<fk table='inquest_organizations' column='id'/> | format: uuid
        payment_terms?: string | null // format: text
        status?: string | null // format: text
        subtotal?: number | null // format: numeric
        total_amount?: number | null // format: numeric
        updated_at?: string | null // format: timestamp with time zone
        vat_amount?: number | null // format: numeric
        vat_rate?: number | null // format: numeric
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        created_by?: string | null // format: uuid
        due_date?: string | null // format: date
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        invoice_number?: string // format: text
        issue_date?: string | null // format: date
        notes?: string | null // format: text
        organization_id?: string | null // Note: This is a Foreign Key to `inquest_organizations.id`.<fk table='inquest_organizations' column='id'/> | format: uuid
        payment_terms?: string | null // format: text
        status?: string | null // format: text
        subtotal?: number | null // format: numeric
        total_amount?: number | null // format: numeric
        updated_at?: string | null // format: timestamp with time zone
        vat_amount?: number | null // format: numeric
        vat_rate?: number | null // format: numeric
        }
        Relationships: []
      }
      inquest_organizations: {
        Row: {
        address: string | null // format: text
        billing_address: string | null // format: text
        contact_person: string | null // format: text
        created_at: string | null // format: timestamp with time zone
        email: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        notes: string | null // format: text
        phone: string | null // format: text
        updated_at: string | null // format: timestamp with time zone
        vat_number: string | null // format: text
        }
        Insert: {
        address?: string | null // format: text
        billing_address?: string | null // format: text
        contact_person?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        email?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        notes?: string | null // format: text
        phone?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        vat_number?: string | null // format: text
        }
        Update: {
        address?: string | null // format: text
        billing_address?: string | null // format: text
        contact_person?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        email?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name?: string // format: text
        notes?: string | null // format: text
        phone?: string | null // format: text
        updated_at?: string | null // format: timestamp with time zone
        vat_number?: string | null // format: text
        }
        Relationships: []
      }
      inquest_services: {
        Row: {
        base_price: number | null // format: numeric
        created_at: string | null // format: timestamp with time zone
        description: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active: boolean | null // format: boolean
        name: string // format: character varying
        unit_type: string | null // format: character varying
        updated_at: string | null // format: timestamp with time zone
        vat_rate: number | null // format: numeric
        }
        Insert: {
        base_price?: number | null // format: numeric
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        name: string // format: character varying
        unit_type?: string | null // format: character varying
        updated_at?: string | null // format: timestamp with time zone
        vat_rate?: number | null // format: numeric
        }
        Update: {
        base_price?: number | null // format: numeric
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        name?: string // format: character varying
        unit_type?: string | null // format: character varying
        updated_at?: string | null // format: timestamp with time zone
        vat_rate?: number | null // format: numeric
        }
        Relationships: []
      }
      inquest_subtasks: {
        Row: {
        assigned_to: string | null // format: uuid
        automation: Json | null // format: jsonb
        completed_at: string | null // format: timestamp with time zone
        completed_by: string | null // format: uuid
        created_at: string | null // format: timestamp with time zone
        description: string | null // format: text
        document_placeholder: string | null // format: text
        due_date: string | null // format: date
        event_id: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        flag_reason: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_completed: boolean | null // format: boolean
        is_flagged: boolean | null // format: boolean
        is_required: boolean | null // format: boolean
        needs_checkbox: boolean | null // format: boolean
        notes: string | null // format: text
        order_index: number | null // format: integer
        task_group: "LEAD_PLANNING" | "BOOKING_PREPARATION" | "LIVE_OPERATIONS" | "CLOSE_OUT" // format: public.inquest_subtask_group
        title: string // format: text
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        assigned_to?: string | null // format: uuid
        automation?: Json | null // format: jsonb
        completed_at?: string | null // format: timestamp with time zone
        completed_by?: string | null // format: uuid
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        document_placeholder?: string | null // format: text
        due_date?: string | null // format: date
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        flag_reason?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_completed?: boolean | null // format: boolean
        is_flagged?: boolean | null // format: boolean
        is_required?: boolean | null // format: boolean
        needs_checkbox?: boolean | null // format: boolean
        notes?: string | null // format: text
        order_index?: number | null // format: integer
        task_group: "LEAD_PLANNING" | "BOOKING_PREPARATION" | "LIVE_OPERATIONS" | "CLOSE_OUT" // format: public.inquest_subtask_group
        title: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        assigned_to?: string | null // format: uuid
        automation?: Json | null // format: jsonb
        completed_at?: string | null // format: timestamp with time zone
        completed_by?: string | null // format: uuid
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        document_placeholder?: string | null // format: text
        due_date?: string | null // format: date
        event_id?: string | null // Note: This is a Foreign Key to `inquest_events.id`.<fk table='inquest_events' column='id'/> | format: uuid
        flag_reason?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_completed?: boolean | null // format: boolean
        is_flagged?: boolean | null // format: boolean
        is_required?: boolean | null // format: boolean
        needs_checkbox?: boolean | null // format: boolean
        notes?: string | null // format: text
        order_index?: number | null // format: integer
        task_group?: "LEAD_PLANNING" | "BOOKING_PREPARATION" | "LIVE_OPERATIONS" | "CLOSE_OUT" // format: public.inquest_subtask_group
        title?: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      installed_plugins: {
        Row: {
        author: string | null // format: text
        category: string | null // format: text
        config: Json | null // format: jsonb
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        installed_at: string | null // format: timestamp with time zone
        is_active: boolean | null // format: boolean
        name: string // format: text
        permissions: Json | null // format: jsonb
        plugin_id: string // format: text
        updated_at: string | null // format: timestamp with time zone
        version: string // format: text
        }
        Insert: {
        author?: string | null // format: text
        category?: string | null // format: text
        config?: Json | null // format: jsonb
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        installed_at?: string | null // format: timestamp with time zone
        is_active?: boolean | null // format: boolean
        name: string // format: text
        permissions?: Json | null // format: jsonb
        plugin_id: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        version: string // format: text
        }
        Update: {
        author?: string | null // format: text
        category?: string | null // format: text
        config?: Json | null // format: jsonb
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        installed_at?: string | null // format: timestamp with time zone
        is_active?: boolean | null // format: boolean
        name?: string // format: text
        permissions?: Json | null // format: jsonb
        plugin_id?: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        version?: string // format: text
        }
        Relationships: []
      }
      iot_sensors: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_reading: Json | null // format: jsonb
        last_reading_at: string | null // format: timestamp with time zone
        location: Json | null // format: jsonb
        sensor_id: string // format: text
        sensor_type: string // format: text
        status: string | null // format: text
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_reading?: Json | null // format: jsonb
        last_reading_at?: string | null // format: timestamp with time zone
        location?: Json | null // format: jsonb
        sensor_id: string // format: text
        sensor_type: string // format: text
        status?: string | null // format: text
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_reading?: Json | null // format: jsonb
        last_reading_at?: string | null // format: timestamp with time zone
        location?: Json | null // format: jsonb
        sensor_id?: string // format: text
        sensor_type?: string // format: text
        status?: string | null // format: text
        }
        Relationships: []
      }
      lost_found_matches: {
        Row: {
        created_at: string // format: timestamp with time zone
        found_item_id: string // Note: This is a Foreign Key to `found_items.id`.<fk table='found_items' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        lost_item_id: string // Note: This is a Foreign Key to `lost_items.id`.<fk table='lost_items' column='id'/> | format: uuid
        match_score: number | null // format: numeric
        matched_by_profile_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        notes: string | null // format: text
        photo_similarity_score: number | null // format: numeric
        status: string // format: text
        updated_at: string // format: timestamp with time zone
        }
        Insert: {
        created_at?: string // format: timestamp with time zone
        found_item_id: string // Note: This is a Foreign Key to `found_items.id`.<fk table='found_items' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        lost_item_id: string // Note: This is a Foreign Key to `lost_items.id`.<fk table='lost_items' column='id'/> | format: uuid
        match_score?: number | null // format: numeric
        matched_by_profile_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        notes?: string | null // format: text
        photo_similarity_score?: number | null // format: numeric
        status?: string // format: text
        updated_at?: string // format: timestamp with time zone
        }
        Update: {
        created_at?: string // format: timestamp with time zone
        found_item_id?: string // Note: This is a Foreign Key to `found_items.id`.<fk table='found_items' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        lost_item_id?: string // Note: This is a Foreign Key to `lost_items.id`.<fk table='lost_items' column='id'/> | format: uuid
        match_score?: number | null // format: numeric
        matched_by_profile_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        notes?: string | null // format: text
        photo_similarity_score?: number | null // format: numeric
        status?: string // format: text
        updated_at?: string // format: timestamp with time zone
        }
        Relationships: []
      }
      lost_items: {
        Row: {
        contact_email: string | null // format: text
        contact_phone: string | null // format: text
        created_at: string // format: timestamp with time zone
        deleted_at: string | null // format: timestamp with time zone
        description: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        keywords: string[] | null // format: text[]
        location: string | null // format: text
        photo_url: string | null // format: text
        reported_at: string // format: timestamp with time zone
        reported_by_profile_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        reporter_name: string | null // format: text
        retention_expires_at: string | null // format: date
        status: string // format: text
        updated_at: string // format: timestamp with time zone
        }
        Insert: {
        contact_email?: string | null // format: text
        contact_phone?: string | null // format: text
        created_at?: string // format: timestamp with time zone
        deleted_at?: string | null // format: timestamp with time zone
        description: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        keywords?: string[] | null // format: text[]
        location?: string | null // format: text
        photo_url?: string | null // format: text
        reported_at?: string // format: timestamp with time zone
        reported_by_profile_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        reporter_name?: string | null // format: text
        retention_expires_at?: string | null // format: date
        status?: string // format: text
        updated_at?: string // format: timestamp with time zone
        }
        Update: {
        contact_email?: string | null // format: text
        contact_phone?: string | null // format: text
        created_at?: string // format: timestamp with time zone
        deleted_at?: string | null // format: timestamp with time zone
        description?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        keywords?: string[] | null // format: text[]
        location?: string | null // format: text
        photo_url?: string | null // format: text
        reported_at?: string // format: timestamp with time zone
        reported_by_profile_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        reporter_name?: string | null // format: text
        retention_expires_at?: string | null // format: date
        status?: string // format: text
        updated_at?: string // format: timestamp with time zone
        }
        Relationships: []
      }
      maintenance_activities: {
        Row: {
        activity_type: string // format: text
        asset_id: string | null // Note: This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> | format: uuid
        created_at: string // format: timestamp with time zone
        created_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        description: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        metadata: Json | null // format: jsonb
        title: string // format: text
        work_order_id: string | null // Note: This is a Foreign Key to `maintenance_work_orders.id`.<fk table='maintenance_work_orders' column='id'/> | format: uuid
        }
        Insert: {
        activity_type: string // format: text
        asset_id?: string | null // Note: This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> | format: uuid
        created_at?: string // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        metadata?: Json | null // format: jsonb
        title: string // format: text
        work_order_id?: string | null // Note: This is a Foreign Key to `maintenance_work_orders.id`.<fk table='maintenance_work_orders' column='id'/> | format: uuid
        }
        Update: {
        activity_type?: string // format: text
        asset_id?: string | null // Note: This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> | format: uuid
        created_at?: string // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        metadata?: Json | null // format: jsonb
        title?: string // format: text
        work_order_id?: string | null // Note: This is a Foreign Key to `maintenance_work_orders.id`.<fk table='maintenance_work_orders' column='id'/> | format: uuid
        }
        Relationships: []
      }
      maintenance_assets: {
        Row: {
        asset_name: string // format: text
        asset_type: string // format: text
        commissioning_date: string | null // format: timestamp with time zone
        created_at: string // format: timestamp with time zone
        created_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_inspection_date: string | null // format: timestamp with time zone
        lifecycle_stage: string | null // format: text
        location: string | null // format: text
        manufacturer: string | null // format: text
        metadata: Json | null // format: jsonb
        model: string | null // format: text
        next_inspection_due: string | null // format: timestamp with time zone
        notes: string | null // format: text
        purchase_date: string | null // format: date
        serial_number: string | null // format: text
        status: string // format: text
        updated_at: string // format: timestamp with time zone
        updated_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        warranty_expires: string | null // format: date
        }
        Insert: {
        asset_name: string // format: text
        asset_type: string // format: text
        commissioning_date?: string | null // format: timestamp with time zone
        created_at?: string // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_inspection_date?: string | null // format: timestamp with time zone
        lifecycle_stage?: string | null // format: text
        location?: string | null // format: text
        manufacturer?: string | null // format: text
        metadata?: Json | null // format: jsonb
        model?: string | null // format: text
        next_inspection_due?: string | null // format: timestamp with time zone
        notes?: string | null // format: text
        purchase_date?: string | null // format: date
        serial_number?: string | null // format: text
        status?: string // format: text
        updated_at?: string // format: timestamp with time zone
        updated_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        warranty_expires?: string | null // format: date
        }
        Update: {
        asset_name?: string // format: text
        asset_type?: string // format: text
        commissioning_date?: string | null // format: timestamp with time zone
        created_at?: string // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_inspection_date?: string | null // format: timestamp with time zone
        lifecycle_stage?: string | null // format: text
        location?: string | null // format: text
        manufacturer?: string | null // format: text
        metadata?: Json | null // format: jsonb
        model?: string | null // format: text
        next_inspection_due?: string | null // format: timestamp with time zone
        notes?: string | null // format: text
        purchase_date?: string | null // format: date
        serial_number?: string | null // format: text
        status?: string // format: text
        updated_at?: string // format: timestamp with time zone
        updated_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        warranty_expires?: string | null // format: date
        }
        Relationships: []
      }
      maintenance_schedules: {
        Row: {
        asset_id: string | null // Note: This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> | format: uuid
        created_at: string // format: timestamp with time zone
        created_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        description: string | null // format: text
        frequency_days: number // format: integer
        frequency_type: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active: boolean | null // format: boolean
        next_due_date: string | null // format: timestamp with time zone
        schedule_name: string // format: text
        schedule_type: string // format: text
        updated_at: string // format: timestamp with time zone
        webhook_url: string | null // format: text
        }
        Insert: {
        asset_id?: string | null // Note: This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> | format: uuid
        created_at?: string // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        description?: string | null // format: text
        frequency_days: number // format: integer
        frequency_type?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        next_due_date?: string | null // format: timestamp with time zone
        schedule_name: string // format: text
        schedule_type?: string // format: text
        updated_at?: string // format: timestamp with time zone
        webhook_url?: string | null // format: text
        }
        Update: {
        asset_id?: string | null // Note: This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> | format: uuid
        created_at?: string // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        description?: string | null // format: text
        frequency_days?: number // format: integer
        frequency_type?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        next_due_date?: string | null // format: timestamp with time zone
        schedule_name?: string // format: text
        schedule_type?: string // format: text
        updated_at?: string // format: timestamp with time zone
        webhook_url?: string | null // format: text
        }
        Relationships: []
      }
      maintenance_work_orders: {
        Row: {
        actual_cost: number | null // format: numeric
        actual_duration_hours: number | null // format: numeric
        asset_id: string | null // Note: This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> | format: uuid
        assigned_to: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        assigned_vendor_id: string | null // Note: This is a Foreign Key to `vendors.id`.<fk table='vendors' column='id'/> | format: uuid
        completed_at: string | null // format: timestamp with time zone
        completion_notes: string | null // format: text
        cost_estimate: number | null // format: numeric
        created_at: string // format: timestamp with time zone
        created_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        description: string | null // format: text
        due_date: string | null // format: timestamp with time zone
        estimated_duration_hours: number | null // format: numeric
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        priority: string // format: text
        schedule_id: string | null // Note: This is a Foreign Key to `maintenance_schedules.id`.<fk table='maintenance_schedules' column='id'/> | format: uuid
        started_at: string | null // format: timestamp with time zone
        status: string // format: text
        title: string // format: text
        updated_at: string // format: timestamp with time zone
        updated_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        work_order_number: string // format: text
        }
        Insert: {
        actual_cost?: number | null // format: numeric
        actual_duration_hours?: number | null // format: numeric
        asset_id?: string | null // Note: This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> | format: uuid
        assigned_to?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        assigned_vendor_id?: string | null // Note: This is a Foreign Key to `vendors.id`.<fk table='vendors' column='id'/> | format: uuid
        completed_at?: string | null // format: timestamp with time zone
        completion_notes?: string | null // format: text
        cost_estimate?: number | null // format: numeric
        created_at?: string // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        description?: string | null // format: text
        due_date?: string | null // format: timestamp with time zone
        estimated_duration_hours?: number | null // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        priority?: string // format: text
        schedule_id?: string | null // Note: This is a Foreign Key to `maintenance_schedules.id`.<fk table='maintenance_schedules' column='id'/> | format: uuid
        started_at?: string | null // format: timestamp with time zone
        status?: string // format: text
        title: string // format: text
        updated_at?: string // format: timestamp with time zone
        updated_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        work_order_number: string // format: text
        }
        Update: {
        actual_cost?: number | null // format: numeric
        actual_duration_hours?: number | null // format: numeric
        asset_id?: string | null // Note: This is a Foreign Key to `maintenance_assets.id`.<fk table='maintenance_assets' column='id'/> | format: uuid
        assigned_to?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        assigned_vendor_id?: string | null // Note: This is a Foreign Key to `vendors.id`.<fk table='vendors' column='id'/> | format: uuid
        completed_at?: string | null // format: timestamp with time zone
        completion_notes?: string | null // format: text
        cost_estimate?: number | null // format: numeric
        created_at?: string // format: timestamp with time zone
        created_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        description?: string | null // format: text
        due_date?: string | null // format: timestamp with time zone
        estimated_duration_hours?: number | null // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        priority?: string // format: text
        schedule_id?: string | null // Note: This is a Foreign Key to `maintenance_schedules.id`.<fk table='maintenance_schedules' column='id'/> | format: uuid
        started_at?: string | null // format: timestamp with time zone
        status?: string // format: text
        title?: string // format: text
        updated_at?: string // format: timestamp with time zone
        updated_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        work_order_number?: string // format: text
        }
        Relationships: []
      }
      ml_models: {
        Row: {
        accuracy: number | null // format: numeric
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active: boolean | null // format: boolean
        model_type: string // format: text
        name: string // format: text
        parameters: Json | null // format: jsonb
        trained_at: string | null // format: timestamp with time zone
        training_data_size: number | null // format: integer
        }
        Insert: {
        accuracy?: number | null // format: numeric
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        model_type: string // format: text
        name: string // format: text
        parameters?: Json | null // format: jsonb
        trained_at?: string | null // format: timestamp with time zone
        training_data_size?: number | null // format: integer
        }
        Update: {
        accuracy?: number | null // format: numeric
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        model_type?: string // format: text
        name?: string // format: text
        parameters?: Json | null // format: jsonb
        trained_at?: string | null // format: timestamp with time zone
        training_data_size?: number | null // format: integer
        }
        Relationships: []
      }
      ml_predictions: {
        Row: {
        confidence: number | null // format: numeric
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id: string | null // format: uuid
        model_id: string | null // Note: This is a Foreign Key to `ml_models.id`.<fk table='ml_models' column='id'/> | format: uuid
        predicted_at: string | null // format: timestamp with time zone
        prediction: Json // format: jsonb
        was_correct: boolean | null // format: boolean
        }
        Insert: {
        confidence?: number | null // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id?: string | null // format: uuid
        model_id?: string | null // Note: This is a Foreign Key to `ml_models.id`.<fk table='ml_models' column='id'/> | format: uuid
        predicted_at?: string | null // format: timestamp with time zone
        prediction: Json // format: jsonb
        was_correct?: boolean | null // format: boolean
        }
        Update: {
        confidence?: number | null // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id?: string | null // format: uuid
        model_id?: string | null // Note: This is a Foreign Key to `ml_models.id`.<fk table='ml_models' column='id'/> | format: uuid
        predicted_at?: string | null // format: timestamp with time zone
        prediction?: Json // format: jsonb
        was_correct?: boolean | null // format: boolean
        }
        Relationships: []
      }
      music_events: {
        Row: {
        artist_name: string | null // format: text
        created_at: string | null // format: text
        created_by: string | null // format: uuid
        curfew_time: string | null // format: text
        description: string | null // format: text
        doors_open_time: string | null // format: text
        end_datetime: string // format: text
        event_end_time: string | null // format: text
        event_manager_contact: Json | null // format: jsonb
        event_manager_name: string | null // format: text
        event_name: string // format: text
        event_type: string // format: text
        expected_attendance: number | null // format: integer
        id: string // format: uuid
        is_current: boolean | null // format: boolean
        main_act_times: string[] | null // format: text[]
        start_datetime: string // format: text
        support_act_times: Json | null // format: jsonb
        updated_at: string | null // format: text
        venue_address: string // format: text
        venue_name: string // format: text
        venue_opening_time: string | null // format: text
        }
        Insert: {
        artist_name?: string | null // format: text
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        curfew_time?: string | null // format: text
        description?: string | null // format: text
        doors_open_time?: string | null // format: text
        end_datetime: string // format: text
        event_end_time?: string | null // format: text
        event_manager_contact?: Json | null // format: jsonb
        event_manager_name?: string | null // format: text
        event_name: string // format: text
        event_type: string // format: text
        expected_attendance?: number | null // format: integer
        id?: string // format: uuid
        is_current?: boolean | null // format: boolean
        main_act_times?: string[] | null // format: text[]
        start_datetime: string // format: text
        support_act_times?: Json | null // format: jsonb
        updated_at?: string | null // format: text
        venue_address: string // format: text
        venue_name: string // format: text
        venue_opening_time?: string | null // format: text
        }
        Update: {
        artist_name?: string | null // format: text
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        curfew_time?: string | null // format: text
        description?: string | null // format: text
        doors_open_time?: string | null // format: text
        end_datetime?: string // format: text
        event_end_time?: string | null // format: text
        event_manager_contact?: Json | null // format: jsonb
        event_manager_name?: string | null // format: text
        event_name?: string // format: text
        event_type?: string // format: text
        expected_attendance?: number | null // format: integer
        id?: string // format: uuid
        is_current?: boolean | null // format: boolean
        main_act_times?: string[] | null // format: text[]
        start_datetime?: string // format: text
        support_act_times?: Json | null // format: jsonb
        updated_at?: string | null // format: text
        venue_address?: string // format: text
        venue_name?: string // format: text
        venue_opening_time?: string | null // format: text
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
        body: string | null // format: text
        data: Json | null // format: jsonb
        delivered_at: string | null // format: timestamp with time zone
        error_message: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        max_retries: number | null // format: integer
        retry_count: number | null // format: integer
        sent_at: string | null // format: timestamp with time zone
        status: string // format: character varying
        subscription_id: string | null // Note: This is a Foreign Key to `push_subscriptions.id`.<fk table='push_subscriptions' column='id'/> | format: uuid
        title: string // format: text
        user_id: string // format: uuid
        }
        Insert: {
        body?: string | null // format: text
        data?: Json | null // format: jsonb
        delivered_at?: string | null // format: timestamp with time zone
        error_message?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        max_retries?: number | null // format: integer
        retry_count?: number | null // format: integer
        sent_at?: string | null // format: timestamp with time zone
        status?: string // format: character varying
        subscription_id?: string | null // Note: This is a Foreign Key to `push_subscriptions.id`.<fk table='push_subscriptions' column='id'/> | format: uuid
        title: string // format: text
        user_id: string // format: uuid
        }
        Update: {
        body?: string | null // format: text
        data?: Json | null // format: jsonb
        delivered_at?: string | null // format: timestamp with time zone
        error_message?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        max_retries?: number | null // format: integer
        retry_count?: number | null // format: integer
        sent_at?: string | null // format: timestamp with time zone
        status?: string // format: character varying
        subscription_id?: string | null // Note: This is a Foreign Key to `push_subscriptions.id`.<fk table='push_subscriptions' column='id'/> | format: uuid
        title?: string // format: text
        user_id?: string // format: uuid
        }
        Relationships: []
      }
      parade_events: {
        Row: {
        assembly_point: string | null // format: text
        created_at: string | null // format: text
        created_by: string | null // format: uuid
        deployment_plan: string | null // format: text
        description: string | null // format: text
        dispersal_point: string | null // format: text
        documents: unknown[] | null // format: jsonb[]
        emergency_access_points: unknown[] | null // format: jsonb[]
        end_datetime: string // format: text
        event_manager_contact: Json | null // format: jsonb
        event_manager_name: string | null // format: text
        event_name: string // format: text
        event_type: string // format: text
        expected_attendance: number | null // format: integer
        first_aid_stations: unknown[] | null // format: jsonb[]
        float_details: unknown[] | null // format: jsonb[]
        id: string // format: uuid
        is_current: boolean | null // format: boolean
        marshal_points: unknown[] | null // format: jsonb[]
        other_contacts: unknown[] | null // format: jsonb[]
        participant_groups: unknown[] | null // format: jsonb[]
        police_liaison_contact: Json | null // format: jsonb
        public_transport_impact: string | null // format: text
        resident_notification_plan: string | null // format: text
        road_closure_times: unknown[] | null // format: jsonb[]
        route_length: number | null // format: numeric
        route_map: Json | null // format: jsonb
        security_staff_required: Json | null // format: jsonb
        security_supervisor_contact: Json | null // format: jsonb
        security_supervisor_name: string | null // format: text
        special_instructions: string | null // format: text
        start_datetime: string // format: text
        traffic_management_plan: string | null // format: text
        updated_at: string | null // format: text
        venue_address: string // format: text
        venue_contact: Json | null // format: jsonb
        venue_name: string // format: text
        website: string | null // format: text
        }
        Insert: {
        assembly_point?: string | null // format: text
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        deployment_plan?: string | null // format: text
        description?: string | null // format: text
        dispersal_point?: string | null // format: text
        documents?: unknown[] | null // format: jsonb[]
        emergency_access_points?: unknown[] | null // format: jsonb[]
        end_datetime: string // format: text
        event_manager_contact?: Json | null // format: jsonb
        event_manager_name?: string | null // format: text
        event_name: string // format: text
        event_type: string // format: text
        expected_attendance?: number | null // format: integer
        first_aid_stations?: unknown[] | null // format: jsonb[]
        float_details?: unknown[] | null // format: jsonb[]
        id?: string // format: uuid
        is_current?: boolean | null // format: boolean
        marshal_points?: unknown[] | null // format: jsonb[]
        other_contacts?: unknown[] | null // format: jsonb[]
        participant_groups?: unknown[] | null // format: jsonb[]
        police_liaison_contact?: Json | null // format: jsonb
        public_transport_impact?: string | null // format: text
        resident_notification_plan?: string | null // format: text
        road_closure_times?: unknown[] | null // format: jsonb[]
        route_length?: number | null // format: numeric
        route_map?: Json | null // format: jsonb
        security_staff_required?: Json | null // format: jsonb
        security_supervisor_contact?: Json | null // format: jsonb
        security_supervisor_name?: string | null // format: text
        special_instructions?: string | null // format: text
        start_datetime: string // format: text
        traffic_management_plan?: string | null // format: text
        updated_at?: string | null // format: text
        venue_address: string // format: text
        venue_contact?: Json | null // format: jsonb
        venue_name: string // format: text
        website?: string | null // format: text
        }
        Update: {
        assembly_point?: string | null // format: text
        created_at?: string | null // format: text
        created_by?: string | null // format: uuid
        deployment_plan?: string | null // format: text
        description?: string | null // format: text
        dispersal_point?: string | null // format: text
        documents?: unknown[] | null // format: jsonb[]
        emergency_access_points?: unknown[] | null // format: jsonb[]
        end_datetime?: string // format: text
        event_manager_contact?: Json | null // format: jsonb
        event_manager_name?: string | null // format: text
        event_name?: string // format: text
        event_type?: string // format: text
        expected_attendance?: number | null // format: integer
        first_aid_stations?: unknown[] | null // format: jsonb[]
        float_details?: unknown[] | null // format: jsonb[]
        id?: string // format: uuid
        is_current?: boolean | null // format: boolean
        marshal_points?: unknown[] | null // format: jsonb[]
        other_contacts?: unknown[] | null // format: jsonb[]
        participant_groups?: unknown[] | null // format: jsonb[]
        police_liaison_contact?: Json | null // format: jsonb
        public_transport_impact?: string | null // format: text
        resident_notification_plan?: string | null // format: text
        road_closure_times?: unknown[] | null // format: jsonb[]
        route_length?: number | null // format: numeric
        route_map?: Json | null // format: jsonb
        security_staff_required?: Json | null // format: jsonb
        security_supervisor_contact?: Json | null // format: jsonb
        security_supervisor_name?: string | null // format: text
        special_instructions?: string | null // format: text
        start_datetime?: string // format: text
        traffic_management_plan?: string | null // format: text
        updated_at?: string | null // format: text
        venue_address?: string // format: text
        venue_contact?: Json | null // format: jsonb
        venue_name?: string // format: text
        website?: string | null // format: text
        }
        Relationships: []
      }
      pattern_analyses: {
        Row: {
        analysis_data: Json // format: jsonb
        analyzed_at: string | null // format: timestamp with time zone
        analyzed_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        provider_used: string | null // format: character varying
        }
        Insert: {
        analysis_data: Json // format: jsonb
        analyzed_at?: string | null // format: timestamp with time zone
        analyzed_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        provider_used?: string | null // format: character varying
        }
        Update: {
        analysis_data?: Json // format: jsonb
        analyzed_at?: string | null // format: timestamp with time zone
        analyzed_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        event_id?: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        provider_used?: string | null // format: character varying
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
        created_at: string // format: timestamp with time zone
        duration: number // format: numeric
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        metadata: Json | null // format: jsonb
        metric_id: string // format: text
        name: string // format: text
        session_id: string | null // format: text
        timestamp: string // format: timestamp with time zone
        type: string // format: text
        user_id: string | null // format: uuid
        }
        Insert: {
        created_at?: string // format: timestamp with time zone
        duration: number // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        metadata?: Json | null // format: jsonb
        metric_id: string // format: text
        name: string // format: text
        session_id?: string | null // format: text
        timestamp?: string // format: timestamp with time zone
        type: string // format: text
        user_id?: string | null // format: uuid
        }
        Update: {
        created_at?: string // format: timestamp with time zone
        duration?: number // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        metadata?: Json | null // format: jsonb
        metric_id?: string // format: text
        name?: string // format: text
        session_id?: string | null // format: text
        timestamp?: string // format: timestamp with time zone
        type?: string // format: text
        user_id?: string | null // format: uuid
        }
        Relationships: []
      }
      plugin_events: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        event_data: Json | null // format: jsonb
        event_type: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        plugin_id: string | null // Note: This is a Foreign Key to `installed_plugins.id`.<fk table='installed_plugins' column='id'/> | format: uuid
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        event_data?: Json | null // format: jsonb
        event_type: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        plugin_id?: string | null // Note: This is a Foreign Key to `installed_plugins.id`.<fk table='installed_plugins' column='id'/> | format: uuid
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        event_data?: Json | null // format: jsonb
        event_type?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        plugin_id?: string | null // Note: This is a Foreign Key to `installed_plugins.id`.<fk table='installed_plugins' column='id'/> | format: uuid
        }
        Relationships: []
      }
      position_assignments: {
        Row: {
        assigned_at: string | null // format: timestamp with time zone
        assigned_by: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        callsign: string // format: text
        created_at: string | null // format: timestamp with time zone
        department: string // format: text
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        position_id: string // format: text
        position_name: string // format: text
        staff_id: string // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        }
        Insert: {
        assigned_at?: string | null // format: timestamp with time zone
        assigned_by?: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        callsign: string // format: text
        created_at?: string | null // format: timestamp with time zone
        department: string // format: text
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        position_id: string // format: text
        position_name: string // format: text
        staff_id: string // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        }
        Update: {
        assigned_at?: string | null // format: timestamp with time zone
        assigned_by?: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        callsign?: string // format: text
        created_at?: string | null // format: timestamp with time zone
        department?: string // format: text
        event_id?: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        position_id?: string // format: text
        position_name?: string // format: text
        staff_id?: string // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        }
        Relationships: []
      }
      positioning_beacons: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active: boolean | null // format: boolean
        location: Json // format: jsonb
        major: number // format: integer
        minor: number // format: integer
        uuid: string // format: text
        venue_id: string | null // Note: This is a Foreign Key to `venue_3d_models.id`.<fk table='venue_3d_models' column='id'/> | format: uuid
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        location: Json // format: jsonb
        major: number // format: integer
        minor: number // format: integer
        uuid: string // format: text
        venue_id?: string | null // Note: This is a Foreign Key to `venue_3d_models.id`.<fk table='venue_3d_models' column='id'/> | format: uuid
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_active?: boolean | null // format: boolean
        location?: Json // format: jsonb
        major?: number // format: integer
        minor?: number // format: integer
        uuid?: string // format: text
        venue_id?: string | null // Note: This is a Foreign Key to `venue_3d_models.id`.<fk table='venue_3d_models' column='id'/> | format: uuid
        }
        Relationships: []
      }
      predictive_forecasts: {
        Row: {
        confidence: number | null // format: numeric
        created_at: string | null // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        forecast_data: Json // format: jsonb
        forecast_type: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        valid_from: string | null // format: timestamp with time zone
        valid_until: string | null // format: timestamp with time zone
        }
        Insert: {
        confidence?: number | null // format: numeric
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        forecast_data: Json // format: jsonb
        forecast_type: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        valid_from?: string | null // format: timestamp with time zone
        valid_until?: string | null // format: timestamp with time zone
        }
        Update: {
        confidence?: number | null // format: numeric
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        forecast_data?: Json // format: jsonb
        forecast_type?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        valid_from?: string | null // format: timestamp with time zone
        valid_until?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      profiles: {
        Row: {
        active_assignments: number | null // format: integer
        avatar_url: string | null // format: text
        callsign: string | null // format: text
        company: string // format: text
        company_id: string | null // format: uuid
        created_at: string | null // format: timestamp with time zone
        email: string | null // format: text
        experience_level: string | null // format: text
        full_name: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        previous_events: string[] | null // format: text[]
        role: string | null // format: text
        skill_tags: string[] | null // format: text[]
        staff_role: string | null // format: text
        }
        Insert: {
        active_assignments?: number | null // format: integer
        avatar_url?: string | null // format: text
        callsign?: string | null // format: text
        company: string // format: text
        company_id?: string | null // format: uuid
        created_at?: string | null // format: timestamp with time zone
        email?: string | null // format: text
        experience_level?: string | null // format: text
        full_name?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        previous_events?: string[] | null // format: text[]
        role?: string | null // format: text
        skill_tags?: string[] | null // format: text[]
        staff_role?: string | null // format: text
        }
        Update: {
        active_assignments?: number | null // format: integer
        avatar_url?: string | null // format: text
        callsign?: string | null // format: text
        company?: string // format: text
        company_id?: string | null // format: uuid
        created_at?: string | null // format: timestamp with time zone
        email?: string | null // format: text
        experience_level?: string | null // format: text
        full_name?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        previous_events?: string[] | null // format: text[]
        role?: string | null // format: text
        skill_tags?: string[] | null // format: text[]
        staff_role?: string | null // format: text
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
        active: boolean | null // format: boolean
        auth: string // format: text
        browser: string | null // format: character varying
        created_at: string | null // format: timestamp with time zone
        device_type: string | null // format: character varying
        endpoint: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_used: string | null // format: timestamp with time zone
        p256dh: string // format: text
        updated_at: string | null // format: timestamp with time zone
        user_agent: string | null // format: text
        user_id: string // format: uuid
        }
        Insert: {
        active?: boolean | null // format: boolean
        auth: string // format: text
        browser?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        device_type?: string | null // format: character varying
        endpoint: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_used?: string | null // format: timestamp with time zone
        p256dh: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        user_agent?: string | null // format: text
        user_id: string // format: uuid
        }
        Update: {
        active?: boolean | null // format: boolean
        auth?: string // format: text
        browser?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        device_type?: string | null // format: character varying
        endpoint?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_used?: string | null // format: timestamp with time zone
        p256dh?: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        user_agent?: string | null // format: text
        user_id?: string // format: uuid
        }
        Relationships: []
      }
      radio_inventory: {
        Row: {
        condition: string | null // format: character varying
        created_at: string | null // format: timestamp with time zone
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        last_maintenance: string | null // format: date
        model: string | null // format: character varying
        next_maintenance_due: string | null // format: date
        notes: string | null // format: text
        purchase_date: string | null // format: date
        radio_number: string // format: character varying
        serial_number: string | null // format: character varying
        status: string | null // format: character varying
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        condition?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        last_maintenance?: string | null // format: date
        model?: string | null // format: character varying
        next_maintenance_due?: string | null // format: date
        notes?: string | null // format: text
        purchase_date?: string | null // format: date
        radio_number: string // format: character varying
        serial_number?: string | null // format: character varying
        status?: string | null // format: character varying
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        condition?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        last_maintenance?: string | null // format: date
        model?: string | null // format: character varying
        next_maintenance_due?: string | null // format: date
        notes?: string | null // format: text
        purchase_date?: string | null // format: date
        radio_number?: string // format: character varying
        serial_number?: string | null // format: character varying
        status?: string | null // format: character varying
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      radio_messages: {
        Row: {
        channel: string // format: text
        from_callsign: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        message: string // format: text
        priority: string | null // format: text
        transmitted_at: string | null // format: timestamp with time zone
        }
        Insert: {
        channel: string // format: text
        from_callsign: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        message: string // format: text
        priority?: string | null // format: text
        transmitted_at?: string | null // format: timestamp with time zone
        }
        Update: {
        channel?: string // format: text
        from_callsign?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        message?: string // format: text
        priority?: string | null // format: text
        transmitted_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      radio_signouts: {
        Row: {
        condition_on_return: string | null // format: character varying
        created_at: string | null // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        overdue_notified_at: string | null // format: timestamp with time zone
        radio_number: string // format: character varying
        signed_in_at: string | null // format: timestamp with time zone
        signed_in_notes: string | null // format: text
        signed_in_signature: string | null // format: text
        signed_out_at: string | null // format: timestamp with time zone
        signed_out_notes: string | null // format: text
        signed_out_signature: string // format: text
        status: string | null // format: character varying
        updated_at: string | null // format: timestamp with time zone
        user_id: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Insert: {
        condition_on_return?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        overdue_notified_at?: string | null // format: timestamp with time zone
        radio_number: string // format: character varying
        signed_in_at?: string | null // format: timestamp with time zone
        signed_in_notes?: string | null // format: text
        signed_in_signature?: string | null // format: text
        signed_out_at?: string | null // format: timestamp with time zone
        signed_out_notes?: string | null // format: text
        signed_out_signature: string // format: text
        status?: string | null // format: character varying
        updated_at?: string | null // format: timestamp with time zone
        user_id: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Update: {
        condition_on_return?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        overdue_notified_at?: string | null // format: timestamp with time zone
        radio_number?: string // format: character varying
        signed_in_at?: string | null // format: timestamp with time zone
        signed_in_notes?: string | null // format: text
        signed_in_signature?: string | null // format: text
        signed_out_at?: string | null // format: timestamp with time zone
        signed_out_notes?: string | null // format: text
        signed_out_signature?: string // format: text
        status?: string | null // format: character varying
        updated_at?: string | null // format: timestamp with time zone
        user_id?: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
        clicked_result: string | null // format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        query: string // format: text
        results_count: number | null // format: integer
        searched_at: string | null // format: timestamp with time zone
        user_id: string | null // format: uuid
        }
        Insert: {
        clicked_result?: string | null // format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        query: string // format: text
        results_count?: number | null // format: integer
        searched_at?: string | null // format: timestamp with time zone
        user_id?: string | null // format: uuid
        }
        Update: {
        clicked_result?: string | null // format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        query?: string // format: text
        results_count?: number | null // format: integer
        searched_at?: string | null // format: timestamp with time zone
        user_id?: string | null // format: uuid
        }
        Relationships: []
      }
      sensor_readings: {
        Row: {
        alert_triggered: boolean | null // format: boolean
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        reading_data: Json | null // format: jsonb
        reading_value: number | null // format: numeric
        recorded_at: string | null // format: timestamp with time zone
        sensor_id: string | null // Note: This is a Foreign Key to `iot_sensors.id`.<fk table='iot_sensors' column='id'/> | format: uuid
        }
        Insert: {
        alert_triggered?: boolean | null // format: boolean
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        reading_data?: Json | null // format: jsonb
        reading_value?: number | null // format: numeric
        recorded_at?: string | null // format: timestamp with time zone
        sensor_id?: string | null // Note: This is a Foreign Key to `iot_sensors.id`.<fk table='iot_sensors' column='id'/> | format: uuid
        }
        Update: {
        alert_triggered?: boolean | null // format: boolean
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        reading_data?: Json | null // format: jsonb
        reading_value?: number | null // format: numeric
        recorded_at?: string | null // format: timestamp with time zone
        sensor_id?: string | null // Note: This is a Foreign Key to `iot_sensors.id`.<fk table='iot_sensors' column='id'/> | format: uuid
        }
        Relationships: []
      }
      smart_collections: {
        Row: {
        auto_update: boolean | null // format: boolean
        created_at: string | null // format: timestamp with time zone
        filters: Json // format: jsonb
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        updated_at: string | null // format: timestamp with time zone
        user_id: string // format: uuid
        }
        Insert: {
        auto_update?: boolean | null // format: boolean
        created_at?: string | null // format: timestamp with time zone
        filters: Json // format: jsonb
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        user_id: string // format: uuid
        }
        Update: {
        auto_update?: boolean | null // format: boolean
        created_at?: string | null // format: timestamp with time zone
        filters?: Json // format: jsonb
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name?: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        user_id?: string // format: uuid
        }
        Relationships: []
      }
      sms_messages: {
        Row: {
        direction: string // format: text
        from_number: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        message: string // format: text
        sent_at: string | null // format: timestamp with time zone
        status: string | null // format: text
        to_number: string // format: text
        }
        Insert: {
        direction: string // format: text
        from_number: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        message: string // format: text
        sent_at?: string | null // format: timestamp with time zone
        status?: string | null // format: text
        to_number: string // format: text
        }
        Update: {
        direction?: string // format: text
        from_number?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        message?: string // format: text
        sent_at?: string | null // format: timestamp with time zone
        status?: string | null // format: text
        to_number?: string // format: text
        }
        Relationships: []
      }
      social_media_monitoring: {
        Row: {
        author: string | null // format: text
        content: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        monitored_at: string | null // format: timestamp with time zone
        platform: string // format: text
        post_id: string // format: text
        posted_at: string | null // format: timestamp with time zone
        requires_action: boolean | null // format: boolean
        sentiment: string | null // format: text
        }
        Insert: {
        author?: string | null // format: text
        content: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        monitored_at?: string | null // format: timestamp with time zone
        platform: string // format: text
        post_id: string // format: text
        posted_at?: string | null // format: timestamp with time zone
        requires_action?: boolean | null // format: boolean
        sentiment?: string | null // format: text
        }
        Update: {
        author?: string | null // format: text
        content?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        monitored_at?: string | null // format: timestamp with time zone
        platform?: string // format: text
        post_id?: string // format: text
        posted_at?: string | null // format: timestamp with time zone
        requires_action?: boolean | null // format: boolean
        sentiment?: string | null // format: text
        }
        Relationships: []
      }
      staff: {
        Row: {
        active: boolean | null // format: boolean
        availability_status: string | null // format: character varying
        company_id: string // Note: This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> | format: uuid
        contact_number: string | null // format: text
        created_at: string | null // format: timestamp with time zone
        current_location: Json | null // format: jsonb
        email: string | null // format: text
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        full_name: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        max_assignments: number | null // format: integer
        notes: string | null // format: text
        profile_photo_url: string | null // format: text
        skill_tags: string[] | null // format: text[]
        }
        Insert: {
        active?: boolean | null // format: boolean
        availability_status?: string | null // format: character varying
        company_id: string // Note: This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> | format: uuid
        contact_number?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        current_location?: Json | null // format: jsonb
        email?: string | null // format: text
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        full_name: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        max_assignments?: number | null // format: integer
        notes?: string | null // format: text
        profile_photo_url?: string | null // format: text
        skill_tags?: string[] | null // format: text[]
        }
        Update: {
        active?: boolean | null // format: boolean
        availability_status?: string | null // format: character varying
        company_id?: string // Note: This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> | format: uuid
        contact_number?: string | null // format: text
        created_at?: string | null // format: timestamp with time zone
        current_location?: Json | null // format: jsonb
        email?: string | null // format: text
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        full_name?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        max_assignments?: number | null // format: integer
        notes?: string | null // format: text
        profile_photo_url?: string | null // format: text
        skill_tags?: string[] | null // format: text[]
        }
        Relationships: []
      }
      staff_assignments: {
        Row: {
        assigned_at: string | null // format: timestamp with time zone
        assigned_by: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        assignment_notes: string | null // format: text
        assignment_type: string | null // format: character varying
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        staff_id: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        unassigned_at: string | null // format: timestamp with time zone
        }
        Insert: {
        assigned_at?: string | null // format: timestamp with time zone
        assigned_by?: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        assignment_notes?: string | null // format: text
        assignment_type?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        staff_id?: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        unassigned_at?: string | null // format: timestamp with time zone
        }
        Update: {
        assigned_at?: string | null // format: timestamp with time zone
        assigned_by?: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        assignment_notes?: string | null // format: text
        assignment_type?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        incident_id?: number | null // Note: This is a Foreign Key to `incident_logs.id`.<fk table='incident_logs' column='id'/> | format: integer
        staff_id?: string | null // Note: This is a Foreign Key to `staff.id`.<fk table='staff' column='id'/> | format: uuid
        unassigned_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      staff_availability: {
        Row: {
        availability_reason: string | null // format: character varying
        created_at: string | null // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        is_available: boolean | null // format: boolean
        last_status_change: string | null // format: timestamp with time zone
        profile_id: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        shift_end: string | null // format: timestamp with time zone
        shift_start: string | null // format: timestamp with time zone
        }
        Insert: {
        availability_reason?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        is_available?: boolean | null // format: boolean
        last_status_change?: string | null // format: timestamp with time zone
        profile_id: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        shift_end?: string | null // format: timestamp with time zone
        shift_start?: string | null // format: timestamp with time zone
        }
        Update: {
        availability_reason?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        is_available?: boolean | null // format: boolean
        last_status_change?: string | null // format: timestamp with time zone
        profile_id?: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        shift_end?: string | null // format: timestamp with time zone
        shift_start?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      staff_performance: {
        Row: {
        avg_response_time_minutes: number | null // format: numeric
        calculated_at: string | null // format: timestamp with time zone
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        incidents_handled: number | null // format: integer
        log_quality_score: number | null // format: integer
        performance_score: number | null // format: integer
        profile_id: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        resolution_rate: number | null // format: numeric
        supervisor_notes: string | null // format: text
        supervisor_rating: number | null // format: integer
        }
        Insert: {
        avg_response_time_minutes?: number | null // format: numeric
        calculated_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incidents_handled?: number | null // format: integer
        log_quality_score?: number | null // format: integer
        performance_score?: number | null // format: integer
        profile_id: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        resolution_rate?: number | null // format: numeric
        supervisor_notes?: string | null // format: text
        supervisor_rating?: number | null // format: integer
        }
        Update: {
        avg_response_time_minutes?: number | null // format: numeric
        calculated_at?: string | null // format: timestamp with time zone
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        incidents_handled?: number | null // format: integer
        log_quality_score?: number | null // format: integer
        performance_score?: number | null // format: integer
        profile_id?: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        resolution_rate?: number | null // format: numeric
        supervisor_notes?: string | null // format: text
        supervisor_rating?: number | null // format: integer
        }
        Relationships: []
      }
      staff_skills: {
        Row: {
        certification_date: string | null // format: date
        certification_number: string | null // format: character varying
        created_at: string | null // format: timestamp with time zone
        expiry_date: string | null // format: date
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        issuing_authority: string | null // format: character varying
        notes: string | null // format: text
        profile_id: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        skill_name: string // format: character varying
        updated_at: string | null // format: timestamp with time zone
        verified: boolean | null // format: boolean
        verified_at: string | null // format: timestamp with time zone
        verified_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Insert: {
        certification_date?: string | null // format: date
        certification_number?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        expiry_date?: string | null // format: date
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        issuing_authority?: string | null // format: character varying
        notes?: string | null // format: text
        profile_id: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        skill_name: string // format: character varying
        updated_at?: string | null // format: timestamp with time zone
        verified?: boolean | null // format: boolean
        verified_at?: string | null // format: timestamp with time zone
        verified_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Update: {
        certification_date?: string | null // format: date
        certification_number?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        expiry_date?: string | null // format: date
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        issuing_authority?: string | null // format: character varying
        notes?: string | null // format: text
        profile_id?: string // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        skill_name?: string // format: character varying
        updated_at?: string | null // format: timestamp with time zone
        verified?: boolean | null // format: boolean
        verified_at?: string | null // format: timestamp with time zone
        verified_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Relationships: []
      }
      subscription_costs: {
        Row: {
        billing_period: string | null // format: character varying
        cost: number // format: numeric
        created_at: string | null // format: timestamp with time zone
        description: string | null // format: text
        end_date: string | null // format: date
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        service_name: string // format: character varying
        start_date: string // format: date
        }
        Insert: {
        billing_period?: string | null // format: character varying
        cost: number // format: numeric
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        end_date?: string | null // format: date
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        service_name: string // format: character varying
        start_date: string // format: date
        }
        Update: {
        billing_period?: string | null // format: character varying
        cost?: number // format: numeric
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        end_date?: string | null // format: date
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        service_name?: string // format: character varying
        start_date?: string // format: date
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
        billing_period: string // format: text
        company_id: string | null // Note: This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> | format: uuid
        cost: number // format: numeric
        created_at: string | null // format: timestamp with time zone
        description: string | null // format: text
        end_date: string | null // format: date
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        service_name: string // format: text
        start_date: string // format: date
        }
        Insert: {
        billing_period: string // format: text
        company_id?: string | null // Note: This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> | format: uuid
        cost: number // format: numeric
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        end_date?: string | null // format: date
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        service_name: string // format: text
        start_date: string // format: date
        }
        Update: {
        billing_period?: string // format: text
        company_id?: string | null // Note: This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> | format: uuid
        cost?: number // format: numeric
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        end_date?: string | null // format: date
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        service_name?: string // format: text
        start_date?: string // format: date
        }
        Relationships: []
      }
      support_acts: {
        Row: {
        act_name: string // format: text
        created_at: string // format: timestamp with time zone
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        start_time: string | null // format: text
        }
        Insert: {
        act_name: string // format: text
        created_at?: string // format: timestamp with time zone
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        start_time?: string | null // format: text
        }
        Update: {
        act_name?: string // format: text
        created_at?: string // format: timestamp with time zone
        event_id?: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        start_time?: string | null // format: text
        }
        Relationships: []
      }
      support_messages: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_internal: boolean | null // format: boolean
        message: string // format: text
        read_at: string | null // format: timestamp with time zone
        sender_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        sender_type: string // format: text
        ticket_id: string | null // Note: This is a Foreign Key to `support_tickets.id`.<fk table='support_tickets' column='id'/> | format: uuid
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_internal?: boolean | null // format: boolean
        message: string // format: text
        read_at?: string | null // format: timestamp with time zone
        sender_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        sender_type: string // format: text
        ticket_id?: string | null // Note: This is a Foreign Key to `support_tickets.id`.<fk table='support_tickets' column='id'/> | format: uuid
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_internal?: boolean | null // format: boolean
        message?: string // format: text
        read_at?: string | null // format: timestamp with time zone
        sender_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        sender_type?: string // format: text
        ticket_id?: string | null // Note: This is a Foreign Key to `support_tickets.id`.<fk table='support_tickets' column='id'/> | format: uuid
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
        assigned_to: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        category: string // format: text
        company_id: string | null // Note: This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> | format: uuid
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        priority: string // format: text
        resolved_at: string | null // format: timestamp with time zone
        status: string // format: text
        subject: string // format: text
        updated_at: string | null // format: timestamp with time zone
        user_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Insert: {
        assigned_to?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        category?: string // format: text
        company_id?: string | null // Note: This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> | format: uuid
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        priority?: string // format: text
        resolved_at?: string | null // format: timestamp with time zone
        status?: string // format: text
        subject: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Update: {
        assigned_to?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        category?: string // format: text
        company_id?: string | null // Note: This is a Foreign Key to `companies.id`.<fk table='companies' column='id'/> | format: uuid
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        priority?: string // format: text
        resolved_at?: string | null // format: timestamp with time zone
        status?: string // format: text
        subject?: string // format: text
        updated_at?: string | null // format: timestamp with time zone
        user_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        }
        Relationships: []
      }
      system_health_snapshots: {
        Row: {
        active_connections: number | null // format: integer
        avg_response_time: number | null // format: numeric
        cpu_usage: number | null // format: numeric
        created_at: string // format: timestamp with time zone
        disk_usage: number | null // format: numeric
        error_rate: number | null // format: numeric
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        memory_usage: number | null // format: numeric
        metadata: Json | null // format: jsonb
        request_rate: number | null // format: numeric
        timestamp: string // format: timestamp with time zone
        }
        Insert: {
        active_connections?: number | null // format: integer
        avg_response_time?: number | null // format: numeric
        cpu_usage?: number | null // format: numeric
        created_at?: string // format: timestamp with time zone
        disk_usage?: number | null // format: numeric
        error_rate?: number | null // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        memory_usage?: number | null // format: numeric
        metadata?: Json | null // format: jsonb
        request_rate?: number | null // format: numeric
        timestamp?: string // format: timestamp with time zone
        }
        Update: {
        active_connections?: number | null // format: integer
        avg_response_time?: number | null // format: numeric
        cpu_usage?: number | null // format: numeric
        created_at?: string // format: timestamp with time zone
        disk_usage?: number | null // format: numeric
        error_rate?: number | null // format: numeric
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        memory_usage?: number | null // format: numeric
        metadata?: Json | null // format: jsonb
        request_rate?: number | null // format: numeric
        timestamp?: string // format: timestamp with time zone
        }
        Relationships: []
      }
      system_settings: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        default_user_role: string | null // format: text
        feature_flags: Json | null // format: jsonb
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        maintenance_message: string | null // format: text
        maintenance_mode: boolean | null // format: boolean
        notification_settings: Json | null // format: jsonb
        platform_config: Json | null // format: jsonb
        updated_at: string | null // format: timestamp with time zone
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        default_user_role?: string | null // format: text
        feature_flags?: Json | null // format: jsonb
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        maintenance_message?: string | null // format: text
        maintenance_mode?: boolean | null // format: boolean
        notification_settings?: Json | null // format: jsonb
        platform_config?: Json | null // format: jsonb
        updated_at?: string | null // format: timestamp with time zone
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        default_user_role?: string | null // format: text
        feature_flags?: Json | null // format: jsonb
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        maintenance_message?: string | null // format: text
        maintenance_mode?: boolean | null // format: boolean
        notification_settings?: Json | null // format: jsonb
        platform_config?: Json | null // format: jsonb
        updated_at?: string | null // format: timestamp with time zone
        }
        Relationships: []
      }
      tag_presets: {
        Row: {
        category: string | null // format: character varying
        color: string | null // format: character varying
        created_at: string | null // format: timestamp with time zone
        description: string | null // format: text
        id: number // Note: This is a Primary Key.<pk/> | format: integer
        is_active: boolean | null // format: boolean
        tag_name: string // format: character varying
        }
        Insert: {
        category?: string | null // format: character varying
        color?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        is_active?: boolean | null // format: boolean
        tag_name: string // format: character varying
        }
        Update: {
        category?: string | null // format: character varying
        color?: string | null // format: character varying
        created_at?: string | null // format: timestamp with time zone
        description?: string | null // format: text
        id?: number // Note: This is a Primary Key.<pk/> | format: integer
        is_active?: boolean | null // format: boolean
        tag_name?: string // format: character varying
        }
        Relationships: []
      }
      usage_events: {
        Row: {
        browser: string | null // format: text
        created_at: string // format: timestamp with time zone
        device_type: string | null // format: text
        event_id: string // format: text
        event_name: string // format: text
        event_type: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        os: string | null // format: text
        page: string | null // format: text
        properties: Json | null // format: jsonb
        referrer: string | null // format: text
        session_id: string // format: text
        timestamp: string // format: timestamp with time zone
        user_id: string | null // format: uuid
        }
        Insert: {
        browser?: string | null // format: text
        created_at?: string // format: timestamp with time zone
        device_type?: string | null // format: text
        event_id: string // format: text
        event_name: string // format: text
        event_type: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        os?: string | null // format: text
        page?: string | null // format: text
        properties?: Json | null // format: jsonb
        referrer?: string | null // format: text
        session_id: string // format: text
        timestamp?: string // format: timestamp with time zone
        user_id?: string | null // format: uuid
        }
        Update: {
        browser?: string | null // format: text
        created_at?: string // format: timestamp with time zone
        device_type?: string | null // format: text
        event_id?: string // format: text
        event_name?: string // format: text
        event_type?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        os?: string | null // format: text
        page?: string | null // format: text
        properties?: Json | null // format: jsonb
        referrer?: string | null // format: text
        session_id?: string // format: text
        timestamp?: string // format: timestamp with time zone
        user_id?: string | null // format: uuid
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
        created_at: string // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        settings: Json // format: jsonb
        updated_at: string // format: timestamp with time zone
        user_id: string // format: uuid
        }
        Insert: {
        created_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        settings: Json // format: jsonb
        updated_at?: string // format: timestamp with time zone
        user_id: string // format: uuid
        }
        Update: {
        created_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        settings?: Json // format: jsonb
        updated_at?: string // format: timestamp with time zone
        user_id?: string // format: uuid
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
        accessibility_settings: Json | null // format: jsonb
        created_at: string | null // format: timestamp with time zone
        dashboard_layout: Json | null // format: jsonb
        date_format: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        language: string | null // format: text
        notification_preferences: Json | null // format: jsonb
        privacy_settings: Json | null // format: jsonb
        theme: string | null // format: text
        time_format: string | null // format: text
        timezone: string | null // format: text
        ui_preferences: Json | null // format: jsonb
        updated_at: string | null // format: timestamp with time zone
        user_id: string | null // format: uuid
        }
        Insert: {
        accessibility_settings?: Json | null // format: jsonb
        created_at?: string | null // format: timestamp with time zone
        dashboard_layout?: Json | null // format: jsonb
        date_format?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        language?: string | null // format: text
        notification_preferences?: Json | null // format: jsonb
        privacy_settings?: Json | null // format: jsonb
        theme?: string | null // format: text
        time_format?: string | null // format: text
        timezone?: string | null // format: text
        ui_preferences?: Json | null // format: jsonb
        updated_at?: string | null // format: timestamp with time zone
        user_id?: string | null // format: uuid
        }
        Update: {
        accessibility_settings?: Json | null // format: jsonb
        created_at?: string | null // format: timestamp with time zone
        dashboard_layout?: Json | null // format: jsonb
        date_format?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        language?: string | null // format: text
        notification_preferences?: Json | null // format: jsonb
        privacy_settings?: Json | null // format: jsonb
        theme?: string | null // format: text
        time_format?: string | null // format: text
        timezone?: string | null // format: text
        ui_preferences?: Json | null // format: jsonb
        updated_at?: string | null // format: timestamp with time zone
        user_id?: string | null // format: uuid
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
        company_id: string // format: uuid
        created_at: string // format: timestamp with time zone
        email: string // format: text
        full_name: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_sign_in: string // format: timestamp with time zone
        role: "champion" | "admin" | "event_control" | "supervisor" | "standard_user" // format: public.user_role
        }
        Insert: {
        company_id: string // format: uuid
        created_at?: string // format: timestamp with time zone
        email: string // format: text
        full_name?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_sign_in?: string // format: timestamp with time zone
        role?: "champion" | "admin" | "event_control" | "supervisor" | "standard_user" // format: public.user_role
        }
        Update: {
        company_id?: string // format: uuid
        created_at?: string // format: timestamp with time zone
        email?: string // format: text
        full_name?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_sign_in?: string // format: timestamp with time zone
        role?: "champion" | "admin" | "event_control" | "supervisor" | "standard_user" // format: public.user_role
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
        browser: string | null // format: text
        created_at: string // format: timestamp with time zone
        device_type: string | null // format: text
        duration_seconds: number | null // format: integer
        ended_at: string | null // format: timestamp with time zone
        events_count: number | null // format: integer
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        ip_address: string | null // format: inet
        metadata: Json | null // format: jsonb
        os: string | null // format: text
        page_views: number | null // format: integer
        session_id: string // format: text
        started_at: string // format: timestamp with time zone
        updated_at: string // format: timestamp with time zone
        user_id: string | null // format: uuid
        }
        Insert: {
        browser?: string | null // format: text
        created_at?: string // format: timestamp with time zone
        device_type?: string | null // format: text
        duration_seconds?: number | null // format: integer
        ended_at?: string | null // format: timestamp with time zone
        events_count?: number | null // format: integer
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        ip_address?: string | null // format: inet
        metadata?: Json | null // format: jsonb
        os?: string | null // format: text
        page_views?: number | null // format: integer
        session_id: string // format: text
        started_at?: string // format: timestamp with time zone
        updated_at?: string // format: timestamp with time zone
        user_id?: string | null // format: uuid
        }
        Update: {
        browser?: string | null // format: text
        created_at?: string // format: timestamp with time zone
        device_type?: string | null // format: text
        duration_seconds?: number | null // format: integer
        ended_at?: string | null // format: timestamp with time zone
        events_count?: number | null // format: integer
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        ip_address?: string | null // format: inet
        metadata?: Json | null // format: jsonb
        os?: string | null // format: text
        page_views?: number | null // format: integer
        session_id?: string // format: text
        started_at?: string // format: timestamp with time zone
        updated_at?: string // format: timestamp with time zone
        user_id?: string | null // format: uuid
        }
        Relationships: []
      }
      vendor_access_levels: {
        Row: {
        created_at: string // format: timestamp with time zone
        description: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_temporary: boolean // format: boolean
        name: string // format: text
        }
        Insert: {
        created_at?: string // format: timestamp with time zone
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_temporary?: boolean // format: boolean
        name: string // format: text
        }
        Update: {
        created_at?: string // format: timestamp with time zone
        description?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_temporary?: boolean // format: boolean
        name?: string // format: text
        }
        Relationships: []
      }
      vendor_accreditation_access_levels: {
        Row: {
        access_level_id: string // Note: This is a Foreign Key to `accreditation_access_levels.id`.<fk table='accreditation_access_levels' column='id'/> | format: uuid
        accreditation_id: string // Note: This is a Foreign Key to `vendor_accreditations.id`.<fk table='vendor_accreditations' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        }
        Insert: {
        access_level_id: string // Note: This is a Foreign Key to `accreditation_access_levels.id`.<fk table='accreditation_access_levels' column='id'/> | format: uuid
        accreditation_id: string // Note: This is a Foreign Key to `vendor_accreditations.id`.<fk table='vendor_accreditations' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        }
        Update: {
        access_level_id?: string // Note: This is a Foreign Key to `accreditation_access_levels.id`.<fk table='accreditation_access_levels' column='id'/> | format: uuid
        accreditation_id?: string // Note: This is a Foreign Key to `vendor_accreditations.id`.<fk table='vendor_accreditations' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        }
        Relationships: []
      }
      vendor_accreditation_audit_logs: {
        Row: {
        accreditation_id: string // Note: This is a Foreign Key to `vendor_accreditations.id`.<fk table='vendor_accreditations' column='id'/> | format: uuid
        action: string // format: text
        actor_profile_id: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        created_at: string // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes: string | null // format: text
        }
        Insert: {
        accreditation_id: string // Note: This is a Foreign Key to `vendor_accreditations.id`.<fk table='vendor_accreditations' column='id'/> | format: uuid
        action: string // format: text
        actor_profile_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        created_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes?: string | null // format: text
        }
        Update: {
        accreditation_id?: string // Note: This is a Foreign Key to `vendor_accreditations.id`.<fk table='vendor_accreditations' column='id'/> | format: uuid
        action?: string // format: text
        actor_profile_id?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        created_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes?: string | null // format: text
        }
        Relationships: []
      }
      vendor_accreditations: {
        Row: {
        accreditation_number: string | null // format: text
        created_at: string // format: timestamp with time zone
        digital_pass_url: string | null // format: text
        expires_at: string | null // format: timestamp with time zone
        feedback: string | null // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        id_document_reference: string | null // format: text
        id_document_type: string | null // format: text
        induction_completed: boolean // format: boolean
        induction_completed_at: string | null // format: timestamp with time zone
        induction_completed_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        induction_token: string | null // format: text
        qr_code_token: string | null // format: text
        reviewed_at: string | null // format: timestamp with time zone
        reviewed_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        status: string // format: text
        submitted_at: string // format: timestamp with time zone
        updated_at: string // format: timestamp with time zone
        vendor_id: string // Note: This is a Foreign Key to `vendors.id`.<fk table='vendors' column='id'/> | format: uuid
        }
        Insert: {
        accreditation_number?: string | null // format: text
        created_at?: string // format: timestamp with time zone
        digital_pass_url?: string | null // format: text
        expires_at?: string | null // format: timestamp with time zone
        feedback?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        id_document_reference?: string | null // format: text
        id_document_type?: string | null // format: text
        induction_completed?: boolean // format: boolean
        induction_completed_at?: string | null // format: timestamp with time zone
        induction_completed_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        induction_token?: string | null // format: text
        qr_code_token?: string | null // format: text
        reviewed_at?: string | null // format: timestamp with time zone
        reviewed_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        status?: string // format: text
        submitted_at?: string // format: timestamp with time zone
        updated_at?: string // format: timestamp with time zone
        vendor_id: string // Note: This is a Foreign Key to `vendors.id`.<fk table='vendors' column='id'/> | format: uuid
        }
        Update: {
        accreditation_number?: string | null // format: text
        created_at?: string // format: timestamp with time zone
        digital_pass_url?: string | null // format: text
        expires_at?: string | null // format: timestamp with time zone
        feedback?: string | null // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        id_document_reference?: string | null // format: text
        id_document_type?: string | null // format: text
        induction_completed?: boolean // format: boolean
        induction_completed_at?: string | null // format: timestamp with time zone
        induction_completed_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        induction_token?: string | null // format: text
        qr_code_token?: string | null // format: text
        reviewed_at?: string | null // format: timestamp with time zone
        reviewed_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        status?: string // format: text
        submitted_at?: string // format: timestamp with time zone
        updated_at?: string // format: timestamp with time zone
        vendor_id?: string // Note: This is a Foreign Key to `vendors.id`.<fk table='vendors' column='id'/> | format: uuid
        }
        Relationships: []
      }
      vendor_induction_events: {
        Row: {
        accreditation_id: string // Note: This is a Foreign Key to `vendor_accreditations.id`.<fk table='vendor_accreditations' column='id'/> | format: uuid
        created_at: string // format: timestamp with time zone
        event_data: Json | null // format: jsonb
        event_type: string // format: text
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        ip_address: string | null // format: inet
        user_agent: string | null // format: text
        }
        Insert: {
        accreditation_id: string // Note: This is a Foreign Key to `vendor_accreditations.id`.<fk table='vendor_accreditations' column='id'/> | format: uuid
        created_at?: string // format: timestamp with time zone
        event_data?: Json | null // format: jsonb
        event_type: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        ip_address?: string | null // format: inet
        user_agent?: string | null // format: text
        }
        Update: {
        accreditation_id?: string // Note: This is a Foreign Key to `vendor_accreditations.id`.<fk table='vendor_accreditations' column='id'/> | format: uuid
        created_at?: string // format: timestamp with time zone
        event_data?: Json | null // format: jsonb
        event_type?: string // format: text
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        ip_address?: string | null // format: inet
        user_agent?: string | null // format: text
        }
        Relationships: []
      }
      vendor_inductions: {
        Row: {
        completed_at: string | null // format: timestamp with time zone
        completed_by: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        created_at: string // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_required: boolean // format: boolean
        resource_url: string | null // format: text
        title: string // format: text
        updated_at: string // format: timestamp with time zone
        vendor_id: string // Note: This is a Foreign Key to `vendors.id`.<fk table='vendors' column='id'/> | format: uuid
        }
        Insert: {
        completed_at?: string | null // format: timestamp with time zone
        completed_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        created_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_required?: boolean // format: boolean
        resource_url?: string | null // format: text
        title: string // format: text
        updated_at?: string // format: timestamp with time zone
        vendor_id: string // Note: This is a Foreign Key to `vendors.id`.<fk table='vendors' column='id'/> | format: uuid
        }
        Update: {
        completed_at?: string | null // format: timestamp with time zone
        completed_by?: string | null // Note: This is a Foreign Key to `profiles.id`.<fk table='profiles' column='id'/> | format: uuid
        created_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        is_required?: boolean // format: boolean
        resource_url?: string | null // format: text
        title?: string // format: text
        updated_at?: string // format: timestamp with time zone
        vendor_id?: string // Note: This is a Foreign Key to `vendors.id`.<fk table='vendors' column='id'/> | format: uuid
        }
        Relationships: []
      }
      vendors: {
        Row: {
        business_name: string // format: text
        contact_email: string | null // format: text
        contact_name: string | null // format: text
        contact_phone: string | null // format: text
        contract_expires_on: string | null // format: date
        created_at: string // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        insurance_document_url: string | null // format: text
        insurance_expires_on: string | null // format: date
        notes: string | null // format: text
        service_type: string | null // format: text
        status: string // format: text
        updated_at: string // format: timestamp with time zone
        }
        Insert: {
        business_name: string // format: text
        contact_email?: string | null // format: text
        contact_name?: string | null // format: text
        contact_phone?: string | null // format: text
        contract_expires_on?: string | null // format: date
        created_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        insurance_document_url?: string | null // format: text
        insurance_expires_on?: string | null // format: date
        notes?: string | null // format: text
        service_type?: string | null // format: text
        status?: string // format: text
        updated_at?: string // format: timestamp with time zone
        }
        Update: {
        business_name?: string // format: text
        contact_email?: string | null // format: text
        contact_name?: string | null // format: text
        contact_phone?: string | null // format: text
        contract_expires_on?: string | null // format: date
        created_at?: string // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        insurance_document_url?: string | null // format: text
        insurance_expires_on?: string | null // format: date
        notes?: string | null // format: text
        service_type?: string | null // format: text
        status?: string // format: text
        updated_at?: string // format: timestamp with time zone
        }
        Relationships: []
      }
      venue_3d_models: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        model_data: Json // format: jsonb
        updated_at: string | null // format: timestamp with time zone
        venue_name: string // format: text
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        model_data: Json // format: jsonb
        updated_at?: string | null // format: timestamp with time zone
        venue_name: string // format: text
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        model_data?: Json // format: jsonb
        updated_at?: string | null // format: timestamp with time zone
        venue_name?: string // format: text
        }
        Relationships: []
      }
      venue_occupancy: {
        Row: {
        created_at: string | null // format: timestamp with time zone
        current_count: number // format: integer
        event_id: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_updated: string | null // format: timestamp with time zone
        timestamp: string | null // format: timestamp with time zone
        total_capacity: number // format: integer
        }
        Insert: {
        created_at?: string | null // format: timestamp with time zone
        current_count?: number // format: integer
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_updated?: string | null // format: timestamp with time zone
        timestamp?: string | null // format: timestamp with time zone
        total_capacity?: number // format: integer
        }
        Update: {
        created_at?: string | null // format: timestamp with time zone
        current_count?: number // format: integer
        event_id?: string | null // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        last_updated?: string | null // format: timestamp with time zone
        timestamp?: string | null // format: timestamp with time zone
        total_capacity?: number // format: integer
        }
        Relationships: []
      }
      venue_zones: {
        Row: {
        alerts: Json | null // format: jsonb
        capacity: number | null // format: integer
        created_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        polygon: Json // format: jsonb
        venue_id: string | null // Note: This is a Foreign Key to `venue_3d_models.id`.<fk table='venue_3d_models' column='id'/> | format: uuid
        zone_type: string // format: text
        }
        Insert: {
        alerts?: Json | null // format: jsonb
        capacity?: number | null // format: integer
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name: string // format: text
        polygon: Json // format: jsonb
        venue_id?: string | null // Note: This is a Foreign Key to `venue_3d_models.id`.<fk table='venue_3d_models' column='id'/> | format: uuid
        zone_type: string // format: text
        }
        Update: {
        alerts?: Json | null // format: jsonb
        capacity?: number | null // format: integer
        created_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        name?: string // format: text
        polygon?: Json // format: jsonb
        venue_id?: string | null // Note: This is a Foreign Key to `venue_3d_models.id`.<fk table='venue_3d_models' column='id'/> | format: uuid
        zone_type?: string // format: text
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
        error_message: string | null // format: text
        executed_actions: Json | null // format: jsonb
        executed_at: string | null // format: timestamp with time zone
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        status: string | null // format: text
        trigger_data: Json | null // format: jsonb
        workflow_id: string | null // Note: This is a Foreign Key to `automation_workflows.id`.<fk table='automation_workflows' column='id'/> | format: uuid
        }
        Insert: {
        error_message?: string | null // format: text
        executed_actions?: Json | null // format: jsonb
        executed_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        status?: string | null // format: text
        trigger_data?: Json | null // format: jsonb
        workflow_id?: string | null // Note: This is a Foreign Key to `automation_workflows.id`.<fk table='automation_workflows' column='id'/> | format: uuid
        }
        Update: {
        error_message?: string | null // format: text
        executed_actions?: Json | null // format: jsonb
        executed_at?: string | null // format: timestamp with time zone
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        status?: string | null // format: text
        trigger_data?: Json | null // format: jsonb
        workflow_id?: string | null // Note: This is a Foreign Key to `automation_workflows.id`.<fk table='automation_workflows' column='id'/> | format: uuid
        }
        Relationships: []
      }
      wristband_access_levels: {
        Row: {
        access_level_id: string // Note: This is a Foreign Key to `accreditation_access_levels.id`.<fk table='accreditation_access_levels' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        wristband_type_id: string // Note: This is a Foreign Key to `wristband_types.id`.<fk table='wristband_types' column='id'/> | format: uuid
        }
        Insert: {
        access_level_id: string // Note: This is a Foreign Key to `accreditation_access_levels.id`.<fk table='accreditation_access_levels' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        wristband_type_id: string // Note: This is a Foreign Key to `wristband_types.id`.<fk table='wristband_types' column='id'/> | format: uuid
        }
        Update: {
        access_level_id?: string // Note: This is a Foreign Key to `accreditation_access_levels.id`.<fk table='accreditation_access_levels' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        wristband_type_id?: string // Note: This is a Foreign Key to `wristband_types.id`.<fk table='wristband_types' column='id'/> | format: uuid
        }
        Relationships: []
      }
      wristband_types: {
        Row: {
        available_quantity: number | null // format: integer
        created_at: string // format: timestamp with time zone
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes: string | null // format: text
        updated_at: string // format: timestamp with time zone
        wristband_color: string // format: text
        wristband_name: string // format: text
        }
        Insert: {
        available_quantity?: number | null // format: integer
        created_at?: string // format: timestamp with time zone
        event_id: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes?: string | null // format: text
        updated_at?: string // format: timestamp with time zone
        wristband_color: string // format: text
        wristband_name: string // format: text
        }
        Update: {
        available_quantity?: number | null // format: integer
        created_at?: string // format: timestamp with time zone
        event_id?: string // Note: This is a Foreign Key to `events.id`.<fk table='events' column='id'/> | format: uuid
        id?: string // Note: This is a Primary Key.<pk/> | format: uuid
        notes?: string | null // format: text
        updated_at?: string // format: timestamp with time zone
        wristband_color?: string // format: text
        wristband_name?: string // format: text
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}