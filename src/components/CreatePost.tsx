// src/components/CreatePost.tsx

"use client";

import { useState } from "react";
import type { PutBlobResult } from "@vercel/blob";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { FileUpload } from "./ui/file-upload";
import { Button } from "./ui/stateful-button";
import { PlusCircleIcon, TrashIcon, Bars3BottomLeftIcon } from '@heroicons/react/24/solid';
import { useUserStore } from "@/store/userStore";

export default function CreatePost({ groupId }: { groupId?: string }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileUploadKey, setFileUploadKey] = useState(Date.now());
  const { socket, session } = useUserStore();
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const handleFileSelect = (files: File[]) => setFile(files.length > 0 ? files[0] : null);
  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };
  const addPollOption = () => pollOptions.length < 5 && setPollOptions([...pollOptions, '']);
  const removePollOption = (index: number) => pollOptions.length > 2 && setPollOptions(pollOptions.filter((_, i) => i !== index));

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement> | React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (loading) return;
    if (!content.trim() && !file && !(showPollCreator && pollOptions.every(opt => opt.trim()))) {
      setError("Post must have text, image, or a valid poll.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let imageUrl: string | undefined;
      if (file) {
        const response = await fetch(`/api/avatar/upload?filename=${file.name}`, { method: "POST", body: file });
        if (!response.ok) throw new Error("Image upload failed.");
        const uploaded: PutBlobResult = await response.json();
        imageUrl = uploaded.url;
      }

      const postData: { content: string; groupId?: string; imageUrl?: string; pollOptions?: string[] } = { content, groupId, imageUrl };
      if (showPollCreator && pollOptions.every(opt => opt.trim().length > 0)) postData.pollOptions = pollOptions;

      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create post.");
      }

      const newPost = await res.json();
      if (socket && session?.user?.id) {
        socket.emit('send-new-post', newPost, session.user.id);
      }

      setContent("");
      setFile(null);
      setPollOptions(['', '']);
      setShowPollCreator(false);
      setFileUploadKey(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="gap-3">
        <PlaceholdersAndVanishInput
          placeholders={["What's on your mind?", "Ask a question and create a poll..."]}
          onChange={(e) => setContent(e.target.value)}
          onSubmit={() => {}}
        />

        {showPollCreator && (
          <div className="my-4 p-4 border border-gray-700 rounded-lg space-y-3">
            {pollOptions.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handlePollOptionChange(index, e.target.value)}
                  className="flex-grow bg-gray-700 border-gray-600 rounded-md p-2 focus:ring-blue-500"
                />
                {pollOptions.length > 2 && (
                  <button type="button" onClick={() => removePollOption(index)}>
                    <TrashIcon className="h-5 w-5 text-red-500" />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 5 && (
              <button type="button" onClick={addPollOption} className="flex items-center gap-2 text-blue-500">
                <PlusCircleIcon className="h-5 w-5" />
                <span>Add Option</span>
              </button>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-evenly">
          <div className="flex gap-4 w-1/2 justify-evenly items-center">
            <FileUpload key={fileUploadKey} onChange={handleFileSelect} />
            <button
              type="button"
              onClick={() => setShowPollCreator(!showPollCreator)}
              title="Create a poll"
              className="p-2 rounded-full hover:bg-gray-700"
            >
              <Bars3BottomLeftIcon className={`h-6 w-6 ${showPollCreator ? 'text-blue-500' : 'text-gray-400'}`} />
            </button>
          </div>

          <Button>Post</Button>
        </div>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
}