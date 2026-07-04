"use client";

import type { FormEvent } from 'react';

type AuthPortalProps = {
  authError: string | null;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  setAuthError: (error: string | null) => void;
  authUsername: string;
  setAuthUsername: (value: string) => void;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  authDisplayName: string;
  setAuthDisplayName: (value: string) => void;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  handleAuthSubmit: (e: FormEvent) => void;
  signInSocial: (provider: 'google' | 'kakao' | 'naver', rememberMe: boolean) => void;
};

export function AuthPortal({
  authError,
  authMode,
  setAuthMode,
  setAuthError,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword,
  authDisplayName,
  setAuthDisplayName,
  rememberMe,
  setRememberMe,
  handleAuthSubmit,
  signInSocial
}: AuthPortalProps) {
  return (
    <div className="row justify-content-center align-items-center" style={{ minHeight: '65vh' }}>
      <div className="col-md-6 col-lg-5">
        <div 
          className="premium-card p-5 position-relative overflow-hidden rounded-4"
          style={{ 
            backgroundColor: 'rgba(15, 18, 36, 0.85)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.15), 0 15px 45px rgba(0, 0, 0, 0.65)'
          }}
        >
          <div className="text-center mb-4">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center p-2 mb-3 shadow-sm" style={{ width: '56px', height: '56px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(99, 102, 241, 0.3)', boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)' }}>
              <img src="/logo.png" alt="Simple Note Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
            </div>
            <h4 className="fw-bold mb-1 display-font text-white">Simple Note</h4>
            <p className="text-secondary small">일정과 메모를 한 화면에서 바로 관리합니다.</p>
          </div>

          {authError && (
            <div className="alert alert-danger border-0 small rounded-3 d-flex align-items-center gap-2 mb-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }} role="alert">
              <i className="bi bi-exclamation-triangle-fill fs-6"></i>
              <div>{authError}</div>
            </div>
          )}

          {/* Social Login Panel */}
          <div className="d-flex flex-column gap-2 mb-4">
            <button
              onClick={() => signInSocial('google', rememberMe)}
              className="btn w-100 rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2 transition-all text-white border"
              style={{ 
                fontSize: '0.9rem', 
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.12)'
              }}
            >
              <i className="bi bi-google text-danger fs-5"></i>
              <strong>Google</strong> 계정으로 로그인
            </button>
            <button
              onClick={() => signInSocial('kakao', rememberMe)}
              className="btn w-100 rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2 shadow-sm transition-all text-dark"
              style={{ fontSize: '0.9rem', backgroundColor: '#fee500', border: 'none' }}
            >
              <i className="bi bi-chat-fill text-dark fs-5"></i>
              <strong>Kakao</strong> 계정으로 로그인
            </button>
            <button
              onClick={() => signInSocial('naver', rememberMe)}
              className="btn w-100 rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2 shadow-sm transition-all text-white"
              style={{ fontSize: '0.9rem', backgroundColor: '#03c75a', border: 'none' }}
            >
              <i className="bi bi-n-circle-fill text-white fs-5"></i>
              <strong>Naver</strong> 계정으로 로그인
            </button>
          </div>

          <div className="position-relative text-center my-4">
            <hr className="text-secondary" style={{ opacity: 0.25 }} />
            <span 
              className="position-absolute top-50 start-50 translate-middle px-3 text-secondary small border" 
              style={{ 
                fontSize: '0.75rem',
                backgroundColor: '#121424',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '12px'
              }}
            >
              또는 일반 계정 이용
            </span>
          </div>

          {/* Local Username/Password Form */}
          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <div className="mb-3">
                <label htmlFor="authDisplayName" className="form-label small fw-semibold text-secondary">이름 또는 닉네임 *</label>
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
              <label htmlFor="authUsername" className="form-label small fw-semibold text-secondary">아이디 (이메일 주소) *</label>
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

            <div className="mb-3">
              <label htmlFor="authPassword" className="form-label small fw-semibold text-secondary">비밀번호 *</label>
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

            <div className="form-check mb-4 text-start">
              <input
                type="checkbox"
                className="form-check-input cursor-pointer"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ backgroundColor: rememberMe ? '#6366f1' : 'transparent', borderColor: 'rgba(255,255,255,0.2)' }}
              />
              <label className="form-check-label small text-secondary cursor-pointer" htmlFor="rememberMe" style={{ userSelect: 'none' }}>
                자동 로그인 (브라우저 종료 시에도 로그인 유지)
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-premium-primary w-100 rounded-pill py-2.5 fw-bold shadow-sm transition-all"
            >
              {authMode === 'login' ? '로그인' : '회원가입 완료'}
            </button>

            <div className="text-center mt-3 small text-secondary">
              {authMode === 'login' ? (
                <>
                  아직 계정이 없으신가요?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(null); }}
                    className="btn btn-link p-0 text-info fw-semibold small text-decoration-underline"
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
                    className="btn btn-link p-0 text-info fw-semibold small text-decoration-underline"
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
  );
}
