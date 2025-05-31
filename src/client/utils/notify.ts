import { useCallback } from "react";
import { toast } from "react-toastify";

export function useSuccess(message?: string) {
  return useCallback(() => {
    emitSuccess(message);
  }, []);
}

export function emitSuccess(message = "Success") {
  toast.success(message, { className: "success-toast" });
}
