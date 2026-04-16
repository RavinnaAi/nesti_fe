"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import NotificationDetailModal from "@/components/notifications/NotificationDetailModal";

const NotificationsUiContext = createContext(null);

export function NotificationsUiProvider({ children }) {
  const [detailNotification, setDetailNotification] = useState(null);

  const openNotificationDetail = useCallback((notification) => {
    if (notification) setDetailNotification(notification);
  }, []);

  const closeNotificationDetail = useCallback(() => setDetailNotification(null), []);

  const value = useMemo(
    () => ({
      detailNotification,
      openNotificationDetail,
      closeNotificationDetail,
    }),
    [detailNotification, openNotificationDetail, closeNotificationDetail],
  );

  return (
    <NotificationsUiContext.Provider value={value}>
      {children}
      <NotificationDetailModal notification={detailNotification} onClose={closeNotificationDetail} />
    </NotificationsUiContext.Provider>
  );
}

export function useNotificationsUi() {
  const ctx = useContext(NotificationsUiContext);
  if (!ctx) {
    throw new Error("useNotificationsUi must be used within NotificationsUiProvider");
  }
  return ctx;
}
