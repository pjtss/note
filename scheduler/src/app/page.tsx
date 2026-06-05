"use client";

import { useState, useEffect } from 'react';
import { useSchedules } from '../hooks/useSchedules';
import { ScheduleCategory, Schedule } from '../types/schedule';
import { useMemos } from '../hooks/useMemos';
import { Memo } from '../types/memo';
import { useAuth } from '../hooks/useAuth';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'memo'>('schedule');

  // 1. 유저 인증 상태 & 비즈니스 로직
  const {
    user,
    loading: authLoading,
    authError,
    setAuthError,
    signUpUser,
    signInUser,
    signInSocial,
    signOutUser
  } = useAuth();

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
  const fontOptions = [
    { name: '💻 프리텐다드 (모던)', value: 'Pretendard', css: "'Pretendard', -apple-system, sans-serif" },
    { name: '🌟 Noto Sans KR (필수)', value: 'Noto Sans KR', css: "'Noto Sans KR', sans-serif" },
    { name: '✍️ 나눔고딕 (단정)', value: 'Nanum Gothic', css: "'Nanum Gothic', sans-serif" },
    { name: '📖 리디바탕 (도서)', value: 'Ridi Batang', css: "'RIDIBatang', Georgia, serif" },
    { name: '🎨 바른히피 (키치)', value: 'Gamja Flower', css: "'Gamja Flower', cursive" },
    { name: '🖋️ 손글씨 (감성)', value: 'Nanum Pen Script', css: "'Nanum Pen Script', cursive" },
    { name: '👶 배달의민족 주아 (동글)', value: 'Jua', css: "'Jua', sans-serif" },
    { name: '📝 고운돋움 (따뜻)', value: 'Gowun Dodum', css: "'Gowun Dodum', sans-serif" }
  ];

  // 선택한 글꼴의 실제 CSS 폰트 패밀리 값 획득 헬퍼
  const getSelectedFontCss = () => {
    const found = fontOptions.find(f => f.value === selectedFont);
    return found ? found.css : "'Pretendard', sans-serif";
  };

  // Supabase 가이드 배너 토글
  const [showGuide, setShowGuide] = useState(false);

  // 프리미엄 파스텔 & 세련된 오션 마린 테마 색상 정의 (하늘, 푸른, 바다색 계열 대폭 강화)
  const pastelColors = [
    { name: '💛 밀크바닐라', hex: '#fffbeb' },    // 감성 코지 옐로우 (라이트)
    { name: '🩵 스카이블루', hex: '#e0f2fe' },    // 화사한 아침 하늘색 (라이트)
    { name: '💙 소다레인', hex: '#bde0fe' },      // 청량한 청하늘색 (라이트)
    { name: '💚 산호바다', hex: '#ccfbf1' },      // 세련되고 맑은 민트 바다색 (라이트)
    { name: '🌊 소프트오션', hex: '#bae6fd' },    // 화사하고 은은한 파스텔 오션블루 (라이트)
    { name: '💎 소다시안', hex: '#e0f7fa' },      // 맑고 청명한 시안 파스텔 바다색 (라이트)
    { name: '💠 소프트마린', hex: '#dbeafe' },    // 세련되고 아늑한 파스텔 로열블루 (라이트)
    { name: '💜 연라벤더', hex: '#e8e8ff' },      // 은은한 안개 보라색 (라이트)
    { name: '🩷 체리블러썸', hex: '#ffe5ec' }     // 부드러운 벚꽃 핑크색 (라이트)
  ];

  // 어두운 색상 판별 헬퍼 함수 (기존 구형 진한 색상 메모에 대한 하위 호환성 전용)
  const checkIfDarkColor = (colorHex: string) => {
    const darkColors = ['#0077b6', '#1d3557', '#2b2d42', '#118ab2', '#4ea8de'];
    return darkColors.includes(colorHex);
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

  // 60초 주기 일정 당일/당시 백그라운드 푸시 알림 체크 엔진 (옵션 A)
  useEffect(() => {
    if (!mounted || !user) return;

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
              icon: '/next.svg',
              badge: '/next.svg',
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
            icon: '/next.svg',
            badge: '/next.svg',
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
    setIsMemoModalOpen(false);
  };

  // 메모 에디터 내 슬래시 커맨드 (/checkbox) 감지 및 자동 치환
  const handleMemoContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      <nav className="navbar navbar-expand-lg glass-nav py-3 sticky-top">
        <div className="container">
          <div className="d-flex align-items-center">
            <div className="bg-primary text-white rounded-3 p-2 me-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-journal-check fs-4"></i>
            </div>
            <div>
              <span className="navbar-brand mb-0 h4 fw-bold text-primary display-font">Antigravity Note</span>
              <small className="d-block text-muted" style={{ fontSize: '0.7rem', marginTop: '-4px' }}>Planner & Memory Pad</small>
            </div>
          </div>

          {/* Tab Navigation Center Router (Only visible when logged in) */}
          {user && (
            <div className="d-flex bg-light p-1 rounded-pill border border-light-subtle shadow-inner mx-auto my-lg-0 my-3">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`btn btn-sm px-4 py-2 rounded-pill fw-semibold transition-all ${activeTab === 'schedule' ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary border-0'}`}
                style={{ fontSize: '0.9rem' }}
              >
                <i className="bi bi-calendar3 me-2"></i>일정 관리
              </button>
              <button
                onClick={() => setActiveTab('memo')}
                className={`btn btn-sm px-4 py-2 rounded-pill fw-semibold transition-all ${activeTab === 'memo' ? 'btn-primary text-white shadow-sm' : 'btn-light text-secondary border-0'}`}
                style={{ fontSize: '0.9rem' }}
              >
                <i className="bi bi-sticky-fill me-2"></i>메모패드
              </button>
            </div>
          )}

          <div className="d-flex align-items-center gap-2">
            {/* User Session Area */}
            {user ? (
              <div className="d-flex align-items-center gap-3">
                <span className="small text-secondary fw-semibold d-flex align-items-center gap-1 bg-white px-3 py-2 rounded-pill shadow-sm border border-light-subtle">
                  {user.provider === 'google' && <i className="bi bi-google text-danger"></i>}
                  {user.provider === 'kakao' && <i className="bi bi-chat-fill text-warning"></i>}
                  {user.provider === 'naver' && <i className="bi bi-n-circle-fill text-success"></i>}
                  {user.provider === 'local' && <i className="bi bi-person-circle text-primary"></i>}
                  <strong>{user.displayName}</strong>님 환영합니다!
                </span>
                <button
                  onClick={signOutUser}
                  className="btn btn-sm btn-outline-danger rounded-pill px-3 py-2"
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className="bi bi-box-arrow-right me-1"></i>로그아웃
                </button>
              </div>
            ) : (
              <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 py-2 rounded-pill">
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
                className="premium-card p-5 shadow-lg position-relative overflow-hidden border-0 rounded-4 bg-white"
                style={{ 
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
                  borderTop: '5px solid #0d6efd'
                }}
              >
                <div className="text-center mb-4">
                  <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-3 shadow-sm" style={{ width: '56px', height: '56px' }}>
                    <i className="bi bi-shield-lock-fill fs-3"></i>
                  </div>
                  <h4 className="fw-bold mb-1 display-font text-dark">Antigravity Portal</h4>
                  <p className="text-muted small">프리미엄 일정 & 메모패드 연동 계정 인증</p>
                </div>

                {authError && (
                  <div className="alert alert-danger border-0 small rounded-3 d-flex align-items-center gap-2 mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill fs-6"></i>
                    <div>{authError}</div>
                  </div>
                )}

                {/* Social Login Panel */}
                <div className="d-flex flex-column gap-2 mb-4">
                  <button
                    onClick={() => signInSocial('google', rememberMe)}
                    className="btn btn-outline-dark w-100 rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2 border border-light-subtle shadow-sm transition-all"
                    style={{ fontSize: '0.9rem', backgroundColor: '#ffffff' }}
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
                  <hr className="text-muted" />
                  <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small" style={{ fontSize: '0.75rem' }}>
                    또는 일반 계정 이용
                  </span>
                </div>

                {/* Local Username/Password Form */}
                <form onSubmit={handleAuthSubmit}>
                  {authMode === 'register' && (
                    <div className="mb-3">
                      <label htmlFor="authDisplayName" className="form-label small fw-semibold text-muted">이름 또는 닉네임 *</label>
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
                    <label htmlFor="authUsername" className="form-label small fw-semibold text-muted">아이디 (이메일 주소) *</label>
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
                    <label htmlFor="authPassword" className="form-label small fw-semibold text-muted">비밀번호 *</label>
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
                    />
                    <label className="form-check-label small text-muted cursor-pointer" htmlFor="rememberMe" style={{ userSelect: 'none' }}>
                      자동 로그인 (브라우저 종료 시에도 로그인 유지)
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 rounded-pill py-2.5 fw-bold shadow-sm transition-all"
                  >
                    {authMode === 'login' ? '로그인' : '회원가입 완료'}
                  </button>

                  <div className="text-center mt-3 small text-muted">
                    {authMode === 'login' ? (
                      <>
                        아직 계정이 없으신가요?{' '}
                        <button
                          type="button"
                          onClick={() => { setAuthMode('register'); setAuthError(null); }}
                          className="btn btn-link p-0 text-primary fw-semibold small text-decoration-underline"
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
                          className="btn btn-link p-0 text-primary fw-semibold small text-decoration-underline"
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
              <>
                {/* 6. 오늘의 스케줄 실시간 요약 브리핑 대시보드 */}
                {(() => {
                  const briefing = getTodayBriefing();
                  if (briefing.totalToday === 0) return null;
                  return (
                    <div 
                      className="premium-card p-3 mb-4 border-0 d-flex align-items-center gap-3 animate-fade-in"
                      style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 51, 234, 0.08))',
                        borderLeft: '5px solid #3b82f6',
                        borderRadius: '16px'
                      }}
                    >
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                        <i className="bi bi-robot fs-5"></i>
                      </div>
                      <div className="flex-grow-1 text-start">
                        <span className="fw-bold text-dark d-block" style={{ fontSize: '0.9rem' }}>오늘의 AI 스케줄 브리핑</span>
                        <small className="text-secondary" style={{ fontSize: '0.8rem' }}>
                          오늘 진행할 일정이 총 <strong>{briefing.totalToday}건</strong> 있으며, 그 중 <strong>{briefing.completedToday}건</strong>을 완료했습니다. 
                          {briefing.importantToday > 0 ? (
                            <span> 미완료된 중요 일정 <strong>{briefing.importantToday}건</strong>이 있으니 잊지 마세요! 🚨</span>
                          ) : (
                            <span> 오늘 남은 과제들을 차근차근 해결해 나가 보세요. 👍</span>
                          )}
                        </small>
                      </div>
                    </div>
                  );
                })()}

                {/* Overview Stats Row */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="premium-card p-3 d-flex align-items-center justify-content-between h-100">
                      <div>
                        <span className="text-muted small d-block mb-1 fw-medium">전체 일정</span>
                        <span className="h3 mb-0 fw-bold">{totalCount}</span>
                      </div>
                      <div className="bg-primary-subtle text-primary rounded-3 p-3">
                        <i className="bi bi-calendar3 fs-4"></i>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="premium-card p-3 d-flex align-items-center justify-content-between h-100">
                      <div>
                        <span className="text-muted small d-block mb-1 fw-medium">완료됨</span>
                        <span className="h3 mb-0 fw-bold text-success">{completedCount}</span>
                      </div>
                      <div className="bg-success-subtle text-success rounded-3 p-3">
                        <i className="bi bi-calendar-check fs-4"></i>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="premium-card p-3 d-flex align-items-center justify-content-between h-100">
                      <div>
                        <span className="text-muted small d-block mb-1 fw-medium">진행 중</span>
                        <span className="h3 mb-0 fw-bold text-warning">{pendingCount}</span>
                      </div>
                      <div className="bg-warning-subtle text-warning rounded-3 p-3">
                        <i className="bi bi-hourglass-split fs-4"></i>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="premium-card p-3 d-flex align-items-center justify-content-between h-100">
                      <div>
                        <span className="text-muted small d-block mb-1 fw-medium">중요 일정</span>
                        <span className="h3 mb-0 fw-bold text-danger">{importantCount}</span>
                      </div>
                      <div className="bg-danger-subtle text-danger rounded-3 p-3">
                        <i className="bi bi-star-fill fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-4">
                  {/* Left Column - Actions Control */}
                  <div className="col-lg-3">
                    <div className="sticky-lg-top" style={{ top: '96px', zIndex: 10 }}>
                      <button
                        onClick={() => {
                          handleCancelEdit();
                          setIsScheduleModalOpen(true);
                        }}
                        className="btn btn-premium-primary w-100 py-3 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 transition-all"
                        style={{ fontSize: '1rem' }}
                      >
                        <i className="bi bi-calendar-plus-fill fs-5"></i>
                        <span>새 일정 계획하기</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Schedule Board & Lists */}
                  <div className="col-lg-9">
                    <div className="premium-card p-4">
                      {/* Filters Header Bar */}
                      {/* 9. 카테고리별 컬러 칩 및 원클릭 퀵 필터 */}
                      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                        <span className="text-muted small fw-semibold me-1">카테고리 퀵 필터:</span>
                        {[
                          { value: 'All', label: '📁 전체', bg: 'bg-light text-dark' },
                          { value: 'Work', label: '🏢 업무', bg: 'bg-primary-subtle text-primary' },
                          { value: 'Personal', label: '🏡 개인', bg: 'bg-success-subtle text-success' },
                          { value: 'Important', label: '⭐ 중요', bg: 'bg-danger-subtle text-danger' },
                          { value: 'Meeting', label: '👥 회의', bg: 'bg-info-subtle text-info' },
                          { value: 'Etc', label: '🏷️ 기타', bg: 'bg-secondary-subtle text-secondary' },
                        ].map((chip) => {
                          const isSelected = categoryFilter === chip.value;
                          const count = chip.value === 'All' 
                            ? myRawSchedules.length
                            : myRawSchedules.filter(s => s.category === chip.value).length;

                          return (
                            <button
                              key={chip.value}
                              onClick={() => setCategoryFilter(chip.value)}
                              className={`btn btn-sm px-2.5 py-1 rounded-pill d-flex align-items-center gap-1.5 transition-all border-0 ${isSelected ? 'fw-bold text-white shadow-sm' : chip.bg}`}
                              style={{
                                fontSize: '0.75rem',
                                background: isSelected 
                                  ? 'linear-gradient(135deg, #3b82f6, #6366f1)' 
                                  : undefined,
                                outline: isSelected ? '2px solid rgba(99, 102, 241, 0.4)' : 'none'
                              }}
                            >
                              <span>{chip.label}</span>
                              <span className={`badge rounded-pill ${isSelected ? 'bg-white text-primary' : 'bg-white-subtle-overlay text-dark'}`} style={{ fontSize: '0.65rem', backgroundColor: 'rgba(0,0,0,0.06)' }}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="row g-3 align-items-center mb-4">
                        <div className="col-md-5">
                          <div className="input-group">
                            <span className="input-group-text bg-white border-end-0 rounded-start-pill text-muted">
                              <i className="bi bi-search"></i>
                            </span>
                            <input
                              type="text"
                              className="form-control border-start-0 rounded-end-pill form-premium-control"
                              style={{ paddingLeft: '0.2rem' }}
                              placeholder="일정 검색..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="col-md-7 d-flex gap-2 justify-content-md-end flex-wrap">
                          {/* Category Filter */}
                          <select
                            className="form-select form-premium-control w-auto"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{ fontSize: '0.85rem' }}
                          >
                            <option value="All">📁 전체 카테고리</option>
                            <option value="Work">🏢 업무</option>
                            <option value="Personal">🏡 개인</option>
                            <option value="Important">⭐ 중요</option>
                            <option value="Meeting">👥 회의</option>
                            <option value="Etc">🏷️ 기타</option>
                          </select>

                          {/* Completion Filter */}
                          <select
                            className="form-select form-premium-control w-auto"
                            value={completionFilter}
                            onChange={(e) => setCompletionFilter(e.target.value)}
                            style={{ fontSize: '0.85rem' }}
                          >
                            <option value="All">✔️ 전체 진행상태</option>
                            <option value="Pending">⏳ 진행 중</option>
                            <option value="Completed">✅ 완료됨</option>
                          </select>
                        </div>
                      </div>

                      {/* Schedules Timelines */}
                      {scheduleLoading ? (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">로딩 중...</span>
                          </div>
                          <p className="mt-3 text-muted">일정 목록을 구성하고 있습니다.</p>
                        </div>
                      ) : mySchedules.length === 0 ? (
                        <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                          <div className="bg-white rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center p-3 mb-3" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-calendar-x text-muted fs-3"></i>
                          </div>
                          <h6 className="fw-bold text-muted mb-1">등록된 일정이 없습니다.</h6>
                          <p className="text-muted small px-4 mb-0">
                            {searchQuery.trim() !== '' || categoryFilter !== 'All' || completionFilter !== 'All' 
                              ? '설정한 필터 조건에 부합하는 일정이 없습니다. 필터를 해제해보세요.' 
                              : '왼쪽 폼을 활용하여 개인 일정을 새롭게 계획하고 관리해보세요.'}
                          </p>
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-3">
                          {mySchedules.map((schedule) => {
                            const categoryClassMap: Record<ScheduleCategory, string> = {
                              Work: 'badge-category-work',
                              Personal: 'badge-category-personal',
                              Important: 'badge-category-important',
                              Meeting: 'badge-category-meeting',
                              Etc: 'badge-category-etc',
                            };

                            const categoryTextMap: Record<ScheduleCategory, string> = {
                              Work: '업무',
                              Personal: '개인',
                              Important: '중요',
                              Meeting: '회의',
                              Etc: '기타',
                            };

                            const isOverdue = new Date(schedule.endTime).getTime() < Date.now() && !schedule.isCompleted;

                            return (
                              <div 
                                key={schedule.id}
                                className={`card border-0 p-3 rounded-4 transition-all position-relative overflow-hidden ${
                                  schedule.isCompleted 
                                    ? 'bg-light border-start border-3 border-secondary opacity-75' 
                                    : isOverdue
                                      ? 'bg-white border-start border-3 border-danger shadow-sm'
                                      : 'bg-white border-start border-3 border-primary shadow-sm'
                                }`}
                                style={{ 
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
                                }}
                              >
                                <div className="d-flex align-items-start gap-3">
                                  {/* Complete Checkbox Wrapper */}
                                  <div className="pt-1">
                                    <button
                                      onClick={() => toggleComplete(schedule.id, schedule.isCompleted)}
                                      className={`btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 border`}
                                      style={{ 
                                        width: '26px', 
                                        height: '26px',
                                        backgroundColor: schedule.isCompleted ? '#10b981' : 'transparent',
                                        borderColor: schedule.isCompleted ? '#10b981' : '#cbd5e1',
                                        color: schedule.isCompleted ? 'white' : 'transparent'
                                      }}
                                      title={schedule.isCompleted ? "미완료 상태로 되돌리기" : "완료 표시하기"}
                                    >
                                      <i className="bi bi-check-lg fs-6"></i>
                                    </button>
                                  </div>

                                  {/* Content Container */}
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                      <span className={`badge badge-category ${categoryClassMap[schedule.category]}`}>
                                        {categoryTextMap[schedule.category]}
                                      </span>
                                      
                                      {(() => {
                                        const dday = calculateDDay(schedule.startTime, schedule.endTime, schedule.isCompleted, schedule.hasTime);
                                        return (
                                          <span className={`badge rounded-pill py-0.5 px-2 ${dday.colorClass}`} style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                            {dday.text}
                                          </span>
                                        );
                                      })()}

                                      {isOverdue && (
                                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill py-0.5 px-2" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                          <i className="bi bi-clock-history me-1"></i>기한 초과
                                        </span>
                                      )}
                                    </div>

                                    <h6 className={`fw-bold mb-1 ${schedule.isCompleted ? 'completed-text text-muted' : 'text-dark'}`} style={{ fontSize: '1.05rem' }}>
                                      {renderHighlightedText(schedule.title, searchQuery)}
                                    </h6>

                                    {schedule.description && (
                                      <p className={`small mb-2 ${schedule.isCompleted ? 'text-muted' : 'text-secondary'}`} style={{ whiteSpace: 'pre-line', fontSize: '0.85rem' }}>
                                        {renderHighlightedText(schedule.description, searchQuery)}
                                      </p>
                                    )}

                                    {/* Date Time Container */}
                                    <div className="d-flex align-items-center gap-3 text-muted small" style={{ fontSize: '0.75rem' }}>
                                      <span className="d-flex align-items-center gap-1">
                                        <i className="bi bi-calendar-event"></i>
                                        {formatDateKST(schedule.startTime, schedule.hasTime)}
                                      </span>
                                      <span>→</span>
                                      <span className="d-flex align-items-center gap-1">
                                        <i className="bi bi-clock"></i>
                                        {formatDateKST(schedule.endTime, schedule.hasTime)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Actions Panel */}
                                  <div className="d-flex gap-1 align-self-start">
                                    <button 
                                      onClick={() => downloadScheduleIcs(schedule)} 
                                      className="btn btn-sm btn-light border text-primary rounded-3"
                                      title="캘린더 내보내기 (iCal .ics 파일)"
                                    >
                                      <i className="bi bi-calendar-event"></i>
                                    </button>
                                    {!schedule.isCompleted && (
                                      <button 
                                        onClick={() => handleStartEdit(schedule)} 
                                        className="btn btn-sm btn-light border text-secondary rounded-3"
                                        title="일정 편집"
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => setDeleteConfirmTarget({ type: 'schedule', id: schedule.id })} 
                                      className="btn btn-sm btn-light border text-danger rounded-3"
                                      title="일정 삭제"
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 2. 메모패드 (Memo Tab) */}
            {activeTab === 'memo' && (
              <div className="row g-4">
                  {/* Left Column - Actions Control */}
                  <div className="col-lg-3">
                    <div className="sticky-lg-top" style={{ top: '96px', zIndex: 10 }}>
                      <button
                        onClick={() => {
                          handleCancelMemoEdit();
                          setIsMemoModalOpen(true);
                        }}
                        className="btn btn-premium-primary w-100 py-3 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 transition-all"
                        style={{ fontSize: '1rem' }}
                      >
                        <i className="bi bi-sticky-fill fs-5"></i>
                        <span>새 메모 작성하기</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Pinterest Style Memo board */}
                  <div className="col-lg-9">
                  <div className="premium-card p-4">
                    {/* Search and Color Filters Bar */}
                    <div className="row g-3 align-items-center mb-4">
                      <div className="col-md-5">
                        <div className="input-group">
                          <span className="input-group-text bg-white border-end-0 rounded-start-pill text-muted">
                            <i className="bi bi-search"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0 rounded-end-pill form-premium-control"
                            style={{ paddingLeft: '0.2rem' }}
                            placeholder="메모 검색..."
                            value={memoSearchQuery}
                            onChange={(e) => setMemoSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="col-md-7 d-flex gap-2 justify-content-md-end align-items-center flex-wrap">
                        <span className="small text-muted fw-semibold me-1"><i className="bi bi-funnel-fill"></i> 색상:</span>
                        <select
                          className="form-select form-premium-control w-auto"
                          value={memoColorFilter}
                          onChange={(e) => setMemoColorFilter(e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                        >
                          <option value="All">🌈 전체</option>
                          {pastelColors.map(c => (
                            <option key={c.hex} value={c.hex}>{c.name}</option>
                          ))}
                        </select>

                        <span className="small text-muted fw-semibold ms-md-2 me-1"><i className="bi bi-fonts"></i> 글꼴:</span>
                        <select
                          className="form-select form-premium-control w-auto"
                          value={selectedFont}
                          onChange={(e) => handleFontChange(e.target.value)}
                          style={{ fontSize: '0.85rem' }}
                        >
                          {fontOptions.map(font => (
                            <option key={font.value} value={font.value}>{font.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Memo Pinterest Grid */}
                    {memoLoading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">로딩 중...</span>
                        </div>
                        <p className="mt-3 text-muted">메모패드를 정돈하고 있습니다.</p>
                      </div>
                    ) : filteredMemos.length === 0 ? (
                      <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                        <div className="bg-white rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center p-3 mb-3" style={{ width: '60px', height: '60px' }}>
                          <i className="bi bi-sticky text-muted fs-3"></i>
                        </div>
                        <h6 className="fw-bold text-muted mb-1">작성된 메모가 없습니다.</h6>
                        <p className="text-muted small px-4 mb-0">
                          {memoSearchQuery.trim() !== '' || memoColorFilter !== 'All'
                            ? '설정한 필터 조건에 부합하는 메모가 없습니다. 필터를 변경해 보세요.'
                            : '왼쪽 폼을 활용하여 아이디어 영감이나 업무 메모를 자유롭게 채워보세요.'}
                        </p>
                      </div>
                    ) : (
                      <div className="row g-3" style={{ minHeight: '300px' }}>
                        {filteredMemos.map((memo) => {
                          const isDarkColor = checkIfDarkColor(memo.color || '#fffbeb');
                          return (
                            <div key={memo.id} className="col-md-6 col-xl-6">
                              <div
                                onClick={() => setSelectedMemo(memo)}
                                className="card border-0 p-4 h-100 rounded-4 transition-all position-relative shadow-sm hover-up"
                                style={{
                                  backgroundColor: memo.color || '#fffbeb',
                                  color: isDarkColor ? '#ffffff' : '#2b2d42',
                                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
                                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                  borderLeft: `5px solid ${isDarkColor ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)'}`,
                                  cursor: 'pointer'
                                }}
                              >
                                <div className="d-flex flex-column h-100">
                                  <div className="d-flex align-items-start justify-content-between mb-2">
                                    <h5 
                                      className="fw-bold mb-0 text-truncate pe-2" 
                                      style={{ 
                                        fontSize: '1.1rem', 
                                        letterSpacing: '-0.3px', 
                                        maxWidth: '80%',
                                        fontFamily: getSelectedFontCss()
                                      }}
                                    >
                                      {memo.title}
                                    </h5>
                                    
                                    <div className="d-flex gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartMemoEdit(memo);
                                        }}
                                        className="btn btn-sm p-1 rounded-3 transition-all d-flex align-items-center justify-content-center border-0"
                                        style={{
                                          backgroundColor: 'rgba(255,255,255,0.25)',
                                          color: isDarkColor ? '#fff' : '#2b2d42',
                                          width: '26px',
                                          height: '26px'
                                        }}
                                        title="메모 수정"
                                      >
                                        <i className="bi bi-pencil-fill" style={{ fontSize: '0.75rem' }}></i>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteConfirmTarget({ type: 'memo', id: memo.id });
                                        }}
                                        className="btn btn-sm p-1 rounded-3 transition-all d-flex align-items-center justify-content-center border-0"
                                        style={{
                                          backgroundColor: 'rgba(255,255,255,0.25)',
                                          color: isDarkColor ? '#ffc6ff' : '#dc3545',
                                          width: '26px',
                                          height: '26px'
                                        }}
                                        title="메모 삭제"
                                      >
                                        <i className="bi bi-trash-fill" style={{ fontSize: '0.75rem' }}></i>
                                      </button>
                                    </div>
                                  </div>
 
                                  {/* Line-Clamp 요약은 제목 중심 UI 규칙에 따라 생략 */}
 
                                  <div 
                                    className="d-flex align-items-center justify-content-between border-top pt-2 mt-auto"
                                    style={{ 
                                      borderColor: isDarkColor ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
                                      fontSize: '0.7rem',
                                      opacity: 0.75
                                    }}
                                  >
                                    <span className="d-flex align-items-center gap-1">
                                      <i className="bi bi-clock-history"></i>
                                      {formatDateKST(memo.createdAt, true)}
                                    </span>
                                    <span className="fw-semibold">Memo Card</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
              border: `1px solid ${hexToRgba(selectedMemo.color || '#6366f1', 0.25)}`,
              borderTop: `6px solid ${selectedMemo.color || '#6366f1'}`,
              boxShadow: `0 0 30px ${hexToRgba(selectedMemo.color || '#6366f1', 0.25)}, 0 15px 50px rgba(0, 0, 0, 0.65), inset 0 0 15px ${hexToRgba(selectedMemo.color || '#6366f1', 0.08)}`,
              fontFamily: getSelectedFontCss()
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="d-flex align-items-start justify-content-between mb-3 border-bottom pb-3" style={{ borderColor: hexToRgba(selectedMemo.color || '#6366f1', 0.18) }}>
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
            <div className="d-flex align-items-center justify-content-between border-top pt-3" style={{ borderColor: hexToRgba(selectedMemo.color || '#6366f1', 0.18) }}>
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
              className="premium-card p-4 w-100 rounded-4 border-0 shadow-lg position-relative scale-in bg-white"
              style={{
                maxWidth: '400px',
                color: '#2b2d42',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
                borderTop: '6px solid #dc3545',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Icon */}
              <div className="text-center mb-3">
                <div className="bg-danger-subtle text-danger rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-2 shadow-sm" style={{ width: '56px', height: '56px' }}>
                  <i className="bi bi-exclamation-triangle-fill fs-3"></i>
                </div>
                <h5 className="fw-bold mb-1">삭제 확인</h5>
              </div>

              {/* Body Text */}
              <div className="text-center py-2 mb-4 text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                삭제하시겠습니까?<br />
                <small className="text-muted" style={{ fontSize: '0.8rem' }}>(이 작업은 되돌릴 수 없습니다.)</small>
              </div>

              {/* Footer Buttons */}
              <div className="d-flex gap-2">
                <button
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="btn btn-light border w-100 py-2.5 rounded-3 fw-semibold"
                  style={{ fontSize: '0.9rem' }}
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="btn btn-danger w-100 py-2.5 rounded-3 fw-semibold shadow-sm"
                  style={{ fontSize: '0.9rem' }}
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 팝업 모달로 동작하는 일정 등록/수정 창 */}
      {isScheduleModalOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
          style={{
            zIndex: 10000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.3s ease-in-out'
          }}
          onClick={handleCancelEdit}
        >
          <div 
            className="premium-card p-4 w-100 rounded-4 border-0 shadow-lg position-relative scale-in bg-white"
            style={{
              maxWidth: '500px',
              color: '#2b2d42',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
              borderTop: `6px solid ${editingScheduleId ? '#ffbd2e' : '#0d6efd'}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: 'inherit' }}>
                <i className={`bi ${editingScheduleId ? 'bi-pencil-square text-warning' : 'bi-plus-circle-fill text-primary'}`}></i>
                {editingScheduleId ? '일정 수정하기' : '새로운 일정 등록'}
              </h5>
              <button 
                onClick={handleCancelEdit}
                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 p-2"
                style={{ backgroundColor: 'rgba(0,0,0,0.06)', width: '32px', height: '32px', color: 'inherit' }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3 text-start">
                <label htmlFor="title" className="form-label small fw-semibold text-muted">일정 제목 *</label>
                <input
                  type="text"
                  id="title"
                  className="form-control form-premium-control"
                  placeholder="예: Supabase 연동 개발 회의"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3 text-start">
                <label htmlFor="description" className="form-label small fw-semibold text-muted">상세 설명</label>
                <textarea
                  id="description"
                  className="form-control form-premium-control"
                  rows={3}
                  placeholder="구체적인 업무 내용 및 메모..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-check mb-3 text-start">
                <input
                  type="checkbox"
                  className="form-check-input cursor-pointer"
                  id="hasTime"
                  checked={hasTime}
                  onChange={(e) => setHasTime(e.target.checked)}
                />
                <label className="form-check-label small text-muted cursor-pointer" htmlFor="hasTime" style={{ userSelect: 'none' }}>
                  ⏰ 시간 설정 활성화 (체크 해제 시 하루 종일 일정으로 등록)
                </label>
              </div>

              <div className="row g-2 mb-3 text-start">
                <div className="col-12 col-md-6">
                  <label htmlFor="startDate" className="form-label small fw-semibold text-muted">시작 날짜 *</label>
                  <input
                    type="date"
                    id="startDate"
                    className="form-control form-premium-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                {hasTime && (
                  <div className="col-12 col-md-6">
                    <label htmlFor="startTimeVal" className="form-label small fw-semibold text-muted">시작 시간 *</label>
                    <input
                      type="time"
                      id="startTimeVal"
                      className="form-control form-premium-control"
                      value={startTimeVal}
                      onChange={(e) => setStartTimeVal(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="row g-2 mb-3 text-start">
                <div className="col-12 col-md-6">
                  <label htmlFor="endDate" className="form-label small fw-semibold text-muted">종료 날짜 *</label>
                  <input
                    type="date"
                    id="endDate"
                    className="form-control form-premium-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
                {hasTime && (
                  <div className="col-12 col-md-6">
                    <label htmlFor="endTimeVal" className="form-label small fw-semibold text-muted">종료 시간 *</label>
                    <input
                      type="time"
                      id="endTimeVal"
                      className="form-control form-premium-control"
                      value={endTimeVal}
                      onChange={(e) => setEndTimeVal(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="mb-4 text-start">
                <label htmlFor="category" className="form-label small fw-semibold text-muted">카테고리</label>
                <select
                  id="category"
                  className="form-select form-premium-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ScheduleCategory)}
                >
                  <option value="Work">🏢 업무 (Work)</option>
                  <option value="Personal">🏡 개인 (Personal)</option>
                  <option value="Important">⭐ 중요 (Important)</option>
                  <option value="Meeting">👥 회의 (Meeting)</option>
                  <option value="Etc">🏷️ 기타 (Etc)</option>
                </select>
              </div>

              <div className="d-flex gap-3 align-items-center w-100" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <button 
                  type="button" 
                  onClick={handleCancelEdit} 
                  className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold transition-all" 
                  style={{ 
                    borderRadius: '14px',
                    flex: '1',
                    background: 'rgba(241, 245, 249, 0.9)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    color: '#475569',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(241, 245, 249, 0.9)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.02)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(0.97)';
                  }}
                >
                  <i className="bi bi-arrow-left-circle-fill fs-5"></i>
                  <span>취소</span>
                </button>

                {editingScheduleId && (
                  <button 
                    type="button" 
                    onClick={handleSaveScheduleOnly} 
                    className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold text-white transition-all animate-fade-in" 
                    style={{ 
                      borderRadius: '14px',
                      flex: '1',
                      background: 'linear-gradient(135deg, #34d399, #10b981)',
                      border: 'none',
                      fontSize: '0.95rem',
                      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 24px rgba(16, 185, 129, 0.35)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #34d399, #10b981)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.2)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(0.97)';
                    }}
                  >
                    <i className="bi bi-save-fill fs-5"></i>
                    <span>임시 저장</span>
                  </button>
                )}

                <button 
                  type="submit" 
                  className="btn d-flex align-items-center justify-content-center gap-2 py-3 fw-bold text-white transition-all" 
                  style={{ 
                    borderRadius: '14px',
                    flex: '2',
                    background: editingScheduleId ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #3b82f6)',
                    color: editingScheduleId ? '#1e293b' : '#ffffff',
                    border: 'none',
                    fontSize: '0.95rem',
                    boxShadow: editingScheduleId ? '0 8px 20px rgba(245, 158, 11, 0.2)' : '0 8px 20px rgba(59, 130, 246, 0.25)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = editingScheduleId ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #4f46e5, #2563eb)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = editingScheduleId ? '0 10px 24px rgba(245, 158, 11, 0.35)' : '0 10px 24px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = editingScheduleId ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #3b82f6)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = editingScheduleId ? '0 8px 20px rgba(245, 158, 11, 0.2)' : '0 8px 20px rgba(59, 130, 246, 0.25)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(0.97)';
                  }}
                >
                  <i className="bi bi-check-circle-fill fs-5"></i>
                  <span>{editingScheduleId ? '수정 완료' : '일정 등록'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 팝업 모달로 동작하는 메모 등록/수정 창 (풀스크린화) */}
      {isMemoModalOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-stretch justify-content-stretch"
          style={{
            zIndex: 10000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.3s ease-in-out'
          }}
          onClick={handleCancelMemoEdit}
        >
          <div 
            className="w-100 h-100 border-0 shadow-lg position-relative scale-in bg-white d-flex flex-column"
            style={{
              color: '#2b2d42',
              borderTop: `6px solid ${editingMemoId ? '#ffbd2e' : '#0d6efd'}`,
              borderRadius: 0,
              padding: '2.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <h5 className="fw-bold mb-0 h4 d-flex align-items-center gap-2" style={{ color: 'inherit' }}>
                <i className={`bi ${editingMemoId ? 'bi-sticky text-warning' : 'bi-sticky-fill text-primary'}`}></i>
                {editingMemoId ? '메모 수정하기' : '새로운 메모 등록'}
              </h5>
              <button 
                onClick={handleCancelMemoEdit}
                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 p-2"
                style={{ backgroundColor: 'rgba(0,0,0,0.06)', width: '36px', height: '36px', color: 'inherit' }}
              >
                <i className="bi bi-x-lg fs-5"></i>
              </button>
            </div>

            <form onSubmit={handleMemoSubmit} className="d-flex flex-column flex-grow-1">
              <div className="mb-3 text-start">
                <label htmlFor="memoTitle" className="form-label small fw-semibold text-muted">메모 제목 *</label>
                <input
                  type="text"
                  id="memoTitle"
                  className="form-control form-premium-control fs-4 py-2"
                  placeholder="예: 아이디어 영감 기록"
                  value={memoTitle}
                  onChange={(e) => setMemoTitle(e.target.value)}
                  required
                  style={{ fontFamily: getSelectedFontCss() }}
                />
              </div>

              <div className="mb-3 text-start d-flex flex-column flex-grow-1">
                <label htmlFor="memoContent" className="form-label small fw-semibold text-muted">메모 내용 *</label>
                <textarea
                  id="memoContent"
                  className="form-control form-premium-control flex-grow-1"
                  placeholder="자유롭게 생각을 기록해 보세요... (/checkbox 입력 시 체크박스로 자동 변환)"
                  value={memoContent}
                  onChange={(e) => setMemoContent(e.target.value)}
                  onKeyDown={handleMemoContentKeyDown}
                  required
                  style={{ 
                    fontFamily: getSelectedFontCss(),
                    resize: 'none',
                    minHeight: '45vh'
                  }}
                />
              </div>

              <div className="mb-4 text-start">
                <label className="form-label small fw-semibold text-muted d-block">메모 카드 테마 색상</label>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  {pastelColors.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setMemoColor(color.hex)}
                      className="rounded-circle border-0 transition-all d-flex align-items-center justify-content-center shadow-sm"
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: color.hex,
                        transform: memoColor === color.hex ? 'scale(1.2)' : 'scale(1)',
                        border: memoColor === color.hex ? '2px solid #000' : 'none',
                        boxShadow: memoColor === color.hex ? '0 0 8px rgba(0,0,0,0.3)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                      title={color.name}
                    >
                      {memoColor === color.hex && (
                        <i className={`bi bi-check-lg ${checkIfDarkColor(color.hex) ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.8rem' }}></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="d-flex gap-3 mt-auto align-items-center w-100" style={{ maxWidth: '650px', margin: '0 auto' }}>
                <button 
                  type="button" 
                  onClick={handleCancelMemoEdit} 
                  className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold transition-all" 
                  style={{ 
                    borderRadius: '14px',
                    flex: '1',
                    background: 'rgba(241, 245, 249, 0.9)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    color: '#475569',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(241, 245, 249, 0.9)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.02)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(0.97)';
                  }}
                >
                  <i className="bi bi-arrow-left-circle-fill fs-5"></i>
                  <span>취소</span>
                </button>

                {editingMemoId && (
                  <button 
                    type="button" 
                    onClick={handleSaveMemoOnly} 
                    className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold text-white transition-all animate-fade-in" 
                    style={{ 
                      borderRadius: '14px',
                      flex: '1',
                      background: 'linear-gradient(135deg, #34d399, #10b981)',
                      border: 'none',
                      fontSize: '0.95rem',
                      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 10px 24px rgba(16, 185, 129, 0.35)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #34d399, #10b981)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.2)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(0.97)';
                    }}
                  >
                    <i className="bi bi-save-fill fs-5"></i>
                    <span>임시 저장</span>
                  </button>
                )}

                <button 
                  type="submit" 
                  className="btn d-flex align-items-center justify-content-center gap-2 py-3 fw-bold text-white transition-all" 
                  style={{ 
                    borderRadius: '14px',
                    flex: '2',
                    background: editingMemoId ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #3b82f6)',
                    color: editingMemoId ? '#1e293b' : '#ffffff',
                    border: 'none',
                    fontSize: '0.95rem',
                    boxShadow: editingMemoId ? '0 8px 20px rgba(245, 158, 11, 0.2)' : '0 8px 20px rgba(59, 130, 246, 0.25)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = editingMemoId ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #4f46e5, #2563eb)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = editingMemoId ? '0 10px 24px rgba(245, 158, 11, 0.35)' : '0 10px 24px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = editingMemoId ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #3b82f6)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = editingMemoId ? '0 8px 20px rgba(245, 158, 11, 0.2)' : '0 8px 20px rgba(59, 130, 246, 0.25)';
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(0.97)';
                  }}
                >
                  <i className="bi bi-check-circle-fill fs-5"></i>
                  <span>{editingMemoId ? '수정 완료' : '메모 등록'}</span>
                </button>
              </div>
            </form>
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
      <footer className="py-5 mt-5 bg-white border-top">
        <div className="container text-center">
          <p className="mb-1 fw-bold text-primary display-font">Antigravity Note</p>
          <p className="text-muted small mb-0">Premium Planner & Elegant Memory Pad Service.</p>
          <p className="text-muted" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
            Built with Next.js App Router, Supabase, and Bootstrap 5.
          </p>
        </div>
      </footer>
    </>
  );
}
