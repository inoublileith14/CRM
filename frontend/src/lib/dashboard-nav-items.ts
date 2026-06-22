import {
  Building2,
  Briefcase,
  Home,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { MessageKey } from '@/lib/i18n/messages';

export type DashboardNavLink = {
  type: 'link';
  href: string;
  labelKey: MessageKey;
  icon: LucideIcon;
};

export type DashboardNavGroup = {
  type: 'group';
  labelKey: MessageKey;
  icon: LucideIcon;
  items: { href: string; labelKey: MessageKey; icon: LucideIcon }[];
  activePathPrefixes?: string[];
};

export type DashboardNavEntry = DashboardNavLink | DashboardNavGroup;

export const dashboardNavEntries: DashboardNavEntry[] = [
  {
    type: 'link',
    href: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
  },
  {
    type: 'group',
    labelKey: 'nav.ownersGroup',
    icon: Building2,
    activePathPrefixes: [
      '/dashboard/casas-alquiler/',
      '/dashboard/casas-venta/',
      '/dashboard/propietarios/',
    ],
    items: [
      {
        href: '/dashboard/casas-alquiler',
        labelKey: 'nav.rentals',
        icon: KeyRound,
      },
      {
        href: '/dashboard/casas-venta',
        labelKey: 'nav.sales',
        icon: Home,
      },
    ],
  },
  {
    type: 'group',
    labelKey: 'nav.clients',
    icon: Users,
    activePathPrefixes: ['/dashboard/clientes/'],
    items: [
      {
        href: '/dashboard/clientes-alquiler',
        labelKey: 'nav.rentalClients',
        icon: UsersRound,
      },
      {
        href: '/dashboard/clientes-venta',
        labelKey: 'nav.saleClients',
        icon: UsersRound,
      },
    ],
  },
  {
    type: 'link',
    href: '/dashboard/workers',
    labelKey: 'nav.workers',
    icon: Briefcase,
  },
  {
    type: 'link',
    href: '/dashboard/whatsapp',
    labelKey: 'nav.whatsapp',
    icon: MessageSquare,
  },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(href);
}

export function isNavGroupActive(
  pathname: string,
  items: { href: string }[],
  activePathPrefixes: string[] = [],
): boolean {
  if (items.some((item) => isNavItemActive(pathname, item.href))) {
    return true;
  }

  return activePathPrefixes.some((prefix) => pathname.startsWith(prefix));
}
