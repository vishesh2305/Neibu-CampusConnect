// src/app/api/admin/users/[userId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { userId } = await params;
  if (!ObjectId.isValid(userId)) {
    return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
    // In a real app, you'd also delete their posts, comments, etc.
    return NextResponse.json({ message: 'User deleted' }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}