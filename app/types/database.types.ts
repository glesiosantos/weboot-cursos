export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = Database['public']['Enums']['user_role']
export type CourseType = Database['public']['Enums']['course_type']
export type CourseStatus = Database['public']['Enums']['course_status']
export type LessonType = Database['public']['Enums']['lesson_type']
export type CoursePricingType = Database['public']['Enums']['course_pricing_type']
export type CourseBatchStatus = Database['public']['Enums']['course_batch_status']
export type CourseBatchActivationMode = Database['public']['Enums']['course_batch_activation_mode']

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.15'
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          attendance_date: string
          created_at: string
          enrollment_id: string
          id: string
          notes: string | null
          recorded_by: string | null
          status: Database['public']['Enums']['attendance_status']
          updated_at: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          enrollment_id: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status: Database['public']['Enums']['attendance_status']
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: Database['public']['Enums']['attendance_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'attendance_enrollment_id_fkey'
            columns: ['enrollment_id']
            isOneToOne: false
            referencedRelation: 'enrollments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'attendance_recorded_by_fkey'
            columns: ['recorded_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          course_id: string
          created_at: string
          file_path: string | null
          id: string
          issued_at: string
          user_id: string
          verification_code: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          created_at?: string
          file_path?: string | null
          id?: string
          issued_at?: string
          user_id: string
          verification_code: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          created_at?: string
          file_path?: string | null
          id?: string
          issued_at?: string
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: 'certificates_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'certificates_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          id: string
          order_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          order_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          order_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'coupon_usages_coupon_id_fkey'
            columns: ['coupon_id']
            isOneToOne: false
            referencedRelation: 'coupons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'coupon_usages_order_id_fkey'
            columns: ['order_id']
            isOneToOne: true
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'coupon_usages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          starts_at: string | null
          type: Database['public']['Enums']['coupon_type']
          updated_at: string
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          starts_at?: string | null
          type: Database['public']['Enums']['coupon_type']
          updated_at?: string
          used_count?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          starts_at?: string | null
          type?: Database['public']['Enums']['coupon_type']
          updated_at?: string
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      course_batches: {
        Row: {
          activation_mode: Database['public']['Enums']['course_batch_activation_mode']
          course_id: string
          created_at: string
          ends_at: string | null
          id: string
          max_sales: number | null
          name: string
          position: number
          price: number
          starts_at: string | null
          status: Database['public']['Enums']['course_batch_status']
          updated_at: string
        }
        Insert: {
          activation_mode: Database['public']['Enums']['course_batch_activation_mode']
          course_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          max_sales?: number | null
          name: string
          position: number
          price: number
          starts_at?: string | null
          status?: Database['public']['Enums']['course_batch_status']
          updated_at?: string
        }
        Update: {
          activation_mode?: Database['public']['Enums']['course_batch_activation_mode']
          course_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          max_sales?: number | null
          name?: string
          position?: number
          price?: number
          starts_at?: string | null
          status?: Database['public']['Enums']['course_batch_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'course_batches_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      course_materials: {
        Row: {
          course_id: string
          created_at: string
          file_path: string
          file_size: number
          id: string
          lesson_id: string | null
          mime_type: string
          module_id: string | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          file_path: string
          file_size: number
          id?: string
          lesson_id?: string | null
          mime_type: string
          module_id?: string | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          file_path?: string
          file_size?: number
          id?: string
          lesson_id?: string | null
          mime_type?: string
          module_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'course_materials_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'course_materials_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'course_materials_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'published_lesson_metadata'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'course_materials_module_id_fkey'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'course_modules'
            referencedColumns: ['id']
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          position: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'course_modules_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      course_presential_details: {
        Row: {
          address: string | null
          address_number: string | null
          city: string
          complement: string | null
          course_id: string
          created_at: string
          ends_at: string
          location_name: string
          max_students: number
          neighborhood: string | null
          postal_code: string | null
          registration_deadline: string | null
          starts_at: string
          state: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_number?: string | null
          city: string
          complement?: string | null
          course_id: string
          created_at?: string
          ends_at: string
          location_name: string
          max_students: number
          neighborhood?: string | null
          postal_code?: string | null
          registration_deadline?: string | null
          starts_at: string
          state: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_number?: string | null
          city?: string
          complement?: string | null
          course_id?: string
          created_at?: string
          ends_at?: string
          location_name?: string
          max_students?: number
          neighborhood?: string | null
          postal_code?: string | null
          registration_deadline?: string | null
          starts_at?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'course_presential_details_course_id_fkey'
            columns: ['course_id']
            isOneToOne: true
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
        ]
      }
      courses: {
        Row: {
          additional_info: string | null
          archived_at: string | null
          cancellation_policy: string | null
          course_type: Database['public']['Enums']['course_type']
          cover_path: string | null
          created_at: string
          description: string
          folder_alt_text: string | null
          folder_mime_type: string | null
          folder_original_name: string | null
          folder_path: string | null
          folder_updated_at: string | null
          id: string
          instructor_id: string | null
          price: number
          pricing_type: Database['public']['Enums']['course_pricing_type']
          program: string | null
          promotional_price: number | null
          published_at: string | null
          requirements: string | null
          short_description: string
          show_future_batches: boolean
          slug: string
          status: Database['public']['Enums']['course_status']
          target_audience: string | null
          title: string
          updated_at: string
          workload_hours: number
        }
        Insert: {
          additional_info?: string | null
          archived_at?: string | null
          cancellation_policy?: string | null
          course_type: Database['public']['Enums']['course_type']
          cover_path?: string | null
          created_at?: string
          description: string
          folder_alt_text?: string | null
          folder_mime_type?: string | null
          folder_original_name?: string | null
          folder_path?: string | null
          folder_updated_at?: string | null
          id?: string
          instructor_id?: string | null
          price: number
          pricing_type?: Database['public']['Enums']['course_pricing_type']
          program?: string | null
          promotional_price?: number | null
          published_at?: string | null
          requirements?: string | null
          short_description: string
          show_future_batches?: boolean
          slug: string
          status?: Database['public']['Enums']['course_status']
          target_audience?: string | null
          title: string
          updated_at?: string
          workload_hours: number
        }
        Update: {
          additional_info?: string | null
          archived_at?: string | null
          cancellation_policy?: string | null
          course_type?: Database['public']['Enums']['course_type']
          cover_path?: string | null
          created_at?: string
          description?: string
          folder_alt_text?: string | null
          folder_mime_type?: string | null
          folder_original_name?: string | null
          folder_path?: string | null
          folder_updated_at?: string | null
          id?: string
          instructor_id?: string | null
          price?: number
          pricing_type?: Database['public']['Enums']['course_pricing_type']
          program?: string | null
          promotional_price?: number | null
          published_at?: string | null
          requirements?: string | null
          short_description?: string
          show_future_batches?: boolean
          slug?: string
          status?: Database['public']['Enums']['course_status']
          target_audience?: string | null
          title?: string
          updated_at?: string
          workload_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: 'courses_instructor_id_fkey'
            columns: ['instructor_id']
            isOneToOne: false
            referencedRelation: 'instructors'
            referencedColumns: ['id']
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          enrolled_at: string
          expires_at: string | null
          id: string
          order_id: string | null
          status: Database['public']['Enums']['enrollment_status']
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          status?: Database['public']['Enums']['enrollment_status']
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          order_id?: string | null
          status?: Database['public']['Enums']['enrollment_status']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'enrollments_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'enrollments_order_id_fkey'
            columns: ['order_id']
            isOneToOne: true
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'enrollments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      instructors: {
        Row: {
          active: boolean
          avatar_path: string | null
          bio: string | null
          created_at: string
          id: string
          linkedin_url: string | null
          name: string
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          linkedin_url?: string | null
          name: string
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'instructors_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lesson_progress_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_progress_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'lessons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_progress_lesson_id_fkey'
            columns: ['lesson_id']
            isOneToOne: false
            referencedRelation: 'published_lesson_metadata'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lesson_progress_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_preview: boolean
          is_required: boolean
          lesson_type: Database['public']['Enums']['lesson_type']
          module_id: string
          position: number
          title: string
          updated_at: string
          video_path: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean
          is_required?: boolean
          lesson_type?: Database['public']['Enums']['lesson_type']
          module_id: string
          position: number
          title: string
          updated_at?: string
          video_path?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean
          is_required?: boolean
          lesson_type?: Database['public']['Enums']['lesson_type']
          module_id?: string
          position?: number
          title?: string
          updated_at?: string
          video_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_module_id_fkey'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'course_modules'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          asaas_checkout_id: string | null
          asaas_payment_id: string | null
          coupon_id: string | null
          course_id: string
          created_at: string
          currency: string
          discount: number
          id: string
          paid_at: string | null
          status: Database['public']['Enums']['order_status']
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_checkout_id?: string | null
          asaas_payment_id?: string | null
          coupon_id?: string | null
          course_id: string
          created_at?: string
          currency?: string
          discount?: number
          id?: string
          paid_at?: string | null
          status?: Database['public']['Enums']['order_status']
          subtotal: number
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_checkout_id?: string | null
          asaas_payment_id?: string | null
          coupon_id?: string | null
          course_id?: string
          created_at?: string
          currency?: string
          discount?: number
          id?: string
          paid_at?: string | null
          status?: Database['public']['Enums']['order_status']
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_coupon_id_fkey'
            columns: ['coupon_id']
            isOneToOne: false
            referencedRelation: 'coupons'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_course_id_fkey'
            columns: ['course_id']
            isOneToOne: false
            referencedRelation: 'courses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          external_id: string
          id: string
          order_id: string
          paid_at: string | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_id: string
          id?: string
          order_id: string
          paid_at?: string | null
          provider?: string
          status: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_id?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          role: Database['public']['Enums']['user_role']
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          id: string
          name: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_type: string
          external_event_id: string
          id: string
          payload_hash: string
          processed_at: string | null
          provider: string
          received_at: string
          status: string
        }
        Insert: {
          event_type: string
          external_event_id: string
          id?: string
          payload_hash: string
          processed_at?: string | null
          provider: string
          received_at?: string
          status?: string
        }
        Update: {
          event_type?: string
          external_event_id?: string
          id?: string
          payload_hash?: string
          processed_at?: string | null
          provider?: string
          received_at?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      published_lesson_metadata: {
        Row: {
          description: string | null
          duration_minutes: number | null
          id: string | null
          is_preview: boolean | null
          is_required: boolean | null
          lesson_type: Database['public']['Enums']['lesson_type'] | null
          module_id: string | null
          position: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'lessons_module_id_fkey'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'course_modules'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      assert_valid_published_course_batches: {
        Args: { target_course_id: string }
        Returns: undefined
      }
      bootstrap_admin: { Args: { target_email: string }, Returns: string }
      get_current_course_batch: {
        Args: { reference_at?: string, target_course_id: string }
        Returns: {
          activation_mode: Database['public']['Enums']['course_batch_activation_mode']
          course_id: string
          created_at: string
          ends_at: string | null
          id: string
          max_sales: number | null
          name: string
          position: number
          price: number
          starts_at: string | null
          status: Database['public']['Enums']['course_batch_status']
          updated_at: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'course_batches'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_published_course_lessons: {
        Args: { target_course_id: string }
        Returns: {
          description: string
          duration_minutes: number
          id: string
          is_preview: boolean
          is_required: boolean
          lesson_type: Database['public']['Enums']['lesson_type']
          module_id: string
          position: number
          title: string
        }[]
      }
      get_upcoming_course_batches: {
        Args: { reference_at?: string, target_course_id: string }
        Returns: {
          activation_mode: Database['public']['Enums']['course_batch_activation_mode']
          course_id: string
          created_at: string
          ends_at: string | null
          id: string
          max_sales: number | null
          name: string
          position: number
          price: number
          starts_at: string | null
          status: Database['public']['Enums']['course_batch_status']
          updated_at: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'course_batches'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin: { Args: never, Returns: boolean }
      replace_course_batches: {
        Args: { batches: Json, target_course_id: string }
        Returns: undefined
      }
    }
    Enums: {
      attendance_status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED'
      coupon_type: 'PERCENTAGE' | 'FIXED'
      course_batch_activation_mode: 'QUANTITY' | 'DATE' | 'QUANTITY_OR_DATE'
      course_batch_status:
        | 'DRAFT'
        | 'SCHEDULED'
        | 'ACTIVE'
        | 'SOLD_OUT'
        | 'EXPIRED'
        | 'DISABLED'
      course_pricing_type: 'FIXED' | 'BATCHES'
      course_status:
        | 'DRAFT'
        | 'PUBLISHED'
        | 'REGISTRATION_CLOSED'
        | 'IN_PROGRESS'
        | 'COMPLETED'
        | 'CANCELED'
      course_type: 'ONLINE' | 'PRESENCIAL'
      enrollment_status:
        | 'PENDING'
        | 'ACTIVE'
        | 'COMPLETED'
        | 'CANCELED'
        | 'EXPIRED'
      lesson_type: 'VIDEO' | 'TEXT' | 'MATERIAL'
      order_status:
        | 'PENDING'
        | 'WAITING_PAYMENT'
        | 'PAID'
        | 'CANCELED'
        | 'REFUNDED'
        | 'EXPIRED'
      user_role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables']
    & DefaultSchema['Views'])
    ? (DefaultSchema['Tables']
      & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ['PRESENT', 'ABSENT', 'JUSTIFIED'],
      coupon_type: ['PERCENTAGE', 'FIXED'],
      course_batch_activation_mode: ['QUANTITY', 'DATE', 'QUANTITY_OR_DATE'],
      course_batch_status: [
        'DRAFT',
        'SCHEDULED',
        'ACTIVE',
        'SOLD_OUT',
        'EXPIRED',
        'DISABLED',
      ],
      course_pricing_type: ['FIXED', 'BATCHES'],
      course_status: [
        'DRAFT',
        'PUBLISHED',
        'REGISTRATION_CLOSED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELED',
      ],
      course_type: ['ONLINE', 'PRESENCIAL'],
      enrollment_status: [
        'PENDING',
        'ACTIVE',
        'COMPLETED',
        'CANCELED',
        'EXPIRED',
      ],
      lesson_type: ['VIDEO', 'TEXT', 'MATERIAL'],
      order_status: [
        'PENDING',
        'WAITING_PAYMENT',
        'PAID',
        'CANCELED',
        'REFUNDED',
        'EXPIRED',
      ],
      user_role: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
    },
  },
} as const
