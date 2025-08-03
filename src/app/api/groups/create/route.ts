import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description } = await req.json();

    if (!name || !description || name.trim().length === 0 || description.trim().length === 0) {
      return NextResponse.json({ message: 'Group name and description are required.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newGroup = {
      name: name.trim(),
      description: description.trim(),
      creatorId: new ObjectId(session.user.id),
      createdAt: new Date(),
    };

    const groupResult = await db.collection('groups').insertOne(newGroup);
    const newGroupId = groupResult.insertedId;

    await db.collection('group_members').insertOne({
      groupId: newGroupId,
      userId: new ObjectId(session.user.id),
      joinedAt: new Date(),
    });

    return NextResponse.json({ message: 'Group created successfully', groupId: newGroupId }, { status: 201 });
  } catch (error) {
    console.error('GROUP_CREATION_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}