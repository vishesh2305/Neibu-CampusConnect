// DashboardClient.tsx
"use client";

import React from "react";

interface DashboardClientProps {
  placeholders: string[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function DashboardClient({
  placeholders,
  value,
  onChange,
  onSubmit
}: DashboardClientProps) {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholders[0]}
        className="w-full p-2 border rounded bg-gray-900 text-white"
      />
    </form>
  );
}