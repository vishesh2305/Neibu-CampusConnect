// src/components/UserList.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface UserListProps {
  apiUrl: string;
}

export default function UserList({ apiUrl }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl);
        if (res.ok) {
          setUsers(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [apiUrl]);

  if (loading) return <p className="text-center text-gray-400 p-4">Loading...</p>;
  if (users.length === 0) return <p className="text-center text-gray-500 p-4">No users to display.</p>;

  return (
    <div className="space-y-3">
      {users.map(user => (
        <Link href={`/profile/${user._id}`} key={user._id} className="flex items-center gap-4 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
          <Image src={user.image || '/default-avatar.png'} alt={user.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
          <span className="font-semibold text-white">{user.name}</span>
        </Link>
      ))}
    </div>
  );
}