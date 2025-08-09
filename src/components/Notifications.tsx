"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { IconBell } from "@tabler/icons-react";
import type { Notification } from "../../types/notifications";

interface NotificationsClientProps {
  initialNotifications: Notification[];
}

export default function NotificationsClient({
  initialNotifications,
}: NotificationsClientProps) {
  const [notifications] = useState<Notification[]>(initialNotifications);

  const getNotificationMessage = (n: Notification) => {
    const action =
      n.type === "like" ? "liked your post" : "commented on your post";
    return (
      <>
        <span className="font-bold">{n.actorId.name}</span> {action}
      </>
    );
  };


  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
      {notifications.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {notifications.map((n) => (
            <li
              key={n._id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
            >
              <Link href={n.link || `/post/${n.postId}`} className="block">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 pt-1">
                    <IconBell className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-white">
                      {n.message || getNotificationMessage(n)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            You have no new notifications.
          </p>
        </div>
      )}
    </div>
  );
}