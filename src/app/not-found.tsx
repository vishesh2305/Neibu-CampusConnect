import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#16161e] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold bg-gradient-to-r from-emerald-400 to-violet-400 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 bg-[#1e1e2e] border border-[#2e2e3e] hover:bg-[#2e2e3e] text-white font-medium rounded-lg transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
