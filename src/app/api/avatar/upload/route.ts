import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/authOptions";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json(
      { message: "Missing filename or file body" },
      { status: 400 }
    );
  }

  const blob = await put(`avatars/${session.user.id}/${filename}`, request.body, {
    access: 'public',
    allowOverwrite: true,
  });

  return NextResponse.json(blob);
}