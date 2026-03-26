// src/components/UserSearch.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
  _id: string;
  name: string;
  image?: string;
}

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        const res = await fetch(`/api/users/search?q=${query}`);
        const data = await res.json();
        setResults(data);
        setLoading(false);
      } else {
        setResults([]);
      }
    };
    const debounce = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleStartConversation = async (recipientId: string) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId }),
    });
    const conversation = await res.json();
    setQuery('');
    router.push(`/messages/${conversation._id}`);
  };

  return (
    <div className="p-2 border-b border-[#2e2e3e]">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a user to message..."
        className="w-full bg-[#12121a] border border-[#2e2e3e] text-white placeholder-gray-500 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
      />
      {loading && <p className="text-xs text-gray-400 p-2">Searching...</p>}
      <div className="max-h-60 overflow-y-auto">
        {results.map(user => (
          <div
            key={user._id}
            onClick={() => handleStartConversation(user._id)}
            className="flex items-center gap-3 p-2 hover:bg-[#1e1e2e] rounded-lg cursor-pointer transition-colors"
          >
            <Image src={user.image || '/default-avatar.png'} alt={user.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
            <span className="text-sm text-white">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
