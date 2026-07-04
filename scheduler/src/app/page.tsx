"use client";

import { useState, useEffect } from 'react';
import { useSchedules } from '../hooks/useSchedules';
import { useMemos } from '../hooks/useMemos';
import { useAuth } from '../hooks/useAuth';

import { ScheduleSection } from '../components/ScheduleSection';
import { MemoSection } from '../components/MemoSection';
import { ProfileSection } from '../components/ProfileSection';
import { MemoDetailModal } from '../components/MemoDetailModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { PomodoroWidget } from '../components/PomodoroWidget';
import { ToastMessage } from '../components/ToastMessage';
import { ScheduleModal as ScheduleModalView } from '../components/ScheduleModal';
import { MemoModal as MemoModalView } from '../components/MemoModal';
import { AuthPortal } from '../components/AuthPortal';

// 커스텀 훅 임포트
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { usePushNotification } from '../hooks/usePushNotification';
import { useScheduleForm } from '../hooks/useScheduleForm';
import { useMemoForm } from '../hooks/useMemoForm';
import { useProfileForm } from '../hooks/useProfileForm';
import { useAuthForm } from '../hooks/useAuthForm';

import {
  pastelColors,
  fontOptions,
  checkIfDarkColor,
  hexToRgba,
  getSelectedFontCss
} from '../lib/editorUi';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'memo' | 'profile'>('schedule');
  const [mounted, setMounted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. 유저 인증 상태 & 비즈니스 로직
  const {
    user,
    authError,
    setAuthError,
    signUpUser,
    signInUser,
    signInSocial,
    signOutUser,
    updateProfile,
    deleteAccount
  } = useAuth();

  // 2. 일정 관리 상태 & 비즈니스 로직
  const {
    schedules,
    rawSchedules,
    loading: scheduleLoading,
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
    addMemo,
    editMemo,
    removeMemo
  } = useMemos();

  // 플로팅 토스트 피드백 노출 함수
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // 모달 및 서브 상태 관리
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<any>(null);
  const [memoSearchQuery, setMemoSearchQuery] = useState('');
  const [memoColorFilter, setMemoColorFilter] = useState('All');
  
  // 메모 상세 모달 제어 버튼들의 호버 상태 관리
  const [closeHovered, setCloseHovered] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<'copy' | 'edit' | 'delete' | null>(null);

  // 삭제 확인 모달용 상태
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'schedule' | 'memo';
    id: string;
  } | null>(null);

  // 뽀모도로 타이머 훅 연동
  const pomodoro = usePomodoroTimer();

  // 푸시 알림 훅 연동
  const { notifiedIds } = usePushNotification(schedules, user, mounted);

  // 일정 폼 훅 연동
  const scheduleForm = useScheduleForm({
    addSchedule,
    updateScheduleDetails,
    userId: user?.id,
    setIsScheduleModalOpen,
    showToast
  });

  // 메모 폼 훅 연동
  const memoForm = useMemoForm({
    addMemo,
    editMemo,
    userId: user?.id,
    setIsMemoModalOpen,
    showToast
  });

  // 프로필 폼 훅 연동
  const profileForm = useProfileForm({
    user,
    updateProfile,
    deleteAccount,
    showToast
  });

  // 인증 폼 훅 연동
  const authForm = useAuthForm({
    signUpUser,
    signInUser,
    setAuthError
  });

  // 글꼴 선택 커스터마이저 상태 & 옵션 정의
  const [selectedFont, setSelectedFont] = useState<string>('Pretendard');

  useEffect(() => {
    setMounted(true);
    
    // 앱 기동 시 마지막에 갱신된 글꼴 설정 자동 복원
    const savedFont = localStorage.getItem('selected_memo_font');
    if (savedFont) {
      setSelectedFont(savedFont);
    }
  }, []);

  if (!mounted) return null;

  const handleFontChange = (fontValue: string) => {
    setSelectedFont(fontValue);
    localStorage.setItem('selected_memo_font', fontValue);
  };

  // 사용자 소유권 격리 필터링
  const myRawSchedules = user ? rawSchedules.filter(s => !s.userId || s.userId === user.id) : [];
  const mySchedules = user ? schedules.filter(s => !s.userId || s.userId === user.id) : [];
  const myMemos = user ? memos.filter(m => !m.userId || m.userId === user.id) : [];

  const totalCount = myRawSchedules.length;
  const completedCount = myRawSchedules.filter(s => s.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const importantCount = myRawSchedules.filter(s => s.category === 'Important' && !s.isCompleted).length;

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

  // 일정 iCal 파일 다운로드
  const downloadScheduleIcs = (schedule: any) => {
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

  // 메모 JSON 백업
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

  // 메모 JSON 복원
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
        e.target.value = '';
      } catch (err) {
        showToast('❌ JSON 복원 실패: 파일 분석 오류');
      }
    };
    reader.readAsText(file);
  };

  const isMemoPinned = (memo: any) => memo.title.startsWith('📌 ');
  const getCleanMemoTitle = (title: string) => title.replace(/^📌\s*/, '');

  // 메모 중요도 핀 고정 토글
  const togglePinMemo = async (memo: any) => {
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

  // 마크다운 원본 복사
  const copyMemoMarkdown = (memo: any) => {
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
        {!user ? (
          <AuthPortal
            authError={authError}
            authMode={authForm.authMode}
            setAuthMode={authForm.setAuthMode}
            setAuthError={setAuthError}
            authUsername={authForm.authUsername}
            setAuthUsername={authForm.setAuthUsername}
            authPassword={authForm.authPassword}
            setAuthPassword={authForm.setAuthPassword}
            authDisplayName={authForm.authDisplayName}
            setAuthDisplayName={authForm.setAuthDisplayName}
            rememberMe={authForm.rememberMe}
            setRememberMe={authForm.setRememberMe}
            handleAuthSubmit={authForm.handleAuthSubmit}
            signInSocial={signInSocial}
          />
        ) : (
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
                handleStartEdit={scheduleForm.handleStartEdit}
                handleCancelEdit={scheduleForm.handleCancelEdit}
                setDeleteConfirmTarget={setDeleteConfirmTarget}
                setIsScheduleModalOpen={setIsScheduleModalOpen}
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
                handleCancelMemoEdit={memoForm.handleCancelMemoEdit}
                setIsMemoModalOpen={setIsMemoModalOpen}
                setSelectedMemo={setSelectedMemo}
                handleStartMemoEdit={memoForm.handleStartMemoEdit}
                formatDateKST={formatDateKST}
              />
            )}

            {/* 3. 마이페이지 (Profile Tab) */}
            {activeTab === 'profile' && (
              <ProfileSection
                user={user}
                profileDisplayName={profileForm.profileDisplayName}
                setProfileDisplayName={profileForm.setProfileDisplayName}
                profileCurrentPassword={profileForm.profileCurrentPassword}
                setProfileCurrentPassword={profileForm.setProfileCurrentPassword}
                profileNewPassword={profileForm.profileNewPassword}
                setProfileNewPassword={profileForm.setProfileNewPassword}
                profileNewPasswordConfirm={profileForm.profileNewPasswordConfirm}
                setProfileNewPasswordConfirm={profileForm.setProfileNewPasswordConfirm}
                profileError={profileForm.profileError}
                profileSuccess={profileForm.profileSuccess}
                onSubmit={profileForm.handleProfileSubmit}
                onTogglePush={profileForm.handleTogglePush}
                onOpenDeleteAccount={() => profileForm.setIsDeleteAccountModalOpen(true)}
                onSignOut={signOutUser}
              />
            )}
          </>
        )}
      </div>

      {/* Floating Pomodoro Widget */}
      <PomodoroWidget
        show={pomodoro.showPomodoroWidget}
        isRunning={pomodoro.pomodoroIsRunning}
        seconds={pomodoro.pomodoroSeconds}
        mode={pomodoro.pomodoroMode}
        customFocus={pomodoro.pomodoroCustomFocus}
        customBreak={pomodoro.pomodoroCustomBreak}
        onOpen={() => pomodoro.setShowPomodoroWidget(true)}
        onClose={() => pomodoro.setShowPomodoroWidget(false)}
        onToggle={() => pomodoro.setPomodoroIsRunning(!pomodoro.pomodoroIsRunning)}
        onReset={() => {
          pomodoro.setPomodoroIsRunning(false);
          pomodoro.setPomodoroSeconds(pomodoro.pomodoroMode === 'focus' ? pomodoro.pomodoroCustomFocus * 60 : pomodoro.pomodoroCustomBreak * 60);
        }}
        onFocusChange={(val) => {
          pomodoro.setPomodoroCustomFocus(val);
          if (pomodoro.pomodoroMode === 'focus') pomodoro.setPomodoroSeconds(val * 60);
        }}
        onBreakChange={(val) => {
          pomodoro.setPomodoroCustomBreak(val);
          if (pomodoro.pomodoroMode === 'break') pomodoro.setPomodoroSeconds(val * 60);
        }}
      />

      {/* Toast Feedback Alert */}
      <ToastMessage message={toastMessage} />

      {/* Modal 1. Schedule Insert/Edit Modal */}
      <ScheduleModalView
        open={isScheduleModalOpen}
        editingScheduleId={scheduleForm.editingScheduleId}
        title={scheduleForm.title}
        setTitle={scheduleForm.setTitle}
        description={scheduleForm.description}
        setDescription={scheduleForm.setDescription}
        hasTime={scheduleForm.hasTime}
        setHasTime={scheduleForm.setHasTime}
        startDate={scheduleForm.startDate}
        setStartDate={scheduleForm.setStartDate}
        startTimeVal={scheduleForm.startTimeVal}
        setStartTimeVal={scheduleForm.setStartTimeVal}
        endDate={scheduleForm.endDate}
        setEndDate={scheduleForm.setEndDate}
        endTimeVal={scheduleForm.endTimeVal}
        setEndTimeVal={scheduleForm.setEndTimeVal}
        category={scheduleForm.category}
        setCategory={scheduleForm.setCategory}
        onClose={scheduleForm.handleCancelEdit}
        onSubmit={scheduleForm.handleSubmit}
        onSaveOnly={scheduleForm.handleSaveScheduleOnly}
      />

      {/* Modal 2. Memo Insert/Edit Modal */}
      <MemoModalView
        open={isMemoModalOpen}
        editingMemoId={memoForm.editingMemoId}
        memoTitle={memoForm.memoTitle}
        setMemoTitle={memoForm.setMemoTitle}
        memoContent={memoForm.memoContent}
        setMemoContent={memoForm.setMemoContent}
        memoColor={memoForm.memoColor}
        setMemoColor={memoForm.setMemoColor}
        selectedFont={selectedFont}
        handleFontChange={handleFontChange}
        memoSuggestionsVisible={memoForm.slashSuggestions.length > 0}
        selectedSlashSuggestionIndex={memoForm.selectedSlashSuggestionIndex}
        slashSuggestions={memoForm.slashSuggestions}
        insertSlashCommand={memoForm.insertSlashCommand}
        onClose={memoForm.handleCancelMemoEdit}
        onSubmit={memoForm.handleMemoSubmit}
        onSaveOnly={memoForm.handleSaveMemoOnly}
        handleCancelMemoEdit={memoForm.handleCancelMemoEdit}
        pastelColors={pastelColors}
        fontOptions={fontOptions}
        checkIfDarkColor={checkIfDarkColor}
        memoError={null}
        getSelectedFontCss={getSelectedFontCss}
        handleMemoContentChange={memoForm.handleMemoContentChange}
        handleMemoContentKeyDown={memoForm.handleMemoContentKeyDown}
      />

      {/* Modal 3. Memo Details View Modal */}
      {selectedMemo && (
        <MemoDetailModal
          memo={selectedMemo}
          selectedFont={selectedFont}
          closeHovered={closeHovered}
          setCloseHovered={setCloseHovered}
          hoveredAction={hoveredAction}
          setHoveredAction={setHoveredAction}
          onClose={() => setSelectedMemo(null)}
          onCopy={() => copyMemoMarkdown(selectedMemo)}
          onEdit={() => {
            memoForm.handleStartMemoEdit(selectedMemo);
            setSelectedMemo(null);
          }}
          onDelete={() => {
            setDeleteConfirmTarget({ type: 'memo', id: selectedMemo.id });
            setSelectedMemo(null);
          }}
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
              await editMemo(selectedMemo.id, { title: selectedMemo.title, content: newContent, color: selectedMemo.color });
              setSelectedMemo({ ...selectedMemo, content: newContent });
            }
          }}
          isMemoPinned={isMemoPinned}
          getCleanMemoTitle={getCleanMemoTitle}
          getMemoStats={getMemoStats}
          formatDateKST={formatDateKST}
        />
      )}

      {/* Modal 4. Hard Delete/Soft Delete Confirm Modal */}
      <DeleteConfirmModal
        open={!!deleteConfirmTarget}
        type={deleteConfirmTarget ? deleteConfirmTarget.type : null}
        onCancel={() => setDeleteConfirmTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Modal 5. Account Withdrawal Danger Zone Warning Confirm Modal */}
      {profileForm.isDeleteAccountModalOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3" 
          style={{ zIndex: 100000, backgroundColor: 'rgba(8, 10, 20, 0.85)', backdropFilter: 'blur(16px)' }}
        >
          <div 
            className="premium-card p-5 w-100 rounded-4 text-center border-danger-glow scale-in" 
            style={{ maxWidth: '520px', backgroundColor: 'rgba(15, 18, 36, 0.95)', border: '1px solid rgba(239, 68, 68, 0.3)', borderTop: '8px solid #ef4444' }}
          >
            <div className="text-danger mb-4">
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.4))' }}></i>
            </div>
            <h4 className="fw-bold mb-3 text-white">경고: 계정을 정말 삭제하시겠습니까?</h4>
            <p className="text-secondary small mb-4 lh-lg">
              회원 탈퇴를 진행하시면 <strong>개인 정보 및 기존의 일정, 메모 기록이 복구 불가능하게 모두 영구 소멸</strong>됩니다.<br />
              (소셜 로그인 연동 또한 원격으로 연결이 해제됩니다.)<br />
              신중히 선택해 주시기 바랍니다.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button 
                type="button" 
                onClick={() => profileForm.setIsDeleteAccountModalOpen(false)}
                className="btn btn-outline-secondary rounded-pill px-4 py-2.5 fw-semibold border"
                style={{ minWidth: '120px', color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)' }}
              >
                취소
              </button>
              <button 
                type="button" 
                onClick={profileForm.handleDeleteAccount}
                className="btn btn-danger rounded-pill px-4 py-2.5 fw-bold text-white"
                style={{ minWidth: '140px', background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              >
                회원 탈퇴
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
