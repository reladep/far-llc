/**
 * Placeholder for Supabase-generated types.
 *
 * To populate: set SUPABASE_PROJECT_ID in your environment, then run:
 *   npm run db:types
 *
 * This will regenerate this file with full schema types from the Supabase CLI.
 * Until then, this file exposes a minimal `Database` type with a loose fallback.
 *
 * Long-term goal: replace every `any` currently used for Supabase row types
 * with precise `Database['public']['Tables']['<table>']['Row']` types.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Minimal stub until `npm run db:types` generates the real schema.
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, Record<string, unknown>>;
  };
};
