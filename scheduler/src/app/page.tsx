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

  // 일정 입력 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
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

  // 글꼴 선택 커스터마이저 상태 & 옵션 정의
  const [selectedFont, setSelectedFont] = useState<string>('Pretendard');
  const fontOptions = [
    { name: '💻 프리텐다드 (모던)', value: 'Pretendard', css: "'Pretendard', -apple-system, sans-serif" },
    { name: '✍️ 나눔고딕 (단정)', value: 'Nanum Gothic', css: "'Nanum Gothic', sans-serif" },
    { name: '📖 리디바탕 (도서)', value: 'Ridi Batang', css: "'RIDIBatang', Georgia, serif" },
    { name: '🎨 바른히피 (키치)', value: 'Gamja Flower', css: "'Gamja Flower', cursive" },
    { name: '🖋️ 손글씨 (감성)', value: 'Nanum Pen Script', css: "'Nanum Pen Script', cursive" }
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
    { name: '밀크바닐라', hex: '#fffbeb' },    // 감성 코지 옐로우 (라이트)
    { name: '스카이블루', hex: '#e0f2fe' },    // 화사한 아침 하늘색 (라이트)
    { name: '소다레인', hex: '#bde0fe' },      // 청량한 청하늘색 (라이트)
    { name: '산호바다', hex: '#a8dadc' },      // 세련된 민트 바다색 (라이트)
    { name: '오션블루', hex: '#4ea8de' },      // 영롱한 몰디브 바다색 (라이트)
    { name: '딥블루', hex: '#0077b6' },        // 깊은 지중해 푸른색 (다크)
    { name: '마린네이비', hex: '#1d3557' },    // 세련된 크루즈 네이비색 (다크)
    { name: '연라벤더', hex: '#e8e8ff' },      // 은은한 안개 보라색 (라이트)
    { name: '체리블러썸', hex: '#ffe5ec' }     // 부드러운 분홍빛 (라이트)
  ];

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

  useEffect(() => {
    setMounted(true);
    
    // 기본 날짜 시간 설정 (오늘 날짜 기준 1시간 단위)
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    
    const formatDateTime = (date: Date) => {
      const tzOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setStartTime(formatDateTime(start));
    setEndTime(formatDateTime(end));
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
        });
      } else {
        await signInUser({
          username: authUsername,
          password: authPassword
        });
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
    if (!title.trim() || !startTime || !endTime) return;

    try {
      if (editingScheduleId) {
        await updateScheduleDetails(editingScheduleId, {
          title,
          description,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          category
        });
        setEditingScheduleId(null);
      } else {
        await addSchedule({
          title,
          description,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          category,
          userId: user?.id // 외래 키 바인딩
        } as any);
      }

      // 폼 초기화
      setTitle('');
      setDescription('');
      
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const formatDateTime = (date: Date) => {
        const tzOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      };
      setStartTime(formatDateTime(start));
      setEndTime(formatDateTime(end));
      setCategory('Work');
    } catch (err) {
      // 에러 자동 처리
    }
  };

  // 일정 수정 모드 진입
  const handleStartEdit = (schedule: Schedule) => {
    setEditingScheduleId(schedule.id);
    setTitle(schedule.title);
    setDescription(schedule.description || '');
    
    const formatDateTime = (isoStr: string) => {
      const date = new Date(isoStr);
      const tzOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setStartTime(formatDateTime(schedule.startTime));
    setEndTime(formatDateTime(schedule.endTime));
    setCategory(schedule.category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 일정 수정 모드 취소
  const handleCancelEdit = () => {
    setEditingScheduleId(null);
    setTitle('');
    setDescription('');
    
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const formatDateTime = (date: Date) => {
      const tzOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    };
    setStartTime(formatDateTime(start));
    setEndTime(formatDateTime(end));
    setCategory('Work');
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
      setMemoColor('#ffd166');
    } catch (err) {
      // 에러 자동 처리
    }
  };

  // 메모 수정 모드 진입
  const handleStartMemoEdit = (memo: Memo) => {
    setEditingMemoId(memo.id);
    setMemoTitle(memo.title);
    setMemoContent(memo.content || '');
    setMemoColor(memo.color || '#ffd166');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 메모 수정 모드 취소
  const handleCancelMemoEdit = () => {
    setEditingMemoId(null);
    setMemoTitle('');
    setMemoContent('');
    setMemoColor('#ffd166');
  };

  // 한국어 날짜 포맷터
  const formatDateKST = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
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
        @import url("https://fonts.googleapis.com/css2?family=Gamja+Flower&family=Nanum+Gothic:wght@400;700&family=Nanum+Pen+Script&display=swap");
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
                    onClick={() => signInSocial('google')}
                    className="btn btn-outline-dark w-100 rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2 border border-light-subtle shadow-sm transition-all"
                    style={{ fontSize: '0.9rem', backgroundColor: '#ffffff' }}
                  >
                    <i className="bi bi-google text-danger fs-5"></i>
                    <strong>Google</strong> 계정으로 로그인
                  </button>
                  <button
                    onClick={() => signInSocial('kakao')}
                    className="btn w-100 rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2 shadow-sm transition-all text-dark"
                    style={{ fontSize: '0.9rem', backgroundColor: '#fee500', border: 'none' }}
                  >
                    <i className="bi bi-chat-fill text-dark fs-5"></i>
                    <strong>Kakao</strong> 계정으로 로그인
                  </button>
                  <button
                    onClick={() => signInSocial('naver')}
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

                  <div className="mb-4">
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
                  {/* Left Column - Input Form */}
                  <div className="col-lg-4">
                    <div className="premium-card p-4 sticky-lg-top" style={{ top: '96px', zIndex: 10 }}>
                      <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                        <i className={`bi ${editingScheduleId ? 'bi-pencil-square text-warning' : 'bi-plus-circle-fill text-primary'}`}></i>
                        {editingScheduleId ? '일정 수정하기' : '새로운 일정 등록'}
                      </h5>
                      
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
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

                        <div className="mb-3">
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

                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <label htmlFor="startTime" className="form-label small fw-semibold text-muted">시작 시간 *</label>
                            <input
                              type="datetime-local"
                              id="startTime"
                              className="form-control form-premium-control"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-6">
                            <label htmlFor="endTime" className="form-label small fw-semibold text-muted">종료 시간 *</label>
                            <input
                              type="datetime-local"
                              id="endTime"
                              className="form-control form-premium-control"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-4">
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

                        <div className="d-flex gap-2">
                          <button type="submit" className={`btn w-100 ${editingScheduleId ? 'btn-warning text-dark fw-bold' : 'btn-premium-primary'}`} style={{ borderRadius: '10px' }}>
                            {editingScheduleId ? '수정 완료' : '일정 등록'}
                          </button>
                          {editingScheduleId && (
                            <button type="button" onClick={handleCancelEdit} className="btn btn-outline-secondary px-3" style={{ borderRadius: '10px' }}>
                              취소
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right Column - Schedule Board & Lists */}
                  <div className="col-lg-8">
                    <div className="premium-card p-4">
                      {/* Filters Header Bar */}
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
                                      
                                      {isOverdue && (
                                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill py-0.5 px-2" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                          <i className="bi bi-clock-history me-1"></i>기한 초과
                                        </span>
                                      )}
                                    </div>

                                    <h6 className={`fw-bold mb-1 ${schedule.isCompleted ? 'completed-text text-muted' : 'text-dark'}`} style={{ fontSize: '1.05rem' }}>
                                      {schedule.title}
                                    </h6>

                                    {schedule.description && (
                                      <p className={`small mb-2 ${schedule.isCompleted ? 'text-muted' : 'text-secondary'}`} style={{ whiteSpace: 'pre-line', fontSize: '0.85rem' }}>
                                        {schedule.description}
                                      </p>
                                    )}

                                    {/* Date Time Container */}
                                    <div className="d-flex align-items-center gap-3 text-muted small" style={{ fontSize: '0.75rem' }}>
                                      <span className="d-flex align-items-center gap-1">
                                        <i className="bi bi-calendar-event"></i>
                                        {formatDateKST(schedule.startTime)}
                                      </span>
                                      <span>→</span>
                                      <span className="d-flex align-items-center gap-1">
                                        <i className="bi bi-clock"></i>
                                        {formatDateKST(schedule.endTime)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Actions Panel */}
                                  <div className="d-flex gap-1 align-self-start">
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
                                      onClick={() => removeSchedule(schedule.id)} 
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
                {/* Left Column - Memo Input Form */}
                <div className="col-lg-4">
                  <div className="premium-card p-4 sticky-lg-top" style={{ top: '96px', zIndex: 10 }}>
                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <i className={`bi ${editingMemoId ? 'bi-sticky text-warning' : 'bi-sticky-fill text-primary'}`}></i>
                      {editingMemoId ? '메모 수정하기' : '새로운 메모 등록'}
                    </h5>

                    <form onSubmit={handleMemoSubmit}>
                      <div className="mb-3">
                        <label htmlFor="memoTitle" className="form-label small fw-semibold text-muted">메모 제목 *</label>
                        <input
                          type="text"
                          id="memoTitle"
                          className="form-control form-premium-control"
                          placeholder="예: 아이디어 영감 기록"
                          value={memoTitle}
                          onChange={(e) => setMemoTitle(e.target.value)}
                          required
                          style={{ fontFamily: getSelectedFontCss() }}
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="memoContent" className="form-label small fw-semibold text-muted">메모 내용 *</label>
                        <textarea
                          id="memoContent"
                          className="form-control form-premium-control"
                          rows={5}
                          placeholder="자유롭게 생각을 기록해 보세요..."
                          value={memoContent}
                          onChange={(e) => setMemoContent(e.target.value)}
                          required
                          style={{ fontFamily: getSelectedFontCss() }}
                        />
                      </div>

                      <div className="mb-4">
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
                                <i className={`bi bi-check-lg ${color.hex === '#2b2d42' ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.8rem' }}></i>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button type="submit" className={`btn w-100 ${editingMemoId ? 'btn-warning text-dark fw-bold' : 'btn-premium-primary'}`} style={{ borderRadius: '10px' }}>
                          {editingMemoId ? '수정 완료' : '메모 등록'}
                        </button>
                        {editingMemoId && (
                          <button type="button" onClick={handleCancelMemoEdit} className="btn btn-outline-secondary px-3" style={{ borderRadius: '10px' }}>
                            취소
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right Column - Pinterest Style Memo board */}
                <div className="col-lg-8">
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
                          const isDarkColor = memo.color === '#0077b6' || memo.color === '#1d3557' || memo.color === '#2b2d42' || memo.color === '#118ab2';
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
                                          removeMemo(memo.id);
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
 
                                  {/* Line-Clamp 기반 마크다운 요약 뷰포트 장착 */}
                                  <div 
                                    className="flex-grow-1 mb-3 text-start" 
                                    style={{ 
                                      lineHeight: '1.5',
                                      opacity: 0.9,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      fontFamily: getSelectedFontCss()
                                    }}
                                  >
                                    <MarkdownRenderer content={memo.content} isDarkColor={isDarkColor} isSummary={true} />
                                  </div>

                                  <div className="mb-2 text-end" style={{ opacity: 0.6, fontSize: '0.7rem', fontWeight: 600 }}>
                                    <i className="bi bi-plus-circle me-1"></i>클릭하여 전체 내용 보기
                                  </div>
 
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
                                      {formatDateKST(memo.createdAt)}
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
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            transition: 'all 0.3s ease-in-out'
          }}
          onClick={() => setSelectedMemo(null)}
        >
          <div 
            className="premium-card p-4 w-100 rounded-4 border-0 shadow-lg position-relative scale-in"
            style={{
              maxWidth: '650px',
              backgroundColor: selectedMemo.color || '#fffbeb',
              color: (selectedMemo.color === '#0077b6' || selectedMemo.color === '#1d3557' || selectedMemo.color === '#2b2d42' || selectedMemo.color === '#118ab2') ? '#ffffff' : '#2b2d42',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
              borderTop: `6px solid ${(selectedMemo.color === '#0077b6' || selectedMemo.color === '#1d3557' || selectedMemo.color === '#2b2d42' || selectedMemo.color === '#118ab2') ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.2)'}`,
              fontFamily: getSelectedFontCss()
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="d-flex align-items-start justify-content-between mb-3 border-bottom pb-2" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <div>
                <h4 className="fw-bold mb-1 display-font" style={{ letterSpacing: '-0.3px' }}>
                  {selectedMemo.title}
                </h4>
                <small style={{ opacity: 0.7, fontSize: '0.75rem' }} className="d-flex align-items-center gap-1">
                  <i className="bi bi-clock-history"></i>
                  {formatDateKST(selectedMemo.createdAt)} 작성됨
                </small>
              </div>
              
              <button 
                onClick={() => setSelectedMemo(null)}
                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 p-2"
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.06)',
                  color: 'inherit',
                  width: '32px',
                  height: '32px'
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
              <MarkdownRenderer content={selectedMemo.content} isDarkColor={selectedMemo.color === '#0077b6' || selectedMemo.color === '#1d3557' || selectedMemo.color === '#2b2d42' || selectedMemo.color === '#118ab2'} />
            </div>

            {/* Modal Footer Controls */}
            <div className="d-flex align-items-center justify-content-between border-top pt-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <span className="badge px-3 py-2 rounded-pill fw-semibold" style={{ backgroundColor: 'rgba(0,0,0,0.06)', color: 'inherit', fontSize: '0.75rem' }}>
                ✏️ Premium Editor Active
              </span>
              
              <div className="d-flex gap-2">
                <button
                  onClick={() => {
                    handleStartMemoEdit(selectedMemo);
                    setSelectedMemo(null);
                  }}
                  className="btn btn-sm px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-1 border-0"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.4)',
                    color: 'inherit',
                    fontSize: '0.8rem'
                  }}
                >
                  <i className="bi bi-pencil-fill"></i> 수정하기
                </button>
                <button
                  onClick={() => {
                    removeMemo(selectedMemo.id);
                    setSelectedMemo(null);
                  }}
                  className="btn btn-sm px-3 py-2 rounded-3 fw-bold text-white d-flex align-items-center gap-1 border-0"
                  style={{
                    backgroundColor: '#dc3545',
                    fontSize: '0.8rem'
                  }}
                >
                  <i className="bi bi-trash-fill"></i> 삭제하기
                </button>
              </div>
            </div>
          </div>
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
