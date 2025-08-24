// src/app/api/reviews/create/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const reviewSchema = z.object({
  courseId: z.string().refine((val) => ObjectId.isValid(val), { message: "Invalid Course ID" }),
  professor: z.string().min(3, "Professor name is required.").max(100),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters.").max(1000),
});


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { courseId, professor, rating, comment } = parsed.data;

    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    const newReview = {
      courseId: new ObjectId(courseId),
      userId,
      professor,
      rating,
      comment,
      createdAt: new Date(),
    };

    await db.collection('reviews').insertOne(newReview);

    return NextResponse.json({ message: 'Review submitted successfully!' }, { status: 201 });
  } catch (error) {
    console.error('SUBMIT_REVIEW_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}