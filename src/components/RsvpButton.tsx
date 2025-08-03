"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

interface RsvpButtonProps {
  eventId: string;
  initialRsvpCount: number;
  hasRsvpd: boolean;
}

export default function RsvpButton({ eventId, initialRsvpCount, hasRsvpd }: RsvpButtonProps) {
  const [rsvpd, setRsvpd] = useState(hasRsvpd);
  const [rsvpCount, setRsvpCount] = useState(initialRsvpCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    const action = rsvpd ? 'unrsvp' : 'rsvp';


    setRsvpd(prev => !prev);
    setRsvpCount(prev => action === 'rsvp' ? prev + 1 : prev - 1);

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, { method: 'POST' });
      if (!res.ok) {

        setRsvpd(prev => !prev);
        setRsvpCount(prev => action === 'rsvp' ? prev - 1 : prev + 1);
      }
      router.refresh(); 
    } catch (error) {
      console.error(error);

      setRsvpd(prev => !prev);
      setRsvpCount(prev => action === 'rsvp' ? prev - 1 : prev + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-full transition-colors disabled:opacity-50 ${
        rsvpd
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {rsvpd ? <CheckCircleIcon className="h-5 w-5" /> : <PlusCircleIcon className="h-5 w-5" />}
      <span>{rsvpCount} Going</span>
    </button>
  );
}