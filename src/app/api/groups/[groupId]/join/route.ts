import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request, { params }: { params: { groupId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { groupId } = await params;
  if (!ObjectId.isValid(groupId)) {
    return NextResponse.json({ message: 'Invalid Group ID' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);
    const groupObjectId = new ObjectId(groupId);

    const existingMembership = await db.collection('group_members').findOne({
      groupId: groupObjectId,
      userId: userId,
    });

    if (existingMembership) {
      await db.collection('group_members').deleteOne({ _id: existingMembership._id });
      return NextResponse.json({ message: 'Successfully left the group.' }, { status: 200 });
    } else {
      await db.collection('group_members').insertOne({
        groupId: groupObjectId,
        userId: userId,
        joinedAt: new Date(),
      });
      return NextResponse.json({ message: 'Successfully joined the group.' }, { status: 200 });
    }
  } catch (error) {
    console.error('JOIN_GROUP_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}