// src/app/api/users/[userId]/follow/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';


interface Follower {
  _id?: ObjectId;
  followerId: ObjectId;
  followingId: ObjectId;
  followedAt: Date;
}

interface Notification {
  _id?: ObjectId;
  userId: ObjectId;
  actorId: ObjectId;    
  type: 'follow';
  read: boolean;
  createdAt: Date;
  link: string;
}


async function dispatchNotification(notification: Notification) {
  try {
    await fetch('http://localhost:3001/api/dispatch-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: notification.userId.toString(),
        notification,
      }),
    });
  } catch (error) {
    console.error('Failed to dispatch follow notification', error);
  }
}



export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { userId: userToFollowId } = await params;

  if (!ObjectId.isValid(userToFollowId)) {
    return NextResponse.json({ message: 'Invalid User ID' }, { status: 400 });
  }

  const currentUserId = new ObjectId(session.user.id);
  const userToFollowObjectId = new ObjectId(userToFollowId);

  if (currentUserId.equals(userToFollowObjectId)) {
    return NextResponse.json(
      { message: 'You cannot follow yourself.' },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const followersCollection = db.collection<Follower>('followers');
    const notificationsCollection = db.collection<Notification>('notifications');

    const existingFollow = await followersCollection.findOne({
      followerId: currentUserId,
      followingId: userToFollowObjectId,
    });

    if (existingFollow) {
      await followersCollection.deleteOne({ _id: existingFollow._id });
      await notificationsCollection.deleteOne({
        type: 'follow',
        actorId: currentUserId,
        userId: userToFollowObjectId,
      });

      return NextResponse.json(
        { message: 'Successfully unfollowed user.' },
        { status: 200 }
      );
    } else {
      await followersCollection.insertOne({
        followerId: currentUserId,
        followingId: userToFollowObjectId,
        followedAt: new Date(),
      });

      const notification: Notification = {
        userId: userToFollowObjectId,
        actorId: currentUserId,
        type: 'follow',
        read: false,
        createdAt: new Date(),
        link: `/profile/${currentUserId.toString()}`,
      };

      const result = await notificationsCollection.insertOne(notification);

      const fullNotification = await notificationsCollection.findOne({
        _id: result.insertedId,
      });

      if (fullNotification) {
        await dispatchNotification(fullNotification);
      }

      return NextResponse.json(
        { message: 'Successfully followed user.' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('FOLLOW_USER_ERROR', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}