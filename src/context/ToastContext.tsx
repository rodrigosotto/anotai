import {
  createContext,
  useCallback,
  useContext,

  useState,
} from "react";

import { Toast } from "../components/ui/Toast";

export type ToastType = "success" | "error" | "info";

export interface ToastState {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: ToastState | null;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const hide = useCallback(() => {
    setToast(null);
  }, []);

  const show = useCallback((message: string, type: ToastType = "info") => {
    setToast({ id: Date.now().toString(), message, type });
  }, []);

  return (
    <ToastContext.Provider value={{ toast, show, hide }}>
      {children}
      <Toast toast={toast} onHide={hide} />
    </ToastContext.Provider>
  );
}

export function useToast(): Pick<ToastContextValue, "show" | "hide"> {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return { show: ctx.show, hide: ctx.hide };
}
