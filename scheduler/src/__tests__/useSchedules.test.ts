import { renderHook, act } from '@testing-library/react';
import { useSchedules } from '../hooks/useSchedules';
import { getScheduleService, SupabaseScheduleService, LocalStorageScheduleService } from '../services/scheduleService';
import { Schedule, CreateScheduleInput } from '../types/schedule';

// 1. scheduleService 모킹
jest.mock('../services/scheduleService');

const mockGetSchedules = jest.fn();
const mockCreateSchedule = jest.fn();
const mockUpdateSchedule = jest.fn();
const mockDeleteSchedule = jest.fn();

// SupabaseScheduleService 인스턴스 분기 테스트를 위해 SupabaseScheduleService 프로토타입 상속 인스턴스 생성
const mockSupabaseServiceInstance = Object.create(SupabaseScheduleService.prototype);
mockSupabaseServiceInstance.getSchedules = mockGetSchedules;
mockSupabaseServiceInstance.createSchedule = mockCreateSchedule;
mockSupabaseServiceInstance.updateSchedule = mockUpdateSchedule;
mockSupabaseServiceInstance.deleteSchedule = mockDeleteSchedule;

// LocalStorage 인스턴스 분기 테스트를 위해 LocalStorageScheduleService 프로토타입 상속 인스턴스 생성
const mockLocalStorageServiceInstance = Object.create(LocalStorageScheduleService.prototype);
mockLocalStorageServiceInstance.getSchedules = mockGetSchedules;
mockLocalStorageServiceInstance.createSchedule = mockCreateSchedule;
mockLocalStorageServiceInstance.updateSchedule = mockUpdateSchedule;
mockLocalStorageServiceInstance.deleteSchedule = mockDeleteSchedule;

describe('useSchedules 커스텀 훅 테스트', () => {
  const dummySchedules: Schedule[] = [
    {
      id: 'id-1',
      title: '일정 1',
      description: '업무 관련 세부 설명',
      startTime: '2026-05-19T09:00:00Z',
      endTime: '2026-05-19T10:00:00Z',
      category: 'Work',
      isCompleted: false,
      createdAt: '2026-05-19T00:00:00Z'
    },
    {
      id: 'id-2',
      title: '일정 2',
      description: '개인 여가 시간',
      startTime: '2026-05-20T10:00:00Z',
      endTime: '2026-05-20T12:00:00Z',
      category: 'Personal',
      isCompleted: true,
      createdAt: '2026-05-19T00:00:00Z'
    },
    {
      id: 'id-3',
      title: '중요 발표 회의',
      description: '임원 대상 발표',
      startTime: '2026-05-21T14:00:00Z',
      endTime: '2026-05-21T15:30:00Z',
      category: 'Important',
      isCompleted: false,
      createdAt: '2026-05-19T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getScheduleService as jest.Mock).mockReturnValue(mockLocalStorageServiceInstance);
    mockGetSchedules.mockResolvedValue(dummySchedules);
  });

  test('마운트 시 일정 목록을 조회하여 적재하고 로딩을 종료해야 함 (LocalStorage 분기 확인)', async () => {
    let hookResult: any;
    
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    expect(mockGetSchedules).toHaveBeenCalledTimes(1);
    expect(hookResult.current.schedules.length).toBe(3);
    expect(hookResult.current.loading).toBe(false);
    expect(hookResult.current.activeServiceType).toBe('LocalStorage');
    expect(hookResult.current.error).toBeNull();
  });

  test('SupabaseScheduleService 서비스가 주입되었을 때 activeServiceType이 Supabase여야 함 (Branch 100%용)', async () => {
    (getScheduleService as jest.Mock).mockReturnValue(mockSupabaseServiceInstance);
    
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    expect(hookResult.current.activeServiceType).toBe('Supabase');
  });

  test('마운트 시 일정 조회 에러 발생 시 error 상태에 적재해야 함', async () => {
    mockGetSchedules.mockRejectedValue(new Error('데이터 로드 실패'));
    
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    expect(hookResult.current.loading).toBe(false);
    expect(hookResult.current.error).toBe('데이터 로드 실패');
  });

  test('마운트 시 message가 없는 에러 던졌을 때 기본 메시지가 들어가야 함 (Branch 100%용)', async () => {
    mockGetSchedules.mockRejectedValue({});
    
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    expect(hookResult.current.error).toBe('일정을 가져오는 중 에러가 발생했습니다.');
  });

  test('addSchedule - 일정 추가 후 목록이 정렬(startTime 기준)되어 업데이트되어야 함', async () => {
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    const newInput: CreateScheduleInput = {
      title: '새로 끼어드는 일정',
      startTime: '2026-05-19T15:00:00Z',
      endTime: '2026-05-19T16:00:00Z',
      category: 'Meeting'
    };

    const mockAdded: Schedule = {
      id: 'id-new',
      ...newInput,
      isCompleted: false,
      createdAt: '2026-05-19T00:00:00Z'
    };

    mockCreateSchedule.mockResolvedValue(mockAdded);

    await act(async () => {
      await hookResult.current.addSchedule(newInput);
    });

    expect(mockCreateSchedule).toHaveBeenCalledWith(newInput);
    expect(hookResult.current.schedules.length).toBe(4);
    expect(hookResult.current.schedules[1].id).toBe('id-new');
  });

  test('addSchedule - 에러 발생 시 error 상태에 저장하고 에러를 throw 해야 함', async () => {
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    mockCreateSchedule.mockRejectedValue(new Error('추가 실패'));

    await act(async () => {
      await expect(hookResult.current.addSchedule({} as any)).rejects.toThrow('추가 실패');
    });

    expect(hookResult.current.error).toBe('추가 실패');

    // message가 없는 에러 (Branch 100%용)
    mockCreateSchedule.mockRejectedValue({});
    await act(async () => {
      await expect(hookResult.current.addSchedule({} as any)).rejects.toEqual({});
    });
    expect(hookResult.current.error).toBe('일정을 추가하는 중 에러가 발생했습니다.');
  });

  test('updateScheduleDetails - 정보 수정 성공 시 schedules 목록이 갱신 및 재정렬되어야 함', async () => {
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    const updatedSchedule: Schedule = {
      ...dummySchedules[1],
      title: '완전 변경된 일정 2',
      startTime: '2026-05-18T10:00:00Z'
    };

    mockUpdateSchedule.mockResolvedValue(updatedSchedule);

    await act(async () => {
      await hookResult.current.updateScheduleDetails('id-2', { title: '완전 변경된 일정 2', startTime: '2026-05-18T10:00:00Z' });
    });

    expect(hookResult.current.schedules[0].id).toBe('id-2');
    expect(hookResult.current.schedules[0].title).toBe('완전 변경된 일정 2');
  });

  test('updateScheduleDetails - 에러 발생 시 error 상태에 저장하고 에러를 throw 해야 함', async () => {
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    mockUpdateSchedule.mockRejectedValue(new Error('수정 오류'));

    await act(async () => {
      await expect(hookResult.current.updateScheduleDetails('id-1', {})).rejects.toThrow('수정 오류');
    });

    expect(hookResult.current.error).toBe('수정 오류');

    // message가 없는 에러 (Branch 100%용)
    mockUpdateSchedule.mockRejectedValue({});
    await act(async () => {
      await expect(hookResult.current.updateScheduleDetails('id-1', {})).rejects.toEqual({});
    });
    expect(hookResult.current.error).toBe('일정을 수정하는 중 에러가 발생했습니다.');
  });

  test('toggleComplete - 완료 여부 토글 성공 시 schedules 상태가 올바르게 업데이트되어야 함', async () => {
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    const updated: Schedule = {
      ...dummySchedules[0],
      isCompleted: true
    };

    mockUpdateSchedule.mockResolvedValue(updated);

    await act(async () => {
      await hookResult.current.toggleComplete('id-1', false);
    });

    expect(mockUpdateSchedule).toHaveBeenCalledWith('id-1', { isCompleted: true });
    expect(hookResult.current.schedules.find((s: any) => s.id === 'id-1')?.isCompleted).toBe(true);
  });

  test('toggleComplete - 에러 발생 시 error 상태에 에러가 기록되어야 함', async () => {
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    mockUpdateSchedule.mockRejectedValue(new Error('토글 에러'));

    await act(async () => {
      await hookResult.current.toggleComplete('id-1', false);
    });

    expect(hookResult.current.error).toBe('토글 에러');

    // message가 없는 에러 (Branch 100%용)
    mockUpdateSchedule.mockRejectedValue({});
    await act(async () => {
      await hookResult.current.toggleComplete('id-1', false);
    });
    expect(hookResult.current.error).toBe('일정 상태를 변경하는 중 에러가 발생했습니다.');
  });

  test('removeSchedule - 일정 삭제 성공 시 목록에서 제외되어야 함', async () => {
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    mockDeleteSchedule.mockResolvedValue(undefined);

    await act(async () => {
      await hookResult.current.removeSchedule('id-3');
    });

    expect(mockDeleteSchedule).toHaveBeenCalledWith('id-3');
    expect(hookResult.current.schedules.length).toBe(2);
    expect(hookResult.current.schedules.find((s: any) => s.id === 'id-3')).toBeUndefined();
  });

  test('removeSchedule - 에러 발생 시 error 상태에 에러가 기록되어야 함', async () => {
    let hookResult: any;
    await act(async () => {
      const { result } = renderHook(() => useSchedules());
      hookResult = result;
    });

    mockDeleteSchedule.mockRejectedValue(new Error('삭제 불가'));

    await act(async () => {
      await hookResult.current.removeSchedule('id-3');
    });

    expect(hookResult.current.error).toBe('삭제 불가');

    // message가 없는 에러 (Branch 100%용)
    mockDeleteSchedule.mockRejectedValue({});
    await act(async () => {
      await hookResult.current.removeSchedule('id-3');
    });
    expect(hookResult.current.error).toBe('일정을 삭제하는 중 에러가 발생했습니다.');
  });

  describe('필터링 비즈니스 로직 검증', () => {
    test('categoryFilter - 특정 카테고리 설정 시 올바르게 걸러지는지 검증', async () => {
      let hookResult: any;
      await act(async () => {
        const { result } = renderHook(() => useSchedules());
        hookResult = result;
      });

      act(() => {
        hookResult.current.setCategoryFilter('Work');
      });

      expect(hookResult.current.schedules.length).toBe(1);
      expect(hookResult.current.schedules[0].id).toBe('id-1');
    });

    test('completionFilter - 완료 상태 필터 검증 (Completed & Pending)', async () => {
      let hookResult: any;
      await act(async () => {
        const { result } = renderHook(() => useSchedules());
        hookResult = result;
      });

      act(() => {
        hookResult.current.setCompletionFilter('Completed');
      });
      expect(hookResult.current.schedules.length).toBe(1);
      expect(hookResult.current.schedules[0].id).toBe('id-2');

      act(() => {
        hookResult.current.setCompletionFilter('Pending');
      });
      expect(hookResult.current.schedules.length).toBe(2);
      expect(hookResult.current.schedules.find((s: any) => s.id === 'id-2')).toBeUndefined();
    });

    test('searchQuery - 검색 기능 검증 (제목 매칭 & 설명 매칭)', async () => {
      let hookResult: any;
      await act(async () => {
        const { result } = renderHook(() => useSchedules());
        hookResult = result;
      });

      act(() => {
        hookResult.current.setSearchQuery('중요 발표');
      });
      expect(hookResult.current.schedules.length).toBe(1);
      expect(hookResult.current.schedules[0].id).toBe('id-3');

      act(() => {
        hookResult.current.setSearchQuery('여가 시간');
      });
      expect(hookResult.current.schedules.length).toBe(1);
      expect(hookResult.current.schedules[0].id).toBe('id-2');

      act(() => {
        hookResult.current.setSearchQuery('아무것도없는검색어');
      });
      expect(hookResult.current.schedules.length).toBe(0);
    });
  });
});
