'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { LoadingAnimation } from './LoadingAnimation';

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <LoadingAnimation />;
  }

  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    redirect('/leasing');
  }

  return <>{children}</>;
} 