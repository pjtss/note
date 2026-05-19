export type SocialProvider = 'google' | 'kakao' | 'naver';

export interface UserSession {
  id: string;
  username: string;
  displayName: string;
  provider: 'local' | SocialProvider;
  createdAt: string;
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
