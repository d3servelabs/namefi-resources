import { useEffect } from 'react';
import { toast } from 'sonner';

export const usePendingToast = (
  pending: boolean | undefined,
  message: string,
) => {
  useEffect(() => {
    let toastId: string | number | undefined;
    if (pending) {
      toastId = toast.loading(message);
    }
    return () => {
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [pending, message]);
};
