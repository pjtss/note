import { UserSession, RegisterInput, LoginInput, SocialProvider } from '../types/auth';
import { isBrowser } from './scheduleService';

export interface IAuthService {
  getCurrentSession(): Promise<UserSession | null>;
  register(input: RegisterInput): Promise<UserSession>;
  login(input: LoginInput): Promise<UserSession>;
  socialLogin(provider: SocialProvider): Promise<UserSession>;
  logout(): Promise<void>;
  getAccessToken(): string | null;
}

// 1. JWT 기반 기기 범용 영구 유지 인증 서비스 구현 (웹/모바일 크로스 플랫폼 최적화)
export class JwtAuthService implements IAuthService {
  private ACCESS_TOKEN_KEY = 'scheduler_jwt_access';
  private REFRESH_TOKEN_KEY = 'scheduler_jwt_refresh'; // 기기 영구 보관용
  private USER_SESSION_KEY = 'scheduler_jwt_user';

  private currentAccessToken: string | null = null;

  getAccessToken(): string | null {
    if (!this.currentAccessToken && isBrowser.check()) {
      this.currentAccessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return this.currentAccessToken;
  }

  private saveTokens(accessToken: string, refreshToken: string, user: UserSession) {
    if (!isBrowser.check()) return;
    this.currentAccessToken = accessToken;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken); // 기기(localStorage) 보관 규정 수호
    localStorage.setItem(this.USER_SESSION_KEY, JSON.stringify(user));
  }

  private clearTokens() {
    if (!isBrowser.check()) return;
    this.currentAccessToken = null;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_SESSION_KEY);
  }

  /**
   * 세션 및 토큰 검증 + 만료 시 자동 토큰 갱신 파이프라인 (RTR)
   */
  async getCurrentSession(): Promise<UserSession | null> {
    if (!isBrowser.check()) return null;

    const savedUser = localStorage.getItem(this.USER_SESSION_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (!savedUser || !refreshToken) {
      this.clearTokens();
      return null;
    }

    try {
      const userObj = JSON.parse(savedUser);
      // AccessToken이 있나 확인
      const accessToken = this.getAccessToken();

      if (!accessToken) {
        // AccessToken이 없으면 기기 내 RefreshToken을 통해 자동 갱신(RTR) 시도
        return await this.refreshTokensFlow(refreshToken);
      }

      // 토큰 페이로드 만료 여부 가검사 (10분 만료 여부)
      const base64Payload = accessToken.split('.')[1];
      if (base64Payload) {
        const decoded = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
        const now = Math.floor(Date.now() / 1000);
        // 만료되기 30초 전이거나 만료되었다면 사전에 조용히 갱신 처리
        if (decoded.exp - now < 30) {
          return await this.refreshTokensFlow(refreshToken);
        }
      }

      return userObj;
    } catch {
      // 파싱 실패 또는 만료 시 리프레시 재시도
      if (refreshToken) {
        try {
          return await this.refreshTokensFlow(refreshToken);
        } catch {
          this.clearTokens();
          return null;
        }
      }
      this.clearTokens();
      return null;
    }
  }

  /**
   * 리프레시 토큰 로테이션(RTR) 서버 타격 갱신
   */
  private async refreshTokensFlow(refreshToken: string): Promise<UserSession> {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) {
      throw new Error('인증 세션이 만료되었습니다. 다시 로그인해주세요.');
    }

    const data = await res.json();
    const newUserSession: UserSession = {
      id: data.user.userId,
      username: data.user.username,
      displayName: data.user.displayName,
      provider: data.user.provider || 'local',
      createdAt: new Date().toISOString()
    };

    this.saveTokens(data.accessToken, data.refreshToken, newUserSession);
    return newUserSession;
  }

  async register(input: RegisterInput): Promise<UserSession> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '회원가입 중 오류가 발생했습니다.');
    }

    const userSession: UserSession = {
      id: data.user.id,
      username: data.user.username,
      displayName: data.user.displayName,
      provider: data.user.provider,
      createdAt: data.user.createdAt
    };

    this.saveTokens(data.accessToken, data.refreshToken, userSession);
    return userSession;
  }

  async login(input: LoginInput): Promise<UserSession> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '로그인 중 오류가 발생했습니다.');
    }

    const userSession: UserSession = {
      id: data.user.id,
      username: data.user.username,
      displayName: data.user.displayName,
      provider: data.user.provider,
      createdAt: data.user.createdAt
    };

    this.saveTokens(data.accessToken, data.refreshToken, userSession);
    return userSession;
  }

  async socialLogin(provider: SocialProvider): Promise<UserSession> {
    // 소셜 로그인 모의 인증: 클라이언트 사이드 가상 모의 세션 즉시 제공 및 JWT 발급
    const socialUsernames: Record<SocialProvider, string> = {
      google: 'google_user@gmail.com',
      kakao: 'kakao_friend@kakao.com',
      naver: 'naver_member@naver.com'
    };

    const socialNames: Record<SocialProvider, string> = {
      google: '구글 프리미엄 유저',
      kakao: '카카오 라이언',
      naver: '네이버 그린멤버'
    };

    // 로컬 모의 JWT 발급 요청 API 대체 연산
    const mockUser: UserSession = {
      id: crypto.randomUUID(),
      username: socialUsernames[provider],
      displayName: socialNames[provider],
      provider: provider,
      createdAt: new Date().toISOString()
    };

    // 모의 테스트 및 로컬 가가동을 위해 임시 JWT 토큰 듀오를 로컬 상에서 직접 가제작하여 저장
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const mockPayload = {
      userId: mockUser.id,
      username: mockUser.username,
      displayName: mockUser.displayName,
      provider: mockUser.provider,
      exp: Math.floor(Date.now() / 1000) + 10 * 60
    };
    const payload = Buffer.from(JSON.stringify(mockPayload)).toString('base64');
    const mockAccessToken = `${header}.${payload}.mock-sig`;
    const mockRefreshToken = `${header}.${payload}.mock-refresh-sig`;

    this.saveTokens(mockAccessToken, mockRefreshToken, mockUser);
    return mockUser;
  }

  async logout(): Promise<void> {
    this.clearTokens();
  }
}

// 2. DI 팩토리 엔진
let authServiceInstance: IAuthService | null = null;

export function getAuthService(): IAuthService {
  if (!authServiceInstance) {
    authServiceInstance = new JwtAuthService();
  }
  return authServiceInstance;
}
