import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';


export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields.' },
        { status: 400 }
      );
    }

    if (!email.includes('.edu')) {
      return NextResponse.json(
        { message: 'A .edu email is required for registration.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(); 
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
      createdAt: new Date(),
    });


    return NextResponse.json(
      { message: 'User registered successfully.', userId: result.insertedId },
      { status: 201 } // 201 Created
    );
  } catch (error) {
    console.error('SIGNUP_ERROR', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}