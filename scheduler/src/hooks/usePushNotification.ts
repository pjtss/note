"use client";

import { useState, useEffect } from 'react';
import { Schedule } from '../types/schedule';
import { UserSession } from '../types/auth';

export function usePushNotification(
  schedules: Schedule[],
  user: UserSession | null,
  mounted: boolean
) {
  // 이미 알림이 전송된 일정 ID 캐시
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);

  // 서비스 워커 등록 및 알림 권한 획득 처리
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('서비스 워커 등록 성공:', reg.scope);
        })
        .catch((err) => {
          console.error('서비스 워커 등록 실패:', err);
        });

      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          console.log('브라우저 알림 권한 부여 결과:', permission);
        });
      }
    }
  }, []);

  // 알림 캐시 데이터 복원
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotified = localStorage.getItem('notified_schedule_ids');
      if (savedNotified) {
        try {
          setNotifiedIds(JSON.parse(savedNotified));
        } catch (e) {
          // 복구 실패 무시
        }
      }
    }
  }, []);

  // 알림 감시 데몬 폴링
  useEffect(() => {
    if (!mounted || !user) return;
    if (!user.pushEnabled) return; // 글로벌 알림 수신 거부 설정 감지 시 바이패스

    const checkSchedulesForPush = () => {
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const nowYear = now.getFullYear();
      const nowMonth = now.getMonth();
      const nowDate = now.getDate();
      const nowHours = now.getHours();
      const nowMinutes = now.getMinutes();

      schedules.forEach((schedule) => {
        if (notifiedIds.includes(schedule.id) || schedule.isCompleted) return;

        const startTimeStr = schedule.startTime;
        if (!startTimeStr) return;

        const schedTime = new Date(startTimeStr);
        if (isNaN(schedTime.getTime())) return;

        const schedYear = schedTime.getFullYear();
        const schedMonth = schedTime.getMonth();
        const schedDate = schedTime.getDate();
        const schedHours = schedTime.getHours();
        const schedMinutes = schedTime.getMinutes();

        const isTimeMatch = 
          nowYear === schedYear &&
          nowMonth === schedMonth &&
          nowDate === schedDate &&
          nowHours === schedHours &&
          nowMinutes === schedMinutes;

        if (isTimeMatch) {
          navigator.serviceWorker.ready.then((registration) => {
            const importanceEmoji = schedule.category === 'Important' ? '🚨 [중요 일정] ' : '📅 ';
            const timeStr = schedule.hasTime ? schedule.startTime.replace('T', ' ').slice(0, 16) : '하루 종일';
            registration.showNotification(`${importanceEmoji}Antigravity 스케줄 알림`, {
              body: `"${schedule.title}" 일정이 지금 시작되었습니다!\n⏰ 시간: ${timeStr}`,
              icon: '/logo.png',
              badge: '/logo.png',
              vibrate: [200, 100, 200],
              tag: `sched-${schedule.id}`,
              renotify: true,
              data: { scheduleId: schedule.id }
            } as any);
          });

          const updatedNotified = [...notifiedIds, schedule.id];
          setNotifiedIds(updatedNotified);
          localStorage.setItem('notified_schedule_ids', JSON.stringify(updatedNotified));
        }
      });
    };

    checkSchedulesForPush();
    const intervalId = setInterval(checkSchedulesForPush, 30000);

    return () => clearInterval(intervalId);
  }, [mounted, user, schedules, notifiedIds]);

  return {
    notifiedIds,
    setNotifiedIds
  };
}
