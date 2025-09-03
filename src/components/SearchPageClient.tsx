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
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4 mb-8 p-4 rounded-lg">
      <div className="relative flex-grow w-full">
        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anything..."
          className="w-full bg-gray-700 border border-transparent rounded-md pl-10 pr-4 py-2 focus:outline-none "
        />
      </div>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full sm:w-auto bg-gray-700 hover:cursor-pointer border border-transparent rounded-md px-3 py-2 focus:outline-none "
      >
        <option value="all">All</option>
        <option value="users">Users</option>
        <option value="posts">Posts</option>
        <option value="groups">Groups</option>
      </select>
      <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-gray-700 hover:bg-gray-900 hover:cursor-pointer rounded-md font-semibold transition-colors">
        Search
      </button>
    </form>
  );
}