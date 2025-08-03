"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UserIcon,
  UsersIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon, 
} from '@heroicons/react/24/outline';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Groups', href: '/groups', icon: UsersIcon },
  { name: 'Events', href: '/events', icon: CalendarDaysIcon },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon }, 
  { name: 'Profile', href: '/profile/edit', icon: UserIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-gray-950 p-4 border-r border-gray-800">
      <nav className="flex-1 space-y-2">
        {navLinks.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={classNames(
              pathname.startsWith(item.href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
            )}
          >
            <item.icon
              className="mr-3 flex-shrink-0 h-6 w-6"
              aria-hidden="true"
            />
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
