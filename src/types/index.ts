// ============================================================
// Database types – mirrors the Supabase schema
// ============================================================

export type UserRole = 'user' | 'contributor' | 'admin'
export type PostStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'

export interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  created_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  slug: string
  title: string
  body: string
  status: PostStatus
  community_id: string
  category_id: string
  author_id: string
  reviewer_id: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  // Pending revision — only set on approved posts being re-edited
  pending_title: string | null
  pending_body: string | null
  pending_community_id: string | null
  pending_category_id: string | null
  pending_submitted_at: string | null
  // Verification — admin-only, applies to naati-aushadha posts
  is_verified: boolean
  verified_at: string | null
  verified_by: string | null
}

// ── Joined / composite types ────────────────────────────────

export interface PostWithDetails extends Post {
  community: Pick<Community, 'id' | 'name' | 'slug'>
  category: Pick<Category, 'id' | 'name' | 'slug'>
  author: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>
}

// ── Translation types ────────────────────────────────────────

export type TranslationLanguage = 'en'

export interface PostTranslation {
  id: string
  post_id: string
  language: TranslationLanguage
  title: string
  body: string
  created_at: string
}

// ── Supabase Database helper types ──────────────────────────
// Matches the shape used by the Supabase JS client

export type Database = {
  public: {
    Tables: {
      communities: {
        Row: Community
        Insert: Omit<Community, 'id' | 'created_at'>
        Update: Partial<Omit<Community, 'id' | 'created_at'>>
        Relationships: []
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      posts: {
        Row: Post
        Insert: {
          title: string
          slug: string
          community_id: string
          category_id: string
          author_id: string
          body?: string
          status?: PostStatus
          reviewer_id?: string | null
          rejection_reason?: string | null
          pending_title?: string | null
          pending_body?: string | null
          pending_community_id?: string | null
          pending_category_id?: string | null
          pending_submitted_at?: string | null
        }
        Update: Partial<Omit<Post, 'id' | 'created_at'>>
        Relationships: []
      }
      post_translations: {
        Row: PostTranslation
        Insert: Omit<PostTranslation, 'id' | 'created_at'>
        Update: Partial<Omit<PostTranslation, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      user_role: UserRole
      post_status: PostStatus
    }
    CompositeTypes: { [_ in never]: never }
  }
}
