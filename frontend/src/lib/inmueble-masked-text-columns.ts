import { InmuebleFormData } from '@/types/inmueble';

export const INMUEBLE_MASKED_TEXT_FIELDS = {
  observaciones: {
    shortLabel: 'OBSERVACIONES',
    label: 'Observaciones',
    visibilityEntity: 'las observaciones',
    saveError: 'No se pudieron guardar las observaciones',
  },
  requisitos_propietario: {
    shortLabel: 'REQ. PROPI.',
    label: 'Requisitos del propietario',
    visibilityEntity: 'los requisitos del propietario',
    saveError: 'No se pudieron guardar los requisitos del propietario',
  },
} as const;

export type InmuebleMaskedTextFieldKey = keyof typeof INMUEBLE_MASKED_TEXT_FIELDS;

export const INMUEBLE_MASKED_TEXT_FIELD_KEYS = Object.keys(
  INMUEBLE_MASKED_TEXT_FIELDS,
) as InmuebleMaskedTextFieldKey[];

export function isInmuebleMaskedTextFieldKey(
  key: keyof InmuebleFormData,
): key is InmuebleMaskedTextFieldKey {
  return key in INMUEBLE_MASKED_TEXT_FIELDS;
}

export const DEFAULT_MASKED_TEXT_ALL_VISIBLE: Record<
  InmuebleMaskedTextFieldKey,
  boolean
> = {
  observaciones: false,
  requisitos_propietario: false,
};

export const DEFAULT_MASKED_TEXT_ROW_OVERRIDES: Record<
  InmuebleMaskedTextFieldKey,
  Record<string, boolean>
> = {
  observaciones: {},
  requisitos_propietario: {},
};
