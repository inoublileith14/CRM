export const CLIENTE_TIPO_NOMINA_OPTIONS = [
  { value: 'contrato', label: 'Contrato' },
  { value: 'freelance', label: 'Freelance' },
] as const;

export type ClienteTipoNomina = (typeof CLIENTE_TIPO_NOMINA_OPTIONS)[number]['value'];

export function normalizeClienteTipoNomina(
  value: string | null | undefined,
): ClienteTipoNomina | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'contrato' || normalized === 'contract') return 'contrato';
  if (normalized === 'freelance' || normalized === 'autonomo' || normalized === 'autónomo') {
    return 'freelance';
  }
  return null;
}

export function getClienteTipoNominaLabel(
  value: string | null | undefined,
): string {
  const normalized = normalizeClienteTipoNomina(value);
  if (!normalized) return value?.trim() || '—';
  return (
    CLIENTE_TIPO_NOMINA_OPTIONS.find((option) => option.value === normalized)
      ?.label ?? value?.trim() ?? '—'
  );
}
