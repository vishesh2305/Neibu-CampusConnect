"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/userStore";
import {
  IconPlus,
  IconX,
  IconEye,
  IconHeart,
  IconCamera,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";

interface Story {
  _id: string;
  userId: string;
  userName: string;
  userImage?: string;
  mediaUrl: string;
  mediaType: "image" | "video" | "text";
  text?: string;
  bgColor?: string;
  viewsCount: number;
  viewers: string[];
  likes: string[];
  createdAt: string;
  expiresAt: string;
}

interface StoryGroup {
  userId: string;
  userName: string;
  userImage?: string;
  stories: Story[];
  hasUnviewed: boolean;
}

export default function Stories() {
  const { data: session } = useSession();
  const { socket } = useUserStore();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [creatorText, setCreatorText] = useState("");
  const [creatorBgColor, setCreatorBgColor] = useState("#1e40af");
  const [creatorFile, setCreatorFile] = useState<File | null>(null);
  const [creatorPreview, setCreatorPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const BG_COLORS = [
    "#1e40af", "#7c3aed", "#db2777", "#dc2626",
    "#ea580c", "#16a34a", "#0891b2", "#4f46e5",
    "#000000", "#1f2937",
  ];

  // Fetch stories
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch("/api/stories");
        if (res.ok) {
          const data = await res.json();
          setStoryGroups(data);
        }
      } catch (error) {
        console.error("Failed to fetch stories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  // Listen for new stories
  useEffect(() => {
    if (!socket) return;
    const handleNewStory = () => {
      fetch("/api/stories")
        .then((r) => r.json())
        .then(setStoryGroups)
        .catch(() => {});
    };
    socket.on("receive-new-story", handleNewStory);
    return () => { socket.off("receive-new-story", handleNewStory); };
  }, [socket]);

  // Story viewer progress
  useEffect(() => {
    if (activeGroup === null) return;

    setProgress(0);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    const duration = 5000; // 5 seconds per story
    const interval = 50;
    let elapsed = 0;

    progressTimerRef.current = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        nextStory();
      }
    }, interval);

    // Mark as viewed
    const group = storyGroups[activeGroup];
    if (group) {
      const story = group.stories[activeStoryIndex];
      if (story && story.userId !== session?.user?.id) {
        fetch(`/api/stories/${story._id}/view`, { method: "POST" }).catch(() => {});
      }
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [activeGroup, activeStoryIndex]);

  const nextStory = () => {
    if (activeGroup === null) return;
    const group = storyGroups[activeGroup];

    if (activeStoryIndex < group.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else if (activeGroup < storyGroups.length - 1) {
      setActiveGroup((prev) => (prev !== null ? prev + 1 : null));
      setActiveStoryIndex(0);
    } else {
      closeViewer();
    }
  };

  const prevStory = () => {
    if (activeGroup === null) return;

    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else if (activeGroup > 0) {
      setActiveGroup((prev) => (prev !== null ? prev - 1 : null));
      setActiveStoryIndex(0);
    }
  };

  const closeViewer = () => {
    setActiveGroup(null);
    setActiveStoryIndex(0);
    setProgress(0);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreatorFile(file);
      const reader = new FileReader();
      reader.onload = () => setCreatorPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const createStory = async () => {
    if (!session?.user) return;
    setCreating(true);

    try {
      const formData = new FormData();
      if (creatorFile) {
        formData.append("file", creatorFile);
        formData.append("mediaType", creatorFile.type.startsWith("video/") ? "video" : "image");
      } else {
        formData.append("mediaType", "text");
      }
      formData.append("text", creatorText);
      formData.append("bgColor", creatorBgColor);

      const res = await fetch("/api/stories", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newStory = await res.json();
        socket?.emit("new-story", newStory);
        setShowCreator(false);
        setCreatorText("");
        setCreatorFile(null);
        setCreatorPreview(null);
        // Refresh stories
        const storiesRes = await fetch("/api/stories");
        if (storiesRes.ok) setStoryGroups(await storiesRes.json());
      }
    } catch (error) {
      console.error("Failed to create story:", error);
    } finally {
      setCreating(false);
    }
  };

  const likeStory = async (storyId: string) => {
    try {
      await fetch(`/api/stories/${storyId}/like`, { method: "POST" });
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto py-4 px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-20 h-28 bg-[#1e1e2e] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Stories Bar */}
      <div className="relative mb-4">
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-hide">
          {/* Create Story */}
          <button
            onClick={() => setShowCreator(true)}
            className="flex-shrink-0 w-20 group"
          >
            <div className="w-20 h-28 rounded-xl bg-[#1e1e2e] border-2 border-dashed border-[#2e2e3e] flex flex-col items-center justify-center group-hover:border-emerald-500 transition-colors">
              <IconPlus className="w-6 h-6 text-gray-400 group-hover:text-emerald-500" />
            </div>
            <p className="text-xs text-gray-400 text-center mt-1 truncate">Your Story</p>
          </button>

          {/* Story Circles */}
          {storyGroups.map((group, idx) => (
            <button
              key={group.userId}
              onClick={() => { setActiveGroup(idx); setActiveStoryIndex(0); }}
              className="flex-shrink-0 w-20 group"
            >
              <div className={`w-20 h-28 rounded-xl overflow-hidden relative ${group.hasUnviewed ? "ring-2 ring-emerald-500" : "ring-1 ring-[#2e2e3e]"}`}>
                {group.stories[0]?.mediaType === "text" ? (
                  <div className="w-full h-full flex items-center justify-center p-2" style={{ backgroundColor: group.stories[0]?.bgColor || "#1e40af" }}>
                    <p className="text-white text-[10px] text-center line-clamp-3">{group.stories[0]?.text}</p>
                  </div>
                ) : (
                  <img src={group.stories[0]?.mediaUrl} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                  <div className="w-7 h-7 rounded-full border-2 border-[#16161e] overflow-hidden bg-[#2e2e3e]">
                    {group.userImage ? (
                      <img src={group.userImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold">
                        {group.userName?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-1 truncate">{group.userName?.split(" ")[0]}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Story Creator Modal */}
      {showCreator && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Create Story</h3>
              <button onClick={() => setShowCreator(false)} className="p-2 rounded-full hover:bg-[#1e1e2e]" aria-label="Close story creator">
                <IconX className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Preview */}
            <div
              className="w-full aspect-[9/16] rounded-2xl overflow-hidden mb-4 flex items-center justify-center relative"
              style={{ backgroundColor: creatorPreview ? "transparent" : creatorBgColor }}
            >
              {creatorPreview ? (
                <img src={creatorPreview} alt="" className="w-full h-full object-cover" />
              ) : null}
              {creatorText && (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <p className="text-white text-xl font-bold text-center">{creatorText}</p>
                </div>
              )}
              {!creatorPreview && !creatorText && (
                <p className="text-gray-400">Tap to add text or photo</p>
              )}
            </div>

            {/* Text input */}
            <input
              type="text"
              value={creatorText}
              onChange={(e) => setCreatorText(e.target.value)}
              placeholder="Add text to your story..."
              className="w-full px-4 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white placeholder-gray-500 mb-3"
              maxLength={200}
            />

            {/* Color picker */}
            {!creatorPreview && (
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {BG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCreatorBgColor(color)}
                    className={`w-8 h-8 rounded-full flex-shrink-0 border-2 ${creatorBgColor === color ? "border-white" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1e1e2e] hover:bg-[#2e2e3e] rounded-lg text-white transition-colors"
              >
                <IconCamera className="w-5 h-5" />
                Photo/Video
              </button>
              <button
                onClick={createStory}
                disabled={creating || (!creatorText && !creatorFile)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold transition-colors disabled:opacity-50"
              >
                {creating ? "Posting..." : "Share Story"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer */}
      {activeGroup !== null && storyGroups[activeGroup] && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative max-w-sm w-full h-full max-h-[90vh] mx-auto">
            {/* Progress bars */}
            <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
              {storyGroups[activeGroup].stories.map((_, idx) => (
                <div key={idx} className="flex-1 h-0.5 bg-[#2e2e3e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-100"
                    style={{
                      width: idx < activeStoryIndex ? "100%" : idx === activeStoryIndex ? `${progress}%` : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* User info */}
            <div className="absolute top-6 left-3 right-3 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2e2e3e] overflow-hidden">
                  {storyGroups[activeGroup].userImage ? (
                    <img src={storyGroups[activeGroup].userImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                      {storyGroups[activeGroup].userName?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-white text-sm font-semibold">{storyGroups[activeGroup].userName}</span>
                <span className="text-gray-400 text-xs">
                  {formatDistanceToNow(new Date(storyGroups[activeGroup].stories[activeStoryIndex]?.createdAt), { addSuffix: true })}
                </span>
              </div>
              <button onClick={closeViewer} className="p-1" aria-label="Close story viewer">
                <IconX className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Story Content */}
            {(() => {
              const story = storyGroups[activeGroup].stories[activeStoryIndex];
              if (!story) return null;

              if (story.mediaType === "text") {
                return (
                  <div
                    className="w-full h-full flex items-center justify-center p-8 rounded-xl"
                    style={{ backgroundColor: story.bgColor || "#1e40af" }}
                  >
                    <p className="text-white text-2xl font-bold text-center">{story.text}</p>
                  </div>
                );
              }

              return (
                <div className="w-full h-full rounded-xl overflow-hidden relative">
                  {story.mediaType === "video" ? (
                    <video src={story.mediaUrl} autoPlay muted loop className="w-full h-full object-cover" />
                  ) : (
                    <img src={story.mediaUrl} alt="" className="w-full h-full object-cover" />
                  )}
                  {story.text && (
                    <div className="absolute bottom-16 left-4 right-4">
                      <p className="text-white text-lg font-semibold text-center bg-black/40 rounded-lg px-4 py-2">{story.text}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Navigation */}
            <button onClick={prevStory} className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-full z-10" aria-label="Previous story" />
            <button onClick={nextStory} className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full z-10" aria-label="Next story" />

            {/* Footer */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <IconEye className="w-4 h-4" />
                {storyGroups[activeGroup].stories[activeStoryIndex]?.viewsCount || 0}
              </div>
              <button
                onClick={() => likeStory(storyGroups[activeGroup].stories[activeStoryIndex]?._id)}
                className="p-2 rounded-full hover:bg-white/10"
                aria-label="Like story"
              >
                <IconHeart className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
