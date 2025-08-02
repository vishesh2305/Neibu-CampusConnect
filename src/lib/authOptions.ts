// src/lib/authOptions.ts

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { User } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }
        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({
          email: credentials.email,
        });
        if (!user) {
          return null;
        }
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordCorrect) {
          return null;
        }
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      }
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  // --- ADD THIS CALLBACKS OBJECT ---
  callbacks: {
    // This callback is called whenever a JWT is created or updated.
    jwt: async ({ token, user }) => {
      // `user` is only available on initial sign-in
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // This callback is called whenever a session is checked.
    session: async ({ session, token }) => {
      // We are passing the user id from the token to the session
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};