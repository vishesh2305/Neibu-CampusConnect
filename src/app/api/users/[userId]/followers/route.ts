// src/app/api/users/[userId]/followers/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!ObjectId.isValid(userId)) {
    return NextResponse.json({ message: 'Invalid User ID' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userObjectId = new ObjectId(userId);

    const followers = await db.collection('followers').aggregate([
      { $match: { followingId: userObjectId } },
      { $lookup: { from: 'users', localField: 'followerId', foreignField: '_id', as: 'followerInfo' }},
      { $unwind: '$followerInfo' },
      { $project: {
          _id: '$followerInfo._id',
          name: '$followerInfo.name',
          image: '$followerInfo.image',
        }
      }
    ]).toArray();

    return NextResponse.json(followers);
  } catch (error) {
    console.error('GET_FOLLOWERS_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}