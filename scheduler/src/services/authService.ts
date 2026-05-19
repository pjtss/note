import { UserSession, RegisterInput, LoginInput, SocialProvider } from '../types/auth';
import { supabase } from './supabaseClient';
import { isBrowser } from './scheduleService';

export interface IAuthService {
  getCurrentSession(): Promise<UserSession | null>;
  register(input: RegisterInput): Promise<UserSession>;
  login(input: LoginInput): Promise<UserSession>;
  socialLogin(provider: SocialProvider): Promise<UserSession>;
  logout(): Promise<void>;
}

// 1. LocalStorage 기반 모의 인증 서비스 구현 (프리미엄 로컬 Fallback 및 데모 플레이용)
export class LocalStorageAuthService implements IAuthService {
  private SESSION_KEY = 'scheduler_user_session';
  private USERS_KEY = 'scheduler_registered_users';

  private getRegisteredUsers(): RegisterInput[] {
    if (!isBrowser.check()) return [];
    const data = localStorage.getItem(this.USERS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveRegisteredUsers(users: RegisterInput[]) {
    if (!isBrowser.check()) return;
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  async getCurrentSession(): Promise<UserSession | null> {
    if (!isBrowser.check()) return null;
    const session = localStorage.getItem(this.SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }

  async register(input: RegisterInput): Promise<UserSession> {
    const users = this.getRegisteredUsers();
    
    // 이미 존재하는 유저명인지 중복 검사
    if (users.some(u => u.username === input.username)) {
      throw new Error('이미 등록된 아이디(이메일)입니다.');
    }

    const newUser: RegisterInput = {
      username: input.username,
      password: input.password || 'default-mock-pass',
      displayName: input.displayName,
      provider: input.provider || 'local'
    };

    users.push(newUser);
    this.saveRegisteredUsers(users);

    const session: UserSession = {
      id: crypto.randomUUID(),
      username: newUser.username,
      displayName: newUser.displayName,
      provider: newUser.provider || 'local',
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return session;
  }

  async login(input: LoginInput): Promise<UserSession> {
    const users = this.getRegisteredUsers();
    const user = users.find(u => u.username === input.username);

    if (!user || user.password !== input.password) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    const session: UserSession = {
      id: crypto.randomUUID(),
      username: user.username,
      displayName: user.displayName,
      provider: user.provider || 'local',
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return session;
  }

  async socialLogin(provider: SocialProvider): Promise<UserSession> {
    // 소셜 로그인 모의 인증 연출: 가상의 소셜 계정 생성 및 세션 부여
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

    const session: UserSession = {
      id: crypto.randomUUID(),
      username: socialUsernames[provider],
      displayName: socialNames[provider],
      provider: provider,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return session;
  }

  async logout(): Promise<void> {
    if (!isBrowser.check()) return;
    localStorage.removeItem(this.SESSION_KEY);
  }
}

// 2. Supabase 클라우드 SDK 기반 실시간 인증 서비스 구현
export class SupabaseAuthService implements IAuthService {
  async getCurrentSession(): Promise<UserSession | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session || !session.user) return null;

    return {
      id: session.user.id,
      username: session.user.email || 'supabase_user@unknown.com',
      displayName: session.user.user_metadata?.displayName || session.user.email?.split('@')[0] || '클라우드 멤버',
      provider: (session.user.app_metadata?.provider as any) || 'local',
      createdAt: session.user.created_at
    };
  }

  async register(input: RegisterInput): Promise<UserSession> {
    const { data, error } = await supabase.auth.signUp({
      email: input.username,
      password: input.password || 'default-supabase-pass',
      options: {
        data: {
          displayName: input.displayName
        }
      }
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('회원가입에 실패했습니다.');

    return {
      id: data.user.id,
      username: data.user.email || input.username,
      displayName: input.displayName,
      provider: 'local',
      createdAt: data.user.created_at
    };
  }

  async login(input: LoginInput): Promise<UserSession> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.username,
      password: input.password || ''
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('로그인에 실패했습니다.');

    return {
      id: data.user.id,
      username: data.user.email || input.username,
      displayName: data.user.user_metadata?.displayName || data.user.email?.split('@')[0] || '클라우드 멤버',
      provider: 'local',
      createdAt: data.user.created_at
    };
  }

  async socialLogin(provider: SocialProvider): Promise<UserSession> {
    // 실제 Supabase OAuth OAuth 3종 기동
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw new Error(error.message);

    // OAuth 리다이렉션을 거치므로 임시 세션 가데이터 반환
    return {
      id: 'oauth-pending',
      username: `${provider}_user@pending.com`,
      displayName: `${provider} 인증 진행 중`,
      provider: provider,
      createdAt: new Date().toISOString()
    };
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }
}

// 3. DI 팩토리 패턴 탑재
export function getAuthService(): IAuthService {
  if (isBrowser.check()) {
    const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const currentAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
    if (currentUrl && currentAnonKey) {
      return new SupabaseAuthService();
    }
  }
  return new LocalStorageAuthService();
}
