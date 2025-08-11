"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
        router.refresh(); // Refresh the page to show the new event
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

  return (
    <div className=" p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-white">Create a New Event</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="title" placeholder="Event Title" value={formData.title} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded-md" required />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded-md resize-none" rows={3} required />
        <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded-md" required />
        <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded-md" required />
        <input type="text" name="location" placeholder="Location (e.g., Library Room 204)" value={formData.location} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded-md" required />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}