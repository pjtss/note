type Props = {
  show: boolean;
  isRunning: boolean;
  seconds: number;
  mode: 'focus' | 'break';
  customFocus: number;
  customBreak: number;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  onReset: () => void;
  onFocusChange: (value: number) => void;
  onBreakChange: (value: number) => void;
};

export function PomodoroWidget(props: Props) {
  return (
    <div className="position-fixed bottom-4 end-4 text-end" style={{ zIndex: 9999, bottom: '24px', right: '24px' }}>
      {!props.show ? (
        <button onClick={props.onOpen} className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 border-0" style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #ff6b6b, #ff8787)' }} title="뽀모도로 집중 타이머 열기">
          <i className="bi bi-hourglass-split text-white fs-4"></i>
        </button>
      ) : (
        <div className="premium-card p-3 rounded-4 shadow-lg text-start border-0 animate-scale-up" style={{ width: '300px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', color: '#2b2d42' }}>
          <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
            <h6 className="fw-bold m-0 d-flex align-items-center gap-2 text-primary">🍅 뽀모도로 타이머</h6>
            <button onClick={props.onClose} className="btn btn-sm rounded-circle p-0 border-0 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}><i className="bi bi-dash fs-6"></i></button>
          </div>
          <div className="text-center py-3">
            <div className="display-4 fw-bold display-font text-dark mb-1" style={{ fontSize: '2.5rem' }}>{Math.floor(props.seconds / 60).toString().padStart(2, '0')}:{(props.seconds % 60).toString().padStart(2, '0')}</div>
            <span className={`badge px-2 py-1 rounded-pill ${props.mode === 'focus' ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-success-subtle text-success border border-success-subtle'}`} style={{ fontSize: '0.75rem' }}>{props.mode === 'focus' ? '🎯 집중 모드' : '🌿 휴식 모드'}</span>
          </div>
          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <button onClick={props.onToggle} className={`btn btn-sm px-3 py-1.5 rounded-pill fw-bold text-white d-flex align-items-center gap-1 border-0 ${props.isRunning ? 'bg-warning' : 'bg-primary'}`} style={{ fontSize: '0.8rem' }}><i className={`bi ${props.isRunning ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>{props.isRunning ? '일시정지' : '시작'}</button>
            <button onClick={props.onReset} className="btn btn-sm btn-outline-secondary px-3 py-1.5 rounded-pill fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>초기화</button>
          </div>
          <div className="bg-light p-2 rounded-3" style={{ fontSize: '0.75rem' }}>
            <div className="row g-2 align-items-center">
              <div className="col-6"><label className="text-muted fw-medium mb-1 d-block">집중 시간 (분)</label><input type="number" value={props.customFocus} onChange={(e) => props.onFocusChange(Math.max(1, parseInt(e.target.value) || 25))} className="form-control form-control-sm text-center border-0 bg-white" min="1" /></div>
              <div className="col-6"><label className="text-muted fw-medium mb-1 d-block">휴식 시간 (분)</label><input type="number" value={props.customBreak} onChange={(e) => props.onBreakChange(Math.max(1, parseInt(e.target.value) || 5))} className="form-control form-control-sm text-center border-0 bg-white" min="1" /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
