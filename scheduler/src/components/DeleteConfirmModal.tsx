type Props = {
  open: boolean;
  type: 'schedule' | 'memo' | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmModal({ open, type, onCancel, onConfirm }: Props) {
  if (!open || !type) return null;
  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3" style={{ zIndex: 10000, backgroundColor: type === 'memo' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(16px)' }} onClick={onCancel}>
      <div className="premium-card p-4 w-100 rounded-4 position-relative scale-in" style={{ maxWidth: type === 'memo' ? '500px' : '400px', backgroundColor: 'rgba(15, 18, 36, 0.95)', color: '#e2e8f0', borderTop: '6px solid #f43f5e' }} onClick={(e) => e.stopPropagation()}>
        <h5 className="fw-bold text-white mb-3 text-center">{type === 'memo' ? '메모를 삭제하시겠습니까?' : '삭제 확인'}</h5>
        <p className="text-center text-secondary mb-4">{type === 'memo' ? '선택하신 메모는 복구할 수 없도록 완전히 삭제되며, 데이터베이스에서 영구히 제거됩니다.' : '삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다.)'}</p>
        <div className="d-flex gap-2">
          <button onClick={onCancel} className="btn w-100 py-2.5 rounded-3 fw-semibold border-0">취소</button>
          <button onClick={onConfirm} className="btn w-100 py-2.5 rounded-3 fw-semibold border-0 text-white" style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}>삭제</button>
        </div>
      </div>
    </div>
  );
}
