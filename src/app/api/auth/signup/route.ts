import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import * as z from 'zod';
import { MongoServerError } from 'mongodb';

const signupSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters long." }),
  email: z.string().email({ message: "Invalid email address." }).refine(email => email.includes('.edu'), {
    message: "A .edu email is required for registration."
  }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = signupSchema.parse(body);

    const client = await clientPromise;
    const db = client.db("test");

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
    });

    return NextResponse.json(
      { message: 'User registered successfully.', userId: result.insertedId },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", errors: error.issues },
        { status: 400 }
      );
    }

    // Check if error is a Mongo duplicate key error
    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        { message: 'Email already exists.' },
        { status: 409 }
      );
    }

    console.error('SIGNUP_ERROR', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
