import { 
  LocalStorageScheduleService, 
  ApiScheduleService, 
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

describe('ScheduleService 테스트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
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

  describe('ApiScheduleService 테스트', () => {
    let service: ApiScheduleService;
    let originalFetch: any;

    beforeEach(() => {
      service = new ApiScheduleService();
      originalFetch = global.fetch;
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    test('getSchedules - 성공 시 데이터가 그대로 반환되어야 함', async () => {
      const mockData = [{ id: '1', title: '일정 1', startTime: '...', endTime: '...', category: 'Work', isCompleted: false, createdAt: '...' }];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockData)
      });

      const res = await service.getSchedules();
      expect(res).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/schedules');
    });

    test('getSchedules - 실패 시 에러가 throw 되어야 함 (JSON 에러 메시지)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'DB 연결 에러' })
      });

      await expect(service.getSchedules()).rejects.toThrow('DB 연결 에러');
    });

    test('getSchedules - 실패 시 에러가 throw 되어야 함 (JSON 파싱 에러인 경우의 폴백)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('JSON Parse Error'))
      });

      await expect(service.getSchedules()).rejects.toThrow('일정을 가져오는데 실패했습니다.');
    });

    test('createSchedule - 성공 시 생성된 일정을 반환해야 함', async () => {
      const input: CreateScheduleInput = { title: '생성', startTime: '...', endTime: '...', category: 'Work' };
      const mockResult = { id: 'new-id', ...input, isCompleted: false, createdAt: '...' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResult)
      });

      const res = await service.createSchedule(input);
      expect(res).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
    });

    test('createSchedule - 실패 시 에러가 throw 되어야 함 (JSON 파싱 실패 대응)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Fail'))
      });

      await expect(service.createSchedule({} as any)).rejects.toThrow('일정을 생성하는데 실패했습니다.');
    });

    test('updateSchedule - 성공 시 업데이트된 일정을 반환해야 함', async () => {
      const input: UpdateScheduleInput = { title: '수정' };
      const mockResult = { id: 'id-1', title: '수정', startTime: '...', endTime: '...', category: 'Work', isCompleted: false, createdAt: '...' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResult)
      });

      const res = await service.updateSchedule('id-1', input);
      expect(res).toEqual(mockResult);
      expect(global.fetch).toHaveBeenCalledWith('/api/schedules/id-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
    });

    test('updateSchedule - 실패 시 에러가 throw 되어야 함 (JSON 파싱 실패 대응)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Fail'))
      });

      await expect(service.updateSchedule('id-1', {})).rejects.toThrow('일정을 수정하는데 실패했습니다.');
    });

    test('deleteSchedule - 성공 시 무리 없이 해결되어야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true
      });

      await expect(service.deleteSchedule('id-1')).resolves.not.toThrow();
      expect(global.fetch).toHaveBeenCalledWith('/api/schedules/id-1', {
        method: 'DELETE'
      });
    });

    test('deleteSchedule - 실패 시 에러가 throw 되어야 함 (JSON 파싱 실패 대응)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('Fail'))
      });

      await expect(service.deleteSchedule('id-1')).rejects.toThrow('일정을 삭제하는데 실패했습니다.');
    });
  });

  describe('getScheduleService 팩토리 테스트', () => {
    test('브라우저 환경인 경우 ApiScheduleService를 리턴해야 함', () => {
      const spy = jest.spyOn(isBrowser, 'check').mockReturnValue(true);
      const service = getScheduleService();
      expect(service).toBeInstanceOf(ApiScheduleService);
      spy.mockRestore();
    });

    test('브라우저 환경이 아닌 경우 LocalStorageScheduleService를 리턴해야 함', () => {
      const spy = jest.spyOn(isBrowser, 'check').mockReturnValue(false);
      const service = getScheduleService();
      expect(service).toBeInstanceOf(LocalStorageScheduleService);
      spy.mockRestore();
    });
  });
});
