// src/app/api/groups/create/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1, { message: 'Group name is required.' }).max(100, { message: 'Group name cannot exceed 100 characters.' }).trim(),
  description: z.string().min(1, { message: 'Group description is required.' }).max(500, { message: 'Group description cannot exceed 500 characters.' }).trim(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, description } = parsed.data;

    const client = await clientPromise;
    const db = client.db();

    const newGroup = {
      name,
      description,
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

    return NextResponse.json(
      { message: 'Group created successfully', groupId: newGroupId },
      { status: 201 }
    );
  } catch (error) {
    console.error('GROUP_CREATION_ERROR', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
