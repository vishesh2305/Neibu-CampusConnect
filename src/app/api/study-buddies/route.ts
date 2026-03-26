// src/app/api/study-buddies/route.ts

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
    const studyBuddies = await db.collection('study_buddies').find({}).toArray();
    return NextResponse.json(studyBuddies);
  } catch (error) {
    console.error('GET_STUDY_BUDDIES_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}