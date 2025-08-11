import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request, context: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { userId: userToFollowId } = await context.params; // ✅ Await params

  if (!ObjectId.isValid(userToFollowId)) {
    return NextResponse.json({ message: 'Invalid User ID' }, { status: 400 });
  }

  const currentUserId = new ObjectId(session.user.id);
  const userToFollowObjectId = new ObjectId(userToFollowId);

  // Prevent users from following themselves
  if (currentUserId.equals(userToFollowObjectId)) {
    return NextResponse.json({ message: 'You cannot follow yourself.' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Check if the follow relationship already exists
    const existingFollow = await db.collection('followers').findOne({
      followerId: currentUserId,
      followingId: userToFollowObjectId,
    });

    if (existingFollow) {
      // If it exists, unfollow the user
      await db.collection('followers').deleteOne({ _id: existingFollow._id });
      return NextResponse.json({ message: 'Successfully unfollowed user.' }, { status: 200 });
    } else {
      // If it does not exist, follow the user
      await db.collection('followers').insertOne({
        followerId: currentUserId,
        followingId: userToFollowObjectId,
        followedAt: new Date(),
      });
      return NextResponse.json({ message: 'Successfully followed user.' }, { status: 200 });
    }
  } catch (error) {
    console.error('FOLLOW_USER_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}