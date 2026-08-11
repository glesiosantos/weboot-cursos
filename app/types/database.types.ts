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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
      course_batches: {
        Row: { id: string, course_id: string, name: string, position: number, price: number, max_sales: number | null, starts_at: string | null, ends_at: string | null, status: Database['public']['Enums']['course_batch_status'], activation_mode: Database['public']['Enums']['course_batch_activation_mode'], created_at: string, updated_at: string }
        Insert: { id?: string, course_id: string, name: string, position: number, price: number, max_sales?: number | null, starts_at?: string | null, ends_at?: string | null, status?: Database['public']['Enums']['course_batch_status'], activation_mode: Database['public']['Enums']['course_batch_activation_mode'], created_at?: string, updated_at?: string }
        Update: { id?: string, course_id?: string, name?: string, position?: number, price?: number, max_sales?: number | null, starts_at?: string | null, ends_at?: string | null, status?: Database['public']['Enums']['course_batch_status'], activation_mode?: Database['public']['Enums']['course_batch_activation_mode'], created_at?: string, updated_at?: string }
        Relationships: [{ foreignKeyName: 'course_batches_course_id_fkey', columns: ['course_id'], isOneToOne: false, referencedRelation: 'courses', referencedColumns: ['id'] }]
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
          show_future_batches: boolean
          short_description: string
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
          show_future_batches?: boolean
          short_description: string
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
          show_future_batches?: boolean
          short_description?: string
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
      bootstrap_admin: { Args: { target_email: string }, Returns: string }
      get_current_course_batch: { Args: { target_course_id: string, reference_at?: string }, Returns: Database['public']['Tables']['course_batches']['Row'][] }
      get_upcoming_course_batches: { Args: { target_course_id: string, reference_at?: string }, Returns: Database['public']['Tables']['course_batches']['Row'][] }
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
      is_admin: { Args: never, Returns: boolean }
      replace_course_batches: { Args: { target_course_id: string, batches: Json }, Returns: undefined }
    }
    Enums: {
      attendance_status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED'
      coupon_type: 'PERCENTAGE' | 'FIXED'
      course_batch_activation_mode: 'QUANTITY' | 'DATE' | 'QUANTITY_OR_DATE'
      course_batch_status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'SOLD_OUT' | 'EXPIRED' | 'DISABLED'
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database['storage']['Enums']['buckettype']
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database['storage']['Enums']['buckettype']
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database['storage']['Enums']['buckettype']
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database['storage']['Enums']['buckettype']
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey'
            columns: ['upload_id']
            isOneToOne: false
            referencedRelation: 's3_multipart_uploads'
            referencedColumns: ['id']
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'vector_indexes_bucket_id_fkey'
            columns: ['bucket_id']
            isOneToOne: false
            referencedRelation: 'buckets_vectors'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string, metadata: Json, name: string, owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }, Returns: string }
      filename: { Args: { name: string }, Returns: string }
      foldername: { Args: { name: string }, Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string, p_key: string, p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never, Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: 'STANDARD' | 'ANALYTICS' | 'VECTOR'
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      attendance_status: ['PRESENT', 'ABSENT', 'JUSTIFIED'],
      coupon_type: ['PERCENTAGE', 'FIXED'],
      course_batch_activation_mode: ['QUANTITY', 'DATE', 'QUANTITY_OR_DATE'],
      course_batch_status: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'SOLD_OUT', 'EXPIRED', 'DISABLED'],
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
  storage: {
    Enums: {
      buckettype: ['STANDARD', 'ANALYTICS', 'VECTOR'],
    },
  },
} as const
