import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

// Mobile login endpoint - returns JWT token for mobile app
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");
    const token = await new SignJWT({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || "user",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    // Update last login
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date(), isOnline: true } }
    );

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image || null,
        role: user.role || "user",
        major: user.major,
        graduationYear: user.graduationYear,
      },
    });
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
