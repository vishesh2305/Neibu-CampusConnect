// src/components/CreatePost.tsx

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { PutBlobResult } from '@vercel/blob';
import { PhotoIcon, XCircleIcon } from '@heroicons/react/24/solid';
import Image from "next/image";

export default function CreatePost({ groupId }: { groupId?: string }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const removeImage = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file) {
      setError("Post must have text or an image.");
      return;
    }
    setLoading(true);
    setError("");
    
    let imageUrl: string | undefined = undefined;

    try {
      // Step 1: Upload image if a file is selected
      if (file) {
        const response = await fetch(`/api/avatar/upload?filename=${file.name}`, {
          method: 'POST',
          body: file,
        });
        if (!response.ok) throw new Error('Image upload failed.');
        const newBlob = (await response.json()) as PutBlobResult;
        imageUrl = newBlob.url;
      }

      // Step 2: Create the post with content and optional imageUrl
      const body = JSON.stringify({ content, groupId, imageUrl });
      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        setContent("");
        removeImage();
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to create post.");
      }
} catch (err: unknown) {
  if (err instanceof Error) {
    setError("An error occurred: " + err.message);
  } else {
    setError("An unknown error occurred.");
  }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md mb-8">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={groupId ? "Post to the group..." : "What's on your mind?"}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
          rows={3}
        />
        
        {previewUrl && (
          <div className="mt-4 relative">
            <Image fill src={previewUrl} alt="Image preview" className="rounded-lg max-h-80 w-auto" />
            <button onClick={removeImage} className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white hover:bg-black/75">
              <XCircleIcon className="h-6 w-6"/>
            </button>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        <div className="flex justify-between items-center mt-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" id="file-upload"/>
          <label htmlFor="file-upload" className="cursor-pointer text-gray-400 hover:text-blue-500">
            <PhotoIcon className="h-6 w-6"/>
          </label>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-50">
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}