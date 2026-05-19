import { renderHook, act } from '@testing-library/react';
import { useMemos } from '../hooks/useMemos';
import { getMemoService } from '../services/memoService';

// 1. getMemoService 모킹
jest.mock('../services/memoService', () => {
  const mockGetMemos = jest.fn();
  const mockCreateMemo = jest.fn();
  const mockUpdateMemo = jest.fn();
  const mockDeleteMemo = jest.fn();

  return {
    getMemoService: () => ({
      getMemos: mockGetMemos,
      createMemo: mockCreateMemo,
      updateMemo: mockUpdateMemo,
      deleteMemo: mockDeleteMemo
    })
  };
});

describe('useMemos 커스텀 훅 테스트', () => {
  const mockService = getMemoService();
  const mockGetMemos = mockService.getMemos as jest.Mock;
  const mockCreateMemo = mockService.createMemo as jest.Mock;
  const mockUpdateMemo = mockService.updateMemo as jest.Mock;
  const mockDeleteMemo = mockService.deleteMemo as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('초기 렌더링 시 메모 데이터를 성공적으로 가져와 상태에 반영해야 함', async () => {
    const mockMemos = [
      { id: 'm-1', title: '제목1', content: '내용1', color: '#ff0', createdAt: '2026-05-20' }
    ];
    mockGetMemos.mockResolvedValue(mockMemos);

    const { result } = renderHook(() => useMemos());

    // 로딩 활성화 상태 검증
    expect(result.current.loading).toBe(true);

    // 비동기 갱신 완료 대기
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.memos).toEqual(mockMemos);
    expect(result.current.error).toBeNull();
  });

  test('데이터 fetch 중 에러 발생 시 error 상태에 에러 메시지를 할당해야 함', async () => {
    mockGetMemos.mockRejectedValue(new Error('Fetch Failed'));

    const { result } = renderHook(() => useMemos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Fetch Failed');
  });

  test('addMemo - 성공 시 새 메모를 memos 리스트의 처음에 정상 추가해야 함', async () => {
    const mockMemos = [{ id: 'm-1', title: '제목1', content: '내용1', color: '#ff0', createdAt: '2026-05-20' }];
    mockGetMemos.mockResolvedValue(mockMemos);

    const { result } = renderHook(() => useMemos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const newMemo = { id: 'm-2', title: '새 글', content: '새 내용', color: '#fff', createdAt: '2026-05-20' };
    mockCreateMemo.mockResolvedValue(newMemo);

    let created;
    await act(async () => {
      created = await result.current.addMemo({ title: '새 글', content: '새 내용', color: '#fff' });
    });

    expect(created).toEqual(newMemo);
    // 새로 들어온 메모가 0번째 위치에 할당되었는지 검증
    expect(result.current.memos[0]).toEqual(newMemo);
    expect(result.current.memos.length).toBe(2);
  });

  test('addMemo - 실패 시 에러가 throw 되고 error 상태에 반영되어야 함', async () => {
    mockGetMemos.mockResolvedValue([]);
    const { result } = renderHook(() => useMemos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    mockCreateMemo.mockRejectedValue(new Error('Create Failed'));

    await act(async () => {
      await expect(result.current.addMemo({ title: '', content: '', color: '' }))
        .rejects.toThrow('Create Failed');
    });

    expect(result.current.error).toBe('Create Failed');
  });

  test('editMemo - 성공 시 상태에서 해당 메모를 찾아 정보를 업데이트해야 함', async () => {
    const mockMemos = [
      { id: 'm-1', title: '제목1', content: '내용1', color: '#ff0', createdAt: '2026-05-20' },
      { id: 'm-2', title: '제목2', content: '내용2', color: '#f0f', createdAt: '2026-05-20' }
    ];
    mockGetMemos.mockResolvedValue(mockMemos);

    const { result } = renderHook(() => useMemos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const updatedMemo = { id: 'm-1', title: '수정제목', content: '내용1', color: '#ff0', createdAt: '2026-05-20' };
    mockUpdateMemo.mockResolvedValue(updatedMemo);

    let res;
    await act(async () => {
      res = await result.current.editMemo('m-1', { title: '수정제목' });
    });

    expect(res).toEqual(updatedMemo);
    expect(result.current.memos.find(m => m.id === 'm-1')?.title).toBe('수정제목');
  });

  test('editMemo - 실패 시 에러가 throw 되고 error 상태에 반영되어야 함', async () => {
    mockGetMemos.mockResolvedValue([]);
    const { result } = renderHook(() => useMemos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    mockUpdateMemo.mockRejectedValue(new Error('Update Failed'));

    await act(async () => {
      await expect(result.current.editMemo('m-1', {}))
        .rejects.toThrow('Update Failed');
    });

    expect(result.current.error).toBe('Update Failed');
  });

  test('removeMemo - 성공 시 리스트에서 해당 메모가 제거되어야 함', async () => {
    const mockMemos = [
      { id: 'm-1', title: '제목1', content: '내용1', color: '#ff0', createdAt: '2026-05-20' }
    ];
    mockGetMemos.mockResolvedValue(mockMemos);

    const { result } = renderHook(() => useMemos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    mockDeleteMemo.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.removeMemo('m-1');
    });

    expect(result.current.memos.length).toBe(0);
  });

  test('removeMemo - 실패 시 에러가 throw 되고 error 상태에 반영되어야 함', async () => {
    mockGetMemos.mockResolvedValue([]);
    const { result } = renderHook(() => useMemos());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    mockDeleteMemo.mockRejectedValue(new Error('Delete Failed'));

    await act(async () => {
      await expect(result.current.removeMemo('m-1'))
        .rejects.toThrow('Delete Failed');
    });

    expect(result.current.error).toBe('Delete Failed');
  });
});
