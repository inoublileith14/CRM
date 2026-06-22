'use client';

import { ReactNode } from 'react';
import { SheetColumnFilterMenu } from '@/components/SheetColumnFilterMenu';
import {
  ColumnFilterFieldType,
  ColumnFilterState,
  SortDirection,
} from '@/lib/table-column-filters';

type HeadVariant = 'emerald' | 'slate' | 'inherit';

interface TableColumnFilterHeadProps {
  label: string;
  shortLabel?: string;
  fieldType: ColumnFilterFieldType;
  uniqueValues: string[];
  filter: ColumnFilterState | undefined;
  sortDirection: SortDirection | null;
  isSortColumn: boolean;
  isOpen: boolean;
  isFilterActive: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filter: ColumnFilterState | undefined) => void;
  onSort: (direction: SortDirection) => void;
  variant?: HeadVariant;
  className?: string;
  children?: ReactNode;
}

const VARIANT_STYLES: Record<
  HeadVariant,
  { th: string; thActive: string; sticky?: string }
> = {
  emerald: {
    th: 'bg-emerald-800',
    thActive: 'bg-emerald-900',
  },
  slate: {
    th: 'bg-slate-50 text-slate-600',
    thActive: 'bg-slate-100 text-slate-800',
  },
  inherit: {
    th: '',
    thActive: 'ring-1 ring-inset ring-white/35',
  },
};

export function TableColumnFilterHead({
  label,
  shortLabel,
  fieldType,
  uniqueValues,
  filter,
  sortDirection,
  isSortColumn,
  isOpen,
  isFilterActive,
  onOpenChange,
  onApply,
  onSort,
  variant = 'emerald',
  className = '',
  children,
}: TableColumnFilterHeadProps) {
  const styles = VARIANT_STYLES[variant];
  const isSlate = variant === 'slate';
  const isInherit = variant === 'inherit';

  const displayLabel = shortLabel ?? label;

  return (
    <th
      className={`${
        isInherit ? '' : 'whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide'
      } ${
        isFilterActive || (isSortColumn && sortDirection)
          ? styles.thActive
          : styles.th
      } ${className}`}
    >
      <span
        className={`inline-flex items-center gap-1 ${shortLabel ? 'max-w-[5.5rem]' : 'max-w-[12rem]'}`}
      >
        {children ?? (
          <span className="truncate" title={label}>
            {displayLabel}
          </span>
        )}
        <SheetColumnFilterMenu
          columnLabel={label}
          fieldType={fieldType}
          uniqueValues={uniqueValues}
          filter={filter}
          sortDirection={sortDirection}
          isSortColumn={isSortColumn}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          onApply={onApply}
          onSort={onSort}
          iconClassName={
            isInherit
              ? isFilterActive || (isSortColumn && sortDirection)
                ? 'text-yellow-300'
                : 'text-white/70 hover:text-white'
              : isSlate
              ? isFilterActive || (isSortColumn && sortDirection)
                ? 'text-emerald-600'
                : 'text-slate-400'
              : undefined
          }
        />
      </span>
    </th>
  );
}
