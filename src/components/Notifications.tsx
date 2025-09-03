"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { IconBell, IconUserPlus, IconMessageCircle } from "@tabler/icons-react";
import type { Notification } from "../../types/notifications";
import { cn } from "@/lib/utils";

interface NotificationsClientProps {
  initialNotifications: Notification[];
}

export default function NotificationsClient({
  initialNotifications,
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  useEffect(() => {
    const markAsRead = async () => {
      try {
        await fetch("/api/notifications", { method: "POST" });
        const updatedNotifications = initialNotifications.map((n) => ({
          ...n,
          read: true,
        }));
        setNotifications(updatedNotifications);
      } catch (error) {
        console.error("Failed to mark notifications as read", error);
      }
    };
    markAsRead();
  }, [initialNotifications]);

  // --- HELPERS ---
  const getActorName = (actor: Notification["actorId"]) => {
    if (typeof actor === "string") return "Someone";
    return actor.name;
  };

  const getActorId = (actor: Notification["actorId"]) => {
    if (typeof actor === "string") return actor;
    return actor._id;
  };

  // --- MODIFICATION START: Handle new notification types ---
  const getNotificationDetails = (n: Notification) => {
    switch (n.type) {
      case "like":
        return {
          icon: <IconBell className="h-5 w-5 text-gray-400" />,
          message: (
            <>
              <span className="font-bold">{getActorName(n.actorId)}</span> liked your post
            </>
          ),
          link: n.link || `/post/${n.postId}`,
        };
      case "comment":
        return {
          icon: <IconBell className="h-5 w-5 text-gray-400" />,
          message: (
            <>
              <span className="font-bold">{getActorName(n.actorId)}</span> commented on your post
            </>
          ),
          link: n.link || `/post/${n.postId}`,
        };
      case "follow":
        return {
          icon: <IconUserPlus className="h-5 w-5 text-blue-400" />,
          message: (
            <>
              <span className="font-bold">{getActorName(n.actorId)}</span> started following you
            </>
          ),
          link: n.link || `/profile/${getActorId(n.actorId)}`,
        };
      case "message":
        return {
          icon: <IconMessageCircle className="h-5 w-5 text-green-400" />,
          message: (
            <>
              <span className="font-bold">{getActorName(n.actorId)}</span> sent you a new message
            </>
          ),
          link: n.link || "#",
        };
      default:
        return {
          icon: <IconBell className="h-5 w-5 text-gray-400" />,
          message: n.message || "You have a new notification.",
          link: n.link || "#",
        };
    }
  };
  // --- MODIFICATION END ---

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
      {notifications.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {notifications.map((n) => {
            const { icon, message, link } = getNotificationDetails(n);
            return (
              <li
                key={n._id}
                className={cn(
                  "p-4 transition-colors duration-200",
                  !n.read
                    ? "bg-blue-500/10 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                )}
              >
                <Link href={link} className="block">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 pt-1 relative">
                      {icon}
                      {!n.read && (
                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-blue-500"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-white">{message}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
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
