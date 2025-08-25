// src/components/DeleteAccountZone.tsx
"use client";

import { useState } from 'react';
import { signOut } from 'next-auth/react';

export default function DeleteAccountZone() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!window.confirm("Are you absolutely sure you want to delete your account? This action is irreversible.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok) {
        // Force sign out and redirect to home page
        await signOut({ callbackUrl: '/', redirect: true });
      } else {
        setError(data.message || 'Failed to delete account.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t border-red-500/30 pt-6">
      <h2 className="text-xl font-semibold mb-2 text-red-400">Danger Zone</h2>
      <p className="text-sm text-gray-400 mb-4">
        Deleting your account is permanent and will remove all your data, including posts, comments, and connections.
      </p>
      <form onSubmit={handleDelete} className="space-y-4 p-4 border border-red-500/50 rounded-lg">
        <input
          type="password"
          name="password"
          placeholder="Enter your password to confirm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-gray-900 p-2 rounded-md border border-red-500/60 focus:ring-red-500 focus:border-red-500"
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-medium">
            {loading ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>
      </form>
    </div>
  );
}