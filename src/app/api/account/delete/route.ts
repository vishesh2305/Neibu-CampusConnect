// src/app/api/account/delete/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const deleteSchema = z.object({
  password: z.string().min(1, "Password is required for account deletion."),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { password } = parsed.data;

    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    const user = await db.collection('users').findOne({ _id: userId });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json({ message: 'Incorrect password.' }, { status: 403 });
    }

    // --- Data Deletion ---
    // This is where you would cascade delete all of the user's data.
    // For example:
    await db.collection('posts').deleteMany({ authorId: userId });
    await db.collection('comments').deleteMany({ authorId: userId });
    await db.collection('likes').deleteMany({ userId: userId });
    await db.collection('followers').deleteMany({ $or: [{ followerId: userId }, { followingId: userId }] });
    // ... delete from other collections like groups, events, rsvps, etc.

    // Finally, delete the user themselves
    await db.collection('users').deleteOne({ _id: userId });

    return NextResponse.json({ message: 'Account deleted successfully.' }, { status: 200 });

  } catch (error)
 {
    console.error('DELETE_ACCOUNT_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}