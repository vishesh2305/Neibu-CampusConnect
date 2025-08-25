// src/components/ChangePasswordForm.tsx
"use client";

import { useState } from 'react';

export default function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.message || 'Failed to update password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t border-gray-700 pt-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          name="currentPassword"
          placeholder="Current Password"
          value={formData.currentPassword}
          onChange={handleChange}
          className="w-full bg-gray-700 p-2 rounded-md"
          required
        />
        <input
          type="password"
          name="newPassword"
          placeholder="New Password"
          value={formData.newPassword}
          onChange={handleChange}
          className="w-full bg-gray-700 p-2 rounded-md"
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm New Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full bg-gray-700 p-2 rounded-md"
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}