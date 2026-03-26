"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#16161e] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent mb-4">
          500
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          An unexpected error occurred. We&apos;ve been notified and are working on a fix.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="px-6 py-2.5 bg-[#1e1e2e] border border-[#2e2e3e] hover:bg-[#2e2e3e] text-white font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
