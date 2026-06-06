'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuthService } from '../../../../services/authService';

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const rememberMe = state === 'remember';

    if (!code) {
      setError('인증 코드가 누락되었습니다. 카카오 로그인에 실패했습니다.');
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    const processLogin = async () => {
      try {
        const redirectUri = `${window.location.origin}/oauth/kakao/callback`;
        await getAuthService().handleKakaoCallback(code, redirectUri, rememberMe);
        router.push('/');
      } catch (err: any) {
        setError(err.message || '카카오 로그인 연동 처리 중 에러가 발생했습니다.');
        setTimeout(() => router.push('/'), 4000);
      }
    };

    processLogin();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 px-3" style={{ background: '#05050b' }}>
        <div className="alert alert-danger border-0 p-4 text-center rounded-4 shadow-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)', maxWidth: '450px' }}>
          <i className="bi bi-exclamation-triangle-fill fs-1 mb-3 d-block text-danger"></i>
          <h5 className="fw-bold mb-2">인증 오류 발생</h5>
          <p className="small mb-0">{error}</p>
          <small className="d-block text-secondary mt-3">잠시 후 메인 화면으로 돌아갑니다...</small>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100" style={{ background: '#05050b' }}>
      <div className="text-center">
        {/* 사이버펑크 스타일 홀로그램 스피너 */}
        <div className="position-relative d-inline-block mb-4">
          <div className="spinner-border text-info" role="status" style={{ width: '4rem', height: '4rem', borderWidth: '0.25em', filter: 'drop-shadow(0 0 10px var(--neon-cyan))' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="position-absolute top-50 start-50 translate-middle">
            <i className="bi bi-shield-lock-fill text-white fs-4" style={{ filter: 'drop-shadow(0 0 5px var(--neon-pink))' }}></i>
          </div>
        </div>
        <h4 className="fw-bold text-white mb-2" style={{ textShadow: '0 0 10px var(--neon-cyan)', letterSpacing: '1px' }}>
          SECURE CONNECTION
        </h4>
        <p className="text-secondary small mb-0" style={{ letterSpacing: '0.5px' }}>
          카카오 보안 인증 정보를 교환하고 있습니다. 잠시만 기다려주세요...
        </p>
      </div>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={
      <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ background: '#05050b', color: '#ffffff' }}>
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <KakaoCallbackContent />
    </Suspense>
  );
}
