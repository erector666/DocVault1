import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  user_id: string;
  category?: string;
  tags?: string[];
  ai_analysis?: any;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}
