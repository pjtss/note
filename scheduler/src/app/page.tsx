"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { useSchedules } from '../hooks/useSchedules';
import { ScheduleCategory, Schedule } from '../types/schedule';
import { useMemos } from '../hooks/useMemos';
import { Memo } from '../types/memo';
import { useAuth } from '../hooks/useAuth';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { ScheduleSection } from '../components/ScheduleSection';
import { MemoSection } from '../components/MemoSection';
import { ScheduleModal as ScheduleModalView } from '../components/ScheduleModal';
import { MemoModal as MemoModalView } from '../components/MemoModal';
import {
  pastelColors as pastelColorsData,
  fontOptions as fontOptionsData,
  checkIfDarkColor as checkIfDarkColorUtil,
  hexToRgba as hexToRgbaUtil,
  getSelectedFontCss as getSelectedFontCssUtil,
  createSlashSuggestions as createSlashSuggestionsUtil,
  slashCommands as slashCommandsData
} from '../lib/editorUi';

type ScheduleModalProps = {
  open: boolean;
  editingScheduleId: string | null;
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  hasTime: boolean;
  setHasTime: (value: boolean) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  startTimeVal: string;
  setStartTimeVal: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  endTimeVal: string;
  setEndTimeVal: (value: string) => void;
  category: ScheduleCategory;
  setCategory: (value: ScheduleCategory) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onSaveOnly: () => void;
};

type MemoModalProps = {
  open: boolean;
  editingMemoId: string | null;
  memoTitle: string;
  setMemoTitle: (value: string) => void;
  memoContent: string;
  setMemoContent: (value: string) => void;
  memoColor: string;
  setMemoColor: (value: string) => void;
  selectedFont: string;
  handleFontChange: (value: string) => void;
  memoSuggestionsVisible: boolean;
  selectedSlashSuggestionIndex: number;
  slashSuggestions: { label: string; insert: string }[];
  insertSlashCommand: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onSaveOnly: () => void;
  handleCancelMemoEdit: () => void;
  pastelColors: { hex: string; name: string }[];
  fontOptions: { value: string; name: string }[];
  checkIfDarkColor: (hex: string) => boolean;
  memoError: string | null;
};

function ScheduleModal({
  open,
  editingScheduleId,
  title,
  setTitle,
  description,
  setDescription,
  hasTime,
  setHasTime,
  startDate,
  setStartDate,
  startTimeVal,
  setStartTimeVal,
  endDate,
  setEndDate,
  endTimeVal,
  setEndTimeVal,
  category,
  setCategory,
  onClose,
  onSubmit,
  onSaveOnly
}: ScheduleModalProps) {
  if (!open) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
      style={{
        zIndex: 10000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.3s ease-in-out'
      }}
      onClick={onClose}
    >
      <div
        className="premium-card p-4 w-100 rounded-4 position-relative scale-in"
        style={{
          maxWidth: '500px',
          backgroundColor: 'rgba(15, 18, 36, 0.95)',
          color: '#cbd5e1',
          border: `1px solid ${editingScheduleId ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`,
          borderTop: `6px solid ${editingScheduleId ? '#f59e0b' : '#6366f1'}`,
          boxShadow: `0 0 30px ${editingScheduleId ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)'}, 0 20px 50px rgba(0, 0, 0, 0.6)`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#ffffff' }}>
            <i className={`bi ${editingScheduleId ? 'bi-pencil-square text-warning' : 'bi-plus-circle-fill text-primary'}`}></i>
            {editingScheduleId ? '일정 수정하기' : '새로운 일정 등록'}
          </h5>
          <button
            onClick={onClose}
            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 p-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', width: '32px', height: '32px', color: '#94a3b8' }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <p className="small text-muted mb-3">일정 등록과 수정은 큰 모달에서 처리되어, 목록 공간을 더 넓게 사용할 수 있습니다.</p>

        <form onSubmit={onSubmit}>
          <div className="mb-3 text-start">
            <label htmlFor="title" className="form-label small fw-semibold text-muted">일정 제목 *</label>
            <input type="text" id="title" className="form-control form-premium-control" placeholder="예: Supabase 연동 개발 회의" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="mb-3 text-start">
            <label htmlFor="description" className="form-label small fw-semibold text-muted">상세 설명</label>
            <textarea id="description" className="form-control form-premium-control" rows={3} placeholder="구체적인 업무 내용 및 메모..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-check mb-3 text-start">
            <input type="checkbox" className="form-check-input cursor-pointer" id="hasTime" checked={hasTime} onChange={(e) => setHasTime(e.target.checked)} />
            <label className="form-check-label small text-muted cursor-pointer" htmlFor="hasTime" style={{ userSelect: 'none' }}>
              ⏰ 시간 설정 활성화 (체크 해제 시 하루 종일 일정으로 등록)
            </label>
          </div>
          <div className="row g-2 mb-3 text-start">
            <div className="col-12 col-md-6">
              <label htmlFor="startDate" className="form-label small fw-semibold text-muted">시작 날짜 *</label>
              <input type="date" id="startDate" className="form-control form-premium-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            {hasTime && (
              <div className="col-12 col-md-6">
                <label htmlFor="startTimeVal" className="form-label small fw-semibold text-muted">시작 시간 *</label>
                <input type="time" id="startTimeVal" className="form-control form-premium-control" value={startTimeVal} onChange={(e) => setStartTimeVal(e.target.value)} required />
              </div>
            )}
          </div>
          <div className="row g-2 mb-3 text-start">
            <div className="col-12 col-md-6">
              <label htmlFor="endDate" className="form-label small fw-semibold text-muted">종료 날짜 *</label>
              <input type="date" id="endDate" className="form-control form-premium-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            {hasTime && (
              <div className="col-12 col-md-6">
                <label htmlFor="endTimeVal" className="form-label small fw-semibold text-muted">종료 시간 *</label>
                <input type="time" id="endTimeVal" className="form-control form-premium-control" value={endTimeVal} onChange={(e) => setEndTimeVal(e.target.value)} required />
              </div>
            )}
          </div>
          <div className="mb-4 text-start">
            <label htmlFor="category" className="form-label small fw-semibold text-muted">카테고리</label>
            <select id="category" className="form-select form-premium-control" value={category} onChange={(e) => setCategory(e.target.value as ScheduleCategory)}>
              <option value="Work">🏢 업무 (Work)</option>
              <option value="Personal">🏡 개인 (Personal)</option>
              <option value="Important">⭐ 중요 (Important)</option>
              <option value="Meeting">👥 회의 (Meeting)</option>
              <option value="Etc">🏷️ 기타 (Etc)</option>
            </select>
          </div>
          <div className="d-flex gap-3 align-items-center w-100" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <button type="button" onClick={onClose} className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold transition-all" style={{ borderRadius: '14px', flex: '1', background: 'rgba(241, 245, 249, 0.9)', border: '1px solid rgba(226, 232, 240, 0.8)', color: '#475569', fontSize: '0.95rem' }}>
              <i className="bi bi-arrow-left-circle-fill fs-5"></i>
              <span>취소</span>
            </button>
            {editingScheduleId && (
              <button type="button" onClick={onSaveOnly} className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold text-white transition-all animate-fade-in" style={{ borderRadius: '14px', flex: '1', background: 'linear-gradient(135deg, #34d399, #10b981)', border: 'none', fontSize: '0.95rem' }}>
                <i className="bi bi-save-fill fs-5"></i>
                <span>임시 저장</span>
              </button>
            )}
            <button type="submit" className="btn d-flex align-items-center justify-content-center gap-2 py-3 fw-bold text-white transition-all" style={{ borderRadius: '14px', flex: '2', background: editingScheduleId ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #3b82f6)', color: editingScheduleId ? '#1e293b' : '#ffffff', border: 'none', fontSize: '0.95rem' }}>
              <i className="bi bi-check-circle-fill fs-5"></i>
              <span>{editingScheduleId ? '수정 완료' : '일정 등록'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemoModal({
  open,
  editingMemoId,
  memoTitle,
  setMemoTitle,
  memoContent,
  setMemoContent,
  memoColor,
  setMemoColor,
  selectedFont,
  handleFontChange,
  memoSuggestionsVisible,
  selectedSlashSuggestionIndex,
  slashSuggestions,
  insertSlashCommand,
  onClose,
  onSubmit,
  onSaveOnly,
  handleCancelMemoEdit,
  pastelColors,
  fontOptions,
  checkIfDarkColor,
  memoError
}: MemoModalProps) {
  if (!open) return null;

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-stretch justify-content-stretch" style={{ zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)', transition: 'all 0.3s ease-in-out' }} onClick={onClose}>
      <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-start p-4 overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="premium-card p-4 w-100 d-flex flex-column" style={{ maxWidth: '760px', minHeight: 'calc(100vh - 80px)', backgroundColor: 'rgba(15, 18, 36, 0.95)', color: '#cbd5e1', border: `1px solid ${editingMemoId ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`, borderTop: `6px solid ${editingMemoId ? '#f59e0b' : '#6366f1'}`, boxShadow: `0 0 30px ${editingMemoId ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)'}, 0 20px 50px rgba(0, 0, 0, 0.6)` }}>
          <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#ffffff' }}>
              <i className={`bi ${editingMemoId ? 'bi-pencil-square text-warning' : 'bi-sticky-fill text-primary'}`}></i>
              {editingMemoId ? '메모 수정하기' : '새 메모 작성하기'}
            </h5>
            <button onClick={onClose} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 p-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', width: '32px', height: '32px', color: '#94a3b8' }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          {memoError && <div className="alert alert-danger border-0 small rounded-3 mb-3">{memoError}</div>}
          <form onSubmit={onSubmit} className="d-flex flex-column flex-grow-1">
            <div className="mb-3 text-start">
              <label htmlFor="memoTitle" className="form-label small fw-semibold text-muted">메모 제목 *</label>
              <input id="memoTitle" type="text" className="form-control form-premium-control" value={memoTitle} onChange={(e) => setMemoTitle(e.target.value)} required />
            </div>
            <div className="mb-3 text-start position-relative flex-grow-1">
              <label htmlFor="memoContent" className="form-label small fw-semibold text-muted">메모 내용 *</label>
              <textarea id="memoContent" className="form-control form-premium-control" rows={12} value={memoContent} onChange={(e) => setMemoContent(e.target.value)} />
              {memoSuggestionsVisible && slashSuggestions.length > 0 && (
                <div className="position-absolute start-0 w-100 mt-2 rounded-4 overflow-hidden border shadow-lg" style={{ zIndex: 10, backgroundColor: 'rgba(15, 18, 36, 0.98)', borderColor: 'rgba(99, 102, 241, 0.25)', top: 'calc(100% + 0.5rem)' }}>
                  {slashSuggestions.map((item, index) => (
                    <button key={item.label} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertSlashCommand(item.insert)} className="w-100 text-start border-0 px-3 py-2 d-flex align-items-center justify-content-between" style={{ backgroundColor: index === selectedSlashSuggestionIndex ? 'rgba(99, 102, 241, 0.25)' : 'transparent', color: '#e2e8f0' }}>
                      <span className="fw-semibold">{item.label}</span>
                      <span className="small text-muted">{item.insert.trim()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-4 text-start">
              <label className="form-label small fw-semibold text-muted d-block">메모 카드 테마 색상</label>
              <div className="d-flex flex-wrap gap-2 mt-1">
                {pastelColors.map((color) => (
                  <button key={color.hex} type="button" onClick={() => setMemoColor(color.hex)} className="rounded-circle border-0 transition-all d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px', backgroundColor: color.hex, transform: memoColor === color.hex ? 'scale(1.2)' : 'scale(1)', border: memoColor === color.hex ? '2px solid #000' : 'none' }} title={color.name}>
                    {memoColor === color.hex && <i className={`bi bi-check-lg ${checkIfDarkColor(color.hex) ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.8rem' }}></i>}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4 text-start">
              <label className="form-label small fw-semibold text-muted d-block">글꼴</label>
              <select className="form-select form-premium-control w-auto" value={selectedFont} onChange={(e) => handleFontChange(e.target.value)} style={{ fontSize: '0.85rem' }}>
                {fontOptions.map((font) => <option key={font.value} value={font.value}>{font.name}</option>)}
              </select>
            </div>
            <div className="d-flex gap-3 mt-auto align-items-center w-100" style={{ maxWidth: '650px', margin: '0 auto' }}>
              <button type="button" onClick={handleCancelMemoEdit} className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold transition-all" style={{ borderRadius: '14px', flex: '1', background: 'rgba(241, 245, 249, 0.9)', border: '1px solid rgba(226, 232, 240, 0.8)', color: '#475569', fontSize: '0.95rem' }}>
                <i className="bi bi-arrow-left-circle-fill fs-5"></i><span>취소</span>
              </button>
              {editingMemoId && <button type="button" onClick={onSaveOnly} className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold text-white transition-all animate-fade-in" style={{ borderRadius: '14px', flex: '1', background: 'linear-gradient(135deg, #34d399, #10b981)', border: 'none', fontSize: '0.95rem' }}><i className="bi bi-save-fill fs-5"></i><span>임시 저장</span></button>}
              <button type="submit" className="btn d-flex align-items-center justify-content-center gap-2 py-3 fw-bold text-white transition-all" style={{ borderRadius: '14px', flex: '2', background: editingMemoId ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #3b82f6)', color: editingMemoId ? '#1e293b' : '#ffffff', border: 'none', fontSize: '0.95rem' }}><i className="bi bi-check-circle-fill fs-5"></i><span>{editingMemoId ? '수정 완료' : '메모 등록'}</span></button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'memo' | 'profile'>('schedule');

  // 1. 유저 인증 상태 & 비즈니스 로직
  const {
    user,
    loading: authLoading,
    authError,
    setAuthError,
    signUpUser,
    signInUser,
    signInSocial,
    signOutUser,
    updateProfile,
    deleteAccount
  } = useAuth();

  // 프로필 변경 폼 상태
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileNewPasswordConfirm, setProfileNewPasswordConfirm] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  // 세션 로드 시 프로필 닉네임 상태 동기화
  useEffect(() => {
    if (user) {
      setProfileDisplayName(user.displayName);
    }
  }, [user]);

  // 2. 일정 관리 상태 & 비즈니스 로직
  const {
    schedules,
    rawSchedules,
    loading: scheduleLoading,
    error: scheduleError,
    activeServiceType,
    categoryFilter,
    setCategoryFilter,
    completionFilter,
    setCompletionFilter,
    searchQuery,
    setSearchQuery,
    addSchedule,
    updateScheduleDetails,
    toggleComplete,
    removeSchedule
  } = useSchedules();

  // 3. 메모 관리 상태 & 비즈니스 로직
  const {
    memos,
    loading: memoLoading,
    error: memoError,
    addMemo,
    editMemo,
    removeMemo
  } = useMemos();

  // Hydration Error 방지를 위한 마운트 체크
  const [mounted, setMounted] = useState(false);

  // 인증 입력 폼 상태
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);

  // 일정 입력 폼 상태 (날짜/시간 분리형 및 시간설정 토글)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTimeVal, setStartTimeVal] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTimeVal, setEndTimeVal] = useState('');
  const [hasTime, setHasTime] = useState(false);
  const [category, setCategory] = useState<ScheduleCategory>('Work');
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // 메모 입력 폼 상태
  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [memoColor, setMemoColor] = useState('#fffbeb'); // 기본 파스텔 코지옐로우
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [slashSuggestions, setSlashSuggestions] = useState<Array<{ label: string; insert: string }>>([]);
  const [selectedSlashSuggestionIndex, setSelectedSlashSuggestionIndex] = useState(0);
  
  // 메모 검색 및 필터 상태
  const [memoSearchQuery, setMemoSearchQuery] = useState('');
  const [memoColorFilter, setMemoColorFilter] = useState('All');
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);

  // 메모 상세 모달 제어 버튼들의 호버 상태 관리
  const [closeHovered, setCloseHovered] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<'copy' | 'edit' | 'delete' | null>(null);

  // 삭제 확인 모달용 상태
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'schedule' | 'memo';
    id: string;
  } | null>(null);

  // 글꼴 선택 커스터마이저 상태 & 옵션 정의
  const [selectedFont, setSelectedFont] = useState<string>('Pretendard');

  // Supabase 가이드 배너 토글
  const [showGuide, setShowGuide] = useState(false);

  const updateSlashSuggestions = (value: string, cursorPos: number) => {
    setSlashSuggestions(createSlashSuggestionsUtil(value, cursorPos));
    setSelectedSlashSuggestionIndex(0);
  };

  // 헥사 색상 코드를 알파 채널이 조절된 rgba로 변환해주는 헬퍼 (네온 글로우 아우라 구현용)
  const hexToRgba = (hex: string, alpha: number = 1) => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    if (cleanHex.length !== 6) {
      return `rgba(99, 102, 241, ${alpha})`; // 기본 네온 블루/인디고 폴백
    }
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // 이미 알림이 전송된 일정 ID 캐시 (새로고침 시 중복 방지용 영속화)
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);

  // 서비스 워커 등록 및 알림 권한 획득 처리 (Web Push A)
  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('서비스 워커 등록 성공:', reg.scope);
        })
        .catch((err) => {
          console.error('서비스 워커 등록 실패:', err);
        });

      // 브라우저 최초 마운트 시 알림 권한 스마트 요청
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          console.log('브라우저 알림 권한 부여 결과:', permission);
        });
      }
    }
  }, []);

  // 알림 캐시 데이터 복원
  useEffect(() => {
    const savedNotified = localStorage.getItem('notified_schedule_ids');
    if (savedNotified) {
      try {
        setNotifiedIds(JSON.parse(savedNotified));
      } catch (e) {
        // 복구 실패 무시
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;
    if (!user.pushEnabled) return; // 글로벌 알림 수신 설정 감지 및 수신 거부 바이패스


    const checkSchedulesForPush = () => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const nowYear = now.getFullYear();
      const nowMonth = now.getMonth();
      const nowDate = now.getDate();
      const nowHours = now.getHours();
      const nowMinutes = now.getMinutes();

      schedules.forEach((schedule) => {
        // 이미 알림이 전송되었거나 완료된 일정은 건너뜀
        if (notifiedIds.includes(schedule.id) || schedule.isCompleted) return;

        // 일정 시작 시간 포맷: YYYY-MM-DDTHH:mm
        const startTimeStr = schedule.startTime;
        if (!startTimeStr) return;

        const schedTime = new Date(startTimeStr);
        if (isNaN(schedTime.getTime())) return;

        const schedYear = schedTime.getTime() ? schedTime.getFullYear() : 0;
        const schedMonth = schedTime.getTime() ? schedTime.getMonth() : 0;
        const schedDate = schedTime.getTime() ? schedTime.getDate() : 0;
        const schedHours = schedTime.getTime() ? schedTime.getHours() : 0;
        const schedMinutes = schedTime.getTime() ? schedTime.getMinutes() : 0;

        // 정확히 현재 분에 도달했는지 검증
        const isTimeMatch = 
          nowYear === schedYear &&
          nowMonth === schedMonth &&
          nowDate === schedDate &&
          nowHours === schedHours &&
          nowMinutes === schedMinutes;

        if (isTimeMatch) {
          // 서비스 워커를 통해 웹 푸시 노출
          navigator.serviceWorker.ready.then((registration) => {
            const importanceEmoji = schedule.category === 'Important' ? '🚨 [중요 일정] ' : '📅 ';
            const timeStr = schedule.hasTime ? schedule.startTime.replace('T', ' ').slice(0, 16) : '하루 종일';
            registration.showNotification(`${importanceEmoji}Antigravity 스케줄 알림`, {
              body: `"${schedule.title}" 일정이 지금 시작되었습니다!\n⏰ 시간: ${timeStr}`,
              icon: '/logo.png',
              badge: '/logo.png',
              vibrate: [200, 100, 200],
              tag: `sched-${schedule.id}`,
              renotify: true,
              data: { scheduleId: schedule.id }
            } as any);
          });

          // 중복 알림 방지 캐시 업데이트
          const updatedNotified = [...notifiedIds, schedule.id];
          setNotifiedIds(updatedNotified);
          localStorage.setItem('notified_schedule_ids', JSON.stringify(updatedNotified));
        }
      });
    };

    // 마운트 후 즉시 검사하고, 30초마다 정밀 스캐닝을 유지하여 1분 주기를 빈틈없이 캐치
    checkSchedulesForPush();
    const intervalId = setInterval(checkSchedulesForPush, 30000);

    return () => clearInterval(intervalId);
  }, [mounted, user, schedules, notifiedIds]);

  useEffect(() => {
    // 앱 기동 시 마지막에 갱신된 글꼴 설정 자동 복원
    const savedFont = localStorage.getItem('selected_memo_font');
    if (savedFont) {
      setSelectedFont(savedFont);
    }
  }, []);

  const handleFontChange = (fontValue: string) => {
    setSelectedFont(fontValue);
    localStorage.setItem('selected_memo_font', fontValue); // 새로운 폰트 선택 시 로컬 스토리지에 갱신 저장
  };

  // ====================================================
  // 🛠️ 10대 유틸리티 추가 기능 전용 상태 및 헬퍼 함수 선언
  // ====================================================
  
  // 1. 뽀모도로 타이머 상태
  const [pomodoroSeconds, setPomodoroSeconds] = useState(1500); // 25분 기본
  const [pomodoroIsRunning, setPomodoroIsRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');
  const [pomodoroCustomFocus, setPomodoroCustomFocus] = useState(25);
  const [pomodoroCustomBreak, setPomodoroCustomBreak] = useState(5);
  const [showPomodoroWidget, setShowPomodoroWidget] = useState(false);
  
  // 2. 실시간 시간 갱신 틱 (D-Day 등 실시간 표기용)
  const [timeRefreshTicker, setTimeRefreshTicker] = useState(0);

  // 3. 플로팅 토스트 피드백 상태
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 토스트 피드백 노출 함수
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // 실시간 갱신 틱 이펙트 (1분 주기)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefreshTicker((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 뽀모도로 타이머 로직 이펙트
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pomodoroIsRunning && pomodoroSeconds > 0) {
      timer = setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroIsRunning && pomodoroSeconds === 0) {
      const nextMode = pomodoroMode === 'focus' ? 'break' : 'focus';
      const bodyText = nextMode === 'focus' 
        ? '휴식 시간이 완료되었습니다! 다시 집중에 집중해 보세요.' 
        : '집중 시간이 완료되었습니다! 5분간 편안히 휴식을 취하세요.';

      if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(`🍅 뽀모도로 타이머 - ${pomodoroMode === 'focus' ? '집중 완료!' : '휴식 완료!'}`, {
            body: bodyText,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'pomodoro-alert',
            renotify: true
          } as any);
        });
      }

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.8);
      } catch (e) {
        // AudioContext 미지원 브라우저 대응
      }

      alert(`🍅 뽀모도로 타이머: ${pomodoroMode === 'focus' ? '집중 완료!' : '휴식 완료!'}\n${bodyText}`);

      setPomodoroMode(nextMode);
      setPomodoroSeconds(nextMode === 'focus' ? pomodoroCustomFocus * 60 : pomodoroCustomBreak * 60);
      setPomodoroIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [pomodoroIsRunning, pomodoroSeconds, pomodoroMode, pomodoroCustomFocus, pomodoroCustomBreak]);

  // D-Day & 남은 시간 실시간 계산 헬퍼
  const calculateDDay = (startTimeStr: string, endTimeStr: string, isCompleted: boolean, hasTimeVal: boolean = true) => {
    if (isCompleted) return { text: '완료', colorClass: 'bg-secondary text-white' };
    const now = Date.now();
    const start = new Date(startTimeStr).getTime();
    const end = new Date(endTimeStr).getTime();

    if (now > end) {
      return { text: '기한 초과', colorClass: 'bg-danger text-white' };
    }
    if (now >= start && now <= end) {
      return { text: '진행 중', colorClass: 'bg-success text-white' };
    }

    const diff = start - now;
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (!hasTimeVal) {
      if (diffDays > 0) {
        return { text: `D-${diffDays}`, colorClass: 'bg-primary text-white' };
      }
      return { text: `D-Day`, colorClass: 'bg-warning text-dark' };
    }

    const diffHours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 1) {
      return { text: `D-${diffDays - 1} (${diffHours}시간 남음)`, colorClass: 'bg-primary text-white' };
    }
    if (diffHours > 0) {
      return { text: `D-Day (${diffHours}시간 남음)`, colorClass: 'bg-warning text-dark' };
    }
    return { text: `D-Day (${diffMins}분 남음)`, colorClass: 'bg-warning text-dark' };
  };

  // 일정 RFC 5545 표준 iCal 파일 생성 및 다운로드 헬퍼
  const downloadScheduleIcs = (schedule: Schedule) => {
    try {
      const startIso = new Date(schedule.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endIso = new Date(schedule.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const cleanDesc = (schedule.description || '').replace(/\n/g, '\\n');
      
      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Antigravity//Note Project//KO',
        'BEGIN:VEVENT',
        `UID:${schedule.id}`,
        `DTSTART:${startIso}`,
        `DTEND:${endIso}`,
        `SUMMARY:${schedule.title}`,
        `DESCRIPTION:${cleanDesc}`,
        `CATEGORIES:${schedule.category}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ];

      const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${schedule.title.replace(/[\/\\?%*:|"<>\s]/g, '_')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('📅 iCal 일정 캘린더 파일 다운로드 성공!');
    } catch (e) {
      showToast('❌ iCal 파일 생성 중 오류 발생');
    }
  };

  // 메모 JSON 백업 파일 다운로드 헬퍼
  const downloadMemosJsonBackup = () => {
    try {
      const dataStr = JSON.stringify(myMemos, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nowStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `antigravity_memos_backup_${nowStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('💾 메모 JSON 백업 다운로드 성공!');
    } catch (e) {
      showToast('❌ 백업 파일 생성 오류');
    }
  };

  // 메모 JSON 백업 복원 및 업로드 파서
  const handleImportMemosJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsedMemos = JSON.parse(fileContent);

        if (!Array.isArray(parsedMemos)) {
          showToast('❌ 올바르지 않은 백업 양식입니다. (배열 아님)');
          return;
        }

        let importCount = 0;
        for (const item of parsedMemos) {
          if (item && item.title && typeof item.content === 'string') {
            await addMemo({
              title: item.title,
              content: item.content,
              color: item.color || '#fffbeb'
            });
            importCount++;
          }
        }
        showToast(`💾 ${importCount}개의 백업 메모를 성공적으로 복원했습니다.`);
        e.target.value = ''; // 인풋 초기화
      } catch (err) {
        showToast('❌ JSON 복원 실패: 파일 분석 오류');
      }
    };
    reader.readAsText(file);
  };

  // 메모 중요도 핀 판단 헬퍼
  const isMemoPinned = (memo: Memo) => memo.title.startsWith('📌 ');

  // 메모 제목 핀 제거 헬퍼
  const getCleanMemoTitle = (title: string) => title.replace(/^📌\s*/, '');

  // 메모 중요도 핀 고정 토글
  const togglePinMemo = async (memo: Memo) => {
    try {
      if (isMemoPinned(memo)) {
        const cleanTitle = memo.title.replace(/^📌\s*/, '');
        await editMemo(memo.id, { ...memo, title: cleanTitle });
        showToast('📌 메모 핀 고정이 해제되었습니다.');
      } else {
        const pinnedTitle = `📌 ${memo.title}`;
        await editMemo(memo.id, { ...memo, title: pinnedTitle });
        showToast('📌 메모가 최상단에 고정되었습니다.');
      }
    } catch (e) {
      showToast('❌ 메모 고정 처리 실패');
    }
  };

  // 글자 수 및 읽는 예상 시간 계산기
  const getMemoStats = (content: string) => {
    const charCountWithSpace = content.length;
    const charCountWithoutSpace = content.replace(/\s/g, '').length;
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const readingTimeMins = Math.ceil(wordCount / 200) || 1;
    return {
      charCountWithSpace,
      charCountWithoutSpace,
      wordCount,
      readingTimeMins
    };
  };

  // 키워드 하이라이터 렌더러
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-warning text-dark px-0.5 rounded fw-bold">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // 마크다운 원본 복사 및 공유용 텍스트 가공
  const copyMemoMarkdown = (memo: Memo) => {
    const rawTitle = getCleanMemoTitle(memo.title);
    const dateStr = formatDateKST(memo.createdAt);
    const shareText = `---
📝 제목: ${rawTitle}
⏰ 작성일: ${dateStr}
---
${memo.content}`;

    navigator.clipboard.writeText(shareText).then(() => {
      showToast('📋 원본 마크다운 텍스트를 클립보드에 복사했습니다.');
    }).catch(() => {
      showToast('❌ 복사 실패');
    });
  };

  // 오늘 하루 스케줄 요약 브리핑 연산
  const getTodayBriefing = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

    const todaySchedules = myRawSchedules.filter((schedule) => {
      const sTime = new Date(schedule.startTime).getTime();
      const eTime = new Date(schedule.endTime).getTime();
      return (sTime >= startOfToday && sTime <= endOfToday) || 
             (eTime >= startOfToday && eTime <= endOfToday) ||
             (sTime < startOfToday && eTime > endOfToday);
    });

    const pendingToday = todaySchedules.filter(s => !s.isCompleted).length;
    const completedToday = todaySchedules.filter(s => s.isCompleted).length;
    const importantToday = todaySchedules.filter(s => s.category === 'Important' && !s.isCompleted).length;

    return {
      totalToday: todaySchedules.length,
      pendingToday,
      completedToday,
      importantToday
    };
  };

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
    setMounted(true);
    
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

  if (!mounted) return null;

  // ====================================================
  // 사용자 소유권 격리 필터링 (Multi-user Data Isolation)
  // ====================================================
  // 1. 로그인된 상태라면 본인 데이터만 선별 노출, 로그인 안 되어있으면 빈 배열
  const myRawSchedules = user ? rawSchedules.filter(s => !s.userId || s.userId === user.id) : [];
  const mySchedules = user ? schedules.filter(s => !s.userId || s.userId === user.id) : [];
  const myMemos = user ? memos.filter(m => !m.userId || m.userId === user.id) : [];

  // 일정 통계 계산
  const totalCount = myRawSchedules.length;
  const completedCount = myRawSchedules.filter(s => s.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const importantCount = myRawSchedules.filter(s => s.category === 'Important' && !s.isCompleted).length;

  // 프로필 변경 제출 핸들러
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!profileDisplayName.trim()) {
      setProfileError('닉네임을 입력해 주세요.');
      return;
    }

    const isLocal = user?.provider === 'local';
    let currentPwd = '';
    let newPwd = '';

    if (isLocal && (profileCurrentPassword || profileNewPassword || profileNewPasswordConfirm)) {
      if (!profileCurrentPassword) {
        setProfileError('현재 비밀번호를 입력해야 비밀번호를 변경할 수 있습니다.');
        return;
      }
      if (!profileNewPassword) {
        setProfileError('새로운 비밀번호를 입력해 주세요.');
        return;
      }
      if (profileNewPassword.length < 4) {
        setProfileError('비밀번호는 최소 4자 이상이어야 합니다.');
        return;
      }
      if (profileNewPassword !== profileNewPasswordConfirm) {
        setProfileError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return;
      }
      currentPwd = profileCurrentPassword;
      newPwd = profileNewPassword;
    }

    try {
      await updateProfile(
        profileDisplayName.trim(),
        currentPwd || undefined,
        newPwd || undefined
      );
      setProfileSuccess('프로필이 성공적으로 수정되었습니다.');
      setProfileCurrentPassword('');
      setProfileNewPassword('');
      setProfileNewPasswordConfirm('');
      showToast('👤 프로필 수정 성공!');
    } catch (err: any) {
      setProfileError(err.message || '프로필 수정 중 오류가 발생했습니다.');
    }
  };

  // 글로벌 푸시 수신 여부 토글 핸들러
  const handleTogglePush = async () => {
    if (!user) return;
    try {
      await updateProfile(user.displayName, undefined, undefined, !user.pushEnabled);
      showToast(`📢 푸시 알림 수신이 ${!user.pushEnabled ? '활성화' : '비활성화'}되었습니다.`);
    } catch (err: any) {
      showToast('❌ 푸시 알림 설정 변경 실패');
    }
  };

  // 회원 탈퇴 실행 핸들러
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setIsDeleteAccountModalOpen(false);
      showToast('👋 회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
    } catch (err: any) {
      showToast(`❌ 회원 탈퇴 실패: ${err.message}`);
    }
  };

  // 인증 제출 핸들러 (회원가입 / 로그인 통합)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authUsername.trim() || !authPassword.trim()) return;

    try {
      if (authMode === 'register') {
        if (!authDisplayName.trim()) {
          setAuthError('이름(닉네임)을 입력해 주세요.');
          return;
        }
        await signUpUser({
          username: authUsername,
          password: authPassword,
          displayName: authDisplayName
        }, rememberMe);
      } else {
        await signInUser({
          username: authUsername,
          password: authPassword
        }, rememberMe);
      }
      // 성공 시 입력 필드 비우기
      setAuthUsername('');
      setAuthPassword('');
      setAuthDisplayName('');
    } catch (err: any) {
      // 에러는 authError 상태를 통해 화면 출력
    }
  };

  // 일정 제출 핸들러
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
          userId: user?.id,
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

  // 일정 수정 시 창 닫지 않고 바로 저장하는 핸들러
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

  // 일정 수정 모드 진입
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

  // 일정 수정 모드 취소
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

  // 메모 제출 핸들러
  const handleMemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoTitle.trim()) return;

    try {
      if (editingMemoId) {
        await editMemo(editingMemoId, {
          title: memoTitle,
          content: memoContent,
          color: memoColor
        });
        setEditingMemoId(null);
      } else {
        await addMemo({
          title: memoTitle,
          content: memoContent,
          color: memoColor,
          userId: user?.id // 외래 키 바인딩
        } as any);
      }

      setMemoTitle('');
      setMemoContent('');
      setMemoColor('#fffbeb');
      setIsMemoModalOpen(false);
    } catch (err) {
      // 에러 자동 처리
    }
  };

  // 메모 수정 시 창 닫지 않고 바로 저장하는 핸들러
  const handleSaveMemoOnly = async () => {
    if (!editingMemoId || !memoTitle.trim()) return;
    try {
      await editMemo(editingMemoId, {
        title: memoTitle,
        content: memoContent,
        color: memoColor
      });
      showToast('💾 메모 변경 사항이 저장되었습니다.');
    } catch (err) {
      showToast('❌ 메모 저장 중 오류가 발생했습니다.');
    }
  };

  // 메모 수정 모드 진입
  const handleStartMemoEdit = (memo: Memo) => {
    setEditingMemoId(memo.id);
    setMemoTitle(memo.title);
    setMemoContent(memo.content || '');
    setMemoColor(memo.color || '#fffbeb');
    setIsMemoModalOpen(true);
  };

  // 메모 수정 모드 취소
  const handleCancelMemoEdit = () => {
    setEditingMemoId(null);
    setMemoTitle('');
    setMemoContent('');
    setMemoColor('#fffbeb');
    setSlashSuggestions([]);
    setIsMemoModalOpen(false);
  };

  // 메모 에디터 내 슬래시 커맨드 (/checkbox) 감지 및 자동 치환
  const handleMemoContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashSuggestionIndex((prev) => (prev + 1) % slashSuggestions.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashSuggestionIndex((prev) => (prev - 1 + slashSuggestions.length) % slashSuggestions.length);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashSuggestions([]);
        return;
      }

      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = slashSuggestions[selectedSlashSuggestionIndex];
        if (!selected) return;
        insertSlashCommand(selected.insert);
        return;
      }
    }

    if (e.key === ' ' || e.key === 'Enter') {
      const textarea = e.currentTarget;
      const value = textarea.value;
      const selectionStart = textarea.selectionStart;
      
      const textBeforeCursor = value.substring(0, selectionStart);
      
      if (textBeforeCursor.endsWith('/checkbox')) {
        e.preventDefault(); // 스페이스나 엔터 자체 입력 차단
        
        const startPos = selectionStart - 9; // '/checkbox'.length = 9
        const endPos = selectionStart;
        
        const newValue = value.substring(0, startPos) + '- [ ] ' + (e.key === 'Enter' ? '\n' : '') + value.substring(endPos);
        setMemoContent(newValue);
        
        const newCursorPos = startPos + 6 + (e.key === 'Enter' ? 1 : 0); // '- [ ] '.length = 6
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    }
  };

  const insertSlashCommand = (insertText: string) => {
    const textarea = document.getElementById('memoContent') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const value = textarea.value;
    const selectionStart = textarea.selectionStart ?? value.length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const textBeforeCursor = value.slice(0, selectionStart);
    const slashIndex = textBeforeCursor.lastIndexOf('/');
    if (slashIndex < 0) return;

    const nextValue = value.slice(0, slashIndex) + insertText + value.slice(selectionEnd);
    setMemoContent(nextValue);
    setSlashSuggestions([]);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(slashIndex + insertText.length, slashIndex + insertText.length);
    }, 0);
  };

  const handleMemoContentChange = (value: string, cursorPos: number) => {
    setMemoContent(value);
    updateSlashSuggestions(value, cursorPos);
  };

  // 삭제 처리 핸들러
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmTarget) return;
    const { type, id } = deleteConfirmTarget;

    try {
      if (type === 'schedule') {
        await removeSchedule(id);
        showToast('📅 일정이 삭제되었습니다.');
      } else {
        await removeMemo(id);
        showToast('📋 메모가 삭제되었습니다.');
      }
    } catch (e) {
      showToast('❌ 삭제 처리 중 오류가 발생했습니다.');
    } finally {
      setDeleteConfirmTarget(null);
    }
  };

  // 한국어 날짜 포맷터
  const formatDateKST = (isoString: string, showTime: boolean = true) => {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    };

    if (showTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
    }

    return new Intl.DateTimeFormat('ko-KR', options).format(date);
  };

  // 메모 필터링 로직
  const filteredMemos = myMemos.filter(memo => {
    const matchesSearch = memo.title.toLowerCase().includes(memoSearchQuery.toLowerCase()) || 
                          memo.content.toLowerCase().includes(memoSearchQuery.toLowerCase());
    const matchesColor = memoColorFilter === 'All' || memo.color === memoColorFilter;
    return matchesSearch && matchesColor;
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");
        @import url("https://fonts.googleapis.com/css2?family=Gamja+Flower&family=Nanum+Gothic:wght@400;700&family=Nanum+Pen+Script&family=Noto+Sans+KR:wght@300;400;500;700&family=Jua&family=Gowun+Dodum&display=swap");
        @font-face {
          font-family: 'RIDIBatang';
          src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_twelve@1.1/RIDIBatang.woff') format('woff');
          font-weight: normal;
          font-style: normal;
        }
      `}} />
      {/* Premium Glass Header Navigation */}
      <nav className="navbar navbar-expand-lg glass-nav py-2 sticky-top">
        <div className="container">
          <div className="d-flex align-items-center">
            <div className="rounded-3 p-1 me-2 d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(236, 72, 153, 0.3)', boxShadow: '0 0 12px var(--neon-pink)' }}>
              <img src="/logo.png" alt="Simple Note Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} />
            </div>
            <div>
              <span className="navbar-brand mb-0 h5 fw-bold display-font neon-text-pink" style={{ letterSpacing: '0.2px' }}>Simple Note</span>
            </div>
          </div>

          {/* Tab Navigation Center Router (Only visible when logged in) */}
          {user && (
            <div 
              className="d-flex p-1 rounded-pill mx-auto my-lg-0 my-3"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              <button
                onClick={() => setActiveTab('schedule')}
                className="btn btn-sm px-4 py-2 rounded-pill fw-semibold transition-all border-0"
                style={{ 
                  fontSize: '0.9rem',
                  background: activeTab === 'schedule' ? 'var(--primary-gradient)' : 'transparent',
                  color: activeTab === 'schedule' ? '#ffffff' : '#94a3b8',
                  boxShadow: activeTab === 'schedule' ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
                }}
              >
                <i className="bi bi-calendar3 me-2"></i>일정 관리
              </button>
              <button
                onClick={() => setActiveTab('memo')}
                className="btn btn-sm px-4 py-2 rounded-pill fw-semibold transition-all border-0"
                style={{ 
                  fontSize: '0.9rem',
                  background: activeTab === 'memo' ? 'var(--primary-gradient)' : 'transparent',
                  color: activeTab === 'memo' ? '#ffffff' : '#94a3b8',
                  boxShadow: activeTab === 'memo' ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
                }}
              >
                <i className="bi bi-sticky-fill me-2"></i>메모패드
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className="btn btn-sm px-4 py-2 rounded-pill fw-semibold transition-all border-0"
                style={{ 
                  fontSize: '0.9rem',
                  background: activeTab === 'profile' ? 'var(--primary-gradient)' : 'transparent',
                  color: activeTab === 'profile' ? '#ffffff' : '#94a3b8',
                  boxShadow: activeTab === 'profile' ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none'
                }}
              >
                <i className="bi bi-person-circle me-2"></i>마이페이지
              </button>
            </div>
          )}

          <div className="d-flex align-items-center gap-2">
            {/* User Session Area */}
            {user ? (
              <div className="d-flex align-items-center gap-3">
                <span 
                  className="small fw-semibold d-flex align-items-center gap-1 px-3 py-2 rounded-pill shadow-sm"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1'
                  }}
                >
                  {user.provider === 'google' && <i className="bi bi-google text-danger"></i>}
                  {user.provider === 'kakao' && <i className="bi bi-chat-fill text-warning"></i>}
                  {user.provider === 'naver' && <i className="bi bi-n-circle-fill text-success"></i>}
                  {user.provider === 'local' && <i className="bi bi-person-circle text-primary"></i>}
                  <strong>{user.displayName}</strong>님 환영합니다!
                </span>
                <button
                  onClick={signOutUser}
                  className="btn btn-sm btn-outline-danger rounded-pill px-3 py-2"
                  style={{ fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                >
                  <i className="bi bi-box-arrow-right me-1"></i>로그아웃
                </button>
              </div>
            ) : (
              <span 
                className="badge px-3 py-2 rounded-pill border"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8'
                }}
              >
                인증이 필요합니다
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Contents Portal */}
      <div className="container py-5">
        {/* ==================================================== */}
        {/* 1. 로그인되어 있지 않을 때: 화려한 인증 포탈 렌더링   */}
        {/* ==================================================== */}
        {!user ? (
          <div className="row justify-content-center align-items-center" style={{ minHeight: '65vh' }}>
            <div className="col-md-6 col-lg-5">
              {/* 회전 무지개 광선 테두리 느낌의 프리미엄 로그인 박스 */}
              <div 
                className="premium-card p-5 position-relative overflow-hidden rounded-4"
                style={{ 
                  backgroundColor: 'rgba(15, 18, 36, 0.85)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.15), 0 15px 45px rgba(0, 0, 0, 0.65)'
                }}
              >
                <div className="text-center mb-4">
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-2 mb-3 shadow-sm" style={{ width: '56px', height: '56px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)' }}>
                    <img src="/logo.png" alt="Simple Note Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
                  </div>
                  <h4 className="fw-bold mb-1 display-font text-white">Simple Note</h4>
                  <p className="text-secondary small">일정과 메모를 한 화면에서 바로 관리합니다.</p>
                </div>

                {authError && (
                  <div className="alert alert-danger border-0 small rounded-3 d-flex align-items-center gap-2 mb-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }} role="alert">
                    <i className="bi bi-exclamation-triangle-fill fs-6"></i>
                    <div>{authError}</div>
                  </div>
                )}

                {/* Social Login Panel */}
                <div className="d-flex flex-column gap-2 mb-4">
                  <button
                    onClick={() => signInSocial('google', rememberMe)}
                    className="btn w-100 rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2 transition-all text-white border"
                    style={{ 
                      fontSize: '0.9rem', 
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      borderColor: 'rgba(255, 255, 255, 0.12)'
                    }}
                  >
                    <i className="bi bi-google text-danger fs-5"></i>
                    <strong>Google</strong> 계정으로 로그인
                  </button>
                  <button
                    onClick={() => signInSocial('kakao', rememberMe)}
                    className="btn w-100 rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2 shadow-sm transition-all text-dark"
                    style={{ fontSize: '0.9rem', backgroundColor: '#fee500', border: 'none' }}
                  >
                    <i className="bi bi-chat-fill text-dark fs-5"></i>
                    <strong>Kakao</strong> 계정으로 로그인
                  </button>
                  <button
                    onClick={() => signInSocial('naver', rememberMe)}
                    className="btn w-100 rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2 shadow-sm transition-all text-white"
                    style={{ fontSize: '0.9rem', backgroundColor: '#03c75a', border: 'none' }}
                  >
                    <i className="bi bi-n-circle-fill text-white fs-5"></i>
                    <strong>Naver</strong> 계정으로 로그인
                  </button>
                </div>

                <div className="position-relative text-center my-4">
                  <hr className="text-secondary" style={{ opacity: 0.25 }} />
                  <span 
                    className="position-absolute top-50 start-50 translate-middle px-3 text-secondary small border" 
                    style={{ 
                      fontSize: '0.75rem',
                      backgroundColor: '#121424',
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px'
                    }}
                  >
                    또는 일반 계정 이용
                  </span>
                </div>

                {/* Local Username/Password Form */}
                <form onSubmit={handleAuthSubmit}>
                  {authMode === 'register' && (
                    <div className="mb-3">
                      <label htmlFor="authDisplayName" className="form-label small fw-semibold text-secondary">이름 또는 닉네임 *</label>
                      <input
                        type="text"
                        id="authDisplayName"
                        className="form-control form-premium-control"
                        placeholder="예: 홍길동"
                        value={authDisplayName}
                        onChange={(e) => setAuthDisplayName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="authUsername" className="form-label small fw-semibold text-secondary">아이디 (이메일 주소) *</label>
                    <input
                      type="email"
                      id="authUsername"
                      className="form-control form-premium-control"
                      placeholder="example@email.com"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="authPassword" className="form-label small fw-semibold text-secondary">비밀번호 *</label>
                    <input
                      type="password"
                      id="authPassword"
                      className="form-control form-premium-control"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-check mb-4 text-start">
                    <input
                      type="checkbox"
                      className="form-check-input cursor-pointer"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ backgroundColor: rememberMe ? '#6366f1' : 'transparent', borderColor: 'rgba(255,255,255,0.2)' }}
                    />
                    <label className="form-check-label small text-secondary cursor-pointer" htmlFor="rememberMe" style={{ userSelect: 'none' }}>
                      자동 로그인 (브라우저 종료 시에도 로그인 유지)
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-premium-primary w-100 rounded-pill py-2.5 fw-bold shadow-sm transition-all"
                  >
                    {authMode === 'login' ? '로그인' : '회원가입 완료'}
                  </button>

                  <div className="text-center mt-3 small text-secondary">
                    {authMode === 'login' ? (
                      <>
                        아직 계정이 없으신가요?{' '}
                        <button
                          type="button"
                          onClick={() => { setAuthMode('register'); setAuthError(null); }}
                          className="btn btn-link p-0 text-info fw-semibold small text-decoration-underline"
                        >
                          회원가입하기
                        </button>
                      </>
                    ) : (
                      <>
                        이미 계정이 있으신가요?{' '}
                        <button
                          type="button"
                          onClick={() => { setAuthMode('login'); setAuthError(null); }}
                          className="btn btn-link p-0 text-info fw-semibold small text-decoration-underline"
                        >
                          로그인하기
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          // ====================================================
          // 2. 로그인되었을 때: 기존 일정/메모 본문화면 렌더링   
          // ====================================================
          <>
            {/* 1. 일정 관리 (Schedule Tab) */}
            {activeTab === 'schedule' && (
              <ScheduleSection
                briefing={getTodayBriefing()}
                totalCount={totalCount}
                completedCount={completedCount}
                pendingCount={pendingCount}
                importantCount={importantCount}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                completionFilter={completionFilter}
                setCompletionFilter={setCompletionFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                scheduleLoading={scheduleLoading}
                mySchedules={mySchedules}
                myRawSchedules={myRawSchedules}
                calculateDDay={calculateDDay}
                formatDateKST={formatDateKST}
                renderHighlightedText={renderHighlightedText}
                toggleComplete={toggleComplete}
                handleStartEdit={handleStartEdit}
                handleCancelEdit={handleCancelEdit}
                setIsScheduleModalOpen={setIsScheduleModalOpen}
                setDeleteConfirmTarget={setDeleteConfirmTarget}
                downloadScheduleIcs={downloadScheduleIcs}
              />
            )}

            {/* 2. 메모패드 (Memo Tab) */}
            {activeTab === 'memo' && (
              <MemoSection
                memoLoading={memoLoading}
                filteredMemos={filteredMemos}
                memoSearchQuery={memoSearchQuery}
                setMemoSearchQuery={setMemoSearchQuery}
                memoColorFilter={memoColorFilter}
                setMemoColorFilter={setMemoColorFilter}
                selectedFont={selectedFont}
                handleFontChange={handleFontChange}
                handleCancelMemoEdit={handleCancelMemoEdit}
                setIsMemoModalOpen={setIsMemoModalOpen}
                setSelectedMemo={setSelectedMemo}
                handleStartMemoEdit={handleStartMemoEdit}
                formatDateKST={formatDateKST}
              />
            )}

            {/* 3. 마이페이지 (Profile Tab) */}
            {activeTab === 'profile' && (
              <div className="row justify-content-center animate-fade-in">
                <div className="col-lg-8 col-xl-7">
                  <div 
                    className="premium-card p-5 position-relative overflow-hidden rounded-4 text-start"
                    style={{ 
                      backgroundColor: 'rgba(15, 18, 36, 0.85)',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                      boxShadow: '0 0 30px rgba(99, 102, 241, 0.15), 0 15px 45px rgba(0, 0, 0, 0.65)'
                    }}
                  >
                    {/* 상단 프로필 헤더 */}
                    <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{
                            width: '64px',
                            height: '64px',
                            background: 'var(--primary-gradient)',
                            boxShadow: '0 0 15px var(--neon-pink)'
                          }}
                        >
                          <i className="bi bi-person-bounding-box text-white fs-3"></i>
                        </div>
                        <div>
                          <h4 className="fw-bold mb-1 text-white display-font">{user.displayName}</h4>
                          <span className="text-secondary small d-flex align-items-center gap-1">
                            {user.provider === 'google' && <i className="bi bi-google text-danger"></i>}
                            {user.provider === 'kakao' && <i className="bi bi-chat-fill text-warning"></i>}
                            {user.provider === 'naver' && <i className="bi bi-n-circle-fill text-success"></i>}
                            {user.provider === 'local' && <i className="bi bi-person-circle text-primary"></i>}
                            <span className="text-uppercase fw-semibold">{user.provider} Auth Portal</span>
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={signOutUser}
                        className="btn btn-outline-danger rounded-pill px-4 py-2 fw-semibold"
                        style={{ fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                      >
                        <i className="bi bi-box-arrow-right me-1"></i>로그아웃
                      </button>
                    </div>

                    {/* 에러 및 성공 메시지 출력 */}
                    {profileError && (
                      <div className="alert alert-danger border-0 small rounded-3 d-flex align-items-center gap-2 mb-4 animate-fade-in" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }} role="alert">
                        <i className="bi bi-exclamation-triangle-fill fs-6"></i>
                        <div>{profileError}</div>
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="alert alert-success border-0 small rounded-3 d-flex align-items-center gap-2 mb-4 animate-fade-in" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }} role="alert">
                        <i className="bi bi-check-circle-fill fs-6"></i>
                        <div>{profileSuccess}</div>
                      </div>
                    )}

                    <form onSubmit={handleProfileSubmit}>
                      {/* 닉네임 수정 필드 */}
                      <div className="mb-4">
                        <label htmlFor="profileDisplayName" className="form-label small fw-semibold text-secondary">이름 / 닉네임 변경 *</label>
                        <input
                          type="text"
                          id="profileDisplayName"
                          className="form-control form-premium-control text-white"
                          value={profileDisplayName}
                          onChange={(e) => setProfileDisplayName(e.target.value)}
                          placeholder="새로운 닉네임을 입력하세요"
                          required
                        />
                      </div>

                      {/* 이메일 주소 정보 (읽기 전용) */}
                      <div className="mb-4">
                        <label className="form-label small fw-semibold text-secondary">계정 아이디 (이메일 주소)</label>
                        <input
                          type="text"
                          className="form-control form-premium-control text-secondary bg-transparent"
                          value={user.username}
                          disabled
                          style={{ opacity: 0.6 }}
                        />
                      </div>

                      {/* 글로벌 푸시 알림 수신 설정 (네온 토글 스위치) */}
                      <div className="mb-4 p-4 rounded-4 border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <h6 className="fw-bold text-white mb-1 d-flex align-items-center gap-2">
                              <i className="bi bi-bell-fill text-info" style={{ filter: 'drop-shadow(0 0 5px var(--neon-cyan))' }}></i>
                              글로벌 푸시 알림 수신 설정
                            </h6>
                            <small className="text-secondary" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                              체크 해제 시 기기의 일정 시작 알림이 더 이상 전송되지 않습니다.
                            </small>
                          </div>
                          <div className="form-check form-switch p-0 m-0">
                            <input
                              className="form-check-input cursor-pointer switch-neon-cyan"
                              type="checkbox"
                              id="profilePushEnabled"
                              checked={user.pushEnabled}
                              onChange={handleTogglePush}
                              style={{ 
                                width: '50px', 
                                height: '26px',
                                cursor: 'pointer',
                                filter: user.pushEnabled ? 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.5))' : 'none'
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 비밀번호 변경 필드 (Local 유저 한정 노출) */}
                      {user.provider === 'local' && (
                        <div className="p-4 rounded-4 mb-4 border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                          <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2">
                            <i className="bi bi-shield-lock-fill text-warning"></i>
                            비밀번호 변경하기
                          </h6>
                          <div className="row g-3">
                            <div className="col-12">
                              <label htmlFor="profileCurrentPassword" className="form-label small fw-semibold text-secondary">현재 비밀번호 *</label>
                              <input
                                type="password"
                                id="profileCurrentPassword"
                                className="form-control form-premium-control text-white"
                                value={profileCurrentPassword}
                                onChange={(e) => setProfileCurrentPassword(e.target.value)}
                                placeholder="현재 비밀번호를 입력해 주세요"
                              />
                            </div>
                            <div className="col-md-6">
                              <label htmlFor="profileNewPassword" className="form-label small fw-semibold text-secondary">새 비밀번호</label>
                              <input
                                type="password"
                                id="profileNewPassword"
                                className="form-control form-premium-control text-white"
                                value={profileNewPassword}
                                onChange={(e) => setProfileNewPassword(e.target.value)}
                                placeholder="최소 4자 이상"
                              />
                            </div>
                            <div className="col-md-6">
                              <label htmlFor="profileNewPasswordConfirm" className="form-label small fw-semibold text-secondary">새 비밀번호 확인</label>
                              <input
                                type="password"
                                id="profileNewPasswordConfirm"
                                className="form-control form-premium-control text-white"
                                value={profileNewPasswordConfirm}
                                onChange={(e) => setProfileNewPasswordConfirm(e.target.value)}
                                placeholder="동일하게 입력"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="btn btn-premium-primary w-100 py-3 rounded-pill fw-bold shadow-sm transition-all mt-2"
                      >
                        <i className="bi bi-check-circle-fill me-2"></i>변경 사항 저장하기
                      </button>

                      {/* 계정 탈퇴 액션 영역 (Danger Zone) */}
                      <div className="mt-5 pt-3 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <span className="text-secondary small fw-semibold">위험 구역 (Danger Zone)</span>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.75rem', opacity: 0.6 }}>계정을 삭제하면 복구가 불가능하며, 일정 및 메모 등 모든 정보가 소멸됩니다.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsDeleteAccountModalOpen(true)}
                            className="btn btn-sm btn-outline-danger px-3 py-2 rounded-3"
                            style={{ fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                          >
                            계정 탈퇴하기
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Glassmorphic Memo Detail Popup Modal */}
      {selectedMemo && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
          style={{
            zIndex: 9999,
            backgroundColor: 'rgba(8, 10, 20, 0.75)',
            backdropFilter: 'blur(16px)',
            transition: 'all 0.3s ease-in-out'
          }}
          onClick={() => setSelectedMemo(null)}
        >
          <div 
            className="premium-card p-4 w-100 rounded-4 position-relative scale-in"
            style={{
              maxWidth: '650px',
              backgroundColor: 'rgba(15, 18, 36, 0.93)',
              color: '#f1f5f9',
              border: `1px solid ${hexToRgbaUtil(selectedMemo.color || '#6366f1', 0.25)}`,
              borderTop: `6px solid ${selectedMemo.color || '#6366f1'}`,
              boxShadow: `0 0 30px ${hexToRgbaUtil(selectedMemo.color || '#6366f1', 0.25)}, 0 15px 50px rgba(0, 0, 0, 0.65), inset 0 0 15px ${hexToRgbaUtil(selectedMemo.color || '#6366f1', 0.08)}`,
              fontFamily: getSelectedFontCssUtil(selectedFont)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="d-flex align-items-start justify-content-between mb-3 border-bottom pb-3" style={{ borderColor: hexToRgbaUtil(selectedMemo.color || '#6366f1', 0.18) }}>
              <div>
                <h4 className="fw-bold mb-1 display-font d-flex align-items-center gap-2" style={{ letterSpacing: '-0.3px', color: '#ffffff' }}>
                  {isMemoPinned(selectedMemo) && <i className="bi bi-pin-angle-fill" style={{ color: selectedMemo.color || '#6366f1', fontSize: '1.25rem' }}></i>}
                  {getCleanMemoTitle(selectedMemo.title)}
                </h4>
                <div className="d-flex flex-wrap align-items-center gap-2 mt-1" style={{ opacity: 0.85 }}>
                  <small style={{ fontSize: '0.75rem', color: '#94a3b8' }} className="d-flex align-items-center gap-1">
                    <i className="bi bi-clock-history"></i>
                    {formatDateKST(selectedMemo.createdAt, true)} 작성됨
                  </small>
                  {(() => {
                    const stats = getMemoStats(selectedMemo.content || '');
                    return (
                      <span 
                        className="badge py-1 px-2 border" 
                        style={{ 
                          fontSize: '0.65rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: '#94a3b8',
                          borderColor: 'rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        공백제외: {stats.charCountWithoutSpace}자 / 예상리딩: {stats.readingTimeMins}분
                      </span>
                    );
                  })()}
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedMemo(null)}
                onMouseEnter={() => setCloseHovered(true)}
                onMouseLeave={() => setCloseHovered(false)}
                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ 
                  backgroundColor: closeHovered ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  color: closeHovered ? '#f87171' : '#94a3b8',
                  width: '32px',
                  height: '32px',
                  border: `1px solid ${closeHovered ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  boxShadow: closeHovered ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
                  transition: 'all 0.2s ease-in-out',
                  cursor: 'pointer'
                }}
                title="닫기"
              >
                <i className="bi bi-x-lg fs-6"></i>
              </button>
            </div>

            {/* Modal Body (Scrollable Markdown Contents) */}
            <div 
              className="py-2 mb-4 scrollbar-premium text-start" 
              style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                lineHeight: '1.6',
                fontSize: '0.95rem'
              }}
            >
              <MarkdownRenderer 
                content={selectedMemo.content} 
                isDarkColor={true} 
                onTodoToggle={async (lineIndex) => {
                  const lines = (selectedMemo.content || '').split('\n');
                  if (lines[lineIndex] !== undefined) {
                    const line = lines[lineIndex];
                    if (line.match(/^(\s*[-*]\s+\[)\s(\].*)$/)) {
                      lines[lineIndex] = line.replace(/^(\s*[-*]\s+\[)\s(\].*)$/, '$1x$2');
                    } else if (line.match(/^(\s*[-*]\s+\[)[xX](\].*)$/)) {
                      lines[lineIndex] = line.replace(/^(\s*[-*]\s+\[)[xX](\].*)$/, '$1 $2');
                    }
                    const newContent = lines.join('\n');
                    await editMemo(selectedMemo.id, {
                      title: selectedMemo.title,
                      content: newContent,
                      color: selectedMemo.color
                    });
                    setSelectedMemo({
                      ...selectedMemo,
                      content: newContent
                    });
                  }
                }}
              />
            </div>

            {/* Modal Footer Controls */}
            <div className="d-flex align-items-center justify-content-between border-top pt-3" style={{ borderColor: hexToRgbaUtil(selectedMemo.color || '#6366f1', 0.18) }}>
              <span 
                className="badge px-3 py-2 rounded-pill fw-semibold" 
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                  color: '#94a3b8', 
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.75rem' 
                }}
              >
                ✏️ Premium View Mode
              </span>
              
              <div className="d-flex gap-2">
                <button
                  onClick={() => {
                    copyMemoMarkdown(selectedMemo);
                  }}
                  onMouseEnter={() => setHoveredAction('copy')}
                  onMouseLeave={() => setHoveredAction(null)}
                  className="btn btn-sm px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-1"
                  style={{
                    background: hoveredAction === 'copy'
                      ? 'linear-gradient(135deg, #2dd4bf, #0ea5e9)'
                      : 'linear-gradient(135deg, rgba(45, 212, 191, 0.08), rgba(14, 165, 233, 0.08))',
                    color: hoveredAction === 'copy' ? '#ffffff' : '#2dd4bf',
                    border: '1px solid rgba(45, 212, 191, 0.4)',
                    boxShadow: hoveredAction === 'copy' ? '0 0 15px rgba(45, 212, 191, 0.5)' : 'none',
                    fontSize: '0.8rem',
                    transform: hoveredAction === 'copy' ? 'translateY(-1px)' : 'none',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer'
                  }}
                  title="마크다운 복사"
                >
                  <i className="bi bi-share-fill"></i> 복사
                </button>
                <button
                  onClick={() => {
                    handleStartMemoEdit(selectedMemo);
                    setSelectedMemo(null);
                  }}
                  onMouseEnter={() => setHoveredAction('edit')}
                  onMouseLeave={() => setHoveredAction(null)}
                  className="btn btn-sm px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-1"
                  style={{
                    background: hoveredAction === 'edit'
                      ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                      : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))',
                    color: hoveredAction === 'edit' ? '#ffffff' : '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    boxShadow: hoveredAction === 'edit' ? '0 0 15px rgba(99, 102, 241, 0.5)' : 'none',
                    fontSize: '0.8rem',
                    transform: hoveredAction === 'edit' ? 'translateY(-1px)' : 'none',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer'
                  }}
                >
                  <i className="bi bi-pencil-fill"></i> 수정하기
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirmTarget({ type: 'memo', id: selectedMemo.id });
                    setSelectedMemo(null);
                  }}
                  onMouseEnter={() => setHoveredAction('delete')}
                  onMouseLeave={() => setHoveredAction(null)}
                  className="btn btn-sm px-3 py-2 rounded-3 fw-bold text-white d-flex align-items-center gap-1"
                  style={{
                    background: hoveredAction === 'delete'
                      ? 'linear-gradient(135deg, #f43f5e, #e11d48)'
                      : 'linear-gradient(135deg, rgba(244, 63, 94, 0.08), rgba(225, 29, 72, 0.08))',
                    color: hoveredAction === 'delete' ? '#ffffff' : '#f43f5e',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    boxShadow: hoveredAction === 'delete' ? '0 0 15px rgba(244, 63, 94, 0.5)' : 'none',
                    fontSize: '0.8rem',
                    transform: hoveredAction === 'delete' ? 'translateY(-1px)' : 'none',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer'
                  }}
                >
                  <i className="bi bi-trash-fill"></i> 삭제하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pomodoro Timer Floating Widget */}
      <div 
        className="position-fixed bottom-4 end-4 text-end"
        style={{ zIndex: 9999, bottom: '24px', right: '24px' }}
      >
        {!showPomodoroWidget ? (
          <button
            onClick={() => setShowPomodoroWidget(true)}
            className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 border-0"
            style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #ff6b6b, #ff8787)',
              boxShadow: '0 8px 24px rgba(255, 107, 107, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            title="뽀모도로 집중 타이머 열기"
          >
            <i className="bi bi-hourglass-split text-white fs-4"></i>
            {pomodoroIsRunning && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style={{ fontSize: '0.65rem' }}>
                ON
              </span>
            )}
          </button>
        ) : (
          <div 
            className="premium-card p-3 rounded-4 shadow-lg text-start border-0 animate-scale-up"
            style={{
              width: '300px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              color: '#2b2d42',
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}
          >
            <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <h6 className="fw-bold m-0 d-flex align-items-center gap-2 text-primary">
                🍅 뽀모도로 타이머
              </h6>
              <button 
                onClick={() => setShowPomodoroWidget(false)}
                className="btn btn-sm rounded-circle p-0 border-0 d-flex align-items-center justify-content-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.05)', width: '24px', height: '24px' }}
              >
                <i className="bi bi-dash fs-6"></i>
              </button>
            </div>

            <div className="text-center py-3">
              <div className="display-4 fw-bold display-font text-dark mb-1" style={{ fontSize: '2.5rem' }}>
                {Math.floor(pomodoroSeconds / 60).toString().padStart(2, '0')}:
                {(pomodoroSeconds % 60).toString().padStart(2, '0')}
              </div>
              <span className={`badge px-2 py-1 rounded-pill ${pomodoroMode === 'focus' ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-success-subtle text-success border border-success-subtle'}`} style={{ fontSize: '0.75rem' }}>
                {pomodoroMode === 'focus' ? '🎯 집중 모드' : '🌿 휴식 모드'}
              </span>
            </div>

            {/* Controls */}
            <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
              <button
                onClick={() => setPomodoroIsRunning(!pomodoroIsRunning)}
                className={`btn btn-sm px-3 py-1.5 rounded-pill fw-bold text-white d-flex align-items-center gap-1 border-0 ${pomodoroIsRunning ? 'bg-warning' : 'bg-primary'}`}
                style={{ fontSize: '0.8rem' }}
              >
                <i className={`bi ${pomodoroIsRunning ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                {pomodoroIsRunning ? '일시정지' : '시작'}
              </button>
              <button
                onClick={() => {
                  setPomodoroIsRunning(false);
                  setPomodoroSeconds(pomodoroMode === 'focus' ? pomodoroCustomFocus * 60 : pomodoroCustomBreak * 60);
                }}
                className="btn btn-sm btn-outline-secondary px-3 py-1.5 rounded-pill fw-bold d-flex align-items-center gap-1"
                style={{ fontSize: '0.8rem' }}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                초기화
              </button>
            </div>

            {/* Settings */}
            <div className="bg-light p-2 rounded-3" style={{ fontSize: '0.75rem' }}>
              <div className="row g-2 align-items-center">
                <div className="col-6">
                  <label className="text-muted fw-medium mb-1 d-block">집중 시간 (분)</label>
                  <input 
                    type="number" 
                    value={pomodoroCustomFocus} 
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 25);
                      setPomodoroCustomFocus(val);
                      if (pomodoroMode === 'focus' && !pomodoroIsRunning) {
                        setPomodoroSeconds(val * 60);
                      }
                    }}
                    className="form-control form-control-sm text-center border-0 bg-white"
                    min="1"
                  />
                </div>
                <div className="col-6">
                  <label className="text-muted fw-medium mb-1 d-block">휴식 시간 (분)</label>
                  <input 
                    type="number" 
                    value={pomodoroCustomBreak} 
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 5);
                      setPomodoroCustomBreak(val);
                      if (pomodoroMode === 'break' && !pomodoroIsRunning) {
                        setPomodoroSeconds(val * 60);
                      }
                    }}
                    className="form-control form-control-sm text-center border-0 bg-white"
                    min="1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 (Glassmorphic) */}
      {deleteConfirmTarget && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
          style={{
            zIndex: 10000,
            backgroundColor: deleteConfirmTarget.type === 'memo' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(16px)',
            transition: 'all 0.3s ease-in-out'
          }}
          onClick={() => setDeleteConfirmTarget(null)}
        >
          {deleteConfirmTarget.type === 'memo' ? (
            /* 메모 삭제용 풀스크린 글래스모피즘 컨펌 보드 */
            <div 
              className="w-100 h-100 d-flex flex-column align-items-center justify-content-center scale-in text-white p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 3D 느낌의 크고 화려한 경고 비주얼 */}
              <div 
                className="mb-4 d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: '120px',
                  height: '120px',
                  background: 'radial-gradient(circle, #ff8787 0%, #fa5252 100%)',
                  boxShadow: '0 15px 35px rgba(250, 82, 82, 0.4), inset 0 -8px 0px rgba(0,0,0,0.15)',
                  transform: 'perspective(500px) translateZ(20px)',
                  animation: 'pulse 2s infinite'
                }}
              >
                <i className="bi bi-trash-fill text-white" style={{ fontSize: '3.5rem' }}></i>
              </div>

              <h2 className="fw-bold mb-2 display-font text-white">메모를 삭제하시겠습니까?</h2>
              <p className="text-white-50 text-center mb-5" style={{ maxWidth: '500px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                선택하신 메모는 복구할 수 없도록 완전히 삭제되며,<br />
                데이터베이스에서 영구히 제거됩니다.
              </p>

              {/* 큼직한 가로 배치 취소/삭제 단추 */}
              <div className="d-flex gap-3 justify-content-center w-100" style={{ maxWidth: '480px' }}>
                <button
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="btn btn-outline-light py-3.5 rounded-4 fw-bold flex-grow-1"
                  style={{ fontSize: '1.1rem', backdropFilter: 'blur(5px)', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '12px' }}
                >
                  아니오, 유지할래요
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="btn btn-danger py-3.5 rounded-4 fw-bold flex-grow-1 shadow-lg"
                  style={{
                    fontSize: '1.1rem',
                    backgroundColor: '#fa5252',
                    border: 'none',
                    boxShadow: '0 10px 25px rgba(250, 82, 82, 0.3)',
                    borderRadius: '12px'
                  }}
                >
                  네, 삭제합니다
                </button>
              </div>
            </div>
          ) : (
            /* 일정 삭제용 컴팩트 모달 */
            <div 
              className="premium-card p-4 w-100 rounded-4 position-relative scale-in"
              style={{
                maxWidth: '400px',
                backgroundColor: 'rgba(15, 18, 36, 0.95)',
                color: '#e2e8f0',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                borderTop: '6px solid #f43f5e',
                boxShadow: '0 0 25px rgba(244, 63, 94, 0.25), 0 20px 50px rgba(0, 0, 0, 0.65)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Icon */}
              <div className="text-center mb-3">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-2 shadow-sm" style={{ width: '56px', height: '56px', backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
                  <i className="bi bi-exclamation-triangle-fill fs-3"></i>
                </div>
                <h5 className="fw-bold mb-1 text-white">삭제 확인</h5>
              </div>

              {/* Body Text */}
              <div className="text-center py-2 mb-4 text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                삭제하시겠습니까?<br />
                <small className="text-secondary" style={{ fontSize: '0.8rem', opacity: 0.6 }}>(이 작업은 되돌릴 수 없습니다.)</small>
              </div>

              {/* Footer Buttons */}
              <div className="d-flex gap-2">
                <button
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="btn w-100 py-2.5 rounded-3 fw-semibold border-0"
                  style={{ fontSize: '0.9rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="btn w-100 py-2.5 rounded-3 fw-semibold border-0 text-white"
                  style={{ fontSize: '0.9rem', background: 'linear-gradient(135deg, #f43f5e, #e11d48)', boxShadow: '0 0 10px rgba(244, 63, 94, 0.4)' }}
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ScheduleModalView
        open={isScheduleModalOpen}
        editingScheduleId={editingScheduleId}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        hasTime={hasTime}
        setHasTime={setHasTime}
        startDate={startDate}
        setStartDate={setStartDate}
        startTimeVal={startTimeVal}
        setStartTimeVal={setStartTimeVal}
        endDate={endDate}
        setEndDate={setEndDate}
        endTimeVal={endTimeVal}
        setEndTimeVal={setEndTimeVal}
        category={category}
        setCategory={setCategory}
        onClose={handleCancelEdit}
        onSubmit={handleSubmit}
        onSaveOnly={handleSaveScheduleOnly}
      />

      <MemoModalView
        open={isMemoModalOpen}
        editingMemoId={editingMemoId}
        memoTitle={memoTitle}
        setMemoTitle={setMemoTitle}
        memoContent={memoContent}
        setMemoContent={(value) => handleMemoContentChange(value, value.length)}
        memoColor={memoColor}
        setMemoColor={setMemoColor}
        selectedFont={selectedFont}
        handleFontChange={handleFontChange}
        memoSuggestionsVisible={slashSuggestions.length > 0}
        selectedSlashSuggestionIndex={selectedSlashSuggestionIndex}
        slashSuggestions={slashSuggestions}
        insertSlashCommand={insertSlashCommand}
        onClose={handleCancelMemoEdit}
        onSubmit={handleMemoSubmit}
        onSaveOnly={handleSaveMemoOnly}
        handleCancelMemoEdit={handleCancelMemoEdit}
        pastelColors={pastelColorsData}
        fontOptions={fontOptionsData}
        checkIfDarkColor={checkIfDarkColorUtil}
        memoError={memoError}
        getSelectedFontCss={getSelectedFontCssUtil}
        handleMemoContentChange={handleMemoContentChange}
        handleMemoContentKeyDown={handleMemoContentKeyDown}
      />

      {/* 회원 탈퇴 확인 모달 (Danger Zone Glassmorphic) */}
      {isDeleteAccountModalOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
          style={{
            zIndex: 10000,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            transition: 'all 0.3s ease-in-out'
          }}
          onClick={() => setIsDeleteAccountModalOpen(false)}
        >
          <div 
            className="w-100 h-100 d-flex flex-column align-items-center justify-content-center scale-in text-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 경고 비주얼 */}
            <div 
              className="mb-4 d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '120px',
                height: '120px',
                background: 'radial-gradient(circle, #ff8787 0%, #fa5252 100%)',
                boxShadow: '0 15px 35px rgba(250, 82, 82, 0.4), inset 0 -8px 0px rgba(0,0,0,0.15)',
                animation: 'pulse 2s infinite'
              }}
            >
              <i className="bi bi-person-x-fill text-white" style={{ fontSize: '3.5rem' }}></i>
            </div>

            <h2 className="fw-bold mb-2 display-font text-white">정말로 탈퇴하시겠습니까?</h2>
            <p className="text-white-50 text-center mb-5" style={{ maxWidth: '500px', fontSize: '1.1rem', lineHeight: '1.6' }}>
              회원 탈퇴 시 작성하신 모든 일정, 메모 정보가 즉시 소멸되며<br />
              소셜(카카오 등) 연동 연결이 안전하게 차단/해제됩니다.<br />
              이 작업은 절대 되돌릴 수 없습니다.
            </p>

            {/* 취소 / 탈퇴 버튼 */}
            <div className="d-flex gap-3 justify-content-center w-100" style={{ maxWidth: '480px' }}>
              <button
                onClick={() => setIsDeleteAccountModalOpen(false)}
                className="btn btn-outline-light py-3.5 rounded-4 fw-bold flex-grow-1"
                style={{ fontSize: '1.1rem', backdropFilter: 'blur(5px)', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '12px' }}
              >
                아니오, 유지할래요
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn btn-danger py-3.5 rounded-4 fw-bold flex-grow-1 shadow-lg"
                style={{
                  fontSize: '1.1rem',
                  backgroundColor: '#fa5252',
                  border: 'none',
                  boxShadow: '0 10px 25px rgba(250, 82, 82, 0.3)',
                  borderRadius: '12px'
                }}
              >
                네, 탈퇴하겠습니다
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div 
          className="position-fixed bottom-4 start-50 translate-middle-x px-4 py-3 rounded-pill shadow-lg d-flex align-items-center gap-2 border text-white animate-fade-in"
          style={{
            zIndex: 10000,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            fontSize: '0.9rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            bottom: '30px'
          }}
        >
          <i className="bi bi-check-circle-fill text-success fs-5"></i>
          <span className="fw-medium">{toastMessage}</span>
        </div>
      )}

      {/* Elegant Footer */}
      <footer 
        className="py-5 mt-5"
        style={{ 
          backgroundColor: 'rgba(8, 10, 20, 0.85)', 
          borderTop: '1px solid rgba(99, 102, 241, 0.15)'
        }}
      >
        <div className="container text-center">
          <p className="mb-1 fw-bold display-font" style={{ color: '#ffffff', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Simple Note</p>
          <p className="text-secondary small mb-0" style={{ opacity: 0.75 }}>일정과 메모를 조용하게 정리하는 개인 작업공간.</p>
          <p className="text-secondary" style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.5 }}>
            Built with Next.js App Router, Supabase, and Bootstrap 5.
          </p>
        </div>
      </footer>
    </>
  );
}
