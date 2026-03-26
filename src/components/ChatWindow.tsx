"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/userStore";
import {
  IconSend,
  IconMoodSmile,
  IconMicrophone,
  IconVideo,
  IconPhone,
  IconCheck,
  IconChecks,
  IconArrowBackUp,
  IconX,
  IconPlayerStop,
  IconPaperclip,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import VideoCall from "./VideoCall";

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderImage?: string;
  text: string;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
  replyTo?: { _id: string; text: string; senderName: string };
  mediaUrl?: string;
  mediaType?: "image" | "voice" | "file";
  reactions?: Array<{ userId: string; emoji: string }>;
}

interface ChatWindowProps {
  conversationId: string;
  recipientId?: string;
  recipientName?: string;
  recipientImage?: string;
}

export default function ChatWindow({
  conversationId,
  recipientId,
  recipientName,
  recipientImage,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callType, setCallType] = useState<"video" | "audio">("video");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] =
    useState<string | null>(null);

  const { data: session } = useSession();
  const { socket } = useUserStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const COMMON_EMOJIS = [
    "👍",
    "❤️",
    "😂",
    "😮",
    "😢",
    "🔥",
    "🎉",
    "👏",
  ];

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages/${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          // Mark messages as read
          const unreadIds = data
            .filter(
              (m: Message) =>
                m.senderId !== session?.user?.id && m.status !== "read"
            )
            .map((m: Message) => m._id);
          if (unreadIds.length > 0 && socket) {
            socket.emit("messages-read", {
              conversationId,
              userId: session?.user?.id,
              messageIds: unreadIds,
            });
            // Also update DB
            fetch(`/api/messages/${conversationId}/read`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageIds: unreadIds }),
            }).catch(() => {});
          }
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [conversationId, session?.user?.id, socket]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    // Join room immediately and also on reconnect
    socket.emit("join-conversation", conversationId);
    const handleReconnect = () => {
      socket.emit("join-conversation", conversationId);
    };
    socket.on("connect", handleReconnect);

    const handleReceiveMessage = (message: Message) => {
      setMessages((prev) => {
        // Prevent duplicate messages (optimistic + real)
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      // Auto mark as read
      if (message.senderId !== session?.user?.id) {
        socket.emit("messages-read", {
          conversationId,
          userId: session?.user?.id,
          messageIds: [message._id],
        });
      }
    };

    const handleTyping = (data: {
      userId: string;
      userName: string;
      conversationId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setTypingUser(data.userName);
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data: {
      userId: string;
      conversationId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setIsTyping(false);
        setTypingUser(null);
      }
    };

    const handleReadReceipt = (data: {
      messageIds: string[];
      conversationId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg._id)
              ? { ...msg, status: "read" }
              : msg
          )
        );
      }
    };

    const handleDelivered = (data: {
      messageId: string;
      conversationId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId ? { ...msg, status: "delivered" } : msg
          )
        );
      }
    };

    const handleReaction = (data: {
      messageId: string;
      userId: string;
      emoji: string;
      conversationId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg._id !== data.messageId) return msg;
            const reactions = msg.reactions || [];
            const existingIdx = reactions.findIndex(
              (r) => r.userId === data.userId
            );
            if (existingIdx >= 0) {
              reactions[existingIdx].emoji = data.emoji;
            } else {
              reactions.push({ userId: data.userId, emoji: data.emoji });
            }
            return { ...msg, reactions };
          })
        );
      }
    };

    const handleStatusChange = (data: {
      userId: string;
      isOnline: boolean;
    }) => {
      if (data.userId === recipientId) {
        setIsOnline(data.isOnline);
        if (!data.isOnline) {
          setLastSeen(new Date().toISOString());
        }
      }
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("user-typing", handleTyping);
    socket.on("user-stopped-typing", handleStopTyping);
    socket.on("messages-read-receipt", handleReadReceipt);
    socket.on("message-delivered", handleDelivered);
    socket.on("receive-reaction", handleReaction);
    socket.on("user-status-change", handleStatusChange);

    // Check online status
    if (recipientId) {
      socket.emit("get-online-users", [recipientId]);
      socket.on(
        "online-users-status",
        (statuses: Record<string, boolean>) => {
          if (recipientId in statuses) {
            setIsOnline(statuses[recipientId]);
          }
        }
      );
    }

    return () => {
      socket.emit("leave-conversation", conversationId);
      socket.off("connect", handleReconnect);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("user-typing", handleTyping);
      socket.off("user-stopped-typing", handleStopTyping);
      socket.off("messages-read-receipt", handleReadReceipt);
      socket.off("message-delivered", handleDelivered);
      socket.off("receive-reaction", handleReaction);
      socket.off("user-status-change", handleStatusChange);
    };
  }, [socket, conversationId, session?.user?.id, recipientId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing indicator
  const handleTypingInput = (value: string) => {
    setNewMessage(value);
    if (!socket || !session?.user) return;

    socket.emit("typing-start", {
      conversationId,
      userId: session.user.id,
      userName: session.user.name,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing-stop", {
        conversationId,
        userId: session.user!.id,
      });
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !session?.user) return;

    const optimisticMessage: Message = {
      _id: Date.now().toString(),
      conversationId,
      senderId: session.user.id,
      senderName: session.user.name || "",
      text: newMessage,
      createdAt: new Date().toISOString(),
      status: "sent",
      replyTo: replyingTo
        ? {
            _id: replyingTo._id,
            text: replyingTo.text,
            senderName: replyingTo.senderName || "",
          }
        : undefined,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setReplyingTo(null);

    // Stop typing
    if (socket) {
      socket.emit("typing-stop", {
        conversationId,
        userId: session.user.id,
      });
    }

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newMessage,
          replyTo: replyingTo?._id,
        }),
      });

      if (res.ok) {
        const savedMessage = await res.json();
        socket?.emit("send-message", { ...savedMessage, conversationId });
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === optimisticMessage._id ? savedMessage : msg
          )
        );
      } else {
        setMessages((prev) =>
          prev.filter((msg) => msg._id !== optimisticMessage._id)
        );
      }
    } catch {
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== optimisticMessage._id)
      );
    }
  };

  // Send media
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", conversationId);

    try {
      const res = await fetch(`/api/messages/${conversationId}/media`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const savedMessage = await res.json();
        setMessages((prev) => [...prev, savedMessage]);
        socket?.emit("send-message", { ...savedMessage, conversationId });
      }
    } catch (err) {
      console.error("Failed to upload media:", err);
    }
  };

  // Voice message
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        stream.getTracks().forEach((t) => t.stop());

        const formData = new FormData();
        formData.append("file", audioBlob, "voice-message.webm");
        formData.append("conversationId", conversationId);
        formData.append("mediaType", "voice");

        try {
          const res = await fetch(`/api/messages/${conversationId}/media`, {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const savedMessage = await res.json();
            setMessages((prev) => [...prev, savedMessage]);
            socket?.emit("send-message", { ...savedMessage, conversationId });
          }
        } catch {}
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // Emoji reaction
  const addReaction = (messageId: string, emoji: string) => {
    if (!socket || !session?.user) return;
    socket.emit("message-reaction", {
      conversationId,
      messageId,
      userId: session.user.id,
      emoji,
    });
    setSelectedMessageForReaction(null);
  };

  // Start call
  const startVideoCall = (type: "video" | "audio") => {
    setCallType(type);
    setShowVideoCall(true);
  };

  // Message status icon
  const renderStatus = (status?: string) => {
    switch (status) {
      case "read":
        return <IconChecks className="w-4 h-4 text-blue-400" />;
      case "delivered":
        return <IconChecks className="w-4 h-4 text-gray-400" />;
      case "sent":
      default:
        return <IconCheck className="w-4 h-4 text-gray-400" />;
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups: Record<string, Message[]>, msg) => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
      return groups;
    },
    {}
  );

  if (showVideoCall && recipientId && recipientName) {
    return (
      <VideoCall
        targetUserId={recipientId}
        targetUserName={recipientName}
        targetUserImage={recipientImage}
        callType={callType}
        onClose={() => setShowVideoCall(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2e2e3e] bg-[#1e1e2e]/50 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#2e2e3e] overflow-hidden flex items-center justify-center">
              {recipientImage ? (
                <img
                  src={recipientImage}
                  alt={recipientName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold">
                  {recipientName?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
            {isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1e1e2e]" />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">
              {recipientName || "Chat"}
            </h3>
            <p className="text-xs text-gray-400">
              {isTyping
                ? `${typingUser || "Someone"} is typing...`
                : isOnline
                  ? "Online"
                  : lastSeen
                    ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`
                    : "Offline"}
            </p>
          </div>
        </div>

        {recipientId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => startVideoCall("audio")}
              className="p-2 rounded-full hover:bg-[#2e2e3e] transition-colors"
              title="Voice call"
            >
              <IconPhone className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => startVideoCall("video")}
              className="p-2 rounded-full hover:bg-[#2e2e3e] transition-colors"
              title="Video call"
            >
              <IconVideo className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg">No messages yet</p>
            <p className="text-sm">Say hello!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-[#1e1e2e] rounded-full text-xs text-gray-400">
                  {new Date(date).toDateString() ===
                  new Date().toDateString()
                    ? "Today"
                    : date}
                </span>
              </div>

              {msgs.map((msg) => {
                const isMine = msg.senderId === session?.user?.id;
                return (
                  <div key={msg._id} className="group relative">
                    <div
                      className={`flex my-1 ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isMine
                            ? "bg-violet-600 text-white rounded-br-md"
                            : "bg-[#1e1e2e] text-gray-200 rounded-bl-md"
                        }`}
                        onDoubleClick={() =>
                          setSelectedMessageForReaction(msg._id)
                        }
                      >
                        {/* Reply preview */}
                        {msg.replyTo && (
                          <div
                            className={`text-xs mb-1 p-2 rounded-lg border-l-2 ${
                              isMine
                                ? "bg-violet-700/50 border-violet-300"
                                : "bg-[#2e2e3e]/50 border-gray-400"
                            }`}
                          >
                            <span className="font-semibold">
                              {msg.replyTo.senderName}
                            </span>
                            <p className="truncate opacity-80">
                              {msg.replyTo.text}
                            </p>
                          </div>
                        )}

                        {/* Media */}
                        {msg.mediaType === "image" && msg.mediaUrl && (
                          <img
                            src={msg.mediaUrl}
                            alt="Shared image"
                            className="rounded-lg max-w-full mb-1"
                          />
                        )}

                        {msg.mediaType === "voice" && msg.mediaUrl && (
                          <audio
                            controls
                            className="max-w-full"
                            src={msg.mediaUrl}
                          />
                        )}

                        {/* Text */}
                        {msg.text && <p className="text-sm">{msg.text}</p>}

                        {/* Time + Status */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span
                            className={`text-[10px] ${isMine ? "text-violet-200" : "text-gray-400"}`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMine && renderStatus(msg.status)}
                        </div>

                        {/* Reactions */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="absolute -bottom-3 left-2 flex gap-0.5">
                            {msg.reactions.map((r, i) => (
                              <span
                                key={i}
                                className="text-xs bg-[#1e1e2e] rounded-full px-1 border border-[#2e2e3e]"
                              >
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick actions */}
                      <div
                        className={`hidden group-hover:flex items-center gap-1 ${isMine ? "mr-2 flex-row-reverse" : "ml-2"}`}
                      >
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="p-1 rounded-full hover:bg-[#2e2e3e]"
                          title="Reply"
                          aria-label="Reply to message"
                        >
                          <IconArrowBackUp className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() =>
                            setSelectedMessageForReaction(msg._id)
                          }
                          className="p-1 rounded-full hover:bg-[#2e2e3e]"
                          title="React"
                          aria-label="Add reaction"
                        >
                          <IconMoodSmile className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Reaction picker */}
                    {selectedMessageForReaction === msg._id && (
                      <div
                        className={`flex items-center gap-1 py-1 px-2 bg-[#1e1e2e] rounded-full shadow-lg w-fit mx-auto my-1 ${isMine ? "ml-auto mr-4" : "ml-4"}`}
                      >
                        {COMMON_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(msg._id, emoji)}
                            className="hover:scale-125 transition-transform text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => setSelectedMessageForReaction(null)}
                          className="ml-1 p-0.5 rounded-full hover:bg-[#2e2e3e]"
                          aria-label="Close reaction picker"
                        >
                          <IconX className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 py-2">
            <div className="flex gap-1 px-4 py-2 bg-[#1e1e2e] rounded-2xl">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyingTo && (
        <div className="px-4 py-2 border-t border-[#2e2e3e] bg-[#1e1e2e]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-violet-500 rounded-full" />
            <div>
              <p className="text-xs text-violet-400 font-semibold">
                {replyingTo.senderId === session?.user?.id
                  ? "You"
                  : replyingTo.senderName}
              </p>
              <p className="text-xs text-gray-400 truncate max-w-[200px]">
                {replyingTo.text}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full hover:bg-[#2e2e3e]"
            aria-label="Cancel reply"
          >
            <IconX className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t border-[#2e2e3e]">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-[#2e2e3e] transition-colors"
            aria-label="Attach file"
          >
            <IconPaperclip className="h-5 w-5 text-gray-400" />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => handleTypingInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-white placeholder-gray-400 text-sm"
          />

          {/* Voice message or Send */}
          {newMessage.trim() ? (
            <button
              type="submit"
              className="p-2 bg-violet-600 rounded-full text-white hover:bg-violet-500 transition-colors"
              aria-label="Send message"
            >
              <IconSend className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={() => isRecording && stopRecording()}
              className={`p-2 rounded-full transition-colors ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-[#2e2e3e] hover:bg-[#3e3e4e]"
              }`}
              aria-label={isRecording ? "Stop recording" : "Record voice message"}
            >
              {isRecording ? (
                <IconPlayerStop className="h-5 w-5 text-white" />
              ) : (
                <IconMicrophone className="h-5 w-5 text-gray-400" />
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
