"use client";

import { useState, useEffect } from 'react';
import { ScheduleCategory, Schedule } from '../types/schedule';

type UseScheduleFormProps = {
  addSchedule: (schedule: any) => Promise<any>;
  updateScheduleDetails: (id: string, details: any) => Promise<any>;
  userId: string | undefined;
  setIsScheduleModalOpen: (open: boolean) => void;
  showToast: (message: string) => void;
};

export function useScheduleForm({
  addSchedule,
  updateScheduleDetails,
  userId,
  setIsScheduleModalOpen,
  showToast
}: UseScheduleFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTimeVal, setStartTimeVal] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTimeVal, setEndTimeVal] = useState('');
  const [hasTime, setHasTime] = useState(false);
  const [category, setCategory] = useState<ScheduleCategory>('Work');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // UTC와 로컬 시간 변환을 위한 병합 도구
  const getUtcTimes = () => {
    let startIso = '';
    let endIso = '';

    if (hasTime) {
      const startLocal = new Date(`${startDate}T${startTimeVal || '00:00'}:00`);
      const endLocal = new Date(`${endDate}T${endTimeVal || '00:00'}:00`);
      startIso = isNaN(startLocal.getTime()) ? new Date().toISOString() : startLocal.toISOString();
      endIso = isNaN(endLocal.getTime()) ? new Date().toISOString() : endLocal.toISOString();
    } else {
      const startLocal = new Date(`${startDate}T00:00:00`);
      const endLocal = new Date(`${endDate}T00:00:00`);
      startIso = isNaN(startLocal.getTime()) ? new Date().toISOString() : startLocal.toISOString();
      endIso = isNaN(endLocal.getTime()) ? new Date().toISOString() : endLocal.toISOString();
    }

    return { startIso, endIso };
  };

  useEffect(() => {
    // 기본 날짜 시간 설정 (로컬 브라우저 타임존 기준)
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    
    const formatDateStr = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const formatTimeStr = (date: Date) => {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    setStartDate(formatDateStr(start));
    setEndDate(formatDateStr(end));
    setStartTimeVal(formatTimeStr(start));
    setEndTimeVal(formatTimeStr(end));
    setHasTime(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    try {
      const { startIso, endIso } = getUtcTimes();

      if (editingScheduleId) {
        await updateScheduleDetails(editingScheduleId, {
          title,
          description,
          startTime: startIso,
          endTime: endIso,
          category,
          hasTime
        });
        setEditingScheduleId(null);
      } else {
        await addSchedule({
          title,
          description,
          startTime: startIso,
          endTime: endIso,
          category,
          userId,
          hasTime
        } as any);
      }

      // 폼 초기화
      setTitle('');
      setDescription('');
      
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const formatDateStr = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };
      const formatTimeStr = (date: Date) => {
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      };

      setStartDate(formatDateStr(start));
      setEndDate(formatDateStr(end));
      setStartTimeVal(formatTimeStr(start));
      setEndTimeVal(formatTimeStr(end));
      setHasTime(false);
      setCategory('Work');
      setIsScheduleModalOpen(false);
    } catch (err) {
      // 에러 자동 처리
    }
  };

  const handleSaveScheduleOnly = async () => {
    if (!editingScheduleId || !title.trim() || !startDate || !endDate) return;
    try {
      const { startIso, endIso } = getUtcTimes();
      await updateScheduleDetails(editingScheduleId, {
        title,
        description,
        startTime: startIso,
        endTime: endIso,
        category,
        hasTime
      });
      showToast('💾 일정 변경 사항이 저장되었습니다.');
    } catch (err) {
      showToast('❌ 일정 저장 중 오류가 발생했습니다.');
    }
  };

  const handleStartEdit = (schedule: Schedule) => {
    setEditingScheduleId(schedule.id);
    setTitle(schedule.title);
    setDescription(schedule.description || '');
    setCategory(schedule.category);
    setHasTime(schedule.hasTime);

    const dateObj = new Date(schedule.startTime);
    const endDateObj = new Date(schedule.endTime);

    const formatDateStr = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const formatTimeStr = (date: Date) => {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    setStartDate(formatDateStr(dateObj));
    setEndDate(formatDateStr(endDateObj));
    setStartTimeVal(formatTimeStr(dateObj));
    setEndTimeVal(formatTimeStr(endDateObj));
    
    setIsScheduleModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingScheduleId(null);
    setTitle('');
    setDescription('');
    
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const formatDateStr = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    const formatTimeStr = (date: Date) => {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    setStartDate(formatDateStr(start));
    setEndDate(formatDateStr(end));
    setStartTimeVal(formatTimeStr(start));
    setEndTimeVal(formatTimeStr(end));
    setHasTime(false);
    setCategory('Work');
    setIsScheduleModalOpen(false);
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    startDate,
    setStartDate,
    startTimeVal,
    setStartTimeVal,
    endDate,
    setEndDate,
    endTimeVal,
    setEndTimeVal,
    hasTime,
    setHasTime,
    category,
    setCategory,
    editingScheduleId,
    setEditingScheduleId,
    handleSubmit,
    handleSaveScheduleOnly,
    handleStartEdit,
    handleCancelEdit
  };
}
