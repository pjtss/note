import { useState, useEffect, useCallback, useRef } from 'react';
import { UserSession, RegisterInput, LoginInput, SocialProvider } from '../types/auth';
import { getAuthService, IAuthService } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const serviceRef = useRef<IAuthService | null>(null);

  const getService = useCallback((): IAuthService => {
    if (!serviceRef.current) {
      serviceRef.current = getAuthService();
    }
    return serviceRef.current;
  }, []);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const activeService = getService();
      const session = await activeService.getCurrentSession();
      setUser(session);
    } catch (err: any) {
      setAuthError(err.message || '인증 정보를 확인하는 과정에서 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [getService]);

  const signUpUser = useCallback(async (input: RegisterInput, rememberMe: boolean = true) => {
    setLoading(true);
    setAuthError(null);
    try {
      const activeService = getService();
      const session = await activeService.register(input, rememberMe);
      setUser(session);
      return session;
    } catch (err: any) {
      setAuthError(err.message || '회원가입 과정에서 장해가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getService]);

  const signInUser = useCallback(async (input: LoginInput, rememberMe: boolean = true) => {
    setLoading(true);
    setAuthError(null);
    try {
      const activeService = getService();
      const session = await activeService.login(input, rememberMe);
      setUser(session);
      return session;
    } catch (err: any) {
      setAuthError(err.message || '로그인 과정에서 장해가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getService]);

  const signInSocial = useCallback(async (provider: SocialProvider, rememberMe: boolean = true) => {
    setLoading(true);
    setAuthError(null);
    try {
      const activeService = getService();
      const session = await activeService.socialLogin(provider, rememberMe);
      // Supabase OAuth는 페이지 리다이렉션이 발생하므로 로컬모드에서만 바로 세션 갱신
      if (session.id !== 'oauth-pending') {
        setUser(session);
      }
      return session;
    } catch (err: any) {
      setAuthError(err.message || '소셜 로그인 도중 장해가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getService]);

  const signOutUser = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const activeService = getService();
      await activeService.logout();
      setUser(null);
    } catch (err: any) {
      setAuthError(err.message || '로그아웃 도중 장해가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [getService]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    user,
    loading,
    authError,
    setAuthError,
    signUpUser,
    signInUser,
    signInSocial,
    signOutUser,
    fetchSession
  };
}
