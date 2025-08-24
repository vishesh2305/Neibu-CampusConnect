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
    return <p>Loading study buddies...</p>;
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
      <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-white">Update Your Study Profile</h2>
          <form onSubmit={handleRegister} className="space-y-4">
              <input type="text" value={myCourses} onChange={e => setMyCourses(e.target.value)} placeholder="Your courses (comma-separated, e.g., CS101, MATH203)" className="w-full bg-gray-700 p-2 rounded-md" />
              <input type="text" value={myAvailability} onChange={e => setMyAvailability(e.target.value)} placeholder="Availability (e.g., Monday, Wednesday)" className="w-full bg-gray-700 p-2 rounded-md" />
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium">Update Profile</button>
          </form>
      </div>

      <h2 className="text-xl font-bold mb-4 text-white">Find a Study Buddy</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studyBuddies.map((buddy) => (
          <div key={buddy._id} className="block p-4 shadow-lg rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
            <h3 className="font-semibold text-white">{buddy.userName}</h3>
            <p className="text-sm text-gray-400 mt-1">{buddy.userEmail}</p>
            <p className="text-sm text-gray-300 mt-2">Courses: {buddy.courses.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}