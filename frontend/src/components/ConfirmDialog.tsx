'use client';

import {
  CoconutBrandedDialog,
  CoconutBrandedDialogActions,
  CoconutBrandedDialogCancelButton,
  CoconutBrandedDialogPrimaryButton,
  COCONUT_DIALOG_BODY_TEXT_CLASS,
  toneFromLegacyButtonClass,
} from '@/components/CoconutBrandedDialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmButtonClassName?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmButtonClassName = 'bg-blue-700 hover:bg-blue-600',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <CoconutBrandedDialog
      open={open}
      onClose={onCancel}
      blockClose={loading}
      title={title}
      subtitle="CONFIRMACIÓN"
      titleId="confirm-dialog-title"
      size="sm"
      zIndexClass="z-[200]"
    >
      <p className={`m-0 ${COCONUT_DIALOG_BODY_TEXT_CLASS}`}>{description}</p>

      <CoconutBrandedDialogActions>
        <CoconutBrandedDialogCancelButton onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </CoconutBrandedDialogCancelButton>
        <CoconutBrandedDialogPrimaryButton
          onClick={onConfirm}
          disabled={loading}
          loading={loading}
          tone={toneFromLegacyButtonClass(confirmButtonClassName)}
        >
          {confirmLabel}
        </CoconutBrandedDialogPrimaryButton>
      </CoconutBrandedDialogActions>
    </CoconutBrandedDialog>
  );
}
