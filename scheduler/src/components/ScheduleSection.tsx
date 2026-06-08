import type { ReactNode } from 'react';
import type { Schedule, ScheduleCategory } from '../types/schedule';

type Briefing = { totalToday: number; completedToday: number; importantToday: number };
type DDay = { text: string; colorClass: string };

type Props = {
  briefing: Briefing;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  importantCount: number;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  completionFilter: string;
  setCompletionFilter: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  scheduleLoading: boolean;
  mySchedules: Schedule[];
  myRawSchedules: Schedule[];
  calculateDDay: (startTimeStr: string, endTimeStr: string, isCompleted: boolean, hasTimeVal?: boolean) => DDay;
  formatDateKST: (isoString: string, showTime?: boolean) => string;
  renderHighlightedText: (text: string, query: string) => ReactNode;
  toggleComplete: (id: string, current: boolean) => void;
  handleStartEdit: (schedule: Schedule) => void;
  handleCancelEdit: () => void;
  setIsScheduleModalOpen: (value: boolean) => void;
  setDeleteConfirmTarget: (value: { type: 'schedule' | 'memo'; id: string } | null) => void;
  downloadScheduleIcs: (schedule: Schedule) => void;
};

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

export function ScheduleSection(props: Props) {
  return (
    <>
      {props.briefing.totalToday > 0 && (
        <div className="premium-card p-3 mb-4 border-0 d-flex align-items-center gap-3 animate-fade-in" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 51, 234, 0.08))', borderLeft: '5px solid #3b82f6', borderRadius: '16px' }}>
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}><i className="bi bi-robot fs-5"></i></div>
          <div className="flex-grow-1 text-start">
            <span className="fw-bold text-white d-block" style={{ fontSize: '0.9rem' }}>오늘의 AI 스케줄 브리핑</span>
            <small style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              오늘 진행할 일정이 총 <strong className="text-info">{props.briefing.totalToday}건</strong> 있으며, 그 중 <strong className="text-success">{props.briefing.completedToday}건</strong>을 완료했습니다.
              {props.briefing.importantToday > 0 ? <span> 미완료된 중요 일정 <strong className="text-danger">{props.briefing.importantToday}건</strong>이 있으니 잊지 마세요! 🚨</span> : <span> 오늘 남은 과제들을 차근차근 해결해 나가 보세요. 👍</span>}
            </small>
          </div>
        </div>
      )}

      <div className="row g-3 mb-4">
        <StatCard title="전체 일정" value={props.totalCount} border="rgba(0, 240, 255, 0.25)" icon="bi-calendar3" color="#fff" iconColor="var(--neon-cyan)" />
        <StatCard title="완료됨" value={props.completedCount} border="rgba(57, 255, 20, 0.25)" icon="bi-calendar-check" color="var(--neon-green)" iconColor="var(--neon-green)" />
        <StatCard title="진행 중" value={props.pendingCount} border="rgba(255, 153, 0, 0.25)" icon="bi-hourglass-split" color="#ff9900" iconColor="#ff9900" />
        <StatCard title="중요 일정" value={props.importantCount} border="rgba(255, 0, 127, 0.25)" icon="bi-star-fill" color="var(--neon-pink)" iconColor="var(--neon-pink)" />
      </div>

      <div className="premium-card p-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
          <div>
            <h5 className="fw-bold mb-1">일정 보드</h5>
            <p className="small text-secondary mb-0">필터와 목록만 남겨 화면을 넓게 사용합니다.</p>
          </div>
          <button onClick={() => { props.handleCancelEdit(); props.setIsScheduleModalOpen(true); }} className="btn btn-premium-primary d-flex align-items-center justify-content-center gap-2 transition-all" style={{ borderRadius: '12px', minWidth: '160px' }}>
            <i className="bi bi-calendar-plus-fill fs-5"></i><span>새 일정 계획하기</span>
          </button>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
          <span className="text-secondary small fw-semibold me-1">카테고리 퀵 필터:</span>
          {[
            { value: 'All', label: '📁 전체' },
            { value: 'Work', label: '🏢 업무' },
            { value: 'Personal', label: '🏡 개인' },
            { value: 'Important', label: '⭐ 중요' },
            { value: 'Meeting', label: '👥 회의' },
            { value: 'Etc', label: '🏷️ 기타' },
          ].map((chip) => {
            const isSelected = props.categoryFilter === chip.value;
            const count = chip.value === 'All' ? props.myRawSchedules.length : props.myRawSchedules.filter(s => s.category === chip.value).length;
            return (
              <button key={chip.value} onClick={() => props.setCategoryFilter(chip.value)} className="btn btn-sm px-2.5 py-1 rounded-pill d-flex align-items-center gap-1.5 transition-all border-0" style={{ fontSize: '0.75rem', background: isSelected ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(255, 255, 255, 0.05)', color: isSelected ? '#fff' : '#94a3b8' }}>
                <span>{chip.label}</span><span className="badge rounded-pill" style={{ fontSize: '0.65rem' }}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="row g-3 align-items-center mb-4">
          <div className="col-md-5"><input className="form-control form-premium-control" placeholder="일정 검색..." value={props.searchQuery} onChange={(e) => props.setSearchQuery(e.target.value)} /></div>
          <div className="col-md-7 d-flex gap-2 justify-content-md-end flex-wrap">
            <select className="form-select form-premium-control w-auto" value={props.categoryFilter} onChange={(e) => props.setCategoryFilter(e.target.value)}><option value="All">📁 전체 카테고리</option><option value="Work">🏢 업무</option><option value="Personal">🏡 개인</option><option value="Important">⭐ 중요</option><option value="Meeting">👥 회의</option><option value="Etc">🏷️ 기타</option></select>
            <select className="form-select form-premium-control w-auto" value={props.completionFilter} onChange={(e) => props.setCompletionFilter(e.target.value)}><option value="All">✔️ 전체 진행상태</option><option value="Pending">⏳ 진행 중</option><option value="Completed">✅ 완료됨</option></select>
          </div>
        </div>

        {props.scheduleLoading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
        ) : props.mySchedules.length === 0 ? (
          <div className="text-center py-5 rounded-4 border border-dashed" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)' }}>
            <h6 className="fw-bold text-secondary mb-1">등록된 일정이 없습니다.</h6>
            <p className="text-secondary small px-4 mb-0">{props.searchQuery.trim() !== '' || props.categoryFilter !== 'All' || props.completionFilter !== 'All' ? '설정한 필터 조건에 부합하는 일정이 없습니다. 필터를 해제해보세요.' : '상단 버튼으로 새 일정을 등록해보세요.'}</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {props.mySchedules.map((schedule) => {
              const isOverdue = new Date(schedule.endTime).getTime() < Date.now() && !schedule.isCompleted;
              return (
                <div key={schedule.id} className="card border-0 p-3 rounded-4 transition-all position-relative overflow-hidden" style={{ backgroundColor: schedule.isCompleted ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', opacity: schedule.isCompleted ? 0.6 : 1, border: '1px solid rgba(255,255,255,0.05)', borderLeft: `4px solid ${schedule.isCompleted ? '#64748b' : isOverdue ? '#f43f5e' : '#6366f1'}` }}>
                  <div className="d-flex align-items-start gap-3">
                    <button onClick={() => props.toggleComplete(schedule.id, schedule.isCompleted)} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-0 border" style={{ width: '26px', height: '26px', backgroundColor: schedule.isCompleted ? '#10b981' : 'transparent', borderColor: schedule.isCompleted ? '#10b981' : '#cbd5e1', color: schedule.isCompleted ? 'white' : 'transparent' }}>
                      <i className="bi bi-check-lg fs-6"></i>
                    </button>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className={`badge badge-category ${categoryClassMap[schedule.category]}`}>{categoryTextMap[schedule.category]}</span>
                        <span className={`badge rounded-pill py-0.5 px-2 ${props.calculateDDay(schedule.startTime, schedule.endTime, schedule.isCompleted, schedule.hasTime).colorClass}`}>{props.calculateDDay(schedule.startTime, schedule.endTime, schedule.isCompleted, schedule.hasTime).text}</span>
                        {isOverdue && <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill py-0.5 px-2">기한 초과</span>}
                      </div>
                      <h6 className={`fw-bold mb-1 ${schedule.isCompleted ? 'completed-text' : ''}`} style={{ fontSize: '1.05rem', color: schedule.isCompleted ? '#94a3b8' : '#fff' }}>{props.renderHighlightedText(schedule.title, props.searchQuery)}</h6>
                      {schedule.description && <p className="small mb-2" style={{ whiteSpace: 'pre-line', fontSize: '0.85rem', color: schedule.isCompleted ? '#64748b' : '#cbd5e1' }}>{props.renderHighlightedText(schedule.description, props.searchQuery)}</p>}
                      <div className="d-flex align-items-center gap-3 small" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        <span className="d-flex align-items-center gap-1"><i className="bi bi-calendar-event"></i>{props.formatDateKST(schedule.startTime, schedule.hasTime)}</span>
                        <span>→</span>
                        <span className="d-flex align-items-center gap-1"><i className="bi bi-clock"></i>{props.formatDateKST(schedule.endTime, schedule.hasTime)}</span>
                      </div>
                    </div>
                    <div className="d-flex gap-1 align-self-start">
                      <button onClick={() => props.downloadScheduleIcs(schedule)} className="btn btn-sm rounded-3 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="캘린더 내보내기"><i className="bi bi-calendar-event"></i></button>
                      {!schedule.isCompleted && <button onClick={() => props.handleStartEdit(schedule)} className="btn btn-sm rounded-3 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="일정 편집"><i className="bi bi-pencil"></i></button>}
                      <button onClick={() => props.setDeleteConfirmTarget({ type: 'schedule', id: schedule.id })} className="btn btn-sm rounded-3 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="일정 삭제"><i className="bi bi-trash"></i></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ title, value, border, icon, color, iconColor }: { title: string; value: number; border: string; icon: string; color: string; iconColor: string }) {
  return (
    <div className="col-6 col-md-3">
      <div className="premium-card p-3 d-flex align-items-center justify-content-between h-100" style={{ border: `1px solid ${border}`, boxShadow: '0 0 10px rgba(255,255,255,0.05)' }}>
        <div><span className="text-secondary small d-block mb-1 fw-medium">{title}</span><span className="h3 mb-0 fw-bold" style={{ color }}>{value}</span></div>
        <div className="rounded-3 p-3 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px', backgroundColor: 'rgba(255,255,255,0.12)', color: iconColor }}><i className={`bi ${icon} fs-5`}></i></div>
      </div>
    </div>
  );
}
