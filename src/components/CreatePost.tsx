"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PutBlobResult } from "@vercel/blob";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { FileUpload } from "./ui/file-upload";
import { Button } from "./ui/stateful-button"; // 1. Import the stateful button

export default function CreatePost({ groupId }: { groupId?: string }) {
  const placeholders = [
    "What's on your mind?",
    "Share an update with your campus...",
    "Ask a question or start a discussion.",
    "What's new in your field of study?",
    "Post about an upcoming event or project.",
  ];

  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [fileUploadKey, setFileUploadKey] = useState(Date.now());

  const handleFileSelect = (files: File[]) => {
    setFile(files.length > 0 ? files[0] : null);
  };

  // 3. Update the handleSubmit function
  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement> | React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }

    if (loading) return; // Prevent multiple submissions

    if (!content.trim() && !file) {
      setError("Post must have text or an image.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let imageUrl: string | undefined;

      if (file) {
        const response = await fetch(
          `/api/avatar/upload?filename=${file.name}`,
          {
            method: "POST",
            body: file,
          }
        );

        if (!response.ok) throw new Error("Image upload failed.");
        const uploaded: PutBlobResult = await response.json();
        imageUrl = uploaded.url;
      }

      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, groupId, imageUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create post.");
      }

      setContent("");
      setFile(null);
      setFileUploadKey(Date.now()); // Reset the FileUpload component
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      // Re-throw the error to prevent the stateful button from showing a success state
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        className="gap-3"
      >
        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setContent(e.target.value)
          }
          onSubmit={() => handleSubmit()}
        />

<div className=" mt-2 flex items-end justify-evenly">
        <FileUpload  key={fileUploadKey} onChange={handleFileSelect} />

        {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            onClick={handleSubmit}
            className=" px-4 py-2 text-sm font-medium text-black hover:text-white transition-colors bg-white hover:bg-black  "
          >
            Post
          </Button>

        </div>
      </form>
    </div>
  );
}