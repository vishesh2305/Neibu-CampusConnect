// src/components/ProfessorReview.tsx

"use client";

import { useState, useEffect } from 'react';

interface Review {
  _id: string;
  courseId: string;
  professor: string;
  rating: number;
  comment: string;
  courseName?: string;
}

interface Course {
  _id: string;
  name: string;
  professor: string;
}

export default function ProfessorReview() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

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
              const updatedReviews = await (await fetch('/api/reviews')).json();
              setReviews(updatedReviews);
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
    return <p className="text-gray-400">Loading reviews...</p>;
  }

  return (
    <div className="mt-8">
        {/* Review Submission Form */}
        <div className="mb-8 p-6 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-white">Write a Review</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full cursor-pointer bg-[#12121a] border border-[#2e2e3e] text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50">
                    <option value="">Select a Course to Review</option>
                    {courses.map(course => (
                        <option key={course._id} value={course._id}>{course.name} - {course.professor}</option>
                    ))}
                </select>
                <div className="flex items-center gap-3">
                    <label className="text-gray-300 text-sm">Rating:</label>
                    <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} className="flex-1 cursor-pointer accent-amber-500"/>
                    <span className="text-amber-400 font-bold text-lg">{rating}/5</span>
                </div>
                <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your thoughts on the course and professor..." rows={4} className="w-full bg-[#12121a] border border-[#2e2e3e] text-white placeholder-gray-500 p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button type="submit" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 cursor-pointer rounded-lg text-white font-semibold transition-colors">Submit Review</button>
            </form>
        </div>

      <h2 className="text-xl font-bold mb-4 text-white">Professor and Course Reviews</h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="p-5 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl hover:border-[#3e3e4e] transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-white">{review.professor}</h3>
                    <p className="text-xs text-gray-400">{review.courseName}</p>
                </div>
                <div className="text-lg font-bold text-amber-400">{review.rating}/5 ★</div>
            </div>
            <p className="text-sm text-gray-300 mt-2">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
