import type { Memo } from '../types/memo';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getSelectedFontCss, hexToRgba } from '../lib/editorUi';

type Props = {
  memo: Memo;
  selectedFont: string;
  closeHovered: boolean;
  setCloseHovered: (value: boolean) => void;
  hoveredAction: 'copy' | 'edit' | 'delete' | null;
  setHoveredAction: (value: 'copy' | 'edit' | 'delete' | null) => void;
  onClose: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTodoToggle: (lineIndex: number) => void;
  isMemoPinned: (memo: Memo) => boolean;
  getCleanMemoTitle: (title: string) => string;
  getMemoStats: (content: string) => { charCountWithoutSpace: number; readingTimeMins: number };
  formatDateKST: (isoString: string, showTime?: boolean) => string;
};

export function MemoDetailModal(props: Props) {
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3" style={{ zIndex: 9999, backgroundColor: 'rgba(8, 10, 20, 0.75)', backdropFilter: 'blur(16px)' }} onClick={props.onClose}>
      <div className="premium-card p-4 w-100 rounded-4 position-relative scale-in" style={{ maxWidth: '650px', backgroundColor: 'rgba(15, 18, 36, 0.93)', color: '#f1f5f9', border: `1px solid ${hexToRgba(props.memo.color || '#6366f1', 0.25)}`, borderTop: `6px solid ${props.memo.color || '#6366f1'}`, boxShadow: `0 0 30px ${hexToRgba(props.memo.color || '#6366f1', 0.25)}, 0 15px 50px rgba(0, 0, 0, 0.65), inset 0 0 15px ${hexToRgba(props.memo.color || '#6366f1', 0.08)}`, fontFamily: getSelectedFontCss(props.selectedFont) }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-start justify-content-between mb-3 border-bottom pb-3" style={{ borderColor: hexToRgba(props.memo.color || '#6366f1', 0.18) }}>
          <div>
            <h4 className="fw-bold mb-1 display-font d-flex align-items-center gap-2" style={{ color: '#fff' }}>{props.isMemoPinned(props.memo) && <i className="bi bi-pin-angle-fill" style={{ color: props.memo.color || '#6366f1', fontSize: '1.25rem' }}></i>}{props.getCleanMemoTitle(props.memo.title)}</h4>
            <div className="d-flex flex-wrap align-items-center gap-2 mt-1" style={{ opacity: 0.85 }}>
              <small style={{ fontSize: '0.75rem', color: '#94a3b8' }} className="d-flex align-items-center gap-1"><i className="bi bi-clock-history"></i>{props.formatDateKST(props.memo.createdAt, true)} 작성됨</small>
              {(() => { const stats = props.getMemoStats(props.memo.content || ''); return <span className="badge py-1 px-2 border" style={{ fontSize: '0.65rem', backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', borderColor: 'rgba(255,255,255,0.08)' }}>공백제외: {stats.charCountWithoutSpace}자 / 예상리딩: {stats.readingTimeMins}분</span>; })()}
            </div>
          </div>
          <button onClick={props.onClose} onMouseEnter={() => props.setCloseHovered(true)} onMouseLeave={() => props.setCloseHovered(false)} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ backgroundColor: props.closeHovered ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.06)', color: props.closeHovered ? '#f87171' : '#94a3b8', width: '32px', height: '32px' }}><i className="bi bi-x-lg fs-6"></i></button>
        </div>
        <div className="py-2 mb-4 scrollbar-premium text-start" style={{ maxHeight: '400px', overflowY: 'auto', lineHeight: '1.6', fontSize: '0.95rem' }}>
          <MarkdownRenderer content={props.memo.content} isDarkColor={true} onTodoToggle={props.onTodoToggle} />
        </div>
        <div className="d-flex align-items-center justify-content-between border-top pt-3" style={{ borderColor: hexToRgba(props.memo.color || '#6366f1', 0.18) }}>
          <span className="badge px-3 py-2 rounded-pill fw-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem' }}>✏️ Premium View Mode</span>
          <div className="d-flex gap-2">
            <button onClick={props.onCopy} onMouseEnter={() => props.setHoveredAction('copy')} onMouseLeave={() => props.setHoveredAction(null)} className="btn btn-sm px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-1">복사</button>
            <button onClick={props.onEdit} onMouseEnter={() => props.setHoveredAction('edit')} onMouseLeave={() => props.setHoveredAction(null)} className="btn btn-sm px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-1">수정하기</button>
            <button onClick={props.onDelete} onMouseEnter={() => props.setHoveredAction('delete')} onMouseLeave={() => props.setHoveredAction(null)} className="btn btn-sm px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-1 text-white">삭제하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
