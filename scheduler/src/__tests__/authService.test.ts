import {
  JwtAuthService,
  getAuthService
} from '../services/authService';
import { isBrowser } from '../services/scheduleService';

// 1. isBrowser 모킹
jest.mock('../services/scheduleService', () => {
  return {
    isBrowser: {
      check: jest.fn(() => true)
    }
  };
});

describe('JwtAuthService 테스트', () => {
  let service: JwtAuthService;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (isBrowser.check as jest.Mock).mockReturnValue(true);
    service = new JwtAuthService();

    // fetch 모킹
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    // @ts-ignore
    delete global.fetch;
  });

  test('getAccessToken - 저장된 토큰이 없을 시 null을 반환해야 함', () => {
    expect(service.getAccessToken()).toBeNull();
  });

  test('getCurrentSession - 세션과 리프레시 토큰이 없으면 null을 반환해야 함', async () => {
    const session = await service.getCurrentSession();
    expect(session).toBeNull();
  });

  test('getCurrentSession - SSR 환경(isBrowser false)인 경우 null을 반환해야 함', async () => {
    (isBrowser.check as jest.Mock).mockReturnValue(false);
    const session = await service.getCurrentSession();
    expect(session).toBeNull();
  });

  test('getCurrentSession - 세션과 만료되지 않은 AccessToken이 존재하면 즉시 세션을 반환해야 함', async () => {
    const mockUser = { id: 'u-1', username: 'test@test.com', displayName: '홍길동', provider: 'local' };
    localStorage.setItem('scheduler_jwt_user', JSON.stringify(mockUser));
    localStorage.setItem('scheduler_jwt_refresh', 'refresh-token');

    // 만료 시각이 넉넉한 Access Token 가제작 (10분 유효)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
    const expTime = Math.floor(Date.now() / 1000) + 500; // 500초 남음
    const payload = Buffer.from(JSON.stringify({ exp: expTime })).toString('base64');
    const mockAccessToken = `${header}.${payload}.sig`;

    localStorage.setItem('scheduler_jwt_access', mockAccessToken);

    const session = await service.getCurrentSession();
    expect(session).toEqual(mockUser);
  });

  test('getCurrentSession - AccessToken이 유효하지만 거의 만료(30초 미만 남음)인 경우 자동 refresh토큰 흐름을 타야 함', async () => {
    const mockUser = { id: 'u-1', username: 'test@test.com', displayName: '홍길동', provider: 'local' };
    localStorage.setItem('scheduler_jwt_user', JSON.stringify(mockUser));
    localStorage.setItem('scheduler_jwt_refresh', 'refresh-token');

    // 거의 만료된 토큰 생성 (5초 남음)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
    const expTime = Math.floor(Date.now() / 1000) + 5; 
    const payload = Buffer.from(JSON.stringify({ exp: expTime })).toString('base64');
    const mockAccessToken = `${header}.${payload}.sig`;
    localStorage.setItem('scheduler_jwt_access', mockAccessToken);

    // fetch 모킹 (refresh 성공)
    const updatedUser = { userId: 'u-1', username: 'test@test.com', displayName: '홍길동', provider: 'local' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'new-acc', refreshToken: 'new-ref', user: updatedUser })
    });

    const session = await service.getCurrentSession();
    expect(session?.username).toBe('test@test.com');
    expect(localStorage.getItem('scheduler_jwt_access')).toBe('new-acc');
  });

  test('getCurrentSession - AccessToken이 존재하지 않는 경우 RefreshToken을 통한 자동 갱신 시도 성공', async () => {
    const mockUser = { id: 'u-1', username: 'test@test.com', displayName: '홍길동', provider: 'local' };
    localStorage.setItem('scheduler_jwt_user', JSON.stringify(mockUser));
    localStorage.setItem('scheduler_jwt_refresh', 'refresh-token');

    const updatedUser = { userId: 'u-1', username: 'test@test.com', displayName: '홍길동', provider: 'local' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'new-acc', refreshToken: 'new-ref', user: updatedUser })
    });

    const session = await service.getCurrentSession();
    expect(session?.username).toBe('test@test.com');
    expect(localStorage.getItem('scheduler_jwt_access')).toBe('new-acc');
  });

  test('getCurrentSession - 갱신 실패 시 세션을 모두 클리어하고 null을 반환해야 함', async () => {
    localStorage.setItem('scheduler_jwt_user', JSON.stringify({ id: 'u-1' }));
    localStorage.setItem('scheduler_jwt_refresh', 'refresh-token');

    // refresh 실패 응답
    mockFetch.mockResolvedValue({ ok: false });

    const session = await service.getCurrentSession();
    expect(session).toBeNull();
    expect(localStorage.getItem('scheduler_jwt_user')).toBeNull();
  });

  test('getCurrentSession - JSON 파싱 실패 등 예외 발생 시 refresh를 시도하여 성공하면 복구해야 함', async () => {
    localStorage.setItem('scheduler_jwt_user', 'invalid-json');
    localStorage.setItem('scheduler_jwt_refresh', 'refresh-token');

    const updatedUser = { userId: 'u-2', username: 'recovered@test.com', displayName: '복구', provider: 'local' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'new-acc', refreshToken: 'new-ref', user: updatedUser })
    });

    const session = await service.getCurrentSession();
    expect(session?.username).toBe('recovered@test.com');
  });

  test('getCurrentSession - JSON 파싱 예외 발생 시 refresh 마저 실패하면 null을 리턴해야 함', async () => {
    localStorage.setItem('scheduler_jwt_user', 'invalid-json');
    localStorage.setItem('scheduler_jwt_refresh', 'refresh-token');

    mockFetch.mockResolvedValue({ ok: false });

    const session = await service.getCurrentSession();
    expect(session).toBeNull();
  });

  test('register - 성공 시 신규 토큰 한 쌍을 받아 로컬 스토리지에 저장하고 세션을 반환해야 함', async () => {
    const mockUserResponse = { id: 'new-u', username: 'reg@test.com', displayName: '가입자', provider: 'local', createdAt: '2026-05-20' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'acc-t', refreshToken: 'ref-t', user: mockUserResponse })
    });

    const session = await service.register({ username: 'reg@test.com', password: '123', displayName: '가입자' });
    expect(session.id).toBe('new-u');
    expect(localStorage.getItem('scheduler_jwt_access')).toBe('acc-t');
  });

  test('register - 실패 시 API 에러 메시지를 throw 해야 함', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: '아이디 중복' })
    });

    await expect(service.register({ username: '', displayName: '' })).rejects.toThrow('아이디 중복');
  });

  test('login - 성공 시 토큰 한 쌍을 저장하고 로그인 완료된 세션을 반환해야 함', async () => {
    const mockUserResponse = { id: 'u-1', username: 'login@test.com', displayName: '로그인남', provider: 'local', createdAt: '2026-05-20' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'acc-t', refreshToken: 'ref-t', user: mockUserResponse })
    });

    const session = await service.login({ username: 'login@test.com', password: '123' });
    expect(session.username).toBe('login@test.com');
    expect(localStorage.getItem('scheduler_jwt_access')).toBe('acc-t');
  });

  test('login - 실패 시 API 에러 메시지를 throw 해야 함', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: '비밀번호 불일치' })
    });

    await expect(service.login({ username: '', password: '' })).rejects.toThrow('비밀번호 불일치');
  });

  test('socialLogin - 제공자별 모의 소셜 로그인 JWT 및 세션을 즉시 제공해야 함', async () => {
    const gSession = await service.socialLogin('google');
    expect(gSession.provider).toBe('google');
    expect(gSession.displayName).toBe('구글 프리미엄 유저');
    expect(localStorage.getItem('scheduler_jwt_access')).toBeDefined();

    const kSession = await service.socialLogin('kakao');
    expect(kSession.provider).toBe('kakao');

    const nSession = await service.socialLogin('naver');
    expect(nSession.provider).toBe('naver');
  });

  test('logout - 모든 토큰 정보를 초기화해야 함', async () => {
    localStorage.setItem('scheduler_jwt_access', 'acc');
    localStorage.setItem('scheduler_jwt_refresh', 'ref');

    await service.logout();
    expect(service.getAccessToken()).toBeNull();
    expect(localStorage.getItem('scheduler_jwt_refresh')).toBeNull();
  });

  test('getAuthService 팩토리 테스트', () => {
    const s1 = getAuthService();
    const s2 = getAuthService();
    expect(s1).toBe(s2); // 싱글톤 보장 검증
  });
});
