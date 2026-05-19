import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = 
  supabaseUrl.trim() !== '' && 
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey.trim() !== '' && 
  supabaseAnonKey !== 'your_supabase_anon_key';

// Supabase 클라이언트 생성 (비어있을 때는 null 또는 가짜 객체를 리턴하여 에러를 막음)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
