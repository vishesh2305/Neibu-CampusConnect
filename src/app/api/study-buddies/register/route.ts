// src/app/api/study-buddies/register/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { courses, availability } = await req.json();
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    // Use updateOne with upsert to create or update the user's study buddy profile
    await db.collection('study_buddies').updateOne(
      { userId: userId },
      { $set: { courses, availability, userName: session.user.name, userEmail: session.user.email } },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Study buddy profile updated!' }, { status: 200 });
  } catch (error) {
    console.error('STUDY_BUDDY_REGISTER_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}