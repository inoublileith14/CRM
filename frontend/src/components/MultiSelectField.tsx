'use client';

interface MultiSelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface MultiSelectFieldProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  emptyMessage?: string;
}

export function MultiSelectField({
  label,
  options,
  selected,
  onChange,
  disabled = false,
  emptyMessage = 'No hay opciones disponibles',
}: MultiSelectFieldProps) {
  function toggle(id: string) {
    if (disabled) return;
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
          {label}
        </label>
        {selected.length > 0 && (
          <span className="text-xs text-emerald-600">
            {selected.length} seleccionado{selected.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {options.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
          {options.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 transition ${
                  isSelected
                    ? 'bg-emerald-50 ring-1 ring-emerald-200'
                    : 'hover:bg-slate-50'
                } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(option.id)}
                  disabled={disabled}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900">
                    {option.label}
                  </span>
                  {option.sublabel && (
                    <span className="block truncate text-xs text-slate-500">
                      {option.sublabel}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
