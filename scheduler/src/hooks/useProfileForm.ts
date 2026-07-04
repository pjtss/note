"use client";

import { useState, useEffect } from 'react';
import { UserSession } from '../types/auth';

type UseProfileFormProps = {
  user: UserSession | null;
  updateProfile: (displayName: string, currentPassword?: string, newPassword?: string, pushEnabled?: boolean) => Promise<any>;
  deleteAccount: () => Promise<any>;
  showToast: (message: string) => void;
};

export function useProfileForm({
  user,
  updateProfile,
  deleteAccount,
  showToast
}: UseProfileFormProps) {
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileNewPasswordConfirm, setProfileNewPasswordConfirm] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);

  // 세션 로드 시 프로필 닉네임 상태 동기화
  useEffect(() => {
    if (user) {
      setProfileDisplayName(user.displayName || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!profileDisplayName.trim()) {
      setProfileError('닉네임을 입력해 주세요.');
      return;
    }

    const isLocal = user?.provider === 'local';
    let currentPwd = '';
    let newPwd = '';

    if (isLocal && (profileCurrentPassword || profileNewPassword || profileNewPasswordConfirm)) {
      if (!profileCurrentPassword) {
        setProfileError('현재 비밀번호를 입력해야 비밀번호를 변경할 수 있습니다.');
        return;
      }
      if (!profileNewPassword) {
        setProfileError('새로운 비밀번호를 입력해 주세요.');
        return;
      }
      if (profileNewPassword.length < 4) {
        setProfileError('비밀번호는 최소 4자 이상이어야 합니다.');
        return;
      }
      if (profileNewPassword !== profileNewPasswordConfirm) {
        setProfileError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return;
      }
      currentPwd = profileCurrentPassword;
      newPwd = profileNewPassword;
    }

    try {
      await updateProfile(
        profileDisplayName.trim(),
        currentPwd || undefined,
        newPwd || undefined
      );
      setProfileSuccess('프로필이 성공적으로 수정되었습니다.');
      setProfileCurrentPassword('');
      setProfileNewPassword('');
      setProfileNewPasswordConfirm('');
      showToast('👤 프로필 수정 성공!');
    } catch (err: any) {
      setProfileError(err.message || '프로필 수정 중 오류가 발생했습니다.');
    }
  };

  const handleTogglePush = async () => {
    if (!user) return;
    try {
      await updateProfile(user.displayName || '', undefined, undefined, !user.pushEnabled);
      showToast(`📢 푸시 알림 수신이 ${!user.pushEnabled ? '활성화' : '비활성화'}되었습니다.`);
    } catch (err: any) {
      showToast('❌ 푸시 알림 설정 변경 실패');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setIsDeleteAccountModalOpen(false);
      showToast('👋 회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
    } catch (err: any) {
      showToast(`❌ 회원 탈퇴 실패: ${err.message}`);
    }
  };

  return {
    profileDisplayName,
    setProfileDisplayName,
    profileCurrentPassword,
    setProfileCurrentPassword,
    profileNewPassword,
    setProfileNewPassword,
    profileNewPasswordConfirm,
    setProfileNewPasswordConfirm,
    profileError,
    setProfileError,
    profileSuccess,
    setProfileSuccess,
    isDeleteAccountModalOpen,
    setIsDeleteAccountModalOpen,
    handleProfileSubmit,
    handleTogglePush,
    handleDeleteAccount
  };
}
