'use client';

import { CSSProperties, ReactNode } from 'react';
import { SheetColumnFilterMenu } from '@/components/SheetColumnFilterMenu';
import {
  ColumnFilterFieldType,
  ColumnFilterState,
  SortDirection,
} from '@/lib/table-column-filters';
import { formatTableHeaderLabel } from '@/lib/table-header-label';
import { TABLE_HEAD_PADDING, TABLE_HEAD_TEXT_CLASS } from '@/lib/excel-table-styles';

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
  style?: CSSProperties;
  labelClassName?: string;
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
  style,
  labelClassName = '',
  children,
}: TableColumnFilterHeadProps) {
  const styles = VARIANT_STYLES[variant];
  const isSlate = variant === 'slate';
  const isInherit = variant === 'inherit';

  const displayLabel = formatTableHeaderLabel(shortLabel ?? label);
  const titleLabel = formatTableHeaderLabel(label);

  return (
    <th
      style={style}
      className={`${
        isInherit ? '' : `whitespace-nowrap ${TABLE_HEAD_PADDING} ${TABLE_HEAD_TEXT_CLASS}`
      } ${
        isFilterActive || (isSortColumn && sortDirection)
          ? styles.thActive
          : styles.th
      } ${className}`}
    >
      <span
        className={`inline-flex items-center justify-center gap-1 ${shortLabel ? 'max-w-[5.5rem]' : 'max-w-[12rem]'}`}
      >
        {children ?? (
          <span
            className={`truncate ${labelClassName}`.trim()}
            title={titleLabel}
          >
            {displayLabel}
          </span>
        )}
        <SheetColumnFilterMenu
          columnLabel={titleLabel}
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
