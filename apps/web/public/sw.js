/* eslint-disable no-restricted-globals */
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;
  const data = event.data.json();
  const title = data?.title ?? "Remind.me";
  const options = {
    body: data?.body ?? "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data?.tag ?? "remind-me",
    data: data?.url ? { url: data.url } : {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0 && clientList[0].url) {
        clientList[0].focus();
        clientList[0].navigate(url);
      } else if (self.clients.openWindow) {
        self.clients.openWindow(url);
      }
    })
  );
});
