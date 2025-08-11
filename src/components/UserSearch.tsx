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
    }, 300); // Debounce to avoid excessive API calls

    return () => clearTimeout(debounce);
  }, [query]);

  const handleStartConversation = async (recipientId: string) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId }),
    });
    const conversation = await res.json();
    setQuery(''); // Clear search after starting conversation
    router.push(`/messages/${conversation._id}`);
  };

  return (
    <div className="p-2 border-b border-gray-800">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a user to message..."
        className="w-full bg-gray-700 p-2 rounded-md text-sm"
      />
      {loading && <p className="text-xs text-gray-400 p-2">Searching...</p>}
      <div className="max-h-60 overflow-y-auto">
        {results.map(user => (
          <div
            key={user._id}
            onClick={() => handleStartConversation(user._id)}
            className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded-md cursor-pointer"
          >
            <Image src={user.image || '/default-avatar.png'} alt={user.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
            <span className="text-sm">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}