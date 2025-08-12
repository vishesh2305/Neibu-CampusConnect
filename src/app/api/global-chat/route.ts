// src/app/api/global-chat/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const messages = await db.collection('global_chat').find({}).sort({ createdAt: 1 }).toArray();
    return NextResponse.json(messages);
  } catch (error) {
    console.error('GET_GLOBAL_CHAT_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ message: 'Message text is required.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newMessage = {
      senderId: new ObjectId(session.user.id),
      anonymousUsername: `User-${session.user.id.substring(0, 5)}`,
      text: text.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection('global_chat').insertOne(newMessage);
    const insertedMessage = await db.collection('global_chat').findOne({ _id: result.insertedId });

    return NextResponse.json(insertedMessage, { status: 201 });
  } catch (error) {
    console.error('SEND_GLOBAL_MESSAGE_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}