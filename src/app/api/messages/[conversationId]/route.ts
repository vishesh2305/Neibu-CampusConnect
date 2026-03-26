// src/app/api/messages/[conversationId]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { rateLimitResponse } from "@/lib/rateLimit";


interface Message {
  _id?: ObjectId;
  conversationId: ObjectId;
  senderId: ObjectId;
  text: string;
  createdAt: Date;
}

interface Notification {
  _id?: ObjectId;
  userId: ObjectId;
  actorId: ObjectId;
  type: 'message';
  message: string;
  link: string;
  read: boolean;
  createdAt: Date;
}


async function dispatchNotification(notification: Notification) {
  try {
    await fetch(`${process.env.SOCKET_SERVER_URL || 'http://localhost:3001'}/api/dispatch-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: notification.userId.toString(),
        notification,
      }),
    });
  } catch (error) {
    console.error('Failed to dispatch message notification', error);
  }
}


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
    return NextResponse.json(
      { message: 'Invalid Conversation ID' },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId(session.user.id),
    });

    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    const messages = await db
      .collection<Message>('messages')
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json(messages);
  } catch (error) {
    console.error('GET_MESSAGES_ERROR', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const rateLimited = rateLimitResponse(`message-send:${session.user.id}`, { windowMs: 60000, maxRequests: 30 });
  if (rateLimited) return rateLimited;

  const { conversationId } = await params;
  if (!ObjectId.isValid(conversationId)) {
    return NextResponse.json(
      { message: 'Invalid Conversation ID' },
      { status: 400 }
    );
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { message: 'Message text is required.' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { message: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    const newMessage: Message = {
      conversationId: conversationObjectId,
      senderId: currentUserId,
      text: text.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection<Message>('messages').insertOne(newMessage);
    const insertedDoc = await db
      .collection<Message>('messages')
      .findOne({ _id: result.insertedId });

    // Convert ObjectIds to strings for client consumption
    const insertedMessage = insertedDoc ? {
      ...insertedDoc,
      _id: insertedDoc._id!.toString(),
      conversationId: conversationId,
      senderId: session.user.id,
    } : null;

    await db.collection('conversations').updateOne(
      { _id: conversationObjectId },
      { $set: { lastMessageAt: new Date() } }
    );

    const recipientId = conversation.participants.find(
      (p: ObjectId) => !p.equals(currentUserId)
    );

    if (recipientId) {
      const notification: Notification = {
        userId: recipientId,
        actorId: currentUserId,
        type: 'message',
        message: `You have a new message from ${session.user.name}`,
        link: `/messages/${conversationId}`,
        read: false,
        createdAt: new Date(),
      };

      const notifyResult = await db
        .collection<Notification>('notifications')
        .insertOne(notification);

      const fullNotification = await db
        .collection<Notification>('notifications')
        .findOne({ _id: notifyResult.insertedId });

      if (fullNotification) {
        await dispatchNotification(fullNotification);
      }
    }

    return NextResponse.json(insertedMessage, { status: 201 });
  } catch (error) {
    console.error('SEND_MESSAGE_ERROR', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
