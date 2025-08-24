// src/app/api/posts/[postId]/vote/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/authOptions";
import clientPromise from "../../../../../lib/mongodb";
import { ObjectId, Document, UpdateFilter } from "mongodb";

// Define a poll option type
interface PollOption {
  text: string;
  votes: ObjectId[];
}

interface PostWithPoll extends Document {
  _id: ObjectId;
  poll?: {
    options: PollOption[];
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await params;
  if (!ObjectId.isValid(postId)) {
    return NextResponse.json({ message: "Invalid Post ID" }, { status: 400 });
  }

  try {
    const { optionIndex } = await req.json();
    if (typeof optionIndex !== "number") {
      return NextResponse.json(
        { message: "Option index is required." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const postObjectId = new ObjectId(postId);
    const userId = new ObjectId(session.user.id);

    const post = (await db.collection("posts").findOne({ _id: postObjectId })) as PostWithPoll;
    if (!post || !post.poll) {
      return NextResponse.json(
        { message: "Post with a poll not found." },
        { status: 404 }
      );
    }

    // Step 1: remove user from all options
    const pullOperations: UpdateFilter<Document> = { $pull: {} };
    post.poll.options.forEach((_: PollOption, index: number) => {
      (pullOperations.$pull as Record<string, ObjectId>)[`poll.options.${index}.votes`] = userId;
    });

    await db.collection("posts").updateOne({ _id: postObjectId }, pullOperations);

    // Step 2: add user to the selected option
    const updateField = `poll.options.${optionIndex}.votes`;
    await db.collection("posts").updateOne(
      { _id: postObjectId },
      { $addToSet: { [updateField]: userId } }
    );

    const updatedPost = await db.collection("posts").findOne({ _id: postObjectId });

    return NextResponse.json(
      {
        message: "Vote cast successfully.",
        poll: updatedPost?.poll,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("VOTE_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
