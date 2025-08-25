"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { PutBlobResult } from '@vercel/blob';
import Image from "next/image";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import DeleteAccountZone from "@/components/DeleteAccountZone";
import { Delete } from "lucide-react";

type UserProfile = {
  name: string;
  major?: string;
  year?: number;
  image?: string;
};
type ExtendedUser = {
  name?: string;
  email?: string;
  image?: string;
  major?: string;
  year?: number;
};


export default function EditProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UserProfile>({
    name: "",
    major: "",
    year: undefined,
    image: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setFormData({
        name: session.user.name || "",
        major: (session.user as ExtendedUser).major || "",
        year: (session.user as ExtendedUser).year || undefined,
        image: session.user.image || "",
      });
    }
  }, [session, status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "year" ? (value === "" ? undefined : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    let newImageUrl = formData.image;


    if (inputFileRef.current?.files && inputFileRef.current.files[0]) {
      const file = inputFileRef.current.files[0];
      try {
        const response = await fetch(
          `/api/avatar/upload?filename=${file.name}`,
          {
            method: 'POST',
            body: file,
          },
        );
        const newBlob = (await response.json()) as PutBlobResult;
        newImageUrl = newBlob.url;
      } catch {
        setError("Failed to upload image.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, image: newImageUrl }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile.");
      }

      setSuccess("Profile updated successfully!");

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          image: newImageUrl,
        }
      });

      router.refresh();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
    }
    finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6  p-8 rounded-lg">

        <div>
          <label className="block text-sm font-medium text-gray-300">Profile Picture</label>
          <div className="mt-2 flex items-center gap-x-4">
            {formData.image ? (
              <Image src={formData.image} height={10} width={10} alt="Current avatar" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-600 flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
            <input type="file" name="avatar" ref={inputFileRef} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
          </div>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Full Name</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2" />
        </div>
        <div>
          <label htmlFor="major" className="block text-sm font-medium text-gray-300">Major</label>
          <input type="text" name="major" id="major" placeholder="e.g., Computer Science" value={formData.major} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2" />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-300">Graduation Year</label>
          <input type="number" name="year" id="year" placeholder="e.g., 2025" value={formData.year || ""} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2" />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium text-white transition-colors disabled:opacity-50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
      <ChangePasswordForm />
      <DeleteAccountZone />
    </div>
  );
}