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
    const userId = new ObjectId(session.user.id);

    const conversations = await db.collection('conversations').aggregate([
      { $match: { participants: userId } },
      { $sort: { lastMessageAt: -1 } },
      {
        $lookup: {
          from: 'users',
          let: { participants: '$participants' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$participants'] } } },
            { $match: { _id: { $ne: userId } } } 
          ],
          as: 'otherParticipants'
        }
      },
      { $unwind: '$otherParticipants' },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'conversationId',
          as: 'lastMessage'
        }
      },
      { $addFields: { lastMessage: { $last: '$lastMessage' } } },

      {
        $project: {
          _id: 1,
          lastMessageAt: 1,
          otherParticipant: {
            _id: '$otherParticipants._id',
            name: '$otherParticipants.name',
            image: '$otherParticipants.image'
          },
          lastMessage: {
            text: '$lastMessage.text',
            createdAt: '$lastMessage.createdAt'
          }
        }
      }
    ]).toArray();

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('GET_CONVERSATIONS_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipientId } = await req.json();
    if (!recipientId || !ObjectId.isValid(recipientId)) {
      return NextResponse.json({ message: 'Valid recipientId is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const currentUserId = new ObjectId(session.user.id);
    const recipientObjectId = new ObjectId(recipientId);

    if (currentUserId.equals(recipientObjectId)) {
        return NextResponse.json({ message: 'You cannot start a conversation with yourself.' }, { status: 400 });
    }

    const existingConversation = await db.collection('conversations').findOne({
      participants: { $all: [currentUserId, recipientObjectId], $size: 2 }
    });

    if (existingConversation) {
      return NextResponse.json(existingConversation); 
    }


    const newConversation = {
      participants: [currentUserId, recipientObjectId],
      createdAt: new Date(),
      lastMessageAt: new Date(), 
    };

    const result = await db.collection('conversations').insertOne(newConversation);
    const conversation = await db.collection('conversations').findOne({ _id: result.insertedId });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('CREATE_CONVERSATION_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}