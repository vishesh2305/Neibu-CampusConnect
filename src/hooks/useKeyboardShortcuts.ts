"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd/Ctrl + K = Global search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        router.push("/search");
      }

      // Escape = Close modals (handled by propagation, but also navigate back)
      if (e.key === "Escape") {
        // Close any open modal by dispatching custom event
        window.dispatchEvent(new CustomEvent("close-modal"));
      }

      // Cmd/Ctrl + Shift + N = New post (focus on dashboard)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
        e.preventDefault();
        router.push("/dashboard");
      }

      // Cmd/Ctrl + Shift + M = Messages
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "M") {
        e.preventDefault();
        router.push("/messages");
      }
    },
    [router]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Hook for closing modals on Escape
export function useEscapeClose(onClose: () => void) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleCustomClose = () => onClose();

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("close-modal", handleCustomClose);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("close-modal", handleCustomClose);
    };
  }, [onClose]);
}
