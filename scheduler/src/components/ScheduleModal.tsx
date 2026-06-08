import type { FormEvent } from 'react';
import type { ScheduleCategory } from '../types/schedule';

type Props = {
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

export function ScheduleModal(props: Props) {
  if (!props.open) return null;
  const { editingScheduleId } = props;
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3" style={{ zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)' }} onClick={props.onClose}>
      <div className="premium-card p-4 w-100 rounded-4 position-relative scale-in" style={{ maxWidth: '500px', backgroundColor: 'rgba(15, 18, 36, 0.95)', color: '#cbd5e1', border: `1px solid ${editingScheduleId ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.25)'}`, borderTop: `6px solid ${editingScheduleId ? '#f59e0b' : '#6366f1'}` }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#fff' }}>
            <i className={`bi ${editingScheduleId ? 'bi-pencil-square text-warning' : 'bi-plus-circle-fill text-primary'}`}></i>
            {editingScheduleId ? '일정 수정하기' : '새로운 일정 등록'}
          </h5>
          <button onClick={props.onClose} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 p-2" style={{ backgroundColor: 'rgba(255,255,255,0.06)', width: '32px', height: '32px', color: '#94a3b8' }}><i className="bi bi-x-lg" /></button>
        </div>
        <p className="small text-muted mb-3">일정 등록과 수정은 큰 모달에서 처리되어, 목록 공간을 더 넓게 사용할 수 있습니다.</p>
        <form onSubmit={props.onSubmit}>
          <div className="mb-3 text-start"><label htmlFor="title" className="form-label small fw-semibold text-muted">일정 제목 *</label><input type="text" id="title" className="form-control form-premium-control" value={props.title} onChange={(e) => props.setTitle(e.target.value)} required /></div>
          <div className="mb-3 text-start"><label htmlFor="description" className="form-label small fw-semibold text-muted">상세 설명</label><textarea id="description" className="form-control form-premium-control" rows={3} value={props.description} onChange={(e) => props.setDescription(e.target.value)} /></div>
          <div className="form-check mb-3 text-start"><input type="checkbox" className="form-check-input cursor-pointer" id="hasTime" checked={props.hasTime} onChange={(e) => props.setHasTime(e.target.checked)} /><label className="form-check-label small text-muted cursor-pointer" htmlFor="hasTime">⏰ 시간 설정 활성화</label></div>
          <div className="row g-2 mb-3 text-start">
            <div className="col-12 col-md-6"><label htmlFor="startDate" className="form-label small fw-semibold text-muted">시작 날짜 *</label><input type="date" id="startDate" className="form-control form-premium-control" value={props.startDate} onChange={(e) => props.setStartDate(e.target.value)} required /></div>
            {props.hasTime && <div className="col-12 col-md-6"><label htmlFor="startTimeVal" className="form-label small fw-semibold text-muted">시작 시간 *</label><input type="time" id="startTimeVal" className="form-control form-premium-control" value={props.startTimeVal} onChange={(e) => props.setStartTimeVal(e.target.value)} required /></div>}
          </div>
          <div className="row g-2 mb-3 text-start">
            <div className="col-12 col-md-6"><label htmlFor="endDate" className="form-label small fw-semibold text-muted">종료 날짜 *</label><input type="date" id="endDate" className="form-control form-premium-control" value={props.endDate} onChange={(e) => props.setEndDate(e.target.value)} required /></div>
            {props.hasTime && <div className="col-12 col-md-6"><label htmlFor="endTimeVal" className="form-label small fw-semibold text-muted">종료 시간 *</label><input type="time" id="endTimeVal" className="form-control form-premium-control" value={props.endTimeVal} onChange={(e) => props.setEndTimeVal(e.target.value)} required /></div>}
          </div>
          <div className="mb-4 text-start"><label htmlFor="category" className="form-label small fw-semibold text-muted">카테고리</label><select id="category" className="form-select form-premium-control" value={props.category} onChange={(e) => props.setCategory(e.target.value as ScheduleCategory)}><option value="Work">🏢 업무 (Work)</option><option value="Personal">🏡 개인 (Personal)</option><option value="Important">⭐ 중요 (Important)</option><option value="Meeting">👥 회의 (Meeting)</option><option value="Etc">🏷️ 기타 (Etc)</option></select></div>
          <div className="d-flex gap-3 align-items-center w-100" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <button type="button" onClick={props.onClose} className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold" style={{ borderRadius: '14px', flex: '1' }}>취소</button>
            {editingScheduleId && <button type="button" onClick={props.onSaveOnly} className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold text-white" style={{ borderRadius: '14px', flex: '1', background: 'linear-gradient(135deg, #34d399, #10b981)' }}>임시 저장</button>}
            <button type="submit" className="btn d-flex align-items-center justify-content-center gap-2 py-3 fw-bold text-white" style={{ borderRadius: '14px', flex: '2', background: editingScheduleId ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>{editingScheduleId ? '수정 완료' : '일정 등록'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
