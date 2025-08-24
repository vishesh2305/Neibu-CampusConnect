// src/components/ProfessorReview.tsx

"use client";

import { useState, useEffect } from 'react';

interface Review {
  _id: string;
  courseId: string; // We'll need this for the form
  professor: string;
  rating: number;
  comment: string;
  // Let's also fetch course name for better display
  courseName?: string;
}

// Assume we have a course type for the dropdown
interface Course {
  _id: string;
  name: string;
  professor: string;
}

export default function ProfessorReview() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsRes, coursesRes] = await Promise.all([
          fetch('/api/reviews'),
          fetch('/api/courses')
        ]);
        const reviewsData = await reviewsRes.json();
        const coursesData = await coursesRes.json();

        // Map course names to reviews
        const populatedReviews = reviewsData.map((review: Review) => ({
            ...review,
            courseName: coursesData.find((c: Course) => c._id === review.courseId)?.name || 'Unknown Course'
        }));


        setReviews(populatedReviews);
        setCourses(coursesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (!selectedCourse || !comment) {
          setError('Please select a course and write a comment.');
          return;
      }
      const selectedCourseData = courses.find(c => c._id === selectedCourse);
      if (!selectedCourseData) return;

      try {
          const res = await fetch('/api/reviews/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  courseId: selectedCourse,
                  professor: selectedCourseData.professor,
                  rating,
                  comment
              })
          });
          if (res.ok) {
              alert('Review submitted!');
              // Refresh reviews
              const updatedReviews = await (await fetch('/api/reviews')).json();
              setReviews(updatedReviews);
              // Reset form
              setSelectedCourse('');
              setRating(3);
              setComment('');
          } else {
              const data = await res.json();
              setError(data.message || 'Failed to submit review.');
          }
      } catch (err) {
        console.log(err);
          setError('An error occurred.');
      }
  };


  if (loading) {
    return <p>Loading reviews...</p>;
  }

  return (
    <div className="mt-8">
        {/* Review Submission Form */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Write a Review</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full bg-gray-700 p-2 rounded-md">
                    <option value="">Select a Course to Review</option>
                    {courses.map(course => (
                        <option key={course._id} value={course._id}>{course.name} - {course.professor}</option>
                    ))}
                </select>
                <div className="flex items-center gap-2">
                    <label className="text-white">Rating:</label>
                    <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full"/>
                    <span className="text-white font-bold">{rating}/5</span>
                </div>
                <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your thoughts on the course and professor..." rows={4} className="w-full bg-gray-700 p-2 rounded-md resize-none" />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium">Submit Review</button>
            </form>
        </div>

      <h2 className="text-xl font-bold mb-4 text-white">Professor and Course Reviews</h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="block p-4 shadow-lg rounded-lg bg-gray-800">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-white">{review.professor}</h3>
                    <p className="text-xs text-gray-500">{review.courseName}</p>
                </div>
                <div className="text-lg font-bold text-yellow-400">{review.rating}/5 ★</div>
            </div>
            <p className="text-sm text-gray-300 mt-2">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}