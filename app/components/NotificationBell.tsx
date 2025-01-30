'use client';

import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { format } from 'date-fns';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, clearNotification } = useNotifications();

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Notificaciones</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500">No hay notificaciones</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg ${
                      notif.read ? 'bg-gray-50' : 'bg-blue-50'
                    }`}
                    onClick={() => handleNotificationClick(notif.id)}
                  >
                    <p className="text-sm">{notif.message}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {format(notif.timestamp, 'MMM d, h:mm a')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notif.id);
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 