import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-gray-950/90 backdrop-blur-sm">
        <Link href="/" className="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-blue-500"
          >
            <path d="M7 7h10v10" />
            <path d="M7 17 17 7" />
          </svg>
          <span className="ml-2 text-lg font-bold">CampusConnect</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                Connect with Your Campus
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                The exclusive social network for university students. Share updates,
                join groups, and discover events at your school.
              </p>
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-800"
              >
                Get Started - It&apos;s Free
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md border border-gray-700 bg-transparent px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-600"
              >
                Log In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex items-center justify-center h-16 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} CampusConnect. All rights reserved.
        </p>
      </footer>
    </div>
  );
}