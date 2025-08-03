"use client";

import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

interface Notification {
  _id: string;
  type: 'like' | 'comment';
  read: boolean;
  createdAt: string;
  postId: string;
  actor: {
    name: string;
    image: string;
  };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications(); 
    const interval = setInterval(fetchNotifications, 60000); // Poll for new notifications every minute
    return () => clearInterval(interval);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
        await fetch('/api/notifications', { method: 'POST' });
        setNotifications(notifications.map(n => ({...n, read: true})));
    }
  };

  const getNotificationMessage = (n: Notification) => {
    const action = n.type === 'like' ? 'liked your post' : 'commented on your post';
    return <><span className="font-bold">{n.actor.name}</span> {action}</>;
  }

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative">
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
          <div className="p-3 font-semibold border-b border-gray-700">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <Link href={`/post/${n.postId}`} key={n._id} onClick={() => setIsOpen(false)}>
                    <div className={`p-3 flex items-start gap-3 hover:bg-gray-700 ${!n.read ? 'bg-blue-900/30' : ''}`}>
                        <Image src={n.actor.image || '/default-avatar.png'} width={40} height={40} alt={n.actor.name} className="w-10 h-10 rounded-full object-cover" />
                        <div className="text-sm">
                            <p>{getNotificationMessage(n)}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(n.createdAt))} ago</p>
                        </div>
                    </div>
                </Link>
              ))
            ) : (
              <p className="p-4 text-center text-sm text-gray-400">No new notifications.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}