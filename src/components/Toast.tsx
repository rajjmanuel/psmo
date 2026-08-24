"use client";

import Swal from "sweetalert2";

type ToastType = "success" | "error" | "info" | "warning";

const AUTO_DISMISS_MS: Record<ToastType, number> = {
  success: 2600,
  info: 3500,
  warning: 4200,
  error: 5200,
};

export function useToast() {
  const show = (type: ToastType, title: string, message?: string) => {
    // Replace any alert already on screen so they never stack up.
    if (Swal.isVisible()) {
      Swal.close();
    }

    Swal.fire({
      icon: type,
      title: title,
      text: message,
      width: 380,
      padding: "1.25rem",
      // Auto-dismiss: disappears on its own even without clicking OK/Exit.
      timer: AUTO_DISMISS_MS[type],
      timerProgressBar: true,
      showConfirmButton: false,
      customClass: {
        popup: "rounded-2xl shadow-2xl border border-[var(--line)]",
        title: "font-display text-lg font-bold text-[var(--ink)]",
        htmlContainer: "text-sm text-[var(--muted)] leading-relaxed",
        timerProgressBar: "h-1 rounded-full",
      },
    });
  };

  return {
    show,
    success: (title: string, message?: string) => show("success", title, message),
    error: (title: string, message?: string) => show("error", title, message),
    info: (title: string, message?: string) => show("info", title, message),
    warning: (title: string, message?: string) => show("warning", title, message),
  };
}
