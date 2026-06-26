import { cn } from '@/lib/utils';
import { FeatureStatus, statusLabels } from '@/lib/copy';

interface StatusBadgeProps {
  status: FeatureStatus;
  className?: string;
}

const styles: Record<FeatureStatus, string> = {
  available: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-blue-100 text-blue-800',
  roadmap: 'bg-amber-100 text-amber-800',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
