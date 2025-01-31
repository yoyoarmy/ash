'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, Settings, ClipboardList, History, GitPullRequest } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Define routes based on user role
  const getAuthorizedLinks = () => {
    if (!session?.user) return [];

    // If user is an ADVERTISER, only show leasing
    if (session.user.role === 'ADVERTISER') {
      return [
        {
          href: '/leasing',
          label: 'Solicitud',
          icon: ClipboardList,
        },
        {
          href: '/leasing/my-leases',
          label: 'Mis Solicitudes',
          icon: History,
        }
      ];
    }

    // For other roles (ADMIN, ASSOCIATE)
    const links = [
      {
        href: '/dashboard',
        label: 'Panel Principal',
        icon: LayoutDashboard,
        roles: ['ADMIN', 'ASSOCIATE']
      },
      {
        href: '/leasing',
        label: 'Solicitud',
        icon: ClipboardList,
        roles: ['ADMIN', 'ASSOCIATE']
      },
      {
        href: '/manage',
        label: 'Administrar',
        icon: Settings,
        roles: ['ADMIN', 'ASSOCIATE']
      },
      {
        href: '/leasing/history',
        label: 'Historial',
        icon: History,
        roles: ['ADMIN', 'ASSOCIATE']
      },
      {
        name: 'Pipeline',
        href: '/pipedrive',
        label: 'Pipeline',
        icon: GitPullRequest,
        roles: ['ADMIN', 'ASSOCIATE']
      }
    ];

    return links.filter(link => link.roles.includes(session.user.role));
  };

  const authorizedLinks = getAuthorizedLinks();

  return (
    <nav className="flex flex-col gap-4 p-4">
      {authorizedLinks.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg
              transition-colors duration-200
              ${isActive 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
} 