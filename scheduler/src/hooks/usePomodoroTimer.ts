"use client";

import { useState, useEffect } from 'react';

export function usePomodoroTimer() {
  const [pomodoroSeconds, setPomodoroSeconds] = useState(1500); // 25분 기본
  const [pomodoroIsRunning, setPomodoroIsRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');
  const [pomodoroCustomFocus, setPomodoroCustomFocus] = useState(25);
  const [pomodoroCustomBreak, setPomodoroCustomBreak] = useState(5);
  const [showPomodoroWidget, setShowPomodoroWidget] = useState(false);

  // 뽀모도로 타이머 로직 이펙트
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pomodoroIsRunning && pomodoroSeconds > 0) {
      timer = setInterval(() => {
        setPomodoroSeconds((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroIsRunning && pomodoroSeconds === 0) {
      const nextMode = pomodoroMode === 'focus' ? 'break' : 'focus';
      const bodyText = nextMode === 'focus' 
        ? '휴식 시간이 완료되었습니다! 다시 집중에 집중해 보세요.' 
        : '집중 시간이 완료되었습니다! 5분간 편안히 휴식을 취하세요.';

      if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(`🍅 뽀모도로 타이머 - ${pomodoroMode === 'focus' ? '집중 완료!' : '휴식 완료!'}`, {
            body: bodyText,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'pomodoro-alert',
            renotify: true
          } as any);
        });
      }

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.8);
      } catch (e) {
        // AudioContext 미지원 브라우저 대응
      }

      alert(`🍅 뽀모도로 타이머: ${pomodoroMode === 'focus' ? '집중 완료!' : '휴식 완료!'}\n${bodyText}`);

      setPomodoroMode(nextMode);
      setPomodoroSeconds(nextMode === 'focus' ? pomodoroCustomFocus * 60 : pomodoroCustomBreak * 60);
      setPomodoroIsRunning(false);
    }
    return () => clearInterval(timer);
  }, [pomodoroIsRunning, pomodoroSeconds, pomodoroMode, pomodoroCustomFocus, pomodoroCustomBreak]);

  return {
    pomodoroSeconds,
    setPomodoroSeconds,
    pomodoroIsRunning,
    setPomodoroIsRunning,
    pomodoroMode,
    setPomodoroMode,
    pomodoroCustomFocus,
    setPomodoroCustomFocus,
    pomodoroCustomBreak,
    setPomodoroCustomBreak,
    showPomodoroWidget,
    setShowPomodoroWidget
  };
}
