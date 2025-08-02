// src/components/CreateGroupForm.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateGroupForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

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
        router.refresh(); // Refresh the page to show the new group
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
    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-white">Create a New Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Group Name</label>
                <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                <textarea name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 resize-none"></textarea>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end">
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create Group'}
                </button>
            </div>
        </form>
    </div>
  );
}