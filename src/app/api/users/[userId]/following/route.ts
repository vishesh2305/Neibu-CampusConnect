// src/app/api/users/[userId]/following/route.ts
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

    const following = await db.collection('followers').aggregate([
      { $match: { followerId: userObjectId } },
      { $lookup: { from: 'users', localField: 'followingId', foreignField: '_id', as: 'followingInfo' }},
      { $unwind: '$followingInfo' },
      { $project: {
          _id: '$followingInfo._id',
          name: '$followingInfo.name',
          image: '$followingInfo.image',
        }
      }
    ]).toArray();

    return NextResponse.json(following);
  } catch (error) {
    console.error('GET_FOLLOWING_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}