import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface UseUnsavedChangesReturn {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  guardedNavigate: (to: string) => void;
}

export function useUnsavedChanges(initialDirty = false): UseUnsavedChangesReturn {
  const [isDirty, setIsDirty] = useState<boolean>(initialDirty);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const navigate = useNavigate();

  // Browser refresh/close tab confirmation
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  const guardedNavigate = useCallback(
    (to: string) => {
      if (isDirty) {
        setPendingNavigation(to);
        setShowDialog(true);
      } else {
        navigate(to);
      }
    },
    [isDirty, navigate]
  );

  const confirmNavigation = useCallback(() => {
    setShowDialog(false);
    setIsDirty(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, navigate]);

  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  return {
    isDirty,
    setIsDirty,
    showDialog,
    setShowDialog,
    confirmNavigation,
    cancelNavigation,
    guardedNavigate,
  };
}
