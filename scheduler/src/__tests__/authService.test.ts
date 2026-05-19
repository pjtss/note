import {
  LocalStorageAuthService,
  SupabaseAuthService,
  getAuthService
} from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { isBrowser } from '../services/scheduleService';

// 1. Supabase Client 모킹
jest.mock('../services/supabaseClient', () => {
  const mockGetSession = jest.fn();
  const mockSignUp = jest.fn();
  const mockSignInWithPassword = jest.fn();
  const mockSignInWithOAuth = jest.fn();
  const mockSignOut = jest.fn();

  return {
    supabase: {
      auth: {
        getSession: mockGetSession,
        signUp: mockSignUp,
        signInWithPassword: mockSignInWithPassword,
        signInWithOAuth: mockSignInWithOAuth,
        signOut: mockSignOut
      }
    }
  };
});

// 2. isBrowser 모킹
jest.mock('../services/scheduleService', () => {
  return {
    isBrowser: {
      check: jest.fn(() => true)
    }
  };
});

describe('AuthService 테스트', () => {
  const mockAuth = supabase.auth;
  const mockGetSession = mockAuth.getSession as jest.Mock;
  const mockSignUp = mockAuth.signUp as jest.Mock;
  const mockSignInWithPassword = mockAuth.signInWithPassword as jest.Mock;
  const mockSignInWithOAuth = mockAuth.signInWithOAuth as jest.Mock;
  const mockSignOut = mockAuth.signOut as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (isBrowser.check as jest.Mock).mockReturnValue(true);
  });

  describe('LocalStorageAuthService 테스트', () => {
    let service: LocalStorageAuthService;

    beforeEach(() => {
      service = new LocalStorageAuthService();
    });

    test('getCurrentSession - 세션이 없을 시 null을 반환해야 함', async () => {
      const session = await service.getCurrentSession();
      expect(session).toBeNull();
    });

    test('getCurrentSession - SSR 환경(isBrowser false)인 경우 null을 반환해야 함', async () => {
      (isBrowser.check as jest.Mock).mockReturnValue(false);
      const session = await service.getCurrentSession();
      expect(session).toBeNull();
    });

    test('register - 성공 시 신규 유저 세션을 생성하고 저장해야 함', async () => {
      const input = { username: 'test@test.com', password: 'password', displayName: '홍길동' };
      const session = await service.register(input);

      expect(session.username).toBe(input.username);
      expect(session.displayName).toBe(input.displayName);
      expect(session.provider).toBe('local');
      expect(session.id).toBeDefined();

      const current = await service.getCurrentSession();
      expect(current).toEqual(session);
    });

    test('register - 이미 가입된 아이디인 경우 에러를 throw 해야 함', async () => {
      const input = { username: 'dup@test.com', password: '123', displayName: '가나다' };
      await service.register(input);

      await expect(service.register(input)).rejects.toThrow('이미 등록된 아이디(이메일)입니다.');
    });

    test('register - SSR 환경일 시 로컬스토리지 저장을 건너뛰어야 함 (Branch 용)', async () => {
      (isBrowser.check as jest.Mock).mockReturnValue(false);
      const input = { username: 'ssr@test.com', displayName: 'SSR' };
      const session = await service.register(input);
      expect(session.id).toBeDefined();
    });

    test('login - 성공 시 올바른 정보를 받으면 세션을 할당해야 함', async () => {
      const input = { username: 'login@test.com', password: 'password', displayName: '홍길동' };
      await service.register(input);

      // 세션 비우기
      localStorage.removeItem('scheduler_user_session');

      const session = await service.login({ username: input.username, password: input.password });
      expect(session.username).toBe(input.username);
      expect(session.displayName).toBe(input.displayName);
    });

    test('login - 패스워드나 아이디가 다르면 에러를 throw 해야 함', async () => {
      await expect(service.login({ username: 'none@test.com', password: '123' }))
        .rejects.toThrow('아이디 또는 비밀번호가 일치하지 않습니다.');
    });

    test('socialLogin - 제공자별 모의 소셜 로그인 세션을 즉시 제공해야 함', async () => {
      const gSession = await service.socialLogin('google');
      expect(gSession.provider).toBe('google');
      expect(gSession.displayName).toBe('구글 프리미엄 유저');

      const kSession = await service.socialLogin('kakao');
      expect(kSession.provider).toBe('kakao');
      expect(kSession.displayName).toBe('카카오 라이언');

      const nSession = await service.socialLogin('naver');
      expect(nSession.provider).toBe('naver');
      expect(nSession.displayName).toBe('네이버 그린멤버');
    });

    test('logout - 세션을 제거해야 함', async () => {
      const input = { username: 'logout@test.com', password: 'password', displayName: '홍길동' };
      await service.register(input);

      await service.logout();
      const current = await service.getCurrentSession();
      expect(current).toBeNull();
    });

    test('logout - SSR 환경일 시 조용히 넘어가야 함 (Branch 용)', async () => {
      (isBrowser.check as jest.Mock).mockReturnValue(false);
      await service.logout();
    });
  });

  describe('SupabaseAuthService 테스트', () => {
    let service: SupabaseAuthService;

    beforeEach(() => {
      service = new SupabaseAuthService();
    });

    test('getCurrentSession - 세션이 존재하면 가공된 유저 세션을 반환해야 함', async () => {
      const mockSession = {
        user: {
          id: 'u-1',
          email: 'cloud@test.com',
          created_at: '2026-05-20',
          user_metadata: { displayName: '구름유저' },
          app_metadata: { provider: 'google' }
        }
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const session = await service.getCurrentSession();
      expect(session?.id).toBe('u-1');
      expect(session?.displayName).toBe('구름유저');
      expect(session?.provider).toBe('google');
    });

    test('getCurrentSession - user_metadata 및 email이 없는 예외 케이스 처리 (Branch 100%용)', async () => {
      const mockSession = {
        user: {
          id: 'u-1',
          created_at: '2026-05-20'
        }
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const session = await service.getCurrentSession();
      expect(session?.username).toBe('supabase_user@unknown.com');
      expect(session?.displayName).toBe('클라우드 멤버');
    });

    test('getCurrentSession - 에러나 세션 부재 시 null을 반환해야 함', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: { message: 'Auth Error' } });
      const session = await service.getCurrentSession();
      expect(session).toBeNull();
    });

    test('register - 성공 시 가입된 세션을 반환해야 함', async () => {
      const mockUser = { id: 'new-u', email: 'reg@test.com', created_at: '2026-05-20' };
      mockSignUp.mockResolvedValue({ data: { user: mockUser }, error: null });

      const res = await service.register({ username: 'reg@test.com', password: '123', displayName: '홍길동' });
      expect(res.id).toBe('new-u');
      expect(res.displayName).toBe('홍길동');
    });

    test('register - 에러 발생 시 throw 해야 함', async () => {
      mockSignUp.mockResolvedValue({ data: { user: null }, error: { message: 'SignUp Fail' } });
      await expect(service.register({ username: '', displayName: '' })).rejects.toThrow('SignUp Fail');
    });

    test('register - user 데이터가 없을 시 throw 해야 함', async () => {
      mockSignUp.mockResolvedValue({ data: { user: null }, error: null });
      await expect(service.register({ username: '', displayName: '' })).rejects.toThrow('회원가입에 실패했습니다.');
    });

    test('login - 성공 시 로그인 세션을 반환해야 함', async () => {
      const mockUser = {
        id: 'u-1',
        email: 'log@test.com',
        created_at: '2026-05-20',
        user_metadata: { displayName: '로그인남' }
      };
      mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser }, error: null });

      const res = await service.login({ username: 'log@test.com', password: '123' });
      expect(res.id).toBe('u-1');
      expect(res.displayName).toBe('로그인남');
    });

    test('login - metadata가 비어있을 시 아이디 기반 명칭 매핑 (Branch 100%용)', async () => {
      const mockUser = {
        id: 'u-1',
        email: 'log@test.com',
        created_at: '2026-05-20'
      };
      mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser }, error: null });

      const res = await service.login({ username: 'log@test.com', password: '123' });
      expect(res.displayName).toBe('log');
    });

    test('login - 에러 발생 시 throw 해야 함', async () => {
      mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'SignIn Fail' } });
      await expect(service.login({ username: '', password: '' })).rejects.toThrow('SignIn Fail');
    });

    test('login - user 데이터가 없을 시 throw 해야 함', async () => {
      mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: null });
      await expect(service.login({ username: '', password: '' })).rejects.toThrow('로그인에 실패했습니다.');
    });

    test('socialLogin - 성공 시 리다이렉트 대기 세션을 반환해야 함', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: null });
      const res = await service.socialLogin('google');
      expect(res.id).toBe('oauth-pending');
      expect(res.displayName).toBe('google 인증 진행 중');
    });

    test('socialLogin - 실패 시 에러를 throw 해야 함', async () => {
      mockSignInWithOAuth.mockResolvedValue({ error: { message: 'OAuth Error' } });
      await expect(service.socialLogin('google')).rejects.toThrow('OAuth Error');
    });

    test('logout - 성공 시 로그아웃이 완료되어야 함', async () => {
      mockSignOut.mockResolvedValue({ error: null });
      await expect(service.logout()).resolves.not.toThrow();
    });

    test('logout - 실패 시 에러를 throw 해야 함', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'SignOut Fail' } });
      await expect(service.logout()).rejects.toThrow('SignOut Fail');
    });
  });

  describe('getAuthService 팩토리 테스트', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('getAuthService - 브라우저 환경이 아닐 시 LocalStorageAuthService를 반환해야 함', () => {
      (isBrowser.check as jest.Mock).mockReturnValue(false);
      const service = getAuthService();
      expect(service).toBeInstanceOf(LocalStorageAuthService);
    });

    test('getAuthService - API 키 환경 변수가 없을 시 LocalStorageAuthService를 반환해야 함', () => {
      (isBrowser.check as jest.Mock).mockReturnValue(true);
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      const service = getAuthService();
      expect(service).toBeInstanceOf(LocalStorageAuthService);
    });

    test('getAuthService - API 키 환경 변수가 지정되어 있을 시 SupabaseAuthService를 반환해야 함', () => {
      (isBrowser.check as jest.Mock).mockReturnValue(true);
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon-key';

      const service = getAuthService();
      expect(service).toBeInstanceOf(SupabaseAuthService);
    });
  });
});
