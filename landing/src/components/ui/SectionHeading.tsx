import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  id?: string;
  dark?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  id,
  dark = false,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('mx-auto max-w-3xl text-center', className)}>
      {id ? (
        <h2
          id={id}
          className={cn(
            'text-3xl font-bold tracking-tight sm:text-4xl',
            dark ? 'text-white' : 'text-slate-900',
          )}
        >
          {title}
        </h2>
      ) : (
        <h2
          className={cn(
            'text-3xl font-bold tracking-tight sm:text-4xl',
            dark ? 'text-white' : 'text-slate-900',
          )}
        >
          {title}
        </h2>
      )}
      {subtitle ? (
        <p
          className={cn(
            'mt-4 text-lg',
            dark ? 'text-slate-300' : 'text-slate-600',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
