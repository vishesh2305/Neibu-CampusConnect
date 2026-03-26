// src/app/api/notifications/count/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const count = await db.collection('notifications').countDocuments({
      userId: new ObjectId(session.user.id),
      read: false
    });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('GET_NOTIFICATION_COUNT_ERROR', error);
    return NextResponse.json({ count: 0 });
  }
}