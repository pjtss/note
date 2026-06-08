import type { UserSession } from '../types/auth';

type Props = {
  user: UserSession;
  profileDisplayName: string;
  setProfileDisplayName: (value: string) => void;
  profileCurrentPassword: string;
  setProfileCurrentPassword: (value: string) => void;
  profileNewPassword: string;
  setProfileNewPassword: (value: string) => void;
  profileNewPasswordConfirm: string;
  setProfileNewPasswordConfirm: (value: string) => void;
  profileError: string | null;
  profileSuccess: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onTogglePush: () => void;
  onOpenDeleteAccount: () => void;
  onSignOut: () => void;
};

export function ProfileSection(props: Props) {
  return (
    <div className="row justify-content-center animate-fade-in">
      <div className="col-lg-8 col-xl-7">
        <div className="premium-card p-5 position-relative overflow-hidden rounded-4 text-start" style={{ backgroundColor: 'rgba(15, 18, 36, 0.85)', border: '1px solid rgba(99, 102, 241, 0.25)', boxShadow: '0 0 30px rgba(99, 102, 241, 0.15), 0 15px 45px rgba(0, 0, 0, 0.65)' }}>
          <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-secondary" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '64px', height: '64px', background: 'var(--primary-gradient)', boxShadow: '0 0 15px var(--neon-pink)' }}><i className="bi bi-person-bounding-box text-white fs-3"></i></div>
              <div>
                <h4 className="fw-bold mb-1 text-white display-font">{props.user.displayName}</h4>
                <span className="text-secondary small d-flex align-items-center gap-1"><span className="text-uppercase fw-semibold">{props.user.provider} Auth Portal</span></span>
              </div>
            </div>
            <button onClick={props.onSignOut} className="btn btn-outline-danger rounded-pill px-4 py-2 fw-semibold" style={{ fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>로그아웃</button>
          </div>

          {props.profileError && <div className="alert alert-danger border-0 small rounded-3 mb-4">{props.profileError}</div>}
          {props.profileSuccess && <div className="alert alert-success border-0 small rounded-3 mb-4">{props.profileSuccess}</div>}

          <form onSubmit={props.onSubmit}>
            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">이름 / 닉네임 변경 *</label>
              <input type="text" className="form-control form-premium-control text-white" value={props.profileDisplayName} onChange={(e) => props.setProfileDisplayName(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">계정 아이디 (이메일 주소)</label>
              <input type="text" className="form-control form-premium-control text-secondary bg-transparent" value={props.user.username} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="mb-4 p-4 rounded-4 border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="fw-bold text-white mb-1 d-flex align-items-center gap-2"><i className="bi bi-bell-fill text-info"></i> 글로벌 푸시 알림 수신 설정</h6>
                  <small className="text-secondary" style={{ fontSize: '0.8rem', opacity: 0.7 }}>체크 해제 시 기기의 일정 시작 알림이 더 이상 전송되지 않습니다.</small>
                </div>
                <input className="form-check-input cursor-pointer" type="checkbox" checked={props.user.pushEnabled} onChange={props.onTogglePush} style={{ width: '50px', height: '26px' }} />
              </div>
            </div>
            {props.user.provider === 'local' && (
              <div className="p-4 rounded-4 mb-4 border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <h6 className="fw-bold text-white mb-3 d-flex align-items-center gap-2"><i className="bi bi-shield-lock-fill text-warning"></i> 비밀번호 변경하기</h6>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary">현재 비밀번호 *</label>
                    <input type="password" className="form-control form-premium-control text-white" value={props.profileCurrentPassword} onChange={(e) => props.setProfileCurrentPassword(e.target.value)} />
                  </div>
                  <div className="col-md-6"><label className="form-label small fw-semibold text-secondary">새 비밀번호</label><input type="password" className="form-control form-premium-control text-white" value={props.profileNewPassword} onChange={(e) => props.setProfileNewPassword(e.target.value)} /></div>
                  <div className="col-md-6"><label className="form-label small fw-semibold text-secondary">새 비밀번호 확인</label><input type="password" className="form-control form-premium-control text-white" value={props.profileNewPasswordConfirm} onChange={(e) => props.setProfileNewPasswordConfirm(e.target.value)} /></div>
                </div>
              </div>
            )}
            <button type="submit" className="btn btn-premium-primary w-100 py-3 rounded-pill fw-bold shadow-sm transition-all mt-2">변경 사항 저장하기</button>
            <div className="mt-5 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-semibold">위험 구역 (Danger Zone)</span>
                  <p className="text-muted small mb-0" style={{ fontSize: '0.75rem', opacity: 0.6 }}>계정을 삭제하면 복구가 불가능하며, 일정 및 메모 등 모든 정보가 소멸됩니다.</p>
                </div>
              <button type="button" onClick={props.onOpenDeleteAccount} className="btn btn-sm btn-outline-danger px-3 py-2 rounded-3" style={{ fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>계정 탈퇴하기</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
