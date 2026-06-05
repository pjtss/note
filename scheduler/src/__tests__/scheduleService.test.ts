process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test-url.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';

import { 
  LocalStorageScheduleService, 
  SupabaseScheduleService, 
  getScheduleService,
  isBrowser
} from '../services/scheduleService';
import { supabase } from '../services/supabaseClient';
import { CreateScheduleInput, UpdateScheduleInput } from '../types/schedule';

// Node.js 글로벌 crypto.randomUUID 모킹
if (typeof global.crypto === 'undefined') {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'mock-uuid-1234'
    }
  });
} else if (typeof global.crypto.randomUUID === 'undefined') {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'mock-uuid-1234'
    }
  });
}

// Supabase JS Client 체이닝 메소드 모킹을 위한 Spy 객체 정의
const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const mockOrder = jest.fn();
const mockSelect = jest.fn();
const mockDelete = jest.fn();

describe('ScheduleService 테스트', () => {
  let originalEnv: any;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    originalEnv = { ...process.env };

    // Supabase 모킹 체이닝 팩토리 설정
    jest.spyOn(supabase, 'from').mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete
    } as any);

    mockSelect.mockReturnValue({ order: mockOrder } as any);
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) } as any);
    mockUpdate.mockReturnValue({ eq: mockEq } as any);
    mockEq.mockReturnValue({ select: () => ({ single: mockSingle }) } as any);
    mockDelete.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) } as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('LocalStorageScheduleService 테스트', () => {
    let service: LocalStorageScheduleService;

    beforeEach(() => {
      service = new LocalStorageScheduleService();
    });

    test('window가 undefined인 SSR 환경 대응 (isBrowser 모킹을 통한 100% 브랜치 커버리지)', async () => {
      const spy = jest.spyOn(isBrowser, 'check').mockReturnValue(false);

      const ssrService = new LocalStorageScheduleService();
      const schedules = await ssrService.getSchedules();
      expect(schedules).toEqual([]);

      const input: CreateScheduleInput = {
        title: 'SSR 테스트 일정',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        category: 'Work'
      };
      
      const created = await ssrService.createSchedule(input);
      expect(created.title).toBe('SSR 테스트 일정');

      spy.mockRestore();
    });

    test('getSchedules - 최초 호출 시 데모 데이터가 반환되고 로컬 스토리지에 저장되어야 함', async () => {
      const schedules = await service.getSchedules();
      expect(schedules.length).toBe(3);
      expect(schedules[0].id).toBe('demo-1');
      expect(localStorage.getItem('scheduler_schedules')).not.toBeNull();
    });

    test('getSchedules - 저장된 데이터가 있을 시 데이터를 그대로 파싱해서 반환해야 함', async () => {
      const mockData = [
        {
          id: 'test-1',
          title: '테스트 일정 1',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          category: 'Work',
          isCompleted: false,
          hasTime: true
        }
      ];
      localStorage.setItem('scheduler_schedules', JSON.stringify(mockData));

      const schedules = await service.getSchedules();
      expect(schedules.length).toBe(1);
      expect(schedules[0].title).toBe('테스트 일정 1');
    });

    test('getSchedules - 로컬 스토리지 파싱 에러 발생 시 빈 배열을 반환해야 함', async () => {
      localStorage.setItem('scheduler_schedules', 'invalid-json-{');
      const schedules = await service.getSchedules();
      expect(schedules.length).toBe(0);
    });

    test('createSchedule - 새로운 일정이 정상적으로 등록되어야 함', async () => {
      const input: CreateScheduleInput = {
        title: '신규 공부 일정',
        description: 'Next.js 16 공식 문서 독해',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        category: 'Personal'
      };

      const result = await service.createSchedule(input);
      expect(result.id).toBeDefined();
      expect(result.title).toBe('신규 공부 일정');
      expect(result.isCompleted).toBe(false);

      const saved = await service.getSchedules();
      expect(saved.length).toBe(4);
    });

    test('updateSchedule - 기존 일정이 정상적으로 업데이트되어야 함', async () => {
      await service.getSchedules();

      const updateInput: UpdateScheduleInput = {
        title: '수정된 제목',
        isCompleted: true
      };

      const updated = await service.updateSchedule('demo-2', updateInput);
      expect(updated.title).toBe('수정된 제목');
      expect(updated.isCompleted).toBe(true);

      const saved = await service.getSchedules();
      const demo2 = saved.find(s => s.id === 'demo-2');
      expect(demo2?.title).toBe('수정된 제목');
    });

    test('updateSchedule - 존재하지 않는 ID 수정 시 에러를 반환해야 함', async () => {
      await service.getSchedules();
      await expect(service.updateSchedule('non-existent', { title: '에러 확인' }))
        .rejects.toThrow('일정을 찾을 수 없습니다.');
    });

    test('deleteSchedule - 일정이 목록에서 정상적으로 제거되어야 함', async () => {
      await service.getSchedules();
      await service.deleteSchedule('demo-1');

      const saved = await service.getSchedules();
      expect(saved.length).toBe(2);
      expect(saved.find(s => s.id === 'demo-1')).toBeUndefined();
    });
  });

  describe('SupabaseScheduleService 테스트', () => {
    let service: SupabaseScheduleService;

    beforeEach(() => {
      service = new SupabaseScheduleService();
    });

    test('getSchedules - 성공 시 데이터가 그대로 반환되어야 함', async () => {
      const mockData = [
        { id: '1', title: '일정 1', description: '', startTime: '...', endTime: '...', category: 'Work', isCompleted: false, createdAt: '...', hasTime: true },
        { id: '2', title: '일정 2', description: '', startTime: '...', endTime: '...', category: 'Work', isCompleted: false, createdAt: '...' }
      ];
      mockOrder.mockResolvedValue({ data: mockData, error: null });

      const res = await service.getSchedules();
      expect(res.length).toBe(2);
      expect(res[0].hasTime).toBe(true);
      expect(res[1].hasTime).toBe(true);
    });

    test('getSchedules - data가 null일 시 빈 배열을 반환해야 함 (Branch 100%용)', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });
      const res = await service.getSchedules();
      expect(res).toEqual([]);
    });

    test('getSchedules - 실패 시 에러가 throw 되어야 함', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'Supabase Select Error' } });
      await expect(service.getSchedules()).rejects.toThrow('Supabase Select Error');
    });

    test('createSchedule - 성공 시 생성된 일정을 반환해야 함', async () => {
      const input: CreateScheduleInput = { title: '생성', description: '', startTime: '...', endTime: '...', category: 'Work' };
      const mockResult = { id: 'new-id', ...input, isCompleted: false, createdAt: '...', hasTime: true };
      mockSingle.mockResolvedValue({ data: mockResult, error: null });

      const res = await service.createSchedule(input);
      expect(res).toEqual(mockResult);
    });

    test('createSchedule - hasTime이 명시적으로 false로 주어졌을 때 정상 반영되어야 함', async () => {
      const input: CreateScheduleInput = { title: '생성', description: '', startTime: '...', endTime: '...', category: 'Work', hasTime: false };
      const mockResult = { id: 'new-id', ...input, isCompleted: false, createdAt: '...', hasTime: false };
      mockSingle.mockResolvedValue({ data: mockResult, error: null });

      const res = await service.createSchedule(input);
      expect(res.hasTime).toBe(false);
    });

    test('createSchedule - 실패 시 에러가 throw 되어야 함', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert Fail' } });
      await expect(service.createSchedule({} as any)).rejects.toThrow('Insert Fail');
    });

    test('updateSchedule - 성공 시 업데이트된 일정을 반환해야 함', async () => {
      const input: UpdateScheduleInput = { title: '수정', description: '', hasTime: true };
      const mockResult = { id: 'id-1', title: '수정', description: '', startTime: '...', endTime: '...', category: 'Work', isCompleted: false, createdAt: '...', hasTime: true };
      mockSingle.mockResolvedValue({ data: mockResult, error: null });

      const res = await service.updateSchedule('id-1', input);
      expect(res).toEqual(mockResult);
    });

    test('updateSchedule - 실패 시 에러가 throw 되어야 함', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Update Fail' } });
      await expect(service.updateSchedule('id-1', {})).rejects.toThrow('Update Fail');
    });

    test('deleteSchedule - 성공 시 무리 없이 해결되어야 함', async () => {
      mockDelete.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      } as any);

      await expect(service.deleteSchedule('id-1')).resolves.not.toThrow();
    });

    test('deleteSchedule - 실패 시 에러가 throw 되어야 함', async () => {
      mockDelete.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete Fail' } })
      } as any);

      await expect(service.deleteSchedule('id-1')).rejects.toThrow('Delete Fail');
    });
  });

  describe('getScheduleService 팩토리 테스트', () => {
    test('브라우저 환경이고 Supabase Key가 있을 시 SupabaseScheduleService를 리턴해야 함', () => {
      const spy = jest.spyOn(isBrowser, 'check').mockReturnValue(true);
      
      // 임시로 환경 변수 강제 설정 효과 부여
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test-url.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';

      const service = getScheduleService();
      // Supabase URL이 세팅되어 있으므로 SupabaseScheduleService 여부 검증
      expect(service).toBeInstanceOf(SupabaseScheduleService);
      spy.mockRestore();
    });

    test('브라우저 환경이고 Supabase Key가 없을 시 LocalStorageScheduleService를 리턴해야 함 (Branch 100%용)', () => {
      const spy = jest.spyOn(isBrowser, 'check').mockReturnValue(true);
      
      // 임시로 환경 변수 제거 효과 부여
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      const service = getScheduleService();
      expect(service).toBeInstanceOf(LocalStorageScheduleService);
      spy.mockRestore();
    });

    test('브라우저 환경이 아닐 경우 LocalStorageScheduleService를 리턴해야 함', () => {
      const spy = jest.spyOn(isBrowser, 'check').mockReturnValue(false);
      const service = getScheduleService();
      expect(service).toBeInstanceOf(LocalStorageScheduleService);
      spy.mockRestore();
    });

    test('환경 변수가 없을 시 더미 supabase 객체 체이닝 동작 검증 (Branch 100%용)', async () => {
      // 1. Jest 모듈 캐시 전격 리셋
      jest.resetModules();

      // 2. 환경 변수가 아예 없는 상황 세팅
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      // 3. 테스트 스파이를 잠시 해제하여 실제 파일 내부 더미 supabase 동작 타깃
      jest.restoreAllMocks();

      // 4. 모듈을 생으로 격리해서 다시 읽어오기
      const freshModule = require('../services/supabaseClient');
      const dummySupabase = freshModule.supabase;
      
      const resSelect = await dummySupabase.from('schedules').select().order();
      expect(resSelect.data).toEqual([]);

      const resInsert = await dummySupabase.from('schedules').insert([]).select().single();
      expect(resInsert.data).toEqual({});

      const resUpdate = await dummySupabase.from('schedules').update({}).eq('id', '1').select().single();
      expect(resUpdate.data).toEqual({});

      const resDelete = await dummySupabase.from('schedules').delete().eq('id', '1');
      expect(resDelete.error).toBeNull();
    });
  });
});
