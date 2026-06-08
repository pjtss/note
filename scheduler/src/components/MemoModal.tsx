import type { FormEvent } from 'react';

type ColorItem = { hex: string; name: string };
type FontItem = { value: string; name: string };
type SlashItem = { label: string; insert: string };

type Props = {
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
  slashSuggestions: SlashItem[];
  insertSlashCommand: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onSaveOnly: () => void;
  handleCancelMemoEdit: () => void;
  pastelColors: readonly ColorItem[];
  fontOptions: readonly FontItem[];
  checkIfDarkColor: (hex: string) => boolean;
  memoError: string | null;
  getSelectedFontCss: (selectedFont: string) => string;
  handleMemoContentChange: (value: string, cursorPos: number) => void;
  handleMemoContentKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export function MemoModal(props: Props) {
  if (!props.open) return null;
  const { editingMemoId } = props;
  const fontCss = props.getSelectedFontCss(props.selectedFont);
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-stretch justify-content-stretch" style={{ zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)' }} onClick={props.onClose}>
      <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-start p-4 overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="premium-card p-4 w-100 d-flex flex-column" style={{ maxWidth: '760px', minHeight: 'calc(100vh - 80px)', backgroundColor: 'rgba(15, 18, 36, 0.95)', color: '#cbd5e1', borderTop: `6px solid ${editingMemoId ? '#f59e0b' : '#6366f1'}` }}>
          <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2"><h5 className="fw-bold mb-0 d-flex align-items-center gap-2 text-white">{editingMemoId ? '메모 수정하기' : '새 메모 작성하기'}</h5><button onClick={props.onClose} className="btn btn-sm rounded-circle border-0 p-2">✕</button></div>
          {props.memoError && <div className="alert alert-danger border-0 small rounded-3 mb-3">{props.memoError}</div>}
          <form onSubmit={props.onSubmit} className="d-flex flex-column flex-grow-1">
            <div className="mb-3 text-start"><label htmlFor="memoTitle" className="form-label small fw-semibold text-muted">메모 제목 *</label><input id="memoTitle" type="text" className="form-control form-premium-control" value={props.memoTitle} onChange={(e) => props.setMemoTitle(e.target.value)} required style={{ fontFamily: fontCss }} /></div>
            <div className="mb-3 text-start position-relative flex-grow-1"><label htmlFor="memoContent" className="form-label small fw-semibold text-muted">메모 내용 *</label><textarea id="memoContent" className="form-control form-premium-control" rows={12} value={props.memoContent} onChange={(e) => props.handleMemoContentChange(e.target.value, e.target.selectionStart ?? e.target.value.length)} onKeyDown={props.handleMemoContentKeyDown} required style={{ fontFamily: fontCss, resize: 'none', minHeight: '45vh' }} />{props.memoSuggestionsVisible && props.slashSuggestions.length > 0 && <div className="position-absolute start-0 w-100 mt-2 rounded-4 overflow-hidden border shadow-lg" style={{ zIndex: 10, backgroundColor: 'rgba(15, 18, 36, 0.98)', top: 'calc(100% + 0.5rem)' }}>{props.slashSuggestions.map((item, index) => <button key={item.label} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => props.insertSlashCommand(item.insert)} className="w-100 text-start border-0 px-3 py-2 d-flex align-items-center justify-content-between" style={{ backgroundColor: index === props.selectedSlashSuggestionIndex ? 'rgba(99, 102, 241, 0.25)' : 'transparent', color: '#e2e8f0' }}><span className="fw-semibold">{item.label}</span><span className="small text-muted">{item.insert.trim()}</span></button>)}</div>}</div>
            <div className="mb-4 text-start"><label className="form-label small fw-semibold text-muted d-block">메모 카드 테마 색상</label><div className="d-flex flex-wrap gap-2 mt-1">{props.pastelColors.map((color) => <button key={color.hex} type="button" onClick={() => props.setMemoColor(color.hex)} className="rounded-circle border-0 transition-all d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px', backgroundColor: color.hex, transform: props.memoColor === color.hex ? 'scale(1.2)' : 'scale(1)' }} title={color.name}>{props.memoColor === color.hex && <i className={`bi bi-check-lg ${props.checkIfDarkColor(color.hex) ? 'text-white' : 'text-dark'}`} style={{ fontSize: '0.8rem' }} />}</button>)}</div></div>
            <div className="mb-4 text-start"><label className="form-label small fw-semibold text-muted d-block">글꼴</label><select className="form-select form-premium-control w-auto" value={props.selectedFont} onChange={(e) => props.handleFontChange(e.target.value)} style={{ fontSize: '0.85rem' }}>{props.fontOptions.map((font) => <option key={font.value} value={font.value}>{font.name}</option>)}</select></div>
            <div className="d-flex gap-3 mt-auto align-items-center w-100"><button type="button" onClick={props.handleCancelMemoEdit} className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold" style={{ borderRadius: '14px', flex: '1' }}>취소</button>{editingMemoId && <button type="button" onClick={props.onSaveOnly} className="btn d-flex align-items-center justify-content-center gap-2 px-4 py-3 fw-bold text-white" style={{ borderRadius: '14px', flex: '1', background: 'linear-gradient(135deg, #34d399, #10b981)' }}>임시 저장</button>}<button type="submit" className="btn d-flex align-items-center justify-content-center gap-2 py-3 fw-bold text-white" style={{ borderRadius: '14px', flex: '2', background: editingMemoId ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>{editingMemoId ? '수정 완료' : '메모 등록'}</button></div>
          </form>
        </div>
      </div>
    </div>
  );
}
