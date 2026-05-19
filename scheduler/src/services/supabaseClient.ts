import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Supabase 클라이언트 초기화 함수 (테스트/SSR 빌드 환경 변수 부재 시 더미 fallback)
const createSupabaseClient = () => {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  return {
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: {}, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: {}, error: null }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) })
    })
  } as any;
};

export const supabase = createSupabaseClient();
