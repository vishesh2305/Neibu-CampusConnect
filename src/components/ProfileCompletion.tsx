"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { IconCheck, IconArrowRight } from "@tabler/icons-react";

interface ExtendedUser {
  name?: string;
  email?: string;
  image?: string;
  major?: string;
  graduationYear?: string;
}

export default function ProfileCompletion() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  const user = session.user as ExtendedUser;

  const steps = [
    { label: "Add name", done: !!user.name },
    { label: "Add profile photo", done: !!user.image },
    { label: "Add major", done: !!user.major },
    { label: "Add graduation year", done: !!user.graduationYear },
  ];

  const completed = steps.filter((s) => s.done).length;
  const percent = Math.round((completed / steps.length) * 100);

  if (percent === 100) return null;

  return (
    <div className="mb-4 p-4 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Complete your profile</h3>
        <span className="text-xs text-emerald-400 font-bold">{percent}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#12121a] rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {steps.map((step) => (
          <span
            key={step.label}
            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              step.done
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-[#12121a] text-gray-500"
            }`}
          >
            {step.done && <IconCheck className="w-3 h-3" />}
            {step.label}
          </span>
        ))}
      </div>

      {percent < 100 && (
        <Link
          href={`/profile/edit`}
          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
        >
          Complete now <IconArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
