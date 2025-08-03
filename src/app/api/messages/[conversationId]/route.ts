import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// GET handler
export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { conversationId } = await params;
  if (!ObjectId.isValid(conversationId)) {
    return NextResponse.json({ message: 'Invalid Conversation ID' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId(session.user.id),
    });

    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found or access denied' }, { status: 404 });
    }

    const messages = await db.collection('messages')
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json(messages);
  } catch (error) {
    console.error('GET_MESSAGES_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST handler
export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { conversationId } = await params;
  if (!ObjectId.isValid(conversationId)) {
    return NextResponse.json({ message: 'Invalid Conversation ID' }, { status: 400 });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ message: 'Message text is required.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const conversationObjectId = new ObjectId(conversationId);
    const currentUserId = new ObjectId(session.user.id);

    const conversation = await db.collection('conversations').findOne({
      _id: conversationObjectId,
      participants: currentUserId,
    });

    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found or access denied' }, { status: 404 });
    }

    const newMessage = {
      conversationId: conversationObjectId,
      senderId: currentUserId,
      text: text.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection('messages').insertOne(newMessage);

    await db.collection('conversations').updateOne(
      { _id: conversationObjectId },
      { $set: { lastMessageAt: new Date() } }
    );

    const insertedMessage = await db.collection('messages').findOne({ _id: result.insertedId });

    return NextResponse.json(insertedMessage, { status: 201 });
  } catch (error) {
    console.error('SEND_MESSAGE_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}