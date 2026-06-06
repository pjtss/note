export type SocialProvider = 'google' | 'kakao' | 'naver';

export interface UserSession {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  provider: 'local' | SocialProvider;
  createdAt: string;
  pushEnabled: boolean;
}

export interface RegisterInput {
  username: string;
  password?: string;
  displayName: string;
  provider?: 'local' | SocialProvider;
}

export interface LoginInput {
  username: string;
  password?: string;
}
