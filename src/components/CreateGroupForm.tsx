// src/components/CreateGroupForm.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

export default function CreateGroupForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const { socket } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      setError('Please fill out all fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        const newGroup = await res.json();
        socket?.emit("send-new-group", newGroup);
        router.refresh();
        setName('');
        setDescription('');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create group.');
      }
    } catch (err) {
        console.error("Group creation error: ", err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-[#1e1e2e] border border-[#2e2e3e]">
        <h2 className="text-xl font-bold mb-4 text-white">Create a New Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Group Name</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#12121a] border border-[#2e2e3e] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                  placeholder="e.g., Computer Science Study Group"
                />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  name="description"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#12121a] border border-[#2e2e3e] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors resize-none"
                  placeholder="What's this group about?"
                />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Creating...' : 'Create Group'}
                </button>
            </div>
        </form>
    </div>
  );
}
