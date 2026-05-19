import { Schedule, CreateScheduleInput, UpdateScheduleInput } from '../types/schedule';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const isBrowser = {
  check: () => typeof window !== 'undefined'
};

export interface IScheduleService {
  getSchedules(): Promise<Schedule[]>;
  createSchedule(input: CreateScheduleInput): Promise<Schedule>;
  updateSchedule(id: string, input: UpdateScheduleInput): Promise<Schedule>;
  deleteSchedule(id: string): Promise<void>;
}

// 1. LocalStorage 기반 서비스 구현 (Supabase가 설정되지 않았을 때의 프리미엄 Fallback)
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
          title: 'Supabase DB 테이블 연동 실전 테스트',
          description: 'Supabase console에서 schedules 테이블 생성 후 .env.local 연동 정보 추가 테스트',
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

// 2. Supabase 기반 서비스 구현
export class SupabaseScheduleService implements IScheduleService {
  async getSchedules(): Promise<Schedule[]> {
    if (!supabase) throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Supabase getSchedules error:', error);
      throw error;
    }

    // DB 스키마(snake_case)를 애플리케이션 모델(camelCase)로 매핑
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      startTime: item.start_time,
      endTime: item.end_time,
      category: item.category,
      isCompleted: item.is_completed,
      createdAt: item.created_at
    }));
  }

  async createSchedule(input: CreateScheduleInput): Promise<Schedule> {
    if (!supabase) throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');

    const { data, error } = await supabase
      .from('schedules')
      .insert([
        {
          title: input.title,
          description: input.description,
          start_time: input.startTime,
          end_time: input.endTime,
          category: input.category,
          is_completed: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase createSchedule error:', error);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      startTime: data.start_time,
      endTime: data.end_time,
      category: data.category,
      isCompleted: data.is_completed,
      createdAt: data.created_at
    };
  }

  async updateSchedule(id: string, input: UpdateScheduleInput): Promise<Schedule> {
    if (!supabase) throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');

    const updatePayload: any = {};
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.description !== undefined) updatePayload.description = input.description;
    if (input.startTime !== undefined) updatePayload.start_time = input.startTime;
    if (input.endTime !== undefined) updatePayload.end_time = input.endTime;
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.isCompleted !== undefined) updatePayload.is_completed = input.isCompleted;

    const { data, error } = await supabase
      .from('schedules')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase updateSchedule error:', error);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      startTime: data.start_time,
      endTime: data.end_time,
      category: data.category,
      isCompleted: data.is_completed,
      createdAt: data.created_at
    };
  }

  async deleteSchedule(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase deleteSchedule error:', error);
      throw error;
    }
  }
}

// 3. DI 및 환경에 따른 최적화 팩토리 패턴 정의
export function getScheduleService(): IScheduleService {
  if (isSupabaseConfigured) {
    console.log('Supabase가 감지되어 SupabaseScheduleService를 활성화합니다.');
    return new SupabaseScheduleService();
  } else {
    console.log('Supabase 환경 변수가 없습니다. LocalStorageScheduleService를 활성화합니다.');
    return new LocalStorageScheduleService();
  }
}

