import { Loader2 } from 'lucide-react';

export function QueryRefreshingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-inherit">
      <Loader2 className="h-3 w-3 animate-spin" />
      Actualizando…
    </span>
  );
}
