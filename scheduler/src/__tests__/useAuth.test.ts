import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';
import { getAuthService } from '../services/authService';

// 1. getAuthService 모킹
jest.mock('../services/authService', () => {
  const mockGetCurrentSession = jest.fn();
  const mockRegister = jest.fn();
  const mockLogin = jest.fn();
  const mockSocialLogin = jest.fn();
  const mockLogout = jest.fn();
  const mockUpdateProfile = jest.fn();

  return {
    getAuthService: () => ({
      getCurrentSession: mockGetCurrentSession,
      register: mockRegister,
      login: mockLogin,
      socialLogin: mockSocialLogin,
      logout: mockLogout,
      updateProfile: mockUpdateProfile
    })
  };
});

describe('useAuth 커스텀 훅 테스트', () => {
  const mockService = getAuthService();
  const mockGetCurrentSession = mockService.getCurrentSession as jest.Mock;
  const mockRegister = mockService.register as jest.Mock;
  const mockLogin = mockService.login as jest.Mock;
  const mockSocialLogin = mockService.socialLogin as jest.Mock;
  const mockLogout = mockService.logout as jest.Mock;
  const mockUpdateProfile = (mockService as any).updateProfile as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('초기 렌더링 시 현재 로그인 세션을 안전하게 조회하여 반영해야 함', async () => {
    const mockSession = { id: 'u-1', username: 'test@test.com', displayName: '홍길동', provider: 'local', createdAt: '2026-05-20' };
    mockGetCurrentSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockSession);
    expect(result.current.authError).toBeNull();
  });

  test('초기 세션 조회 중 에러 발생 시 authError 상태를 업데이트해야 함', async () => {
    mockGetCurrentSession.mockRejectedValue(new Error('Session Check Failed'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.authError).toBe('Session Check Failed');
  });

  test('signUpUser - 성공 시 신규 회원가입을 완료하고 세션을 갱신해야 함', async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const mockSession = { id: 'new-u', username: 'new@test.com', displayName: '김회원', provider: 'local', createdAt: '2026-05-20' };
    mockRegister.mockResolvedValue(mockSession);

    let res;
    await act(async () => {
      res = await result.current.signUpUser({ username: 'new@test.com', displayName: '김회원' });
    });

    expect(res).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession);
  });

  test('signUpUser - 실패 시 에러를 throw 하고 authError 상태를 갱신해야 함', async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    mockRegister.mockRejectedValue(new Error('SignUp Failed'));

    await act(async () => {
      await expect(result.current.signUpUser({ username: '', displayName: '' }))
        .rejects.toThrow('SignUp Failed');
    });

    expect(result.current.authError).toBe('SignUp Failed');
  });

  test('signInUser - 성공 시 로그인 세션을 받아와 갱신해야 함', async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const mockSession = { id: 'u-1', username: 'user@test.com', displayName: '이름', provider: 'local', createdAt: '2026-05-20' };
    mockLogin.mockResolvedValue(mockSession);

    let res;
    await act(async () => {
      res = await result.current.signInUser({ username: 'user@test.com', password: '123' });
    });

    expect(res).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession);
  });

  test('signInUser - 실패 시 에러를 throw 하고 authError 상태를 갱신해야 함', async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    mockLogin.mockRejectedValue(new Error('Login Failed'));

    await act(async () => {
      await expect(result.current.signInUser({ username: '', password: '' }))
        .rejects.toThrow('Login Failed');
    });

    expect(result.current.authError).toBe('Login Failed');
  });

  test('signInSocial - 성공 시 소셜 로그인 임시 또는 로컬 세션을 적용해야 함', async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const mockSession = { id: 'social-u', username: 'g@test.com', displayName: '구글러', provider: 'google', createdAt: '2026-05-20' };
    mockSocialLogin.mockResolvedValue(mockSession);

    await act(async () => {
      await result.current.signInSocial('google');
    });

    expect(result.current.user).toEqual(mockSession);
  });

  test('signInSocial - Supabase OAuth 리다이렉션 대기중인 경우 세션 갱신을 미뤄야 함 (Branch 100%용)', async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const pendingSession = { id: 'oauth-pending', username: 'google_user@pending.com', displayName: 'google 인증 진행 중', provider: 'google', createdAt: '2026-05-20' };
    mockSocialLogin.mockResolvedValue(pendingSession);

    await act(async () => {
      await result.current.signInSocial('google');
    });

    // pending 상태이므로 user는 계속 null 이어야 함
    expect(result.current.user).toBeNull();
  });

  test('signInSocial - 실패 시 에러를 throw 하고 authError 상태를 갱신해야 함', async () => {
    mockGetCurrentSession.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    mockSocialLogin.mockRejectedValue(new Error('OAuth Failed'));

    await act(async () => {
      await expect(result.current.signInSocial('google')).rejects.toThrow('OAuth Failed');
    });

    expect(result.current.authError).toBe('OAuth Failed');
  });

  test('signOutUser - 성공 시 로그아웃 세션을 비워야 함', async () => {
    const mockSession = { id: 'u-1', username: 'test@test.com', displayName: '홍길동', provider: 'local', createdAt: '2026-05-20' };
    mockGetCurrentSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.user).toEqual(mockSession);

    mockLogout.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.signOutUser();
    });

    expect(result.current.user).toBeNull();
  });

  test('signOutUser - 실패 시 에러를 authError 상태에 채워야 함', async () => {
    const mockSession = { id: 'u-1', username: 'test@test.com', displayName: '홍길동', provider: 'local', createdAt: '2026-05-20' };
    mockGetCurrentSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    mockLogout.mockRejectedValue(new Error('Logout Failed'));

    await act(async () => {
      await result.current.signOutUser();
    });

    expect(result.current.authError).toBe('Logout Failed');
  });

  test('updateProfile - 성공 시 프로필을 수정하고 세션을 갱신해야 함', async () => {
    const mockSession = { id: 'u-1', username: 'test@test.com', displayName: '홍길동', provider: 'local', createdAt: '2026-05-20' };
    mockGetCurrentSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const updatedSession = { ...mockSession, displayName: '새이름' };
    mockUpdateProfile.mockResolvedValue(updatedSession);

    let res;
    await act(async () => {
      res = await result.current.updateProfile('새이름');
    });

    expect(res).toEqual(updatedSession);
    expect(result.current.user).toEqual(updatedSession);
  });

  test('updateProfile - 실패 시 에러를 throw 하고 authError 상태를 갱신해야 함', async () => {
    const mockSession = { id: 'u-1', username: 'test@test.com', displayName: '홍길동', provider: 'local', createdAt: '2026-05-20' };
    mockGetCurrentSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    mockUpdateProfile.mockRejectedValue(new Error('Update Failed'));

    await act(async () => {
      await expect(result.current.updateProfile('새이름'))
        .rejects.toThrow('Update Failed');
    });

    expect(result.current.authError).toBe('Update Failed');
  });
});

