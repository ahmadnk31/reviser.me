import { createBrowserClient } from '@supabase/ssr';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title?: string
          user_id?: string
        }
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          front: string
          id: string
          last_reviewed: string | null
          next_review: string | null
          review_count: number
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          front: string
          id?: string
          last_reviewed?: string | null
          next_review?: string | null
          review_count?: number
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          front?: string
          id?: string
          last_reviewed?: string | null
          next_review?: string | null
          review_count?: number
        }
      }
      reviews: {
        Row: {
          created_at: string
          difficulty: number
          flashcard_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty: number
          flashcard_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: number
          flashcard_id?: string
          id?: string
          user_id?: string
        }
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