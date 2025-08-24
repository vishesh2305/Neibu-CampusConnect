// src/components/CourseList.tsx

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Course {
  _id: string;
  name: string;
  courseCode: string;
  description: string;
  professor: string;
}

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  
  
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/courses');
        const data = await res.json();
        setCourses(data);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (e: React.MouseEvent, courseId: string) => {
    e.preventDefault();
    setEnrolling(courseId);
    try {
        const res = await fetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
        if (res.ok) {
            alert('Successfully enrolled!');
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to enroll.');
        }
    } catch (error) {
        console.error("Enrollment error:", error);
        alert("An error occurred during enrollment.");
    } finally {
        setEnrolling(null);
    }
  };

  if (loading) {
    return <p>Loading courses...</p>;
  }




 return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-white">Available Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <Link
            href={`/academic/courses/${course._id}`}
            key={course._id}
            className="p-4 shadow-lg rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <h3 className="font-semibold text-white">{course.name}</h3>
              <p className="text-sm text-gray-400 mt-1">{course.courseCode}</p>
              <p className="text-sm text-gray-300 mt-2 line-clamp-3">{course.description}</p>
              <p className="text-xs text-gray-500 mt-2">Professor: {course.professor}</p>
            </div>
            <button
              onClick={(e) => handleEnroll(e, course._id)}
              disabled={enrolling === course._id}
              className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium text-sm disabled:opacity-50"
            >
              {enrolling === course._id ? 'Enrolling...' : 'Enroll'}
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}