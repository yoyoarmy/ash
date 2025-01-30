'use client';

import React, { createContext, useContext, useState } from 'react';

type Notification = {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
};

type NotificationContextType = {
  notifications: Notification[];
  addNotification: (message: string) => void;
  markAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
  unreadCount: number;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Translation map for common notification messages
const notificationTranslations: { [key: string]: string } = {
  'Lease successfully created': 'Solicitud creada exitosamente',
  'Failed to create lease': 'Error al crear la solicitud',
  'Lease successfully revoked': 'Solicitud revocada exitosamente',
  'Failed to revoke lease': 'Error al revocar la solicitud',
  'Store updated successfully': 'Tienda actualizada exitosamente',
  'Failed to update store': 'Error al actualizar la tienda',
  'Media space updated': 'Espacio publicitario actualizado',
  'Failed to update media space': 'Error al actualizar el espacio publicitario'
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string) => {
    const translatedMessage = notificationTranslations[message] || message;
    const newNotification = {
      id: Date.now().toString(),
      message: translatedMessage,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        clearNotification,
        unreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 