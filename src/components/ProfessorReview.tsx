// src/components/ProfessorReview.tsx

"use client";

import { useState, useEffect } from 'react';

interface Review {
  _id: string;
  courseId: string;
  professor: string;
  rating: number;
  comment: string;
}

export default function ProfessorReview() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews');
        const data = await res.json();
        setReviews(data);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return <p>Loading reviews...</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 text-white">Professor and Course Reviews</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((review) => (
          <div key={review._id} className="block p-4 shadow-lg rounded-lg hover:bg-gray-700 transition-colors">
            <h3 className="font-semibold text-white">{review.professor}</h3>
            <p className="text-sm text-gray-400 mt-1">Rating: {review.rating}/5</p>
            <p className="text-sm text-gray-400 mt-1">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}