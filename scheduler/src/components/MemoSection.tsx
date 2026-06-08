import type { Memo } from '../types/memo';
import { getSelectedFontCss, pastelColors, fontOptions, checkIfDarkColor, hexToRgba } from '../lib/editorUi';

type Props = {
  memoLoading: boolean;
  filteredMemos: Memo[];
  memoSearchQuery: string;
  setMemoSearchQuery: (value: string) => void;
  memoColorFilter: string;
  setMemoColorFilter: (value: string) => void;
  selectedFont: string;
  handleFontChange: (value: string) => void;
  handleCancelMemoEdit: () => void;
  setIsMemoModalOpen: (value: boolean) => void;
  setSelectedMemo: (value: Memo | null) => void;
  handleStartMemoEdit: (memo: Memo) => void;
  formatDateKST: (isoString: string, showTime?: boolean) => string;
  pastelColorsOverride?: readonly { hex: string; name: string }[];
  fontOptionsOverride?: readonly { value: string; name: string }[];
};

export function MemoSection(props: Props) {
  const pastel = props.pastelColorsOverride ?? pastelColors;
  const fonts = props.fontOptionsOverride ?? fontOptions;

  return (
    <div className="premium-card p-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
        <div>
          <h5 className="fw-bold mb-1">메모 보드</h5>
          <p className="small text-secondary mb-0">필터와 목록만 남겨 화면을 넓게 사용합니다.</p>
        </div>
        <button
          onClick={() => {
            props.handleCancelMemoEdit();
            props.setIsMemoModalOpen(true);
          }}
          className="btn btn-premium-primary d-flex align-items-center justify-content-center gap-2 transition-all"
          style={{ borderRadius: '12px', minWidth: '160px' }}
        >
          <i className="bi bi-sticky-fill fs-5"></i>
          <span>새 메모 작성하기</span>
        </button>
      </div>

      <div className="row g-3 align-items-center mb-4">
        <div className="col-md-5">
          <div className="input-group">
            <span className="input-group-text border-end-0 rounded-start-pill text-secondary" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 rounded-end-pill form-premium-control"
              style={{ paddingLeft: '0.2rem' }}
              placeholder="메모 검색..."
              value={props.memoSearchQuery}
              onChange={(e) => props.setMemoSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="col-md-7 d-flex gap-2 justify-content-md-end align-items-center flex-wrap">
          <span className="small text-secondary fw-semibold me-1"><i className="bi bi-funnel-fill"></i> 색상:</span>
          <select className="form-select form-premium-control w-auto" value={props.memoColorFilter} onChange={(e) => props.setMemoColorFilter(e.target.value)} style={{ fontSize: '0.85rem' }}>
            <option value="All">🌈 전체</option>
            {pastel.map(c => <option key={c.hex} value={c.hex}>{c.name}</option>)}
          </select>

          <span className="small text-secondary fw-semibold ms-md-2 me-1"><i className="bi bi-fonts"></i> 글꼴:</span>
          <select className="form-select form-premium-control w-auto" value={props.selectedFont} onChange={(e) => props.handleFontChange(e.target.value)} style={{ fontSize: '0.85rem' }}>
            {fonts.map(font => <option key={font.value} value={font.value}>{font.name}</option>)}
          </select>
        </div>
      </div>

      {props.memoLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3 text-muted">메모패드를 정돈하고 있습니다.</p>
        </div>
      ) : props.filteredMemos.length === 0 ? (
        <div className="text-center py-5 rounded-4 border border-dashed" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h6 className="fw-bold text-secondary mb-1">작성된 메모가 없습니다.</h6>
          <p className="text-secondary small px-4 mb-0" style={{ opacity: 0.7 }}>{props.memoSearchQuery.trim() !== '' || props.memoColorFilter !== 'All' ? '설정한 필터 조건에 부합하는 메모가 없습니다. 필터를 변경해 보세요.' : '상단 버튼으로 새 메모를 작성해보세요.'}</p>
        </div>
      ) : (
        <div className="row g-3" style={{ minHeight: '300px' }}>
          {props.filteredMemos.map((memo) => {
            const isDarkColor = checkIfDarkColor(memo.color || '#fffbeb');
            return (
              <div key={memo.id} className="col-md-6 col-xl-6">
                <div
                  onClick={() => props.setSelectedMemo(memo)}
                  className="card border-0 p-4 h-100 rounded-4 transition-all position-relative hover-up"
                  style={{
                    backgroundColor: 'rgba(10, 10, 20, 0.8)',
                    color: '#e2e8f0',
                    border: `1px solid ${hexToRgba(memo.color || '#ff007f', 0.25)}`,
                    borderLeft: `5px solid ${memo.color || '#ff007f'}`,
                    boxShadow: `0 0 15px ${hexToRgba(memo.color || '#ff007f', 0.15)}, inset 0 0 10px ${hexToRgba(memo.color || '#ff007f', 0.05)}`,
                    cursor: 'pointer',
                    fontFamily: getSelectedFontCss(props.selectedFont)
                  }}
                >
                  <div className="d-flex flex-column h-100">
                    <div className="d-flex align-items-start justify-content-between mb-2">
                      <h5 className="fw-bold mb-0 text-truncate pe-2" style={{ fontSize: '1.1rem', letterSpacing: '-0.3px', maxWidth: '80%', color: '#fff' }}>{memo.title}</h5>
                      <div className="d-flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); props.handleStartMemoEdit(memo); }} className="btn btn-sm p-1 rounded-3 transition-all d-flex align-items-center justify-content-center border-0" style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: isDarkColor ? '#fff' : '#2b2d42', width: '26px', height: '26px' }} title="메모 수정"><i className="bi bi-pencil-fill" style={{ fontSize: '0.75rem' }} /></button>
                        <button onClick={(e) => { e.stopPropagation(); props.setSelectedMemo(null); }} className="btn btn-sm p-1 rounded-3 transition-all d-flex align-items-center justify-content-center border-0" style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: isDarkColor ? '#ffc6ff' : '#dc3545', width: '26px', height: '26px' }} title="메모 닫기"><i className="bi bi-x-lg" style={{ fontSize: '0.75rem' }} /></button>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between border-top pt-2 mt-auto" style={{ borderColor: isDarkColor ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)', fontSize: '0.7rem', opacity: 0.75 }}>
                      <span className="d-flex align-items-center gap-1"><i className="bi bi-clock-history"></i>{props.formatDateKST(memo.createdAt, true)}</span>
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
  );
}
