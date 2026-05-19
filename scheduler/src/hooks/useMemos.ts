import { useState, useEffect, useCallback, useRef } from 'react';
import { Memo, CreateMemoInput, UpdateMemoInput } from '../types/memo';
import { getMemoService, IMemoService } from '../services/memoService';

export function useMemos() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const serviceRef = useRef<IMemoService | null>(null);

  const getService = useCallback((): IMemoService => {
    if (!serviceRef.current) {
      serviceRef.current = getMemoService();
    }
    return serviceRef.current;
  }, []);

  const fetchMemos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeService = getService();
      const data = await activeService.getMemos();
      setMemos(data);
    } catch (err: any) {
      setError(err.message || '메모 데이터를 가져오는 도중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [getService]);

  const addMemo = useCallback(async (input: CreateMemoInput) => {
    setError(null);
    try {
      const activeService = getService();
      const newMemo = await activeService.createMemo(input);
      setMemos(prev => [newMemo, ...prev]);
      return newMemo;
    } catch (err: any) {
      setError(err.message || '메모를 생성하는 과정에서 장해가 발생했습니다.');
      throw err;
    }
  }, [getService]);

  const editMemo = useCallback(async (id: string, input: UpdateMemoInput) => {
    setError(null);
    try {
      const activeService = getService();
      const updatedMemo = await activeService.updateMemo(id, input);
      setMemos(prev => prev.map(m => m.id === id ? updatedMemo : m));
      return updatedMemo;
    } catch (err: any) {
      setError(err.message || '메모를 업데이트하는 과정에서 장해가 발생했습니다.');
      throw err;
    }
  }, [getService]);

  const removeMemo = useCallback(async (id: string) => {
    setError(null);
    try {
      const activeService = getService();
      await activeService.deleteMemo(id);
      setMemos(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError(err.message || '메모를 삭제하는 과정에서 장해가 발생했습니다.');
      throw err;
    }
  }, [getService]);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  return {
    memos,
    loading,
    error,
    fetchMemos,
    addMemo,
    editMemo,
    removeMemo
  };
}
