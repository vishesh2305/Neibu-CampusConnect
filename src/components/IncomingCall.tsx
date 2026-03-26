"use client";

import { useState, useEffect, useRef } from "react";
import { useUserStore } from "@/store/userStore";
import { IconPhone, IconPhoneOff } from "@tabler/icons-react";
import Image from "next/image";
import VideoCall from "./VideoCall";

interface IncomingCallData {
  callerId: string;
  callerName: string;
  callerImage?: string;
  roomId: string;
  callType: "video" | "audio";
}

export default function IncomingCallHandler() {
  const { socket } = useUserStore();
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [activeCall, setActiveCall] = useState<IncomingCallData | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: IncomingCallData) => {
      // Don't show if already in a call
      if (activeCall) {
        socket.emit("reject-call", { roomId: data.roomId, callerId: data.callerId, reason: "User is busy" });
        return;
      }
      setIncomingCall(data);
      // Ringtone is optional — no 404 spam if file doesn't exist
    };

    socket.on("incoming-call", handleIncomingCall);
    return () => { socket.off("incoming-call", handleIncomingCall); };
  }, [socket, activeCall]);

  const acceptCall = () => {
    if (!incomingCall || !socket) return;
    ringtoneRef.current?.pause();

    socket.emit("accept-call", {
      roomId: incomingCall.roomId,
      callerId: incomingCall.callerId,
    });
    socket.emit("join-call-room", incomingCall.roomId);

    setActiveCall(incomingCall);
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (!incomingCall || !socket) return;
    ringtoneRef.current?.pause();

    socket.emit("reject-call", {
      roomId: incomingCall.roomId,
      callerId: incomingCall.callerId,
      reason: "Call declined",
    });
    setIncomingCall(null);
  };

  if (activeCall) {
    return (
      <VideoCall
        targetUserId={activeCall.callerId}
        targetUserName={activeCall.callerName}
        targetUserImage={activeCall.callerImage}
        callType={activeCall.callType}
        isIncoming={true}
        roomId={activeCall.roomId}
        onClose={() => setActiveCall(null)}
      />
    );
  }

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
      <div className="bg-[#1e1e2e] rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-[#2e2e3e]">
        <div className="relative mx-auto w-24 h-24 mb-4">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-[#2e2e3e] overflow-hidden flex items-center justify-center">
            {incomingCall.callerImage ? (
              <Image src={incomingCall.callerImage} alt={incomingCall.callerName} fill className="object-cover" />
            ) : (
              <span className="text-3xl text-white font-bold">{incomingCall.callerName?.[0]?.toUpperCase()}</span>
            )}
          </div>
        </div>

        <h3 className="text-white text-xl font-semibold mb-1">{incomingCall.callerName}</h3>
        <p className="text-gray-400 mb-6">Incoming {incomingCall.callType} call...</p>

        <div className="flex justify-center gap-8">
          <button onClick={rejectCall} aria-label="Reject call"
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all hover:scale-110">
            <IconPhoneOff className="w-8 h-8 text-white" />
          </button>
          <button onClick={acceptCall} aria-label="Accept call"
            className="p-4 rounded-full bg-emerald-600 hover:bg-emerald-700 transition-all hover:scale-110 animate-pulse">
            <IconPhone className="w-8 h-8 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
