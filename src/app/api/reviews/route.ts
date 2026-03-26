// src/app/api/reviews/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '../../../lib/mongodb';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const reviews = await db.collection('reviews').find({}).toArray();
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('GET_REVIEWS_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}