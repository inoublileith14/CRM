'use client';

import { getInitials } from '@/lib/avatar';

type UserAvatarSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<UserAvatarSize, string> = {
  sm: 'h-10 w-10 text-sm ring-2',
  md: 'h-16 w-16 text-xl ring-2',
  lg: 'h-24 w-24 text-2xl ring-4',
};

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
}

export function UserAvatar({
  name,
  avatarUrl,
  size = 'sm',
  className = '',
}: UserAvatarProps) {
  const initials = getInitials(name);
  const base = `relative shrink-0 overflow-hidden rounded-full bg-emerald-600 font-bold text-white ring-emerald-100 ${sizeClasses[size]} ${className}`;

  if (avatarUrl) {
    return (
      <div className={base}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${base}`}>{initials}</div>
  );
}
