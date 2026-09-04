import React from 'react';
import { ConfirmDialog } from '../feedback/ConfirmDialog';

export interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onDiscard: () => void;
  onKeepEditing: () => void;
  title?: string;
  message?: string;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onDiscard,
  onKeepEditing,
  title = 'Unsaved Changes',
  message = 'You have unsaved changes. Leaving this page will discard all edits made. Are you sure you want to proceed?',
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onKeepEditing}
      onConfirm={onDiscard}
      title={title}
      message={message}
      confirmLabel="Discard & Leave"
      cancelLabel="Keep Editing"
      variant="danger"
    />
  );
};
