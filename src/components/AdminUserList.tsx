// src/components/AdminUserList.tsx
"use client";
import { useState, useEffect } from "react";
import { TrashIcon } from "@heroicons/react/24/solid";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminUserList() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    };
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u._id !== userId));
    } else {
      alert('Failed to delete user.');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-700">
        {/* Table Head */}
        <thead className="bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
          </tr>
        </thead>
        {/* Table Body */}
        <tbody className="divide-y divide-gray-700">
          {users.map((user) => (
            <tr key={user._id}>
              <td className="px-6 py-4 text-sm text-gray-200">{user.name}</td>
              <td className="px-6 py-4 text-sm text-gray-300">{user.email}</td>
              <td className="px-6 py-4 text-sm text-gray-400">{user.role}</td>
              <td className="px-6 py-4 text-sm font-medium">
                <button onClick={() => handleDelete(user._id)} className="text-red-500 hover:text-red-700">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}