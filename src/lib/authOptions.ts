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
          image: user.image, // Ensure image is returned on login
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
  callbacks: {
    // This callback is called whenever a JWT is created or updated.
    jwt: async ({ token, user, trigger, session }) => {
      // On initial sign-in, add user properties to the token
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.picture = user.image;
      }

      // On session update (e.g., after profile edit), add the new data to the token
      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        token.picture = session.user.image;
      }
      return token;
    },
    // This callback is called whenever a session is checked.
    session: async ({ session, token }) => {
      // Pass properties from the token to the client-side session object
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
};