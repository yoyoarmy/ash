'use client';

import { SessionProvider } from 'next-auth/react';
import { MediaProvider } from '../contexts/MediaContext';
import { NotificationProvider } from '../contexts/NotificationContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MediaProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </MediaProvider>
    </SessionProvider>
  );
} 