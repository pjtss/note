import { Schedule, CreateScheduleInput, UpdateScheduleInput } from '../types/schedule';

export const isBrowser = {
  check: () => typeof window !== 'undefined'
};

export interface IScheduleService {
  getSchedules(): Promise<Schedule[]>;
  createSchedule(input: CreateScheduleInput): Promise<Schedule>;
  updateSchedule(id: string, input: UpdateScheduleInput): Promise<Schedule>;
  deleteSchedule(id: string): Promise<void>;
}

// 1. LocalStorage 기반 서비스 구현 (Supabase/PostgreSQL 연결 에러 시 프리미엄 Fallback)
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
          title: 'Prisma ORM 기반 PostgreSQL 연동 테스트',
          description: 'Direct Connection String 환경변수를 지정하여 서버사이드 Prisma ORM CRUD 연동 실전 테스트',
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

// 2. Next.js API Routes를 통해 서버사이드 Prisma ORM에 질의하는 클라이언트 서비스 구현
export class ApiScheduleService implements IScheduleService {
  async getSchedules(): Promise<Schedule[]> {
    const res = await fetch('/api/schedules');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '일정을 가져오는데 실패했습니다.');
    }
    return res.json();
  }

  async createSchedule(input: CreateScheduleInput): Promise<Schedule> {
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '일정을 생성하는데 실패했습니다.');
    }
    return res.json();
  }

  async updateSchedule(id: string, input: UpdateScheduleInput): Promise<Schedule> {
    const res = await fetch(`/api/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '일정을 수정하는데 실패했습니다.');
    }
    return res.json();
  }

  async deleteSchedule(id: string): Promise<void> {
    const res = await fetch(`/api/schedules/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '일정을 삭제하는데 실패했습니다.');
    }
  }
}

// 3. DI 및 환경에 따른 최적화 팩토리 패턴 정의
export function getScheduleService(): IScheduleService {
  // 브라우저 클라이언트 환경인 경우, API Routes ORM 레이어를 기본 기동시킴
  if (isBrowser.check()) {
    console.log('클라우드 ORM API 연동 활성화: ApiScheduleService 기동');
    return new ApiScheduleService();
  } else {
    console.log('로컬 스탠드얼론 모드: LocalStorageScheduleService 활성화');
    return new LocalStorageScheduleService();
  }
}
