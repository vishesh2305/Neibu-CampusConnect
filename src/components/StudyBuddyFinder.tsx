// src/components/StudyBuddyFinder.tsx

"use client";

import { useState, useEffect } from 'react';

interface StudyBuddy {
  _id: string;
  userName: string;
  userEmail: string;
  courses: string[];
  availability: Record<string, string[]>;
}

export default function StudyBuddyFinder() {
  const [studyBuddies, setStudyBuddies] = useState<StudyBuddy[]>([]);
  const [loading, setLoading] = useState(true);

  const [myCourses, setMyCourses] = useState('');
  const [myAvailability, setMyAvailability] = useState('');

  useEffect(() => {
    const fetchStudyBuddies = async () => {
      try {
        const res = await fetch('/api/study-buddies');
        const data = await res.json();
        setStudyBuddies(data);
      } catch (error) {
        console.error("Failed to fetch study buddies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudyBuddies();
  }, []);

  if (loading) {
    return <p className="text-gray-400">Loading study buddies...</p>;
  }

    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      const availabilityObject = myAvailability.split(',').reduce((acc, day) => {
          acc[day.trim()] = ["anytime"];
          return acc;
      }, {} as Record<string, string[]>);

      try {
          const res = await fetch('/api/study-buddies/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courses: myCourses.split(',').map(c => c.trim()), availability: availabilityObject }),
          });
          if (res.ok) {
              alert('Your profile has been updated!');
              const updatedBuddies = await (await fetch('/api/study-buddies')).json();
              setStudyBuddies(updatedBuddies);
          } else {
              alert('Failed to update profile.');
          }
      } catch (error) {
          console.error(error);
      }
  };

 return (
    <div className="mt-8">
      <div className="mb-8 p-6 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-white">Update Your Study Profile</h2>
          <form onSubmit={handleRegister} className="space-y-4">
              <input type="text" value={myCourses} onChange={e => setMyCourses(e.target.value)} placeholder="Your courses (comma-separated, e.g., CS101, MATH203)" className="w-full bg-[#12121a] border border-[#2e2e3e] text-white placeholder-gray-500 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              <input type="text" value={myAvailability} onChange={e => setMyAvailability(e.target.value)} placeholder="Availability (e.g., Monday, Wednesday)" className="w-full bg-[#12121a] border border-[#2e2e3e] text-white placeholder-gray-500 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 cursor-pointer rounded-lg text-white font-semibold transition-colors">Update Profile</button>
          </form>
      </div>

      <h2 className="text-xl font-bold mb-4 text-white">Find a Study Buddy</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studyBuddies.map((buddy) => (
          <div key={buddy._id} className="p-5 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl hover:border-[#3e3e4e] transition-colors">
            <h3 className="font-semibold text-white">{buddy.userName}</h3>
            <p className="text-sm text-gray-400 mt-1">{buddy.userEmail}</p>
            <p className="text-sm text-gray-300 mt-2">Courses: {buddy.courses.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
