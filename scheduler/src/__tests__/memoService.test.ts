import {
  LocalStorageMemoService,
  SupabaseMemoService,
  getMemoService
} from '../services/memoService';
import { supabase } from '../services/supabaseClient';
import { isBrowser } from '../services/scheduleService';

// 1. Supabase Client 모킹
jest.mock('../services/supabaseClient', () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      from: mockFrom
    }
  };
});

// 2. isBrowser 모킹
jest.mock('../services/scheduleService', () => {
  return {
    isBrowser: {
      check: jest.fn(() => true)
    }
  };
});

describe('MemoService 테스트', () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (isBrowser.check as jest.Mock).mockReturnValue(true);
  });

  describe('LocalStorageMemoService 테스트', () => {
    let service: LocalStorageMemoService;

    beforeEach(() => {
      service = new LocalStorageMemoService();
    });

    test('getMemos - 데이터가 없을 시 기본 데모 데이터를 탑재하고 반환해야 함', async () => {
      const memos = await service.getMemos();
      expect(memos.length).toBe(3);
      expect(memos[0].id).toBe('demo-memo-1');
    });

    test('getMemos - SSR 환경(isBrowser false)인 경우 빈 배열을 반환해야 함', async () => {
      (isBrowser.check as jest.Mock).mockReturnValue(false);
      const memos = await service.getMemos();
      expect(memos).toEqual([]);
    });

    test('getMemos - 데이터가 있을 시 로컬스토리지 데이터를 가져와야 함', async () => {
      const mockMemos = [{ id: 'm-1', title: '제목', content: '내용', color: '#fff', createdAt: '2026-05-20' }];
      localStorage.setItem('scheduler_memos', JSON.stringify(mockMemos));
      
      const memos = await service.getMemos();
      expect(memos).toEqual(mockMemos);
    });

    test('getMemos - JSON 파싱 실패 시 빈 배열을 반환해야 함', async () => {
      localStorage.setItem('scheduler_memos', 'invalid-json');
      const memos = await service.getMemos();
      expect(memos).toEqual([]);
    });

    test('createMemo - 성공 시 새 메모를 로컬스토리지에 추가하고 반환해야 함', async () => {
      const mockInput = { title: '새 글', content: '새 내용', color: '#ff0000' };
      const res = await service.createMemo(mockInput);
      
      expect(res.title).toBe(mockInput.title);
      expect(res.content).toBe(mockInput.content);
      expect(res.color).toBe(mockInput.color);
      expect(res.id).toBeDefined();

      const saved = await service.getMemos();
      // 기존 데모 3개 + 신규 1개 = 4개
      expect(saved.length).toBe(4);
    });

    test('createMemo - SSR 환경일 시 로컬스토리지 저장을 건너뛰어야 함 (Branch 용)', async () => {
      (isBrowser.check as jest.Mock).mockReturnValue(false);
      const mockInput = { title: '새 글', content: '새 내용', color: '#ff0000' };
      const res = await service.createMemo(mockInput);
      expect(res.id).toBeDefined();
    });

    test('updateMemo - 성공 시 메모 내용을 업데이트해야 함', async () => {
      // 데모 1번 수정 시도
      const updated = await service.updateMemo('demo-memo-1', { title: '수정제목' });
      expect(updated.title).toBe('수정제목');

      const saved = await service.getMemos();
      expect(saved.find(m => m.id === 'demo-memo-1')?.title).toBe('수정제목');
    });

    test('updateMemo - 메모가 존재하지 않을 시 에러를 throw 해야 함', async () => {
      await expect(service.updateMemo('invalid-id', { title: '수정' }))
        .rejects.toThrow('메모를 찾을 수 없습니다.');
    });

    test('deleteMemo - 성공 시 해당 메모를 삭제해야 함', async () => {
      await service.deleteMemo('demo-memo-1');
      const saved = await service.getMemos();
      expect(saved.find(m => m.id === 'demo-memo-1')).toBeUndefined();
    });

    test('deleteMemo - SSR 환경일 시 조용히 넘어가야 함 (Branch 용)', async () => {
      (isBrowser.check as jest.Mock).mockReturnValue(false);
      await service.deleteMemo('demo-memo-1');
    });
  });

  describe('SupabaseMemoService 테스트', () => {
    let service: SupabaseMemoService;
    let mockSelect: jest.Mock;
    let mockOrder: jest.Mock;
    let mockInsert: jest.Mock;
    let mockUpdate: jest.Mock;
    let mockDelete: jest.Mock;
    let mockEq: jest.Mock;
    let mockSingle: jest.Mock;

    beforeEach(() => {
      service = new SupabaseMemoService();

      mockSingle = jest.fn();
      mockOrder = jest.fn();
      mockEq = jest.fn().mockImplementation(() => {
        return {
          select: () => ({ single: mockSingle }),
          order: mockOrder
        };
      });
      mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
      mockInsert = jest.fn().mockReturnValue({ select: () => ({ single: mockSingle }) });
      mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete
      });
    });

    test('getMemos - 성공 시 조회 데이터를 리스트로 가공해 반환해야 함', async () => {
      const mockResult = [
        { id: 'm-1', title: '제목1', content: '내용1', color: '#ff0', createdAt: '2026-05-20' }
      ];
      mockOrder.mockResolvedValue({ data: mockResult, error: null });

      const memos = await service.getMemos();
      expect(memos).toEqual([
        { id: 'm-1', userId: undefined, title: '제목1', content: '내용1', color: '#ff0', isDeleted: false, createdAt: '2026-05-20' }
      ]);
    });

    test('getMemos - data가 null일 시 빈 배열을 반환해야 함 (Branch 100%용)', async () => {
      mockOrder.mockResolvedValue({ data: null, error: null });
      const memos = await service.getMemos();
      expect(memos).toEqual([]);
    });

    test('getMemos - 실패 시 에러가 throw 되어야 함', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'Memos Select Error' } });
      await expect(service.getMemos()).rejects.toThrow('Memos Select Error');
    });

    test('createMemo - 성공 시 생성된 메모를 반환해야 함', async () => {
      const mockInput = { title: '생성', content: '내용', color: '#fff' };
      const mockResult = { id: 'new-id', ...mockInput, createdAt: '2026-05-20' };
      mockSingle.mockResolvedValue({ data: mockResult, error: null });

      const res = await service.createMemo(mockInput);
      expect(res).toEqual({ id: 'new-id', userId: undefined, ...mockInput, isDeleted: false, createdAt: '2026-05-20' });
    });

    test('createMemo - 실패 시 에러가 throw 되어야 함', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Memos Insert Error' } });
      await expect(service.createMemo({ title: '', content: '', color: '' })).rejects.toThrow('Memos Insert Error');
    });

    test('updateMemo - 성공 시 업데이트된 메모를 반환해야 함', async () => {
      const mockInput = { title: '수정', content: '내용', color: '#fff' };
      const mockResult = { id: 'm-1', ...mockInput, createdAt: '2026-05-20' };
      mockSingle.mockResolvedValue({ data: mockResult, error: null });

      const res = await service.updateMemo('m-1', mockInput);
      expect(res).toEqual({ id: 'm-1', userId: undefined, ...mockInput, isDeleted: false, createdAt: '2026-05-20' });
    });

    test('updateMemo - 실패 시 에러가 throw 되어야 함', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Memos Update Error' } });
      await expect(service.updateMemo('m-1', {})).rejects.toThrow('Memos Update Error');
    });

    test('deleteMemo - 성공 시 무사히 삭제가 완료되어야 함', async () => {
      mockEq.mockResolvedValue({ error: null });
      await expect(service.deleteMemo('m-1')).resolves.not.toThrow();
    });

    test('deleteMemo - 실패 시 에러가 throw 되어야 함', async () => {
      mockEq.mockResolvedValue({ error: { message: 'Memos Delete Error' } });
      await expect(service.deleteMemo('m-1')).rejects.toThrow('Memos Delete Error');
    });
  });

  describe('getMemoService 팩토리 테스트', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('getMemoService - 브라우저 환경이 아닐 시 LocalStorageMemoService를 반환해야 함', () => {
      (isBrowser.check as jest.Mock).mockReturnValue(false);
      const service = getMemoService();
      expect(service).toBeInstanceOf(LocalStorageMemoService);
    });

    test('getMemoService - API 키 환경 변수가 없을 시 LocalStorageMemoService를 반환해야 함', () => {
      (isBrowser.check as jest.Mock).mockReturnValue(true);
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      const service = getMemoService();
      expect(service).toBeInstanceOf(LocalStorageMemoService);
    });

    test('getMemoService - API 키 환경 변수가 지정되어 있을 시 SupabaseMemoService를 반환해야 함', () => {
      (isBrowser.check as jest.Mock).mockReturnValue(true);
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon-key';

      const service = getMemoService();
      expect(service).toBeInstanceOf(SupabaseMemoService);
    });
  });
});
