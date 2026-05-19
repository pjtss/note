import { 
  LocalStorageScheduleService, 
  SupabaseScheduleService, 
  getScheduleService,
  isBrowser
} from '../services/scheduleService';
import { CreateScheduleInput, UpdateScheduleInput } from '../types/schedule';

// Node.js 글로벌 crypto.randomUUID 모킹
if (typeof global.crypto === 'undefined') {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'mock-uuid-1234'
    }
  });
} else if (typeof global.crypto.randomUUID === 'undefined') {
  Object.defineProperty(global.crypto, 'randomUUID', {
    value: () => 'mock-uuid-1234'
  });
}

// 1. Supabase 모킹 준비
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  }))
};

jest.mock('../lib/supabaseClient', () => {
  return {
    get isSupabaseConfigured() {
      return mockIsSupabaseConfigured;
    },
    get supabase() {
      return mockSupabaseInstance;
    }
  };
});

let mockIsSupabaseConfigured = false;
let mockSupabaseInstance: any = null;

describe('ScheduleService 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockIsSupabaseConfigured = false;
    mockSupabaseInstance = null;
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
          isCompleted: false
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
      mockIsSupabaseConfigured = true;
      mockSupabaseInstance = mockSupabaseClient;
      service = new SupabaseScheduleService();
    });

    test('Supabase 미초기화 시 getSchedules에서 에러가 throw 되어야 함', async () => {
      mockSupabaseInstance = null;
      await expect(service.getSchedules()).rejects.toThrow('Supabase 클라이언트가 초기화되지 않았습니다.');
    });

    test('Supabase 미초기화 시 createSchedule에서 에러가 throw 되어야 함', async () => {
      mockSupabaseInstance = null;
      await expect(service.createSchedule({} as any)).rejects.toThrow('Supabase 클라이언트가 초기화되지 않았습니다.');
    });

    test('Supabase 미초기화 시 updateSchedule에서 에러가 throw 되어야 함', async () => {
      mockSupabaseInstance = null;
      await expect(service.updateSchedule('1', {})).rejects.toThrow('Supabase 클라이언트가 초기화되지 않았습니다.');
    });

    test('Supabase 미초기화 시 deleteSchedule에서 에러가 throw 되어야 함', async () => {
      mockSupabaseInstance = null;
      await expect(service.deleteSchedule('1')).rejects.toThrow('Supabase 클라이언트가 초기화되지 않았습니다.');
    });

    test('getSchedules - Supabase 연동 데이터 조회 및 카멜케이스 변환 매핑 테스트', async () => {
      const mockRawData = [
        {
          id: 'sb-1',
          title: 'Supabase 일정 1',
          description: '설명',
          start_time: '2026-05-19T00:00:00Z',
          end_time: '2026-05-19T02:00:00Z',
          category: 'Work',
          is_completed: false,
          created_at: '2026-05-19T00:00:00Z'
        }
      ];

      mockSelect.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: mockRawData, error: null })
      });

      const result = await service.getSchedules();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('sb-1');
      expect(result[0].startTime).toBe('2026-05-19T00:00:00Z');
      expect(result[0].isCompleted).toBe(false);
    });

    test('getSchedules - DB에 데이터가 하나도 없을 시 빈 배열을 리턴해야 함 (Branch 100%용)', async () => {
      mockSelect.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: null, error: null })
      });

      const result = await service.getSchedules();
      expect(result).toEqual([]);
    });

    test('getSchedules - DB 에러 발생 시 에러가 throw 되어야 함', async () => {
      mockSelect.mockReturnValue({
        order: mockOrder.mockResolvedValue({ data: null, error: { message: 'DB Connection Fail' } })
      });

      await expect(service.getSchedules()).rejects.toEqual({ message: 'DB Connection Fail' });
    });

    test('createSchedule - Supabase 일정 신규 추가 테스트', async () => {
      const input: CreateScheduleInput = {
        title: '신규 Supabase 일정',
        description: '설명글',
        startTime: '2026-05-19T10:00:00Z',
        endTime: '2026-05-19T12:00:00Z',
        category: 'Work'
      };

      const mockInserted = {
        id: 'sb-new',
        title: input.title,
        description: input.description,
        start_time: input.startTime,
        end_time: input.endTime,
        category: input.category,
        is_completed: false,
        created_at: '2026-05-19T00:00:00Z'
      };

      mockInsert.mockReturnValue({
        select: jest.fn(() => ({
          single: mockSingle.mockResolvedValue({ data: mockInserted, error: null })
        }))
      });

      const result = await service.createSchedule(input);
      expect(result.id).toBe('sb-new');
      expect(result.title).toBe('신규 Supabase 일정');
      expect(result.startTime).toBe('2026-05-19T10:00:00Z');
    });

    test('createSchedule - DB 에러 시 throw 되어야 함', async () => {
      mockInsert.mockReturnValue({
        select: jest.fn(() => ({
          single: mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert Error' } })
        }))
      });

      await expect(service.createSchedule({} as any)).rejects.toEqual({ message: 'Insert Error' });
    });

    test('updateSchedule - Supabase 일정 업데이트 테스트 (일부 필드 누락 및 전체)', async () => {
      const input: UpdateScheduleInput = {
        title: '수정 완료',
        description: '설명 수정',
        startTime: '2026-05-19T11:00:00Z',
        endTime: '2026-05-19T13:00:00Z',
        category: 'Meeting',
        isCompleted: true
      };

      const mockUpdated = {
        id: 'sb-update',
        title: input.title,
        description: input.description,
        start_time: input.startTime,
        end_time: input.endTime,
        category: input.category,
        is_completed: input.isCompleted,
        created_at: '2026-05-19T00:00:00Z'
      };

      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({
          select: jest.fn(() => ({
            single: mockSingle.mockResolvedValue({ data: mockUpdated, error: null })
          }))
        })
      });

      const result = await service.updateSchedule('sb-update', input);
      expect(result.title).toBe('수정 완료');
      expect(result.isCompleted).toBe(true);

      const emptyResult = await service.updateSchedule('sb-update', {});
      expect(emptyResult.title).toBe('수정 완료');
    });

    test('updateSchedule - DB 에러 시 throw 되어야 함', async () => {
      mockUpdate.mockReturnValue({
        eq: mockEq.mockReturnValue({
          select: jest.fn(() => ({
            single: mockSingle.mockResolvedValue({ data: null, error: { message: 'Update Failed' } })
          }))
        })
      });

      await expect(service.updateSchedule('sb-id', {})).rejects.toEqual({ message: 'Update Failed' });
    });

    test('deleteSchedule - Supabase 일정 삭제 테스트', async () => {
      mockDelete.mockReturnValue({
        eq: mockEq.mockResolvedValue({ error: null })
      });

      await expect(service.deleteSchedule('sb-delete')).resolves.not.toThrow();
    });

    test('deleteSchedule - DB 에러 시 throw 되어야 함', async () => {
      mockDelete.mockReturnValue({
        eq: mockEq.mockResolvedValue({ error: { message: 'Delete Failed' } })
      });

      await expect(service.deleteSchedule('sb-delete')).rejects.toEqual({ message: 'Delete Failed' });
    });
  });

  describe('getScheduleService 팩토리 테스트', () => {
    test('Supabase 설정이 안 되어 있을 시 LocalStorageScheduleService를 리턴해야 함', () => {
      mockIsSupabaseConfigured = false;
      const service = getScheduleService();
      expect(service).toBeInstanceOf(LocalStorageScheduleService);
    });

    test('Supabase 설정이 활성화되어 있을 시 SupabaseScheduleService를 리턴해야 함', () => {
      mockIsSupabaseConfigured = true;
      const service = getScheduleService();
      expect(service).toBeInstanceOf(SupabaseScheduleService);
    });
  });
});
