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
        await signOut({ callbackUrl: '/', redirect: true });
      } else {
        setError(data.message || 'Failed to delete account.');
      }
    } catch (err) {
      console.log(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t border-rose-500/30 pt-6">
      <h2 className="text-xl font-semibold mb-2 text-rose-400">Danger Zone</h2>
      <p className="text-sm text-gray-400 mb-4">
        Deleting your account is permanent and will remove all your data, including posts, comments, and connections.
      </p>
      <form onSubmit={handleDelete} className="space-y-4 p-4 bg-rose-500/5 border border-rose-500/30 rounded-xl">
        <input
          type="password"
          name="password"
          placeholder="Enter your password to confirm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#12121a] border border-rose-500/40 text-white placeholder-gray-500 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50"
          required
        />
        {error && <p className="text-rose-400 text-sm">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50">
            {loading ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
