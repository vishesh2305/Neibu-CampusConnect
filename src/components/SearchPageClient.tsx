// src/components/SearchPageClient.tsx

"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}&type=${filter}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4 mb-8 p-4 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl">
      <div className="relative flex-grow w-full">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anything..."
          className="w-full bg-[#12121a] border border-[#2e2e3e] text-white placeholder-gray-500 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full sm:w-auto bg-[#12121a] border border-[#2e2e3e] text-white cursor-pointer rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <option value="all">All</option>
        <option value="users">Users</option>
        <option value="posts">Posts</option>
        <option value="groups">Groups</option>
      </select>
      <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 cursor-pointer rounded-lg font-semibold text-white transition-colors">
        Search
      </button>
    </form>
  );
}
