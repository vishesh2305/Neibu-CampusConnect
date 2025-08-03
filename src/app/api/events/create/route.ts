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
    const { title, description, date, time, location } = await req.json();

    if (!title || !description || !date || !time || !location) {
      return NextResponse.json({ message: 'All event fields are required.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newEvent = {
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      location: location.trim(),
      creatorId: new ObjectId(session.user.id),
      createdAt: new Date(),
    };

    const result = await db.collection('events').insertOne(newEvent);

    return NextResponse.json({ message: 'Event created successfully', eventId: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error('EVENT_CREATION_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}