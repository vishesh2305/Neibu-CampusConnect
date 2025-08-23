// src/app/api/events/create/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/authOptions';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const createEventSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Event title is required.' })
    .max(100, { message: 'Event title cannot exceed 100 characters.' })
    .trim(),
  description: z
    .string()
    .min(1, { message: 'Event description is required.' })
    .max(1000, { message: 'Event description cannot exceed 1000 characters.' })
    .trim(),
  date: z
    .string()
    .min(1, { message: 'Event date is required.' }), // could refine with regex/ISO check
  time: z
    .string()
    .min(1, { message: 'Event time is required.' }), // could refine with regex like HH:MM
  location: z
    .string()
    .min(1, { message: 'Event location is required.' })
    .max(200, { message: 'Event location cannot exceed 200 characters.' })
    .trim(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, description, date, time, location } = parsed.data;

    const client = await clientPromise;
    const db = client.db();

    const newEvent = {
      title,
      description,
      date,
      time,
      location,
      creatorId: new ObjectId(session.user.id),
      createdAt: new Date(),
    };

    const result = await db.collection('events').insertOne(newEvent);

    return NextResponse.json(
      { message: 'Event created successfully', eventId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('EVENT_CREATION_ERROR', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
