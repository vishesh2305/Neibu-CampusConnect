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
  const [filter, setFilter] = useState('all'); // 'all', 'users', 'posts', 'groups'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}&type=${filter}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="relative flex-grow w-full">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anything..."
          className="w-full bg-gray-700 border border-transparent rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full sm:w-auto bg-gray-700 border border-transparent rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All</option>
        <option value="users">Users</option>
        <option value="posts">Posts</option>
        <option value="groups">Groups</option>
      </select>
      <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition-colors">
        Search
      </button>
    </form>
  );
}