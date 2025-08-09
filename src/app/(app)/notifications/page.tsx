import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import NotificationsClient from "../../../components/Notifications";
import type { Notification } from "../../../../types/notifications";

// Raw MongoDB document type
interface NotificationDoc {
  _id: ObjectId;
  userId: ObjectId;
  actorId: ObjectId;
  postId: ObjectId;
  type: "like" | "comment";
  read: boolean;
  createdAt: Date | string;
  message?: string;
  link?: string;
}

async function getNotifications(userId: string): Promise<Notification[]> {
  const client = await clientPromise;
  const db = client.db();

  const notifications = await db
    .collection("notifications")
    .aggregate([
      { $match: { userId: new ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "actorId",
          foreignField: "_id",
          as: "actorData",
        },
      },
      { $unwind: "$actorData" },
      {
        $project: {
          _id: { $toString: "$_id" },
          userId: { $toString: "$userId" },
          postId: { $toString: "$postId" },
          createdAt: { $dateToString: { date: "$createdAt" } },
          type: 1,
          read: 1,
          message: 1,
          link: 1,
          actorId: {
            name: "$actorData.name",
            image: "$actorData.image",
          },
        },
      },
    ])
    .toArray();

  return notifications as Notification[];
}


export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const notifications = await getNotifications(session.user.id);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Notifications</h1>
      <NotificationsClient initialNotifications={notifications} />
    </main>
  );
}