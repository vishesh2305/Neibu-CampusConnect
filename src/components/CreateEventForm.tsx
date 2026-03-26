"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

export default function CreateEventForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { socket } = useUserStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newEvent = await res.json();
        socket?.emit("send-new-event", newEvent);
        router.refresh();
        setFormData({ title: '', description: '', date: '', time: '', location: '' });
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create event.');
      }
    } catch (err) {
        console.log(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#12121a] border border-[#2e2e3e] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors";

  return (
    <div className="p-6 rounded-xl bg-[#1e1e2e] border border-[#2e2e3e]">
      <h2 className="text-xl font-bold mb-4 text-white">Create a New Event</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="title" placeholder="Event Title" value={formData.title} onChange={handleChange} className={inputClass} required />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className={`${inputClass} resize-none`} rows={3} required />
        <div className="grid grid-cols-2 gap-3">
          <input type="date" name="date" value={formData.date} onChange={handleChange} className={inputClass} required />
          <input type="time" name="time" value={formData.time} onChange={handleChange} className={inputClass} required />
        </div>
        <input type="text" name="location" placeholder="Location (e.g., Library Room 204)" value={formData.location} onChange={handleChange} className={inputClass} required />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-semibold disabled:opacity-50 transition-colors">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
