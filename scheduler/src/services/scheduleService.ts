import { Schedule, CreateScheduleInput, UpdateScheduleInput } from '../types/schedule';
import { supabase } from './supabaseClient';

export const isBrowser = {
  check: () => typeof window !== 'undefined'
};

export interface IScheduleService {
  getSchedules(): Promise<Schedule[]>;
  createSchedule(input: CreateScheduleInput): Promise<Schedule>;
  updateSchedule(id: string, input: UpdateScheduleInput): Promise<Schedule>;
  deleteSchedule(id: string): Promise<void>;
}

// 1. LocalStorage 기반 서비스 구현 (Supabase 연결 에러 시 프리미엄 Fallback)
export class LocalStorageScheduleService implements IScheduleService {
  private STORAGE_KEY = 'scheduler_schedules';

  private getRawSchedules(): Schedule[] {
    if (!isBrowser.check()) return [];
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      // 초기 데모 데이터 제공
      const demoData: Schedule[] = [
        {
          id: 'demo-1',
          title: 'Next.js 일정 관리 앱 기획 및 설계',
          description: '테스트 최적화 아키텍처 규칙을 적용한 Next.js 프로젝트 초기 세팅과 Supabase 연동 설계',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          category: 'Work',
          isCompleted: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo-2',
          title: '부트스트랩 테마 적용 & 세련된 UI 스타일링',
          description: 'Bootstrap 5와 Vanilla CSS를 활용한 다크 모드 감성 및 세련된 일정 대시보드 구축',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          category: 'Personal',
          isCompleted: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo-3',
          title: 'Supabase 클라우드 SDK 실시간 테스트',
          description: 'NEXT_PUBLIC_SUPABASE_URL 환경변수를 지정하여 클라우드 Supabase CRUD 연동 실전 테스트',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
          category: 'Important',
          isCompleted: false,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(demoData));
      return demoData;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveRawSchedules(schedules: Schedule[]) {
    if (!isBrowser.check()) return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(schedules));
  }

  async getSchedules(): Promise<Schedule[]> {
    return this.getRawSchedules();
  }

  async createSchedule(input: CreateScheduleInput): Promise<Schedule> {
    const schedules = this.getRawSchedules();
    const newSchedule: Schedule = {
      id: crypto.randomUUID(),
      userId: input.userId,
      title: input.title,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
      category: input.category,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };
    schedules.push(newSchedule);
    this.saveRawSchedules(schedules);
    return newSchedule;
  }

  async updateSchedule(id: string, input: UpdateScheduleInput): Promise<Schedule> {
    const schedules = this.getRawSchedules();
    const idx = schedules.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('일정을 찾을 수 없습니다.');
    
    schedules[idx] = {
      ...schedules[idx],
      ...input
    };
    this.saveRawSchedules(schedules);
    return schedules[idx];
  }

  async deleteSchedule(id: string): Promise<void> {
    const schedules = this.getRawSchedules();
    const filtered = schedules.filter(s => s.id !== id);
    this.saveRawSchedules(filtered);
  }
}

// 2. Supabase JS SDK 기반 실시간 데이터베이스 연동 서비스 구현
export class SupabaseScheduleService implements IScheduleService {
  async getSchedules(): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('startTime', { ascending: true });
    
    if (error) throw new Error(error.message);
    return (data || []).map((item: any) => ({
      id: item.id,
      userId: item.userId,
      title: item.title,
      description: item.description || '',
      startTime: item.startTime,
      endTime: item.endTime,
      category: item.category,
      isCompleted: item.isCompleted,
      createdAt: item.createdAt
    }));
  }

  async createSchedule(input: CreateScheduleInput): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert([
        {
          id: crypto.randomUUID(),
          userId: input.userId,
          title: input.title,
          description: input.description,
          startTime: input.startTime,
          endTime: input.endTime,
          category: input.category,
          isCompleted: false
        }
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      userId: data.userId,
      title: data.title,
      description: data.description || '',
      startTime: data.startTime,
      endTime: data.endTime,
      category: data.category,
      isCompleted: data.isCompleted,
      createdAt: data.createdAt
    };
  }

  async updateSchedule(id: string, input: UpdateScheduleInput): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      userId: data.userId,
      title: data.title,
      description: data.description || '',
      startTime: data.startTime,
      endTime: data.endTime,
      category: data.category,
      isCompleted: data.isCompleted,
      createdAt: data.createdAt
    };
  }

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}

// 3. DI 및 환경에 따른 최적화 팩토리 패턴 정의 (동적 실시간 환경 변수 판별 지원)
export function getScheduleService(): IScheduleService {
  if (isBrowser.check()) {
    const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const currentAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    // Supabase API 키가 동적으로 주입되어 있을 때만 Supabase 연동 활성화
    if (currentUrl && currentAnonKey) {
      console.log('클라우드 Supabase API 연동 활성화: SupabaseScheduleService 기동');
      return new SupabaseScheduleService();
    }
  }
  console.log('로컬 스탠드얼론 모드: LocalStorageScheduleService 활성화');
  return new LocalStorageScheduleService();
}
