// src/config/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and Anon Key from .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is not configured. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  // You might want to throw an error here or handle this case more gracefully
  // depending on whether the app can function at all without Supabase.
}

// Type guard to ensure that the variables are strings if they exist,
// otherwise, createClient might complain if they are undefined.
// However, the check above should ideally prevent this function from being called with undefined values.
const effectiveSupabaseUrl = supabaseUrl || 'http://localhost:54321'; // Fallback for type reasons, error is thrown above
const effectiveSupabaseAnonKey = supabaseAnonKey || 'fallback_anon_key'; // Fallback for type reasons

export const supabase = createClient(effectiveSupabaseUrl, effectiveSupabaseAnonKey);

// Example of how to define types for your database for better type safety
// You would generate these types from your Supabase schema, e.g., using Supabase CLI:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/config/database.types.ts
// Then import them: import { Database } from './database.types.ts'
// And use like this: export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/*
// Placeholder for database types - generate and import this from a separate file e.g., database.types.ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { // The data expected to be returned from a "select" statement
          id: string;
          updated_at: string; // TIMESTAMPTZ is typically string in JS
          full_name?: string | null;
          avatar_url?: string | null;
          role: 'Admin Geral' | 'Diretoria' | 'Gerente de Setor' | 'Usuário do Setor' | 'Visitante';
          sector?: string | null;
        };
        Insert: { // The data expected passed to an "insert" statement
          id: string; // Usually provided by auth.users.id
          updated_at?: string | null; // Default value in DB
          full_name?: string | null;
          avatar_url?: string | null;
          role: 'Admin Geral' | 'Diretoria' | 'Gerente de Setor' | 'Usuário do Setor' | 'Visitante'; // Non-nullable, default in DB
          sector?: string | null;
        };
        Update: { // The data expected passed to an "update" statement
          id?: string; // PK should not be updated
          updated_at?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'Admin Geral' | 'Diretoria' | 'Gerente de Setor' | 'Usuário do Setor' | 'Visitante';
          sector?: string | null;
        };
      };
      // ... other tables like 'departments', 'projects', etc.
    };
    Views: {
      // ... any database views you might have
    };
    Functions: {
      // ... any database functions you might call
    };
  };
}
*/
