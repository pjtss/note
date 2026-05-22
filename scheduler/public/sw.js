// Service Worker for Antigravity Note Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 알림 클릭 이벤트 핸들링 (기존 탭 포커스 또는 새 탭 열기)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // 알림 클릭 시 우리 앱으로 브라우저를 자동 이동시키는 포커스 라우터
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 켜진 탭이 있다면 포커스
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // 없다면 새 창 열기
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
