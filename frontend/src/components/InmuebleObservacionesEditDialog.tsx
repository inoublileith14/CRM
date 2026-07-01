'use client';

import {
  CoconutBrandedDialog,
  CoconutBrandedDialogActions,
  CoconutBrandedDialogCancelButton,
  CoconutBrandedDialogPrimaryButton,
  COCONUT_DIALOG_INPUT_CLASS,
} from '@/components/CoconutBrandedDialog';

interface InmuebleObservacionesEditDialogProps {
  open: boolean;
  title: string;
  subtitle: string;
  value: string;
  saving?: boolean;
  readOnly?: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function InmuebleObservacionesEditDialog({
  open,
  title,
  subtitle,
  value,
  saving,
  readOnly,
  onChange,
  onSave,
  onClose,
}: InmuebleObservacionesEditDialogProps) {
  return (
    <CoconutBrandedDialog
      open={open}
      onClose={onClose}
      blockClose={saving}
      title={title}
      subtitle={subtitle}
      titleId="observaciones-edit-title"
      size="sm"
    >
      <textarea
        value={value}
        disabled={saving || readOnly}
        readOnly={readOnly}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Escribe aquí…"
        className={`${COCONUT_DIALOG_INPUT_CLASS} resize-y text-center leading-relaxed`}
      />

      <CoconutBrandedDialogActions>
        <CoconutBrandedDialogCancelButton onClick={onClose} disabled={saving}>
          {readOnly ? 'Cerrar' : 'Volver'}
        </CoconutBrandedDialogCancelButton>
        {!readOnly ? (
          <CoconutBrandedDialogPrimaryButton
            onClick={onSave}
            disabled={saving}
            loading={saving}
          >
            Guardar
          </CoconutBrandedDialogPrimaryButton>
        ) : null}
      </CoconutBrandedDialogActions>
    </CoconutBrandedDialog>
  );
}
