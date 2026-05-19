"use client";

import { useState, useEffect } from 'react';
import { useSchedules } from '../hooks/useSchedules';
import { ScheduleCategory, Schedule } from '../types/schedule';

export default function Home() {
  const {
    schedules,
    rawSchedules,
    loading,
    error,
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

  // Hydration Error 방지를 위한 마운트 체크
  const [mounted, setMounted] = useState(false);

  // 일정 입력 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState<ScheduleCategory>('Work');
  
  // 수정 모드 상태
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Supabase 가이드 배너 토글
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 기본 날짜 시간 설정 (오늘 날짜 기준 1시간 단위)
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    
    // Local timezone ISO formatting for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateTime = (date: Date) => {
      const tzOffset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setStartTime(formatDateTime(start));
    setEndTime(formatDateTime(end));
  }, []);

  if (!mounted) return null;

  // 통계 계산
  const totalCount = rawSchedules.length;
  const completedCount = rawSchedules.filter(s => s.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const importantCount = rawSchedules.filter(s => s.category === 'Important' && !s.isCompleted).length;

  // 일정 제출 핸들러 (추가 및 수정 통합)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;

    try {
      if (editingScheduleId) {
        // 일정 수정
        await updateScheduleDetails(editingScheduleId, {
          title,
          description,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          category
        });
        setEditingScheduleId(null);
      } else {
        // 신규 일정 추가
        await addSchedule({
          title,
          description,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          category
        });
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
      // hook에서 내부 에러가 catch됨
    }
  };

  // 수정 모드 진입
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
    
    // 폼 위치로 스크롤 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 수정 모드 취소
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

  return (
    <>
      {/* Premium Glass Header Navigation */}
      <nav className="navbar navbar-expand-lg glass-nav py-3">
        <div className="container">
          <div className="d-flex align-items-center">
            <div className="bg-primary text-white rounded-3 p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-calendar-check-fill fs-5"></i>
            </div>
            <div>
              <span className="navbar-brand mb-0 h4 fw-bold text-primary display-font">PlanBoard</span>
              <small className="d-block text-muted" style={{ fontSize: '0.7rem', marginTop: '-4px' }}>Smart Personal Scheduler</small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {activeServiceType === 'Supabase' ? (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill d-flex align-items-center gap-1">
                <span className="spinner-grow spinner-grow-sm text-success me-1" role="status" style={{ width: '8px', height: '8px' }}></span>
                Supabase 연동 완료
              </span>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 rounded-pill d-flex align-items-center gap-1">
                  <i className="bi bi-hdd-fill me-1"></i>
                  로컬 스토리지 모드
                </span>
                <button 
                  onClick={() => setShowGuide(!showGuide)} 
                  className="btn btn-sm btn-outline-secondary rounded-pill"
                >
                  <i className="bi bi-database-fill-gear me-1"></i>
                  Supabase 연동 가이드
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {/* Supabase Integration Guide Accordion */}
        {showGuide && activeServiceType === 'LocalStorage' && (
          <div className="alert alert-info border-0 shadow-sm rounded-4 p-4 mb-4">
            <div className="d-flex align-items-start gap-3">
              <div className="bg-info text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                <i className="bi bi-info-circle-fill fs-5"></i>
              </div>
              <div className="w-100">
                <h5 className="alert-heading fw-bold mb-2">Supabase 실시간 클라우드 DB 연동 가이드</h5>
                <p className="mb-3 text-muted small">
                  현재 로컬 스토리지 모드로 작동 중입니다. 데이터의 완벽한 실시간 동기화를 원하시면 아래 단계를 진행해 주세요.
                </p>
                <ol className="small text-muted ps-3 mb-3">
                  <li className="mb-2">
                    <strong>Supabase 프로젝트 생성:</strong> <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="fw-semibold text-decoration-underline">Supabase.com</a> 로그인 후 새 Project를 생성합니다.
                  </li>
                  <li className="mb-2">
                    <strong>테이블 생성 SQL 실행:</strong> Supabase Dashboard의 <strong>SQL Editor</strong>를 열고 아래 SQL 명령을 붙여넣은 뒤 <strong>Run</strong>을 클릭해 테이블을 만듭니다.
                    <pre className="bg-dark text-light p-3 rounded-3 mt-2 mb-2" style={{ fontSize: '0.8rem', overflowX: 'auto' }}>
{`CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);`}
                    </pre>
                  </li>
                  <li>
                    <strong>환경변수 추가:</strong> 프로젝트 루트의 <code>scheduler/.env.local</code> 파일을 열어 Supabase API Credentials를 입력하고 로컬 서버를 재부팅합니다.
                  </li>
                </ol>
                <button 
                  onClick={() => setShowGuide(false)} 
                  className="btn btn-sm btn-info text-white rounded-3 px-3"
                >
                  확인했습니다
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Error Notice */}
        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-3 d-flex align-items-center gap-2 mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill fs-5"></i>
            <div>{error}</div>
          </div>
        )}

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
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">로딩 중...</span>
                  </div>
                  <p className="mt-3 text-muted">일정 목록을 구성하고 있습니다.</p>
                </div>
              ) : schedules.length === 0 ? (
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
                  {schedules.map((schedule) => {
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
      </div>

      {/* Elegant Footer */}
      <footer className="py-5 mt-5 bg-white border-top">
        <div className="container text-center">
          <p className="mb-1 fw-bold text-primary display-font">PlanBoard</p>
          <p className="text-muted small mb-0">Premium Personal Schedule Management Service.</p>
          <p className="text-muted" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
            Built with Next.js App Router, Supabase, and Bootstrap 5.
          </p>
        </div>
      </footer>
    </>
  );
}

