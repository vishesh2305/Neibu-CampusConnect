import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const notifications = await db.collection('notifications')
      .aggregate([
        { $match: { userId: new ObjectId(session.user.id) } },
        { $sort: { createdAt: -1 } },
        { $limit: 20 }, 
        {
          $lookup: {
            from: 'users',
            localField: 'actorId',
            foreignField: '_id',
            as: 'actorDetails'
          }
        },
        { $unwind: '$actorDetails' },
        {
          $project: { 
            _id: 1,
            type: 1,
            read: 1,
            createdAt: 1,
            postId: 1,
            actor: {
              name: '$actorDetails.name',
              image: '$actorDetails.image'
            }
          }
        }
      ]).toArray();

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('GET_NOTIFICATIONS_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      const client = await clientPromise;
      const db = client.db();

      await db.collection('notifications').updateMany(
        { userId: new ObjectId(session.user.id), read: false },
        { $set: { read: true } }
      );

      return NextResponse.json({ message: 'Notifications marked as read' }, { status: 200 });
    } catch (error) {
      console.error('MARK_NOTIFICATIONS_READ_ERROR', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  }