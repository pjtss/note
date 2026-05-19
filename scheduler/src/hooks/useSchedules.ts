import { useState, useEffect, useCallback, useMemo } from 'react';
import { Schedule, CreateScheduleInput, UpdateScheduleInput, ScheduleCategory } from '../types/schedule';
import { getScheduleService, SupabaseScheduleService } from '../services/scheduleService';

export function useSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 필터링 상태
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [completionFilter, setCompletionFilter] = useState<string>('All'); // 'All' | 'Completed' | 'Pending'
  const [searchQuery, setSearchQuery] = useState<string>('');

  const service = useMemo(() => getScheduleService(), []);
  
  // 전역 mock 모듈 캐싱 한계를 넘기 위해 인스턴스 검사로 activeServiceType 동적 판단
  const activeServiceType = useMemo(() => {
    return service instanceof SupabaseScheduleService ? 'Supabase' : 'LocalStorage';
  }, [service]);

  // 일정 조회
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.getSchedules();
      setSchedules(data);
    } catch (err: any) {
      setError(err.message || '일정을 가져오는 중 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  // 컴포넌트 마운트 시 데이터 fetch
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // 일정 추가
  const addSchedule = useCallback(async (input: CreateScheduleInput) => {
    setError(null);
    try {
      const newSchedule = await service.createSchedule(input);
      setSchedules(prev => {
        const next = [...prev, newSchedule];
        // 시작 시간 기준 오름차순 정렬
        return next.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      });
      return newSchedule;
    } catch (err: any) {
      setError(err.message || '일정을 추가하는 중 에러가 발생했습니다.');
      throw err;
    }
  }, [service]);

  // 일정 정보 업데이트 (수정)
  const updateScheduleDetails = useCallback(async (id: string, input: UpdateScheduleInput) => {
    setError(null);
    try {
      const updated = await service.updateSchedule(id, input);
      setSchedules(prev => 
        prev.map(s => s.id === id ? updated : s)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      );
      return updated;
    } catch (err: any) {
      setError(err.message || '일정을 수정하는 중 에러가 발생했습니다.');
      throw err;
    }
  }, [service]);

  // 일정 완료 상태 토글
  const toggleComplete = useCallback(async (id: string, currentStatus: boolean) => {
    setError(null);
    try {
      const updated = await service.updateSchedule(id, { isCompleted: !currentStatus });
      setSchedules(prev => prev.map(s => s.id === id ? updated : s));
    } catch (err: any) {
      setError(err.message || '일정 상태를 변경하는 중 에러가 발생했습니다.');
    }
  }, [service]);

  // 일정 삭제
  const removeSchedule = useCallback(async (id: string) => {
    setError(null);
    try {
      await service.deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setError(err.message || '일정을 삭제하는 중 에러가 발생했습니다.');
    }
  }, [service]);

  // 조건에 맞는 일정 필터링
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      // 1. 카테고리 필터
      if (categoryFilter !== 'All' && schedule.category !== categoryFilter) {
        return false;
      }
      // 2. 완료 여부 필터
      if (completionFilter === 'Completed' && !schedule.isCompleted) {
        return false;
      }
      if (completionFilter === 'Pending' && schedule.isCompleted) {
        return false;
      }
      // 3. 검색 쿼리 필터 (제목 또는 설명)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const titleMatch = schedule.title.toLowerCase().includes(query);
        const descMatch = schedule.description?.toLowerCase().includes(query) || false;
        if (!titleMatch && !descMatch) {
          return false;
        }
      }
      return true;
    });
  }, [schedules, categoryFilter, completionFilter, searchQuery]);

  return {
    schedules: filteredSchedules,
    rawSchedules: schedules, // 필터 안 된 원본 데이터 (통계 등에 활용)
    loading,
    error,
    activeServiceType,
    categoryFilter,
    setCategoryFilter,
    completionFilter,
    setCompletionFilter,
    searchQuery,
    setSearchQuery,
    fetchSchedules,
    addSchedule,
    updateScheduleDetails,
    toggleComplete,
    removeSchedule
  };
}
