"use client";

import { useState } from 'react';

type UseAuthFormProps = {
  signUpUser: (data: any, rememberMe: boolean) => Promise<any>;
  signInUser: (data: any, rememberMe: boolean) => Promise<any>;
  setAuthError: (error: string | null) => void;
};

export function useAuthForm({
  signUpUser,
  signInUser,
  setAuthError
}: UseAuthFormProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authUsername.trim() || !authPassword.trim()) return;

    try {
      if (authMode === 'register') {
        if (!authDisplayName.trim()) {
          setAuthError('이름(닉네임)을 입력해 주세요.');
          return;
        }
        await signUpUser({
          username: authUsername,
          password: authPassword,
          displayName: authDisplayName
        }, rememberMe);
      } else {
        await signInUser({
          username: authUsername,
          password: authPassword
        }, rememberMe);
      }
      // 성공 시 입력 필드 비우기
      setAuthUsername('');
      setAuthPassword('');
      setAuthDisplayName('');
    } catch (err: any) {
      // 에러는 useAuth 훅 내부에서 처리되거나 setAuthError 상태를 통해 렌더링됩니다.
    }
  };

  return {
    authMode,
    setAuthMode,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    authDisplayName,
    setAuthDisplayName,
    rememberMe,
    setRememberMe,
    handleAuthSubmit
  };
}
