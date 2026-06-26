import { cn } from '@/lib/utils';

interface BrowserFrameProps {
  url?: string;
  children: React.ReactNode;
  className?: string;
}

export function BrowserFrame({
  url = 'app.cocount.es/dashboard/casas-alquiler',
  children,
  className,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-emerald-900/20',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="ml-3 flex-1 truncate rounded-md bg-slate-900 px-3 py-1 text-xs text-slate-400">
          {url}
        </div>
      </div>
      <div className="bg-white p-3 sm:p-4">{children}</div>
    </div>
  );
}
