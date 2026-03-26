"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/userStore";
import {
  IconPhoneOff,
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconScreenShare,
  IconScreenShareOff,
  IconMaximize,
  IconMinimize,
} from "@tabler/icons-react";
import Image from "next/image";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

interface VideoCallProps {
  targetUserId: string;
  targetUserName: string;
  targetUserImage?: string;
  callType?: "video" | "audio";
  isIncoming?: boolean; // true = callee answering, false = caller initiating
  roomId?: string; // provided when answering an incoming call
  onClose: () => void;
}

export default function VideoCall({
  targetUserId,
  targetUserName,
  targetUserImage,
  callType = "video",
  isIncoming = false,
  roomId: incomingRoomId,
  onClose,
}: VideoCallProps) {
  const { data: session } = useSession();
  const { socket } = useUserStore();
  const [callState, setCallState] = useState<
    "idle" | "calling" | "ringing" | "connected" | "ended"
  >(isIncoming ? "connected" : "idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteMediaState, setRemoteMediaState] = useState({
    audio: true,
    video: callType === "video",
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaReadyResolveRef = useRef<(() => void) | null>(null);
  const mediaReadyPromiseRef = useRef<Promise<void>>(new Promise((resolve) => { mediaReadyResolveRef.current = resolve; }));
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef<string>(incomingRoomId || "");
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callStateRef = useRef(callState); // Track state in ref to avoid stale closures
  const mountedRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false); // Prevent double-start in strict mode

  // Keep ref in sync with state
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const cleanupMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc-ice-candidate", {
          roomId: roomIdRef.current,
          candidate: event.candidate.toJSON(),
          targetUserId,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        if (mountedRef.current) {
          setCallState("ended");
          cleanupMedia();
        }
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, targetUserId, cleanupMedia]);

  // === CALLER: Initiate the call ===
  const startCall = useCallback(async () => {
    if (!socket || !session?.user || startedRef.current) return;
    startedRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      mediaReadyResolveRef.current?.();

      roomIdRef.current = `call_${session.user.id}_${targetUserId}_${Date.now()}`;
      setCallState("calling");

      socket.emit("call-user", {
        callerId: session.user.id,
        callerName: session.user.name,
        callerImage: session.user.image,
        calleeId: targetUserId,
        roomId: roomIdRef.current,
        callType,
      });

      // Auto-timeout after 45 seconds (use ref to check current state)
      setTimeout(() => {
        if (callStateRef.current === "calling" && mountedRef.current) {
          socket.emit("end-call", { roomId: roomIdRef.current });
          setCallState("ended");
          cleanupMedia();
        }
      }, 45000);
    } catch (err) {
      console.error("Failed to access media devices:", err);
      if (mountedRef.current) setCallState("ended");
    }
  }, [socket, session, targetUserId, callType, cleanupMedia]);

  // === CALLEE: Get media when answering ===
  const setupLocalMedia = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      console.log("[VideoCall] Callee media ready, tracks:", stream.getTracks().length);
      mediaReadyResolveRef.current?.();
    } catch (err) {
      console.error("Failed to access media devices:", err);
      mediaReadyResolveRef.current?.(); // Resolve anyway so we don't block forever
    }
  }, [callType]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = async (data: { roomId: string }) => {
      console.log("[VideoCall] Call accepted, creating offer. Room:", data.roomId, "Target:", targetUserId);
      roomIdRef.current = data.roomId;
      const pc = createPeerConnection();
      socket.emit("join-call-room", data.roomId);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
      } else {
        console.warn("[VideoCall] No local stream when creating offer!");
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("[VideoCall] Sending offer to:", targetUserId);
      socket.emit("webrtc-offer", { roomId: data.roomId, offer, targetUserId });

      if (mountedRef.current) {
        setCallState("connected");
        callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
      }
    };

    const handleCallRejected = () => {
      if (mountedRef.current) { setCallState("ended"); cleanupMedia(); }
    };

    const handleCallFailed = () => {
      if (mountedRef.current) { setCallState("ended"); cleanupMedia(); }
    };

    const handleOffer = async (data: { offer: RTCSessionDescriptionInit; roomId: string; senderId: string }) => {
      console.log("[VideoCall] Received offer from:", data.senderId, "Waiting for media...");
      // Wait for local media to be ready before creating answer
      await mediaReadyPromiseRef.current;
      console.log("[VideoCall] Media ready. Creating peer connection.");

      const pc = createPeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
        console.log("[VideoCall] Added", localStreamRef.current.getTracks().length, "local tracks to PC");
      } else {
        console.warn("[VideoCall] No local stream when handling offer!");
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("[VideoCall] Sending answer to:", data.senderId);
      socket.emit("webrtc-answer", { roomId: data.roomId, answer, targetUserId: data.senderId });

      if (mountedRef.current && !callTimerRef.current) {
        setCallState("connected");
        callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
      }
    };

    const handleAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      console.log("[VideoCall] Received answer, setting remote description");
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    const handleCallEnded = () => {
      if (mountedRef.current) { setCallState("ended"); cleanupMedia(); }
    };

    const handleRemoteMediaToggle = (data: { type: "audio" | "video"; enabled: boolean }) => {
      if (mountedRef.current) setRemoteMediaState((prev) => ({ ...prev, [data.type]: data.enabled }));
    };

    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-failed", handleCallFailed);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);
    socket.on("remote-media-toggle", handleRemoteMediaToggle);

    return () => {
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-failed", handleCallFailed);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      socket.off("remote-media-toggle", handleRemoteMediaToggle);
    };
  }, [socket, targetUserId, createPeerConnection, cleanupMedia]);

  // Init: start call (caller) or setup media (callee)
  useEffect(() => {
    if (isIncoming) {
      setupLocalMedia();
    } else {
      startCall();
    }
    // NO cleanup that emits end-call here — that caused the strict-mode bug
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endCall = () => {
    if (socket && roomIdRef.current) {
      socket.emit("end-call", { roomId: roomIdRef.current });
    }
    setCallState("ended");
    cleanupMedia();
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        socket?.emit("toggle-media", { roomId: roomIdRef.current, type: "audio", enabled: audioTrack.enabled });
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        socket?.emit("toggle-media", { roomId: roomIdRef.current, type: "video", enabled: videoTrack.enabled });
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;
    if (isScreenSharing) {
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(videoTrack);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    }
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!isFullScreen) containerRef.current.requestFullscreen?.();
    else document.exitFullscreen?.();
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
      <div className="relative w-full h-full">
        {callState === "connected" ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="relative w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-4 overflow-hidden">
              {targetUserImage ? (
                <Image src={targetUserImage} alt={targetUserName} fill className="object-cover" />
              ) : (
                <span className="text-3xl text-white font-bold">{targetUserName?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <h2 className="text-white text-2xl font-semibold mb-2">{targetUserName}</h2>
            <p className="text-gray-400 text-lg">
              {callState === "calling" && "Calling..."}
              {callState === "ringing" && "Ringing..."}
              {callState === "ended" && "Call ended"}
              {callState === "idle" && "Connecting..."}
            </p>
            {callState === "calling" && (
              <div className="mt-4 flex space-x-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            )}
          </div>
        )}

        {/* Local Video PIP */}
        <div className="absolute top-4 right-4 w-40 h-28 md:w-52 md:h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <IconVideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {callState === "connected" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-1 rounded-full">
            <span className="text-white text-sm font-mono">{formatDuration(callDuration)}</span>
          </div>
        )}

        {callState === "connected" && !remoteMediaState.audio && (
          <div className="absolute top-4 left-4 bg-red-500/80 px-3 py-1 rounded-full flex items-center gap-1">
            <IconMicrophoneOff className="w-4 h-4 text-white" />
            <span className="text-white text-xs">Muted</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}
          className={`p-4 rounded-full transition-colors ${isMuted ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}>
          {isMuted ? <IconMicrophoneOff className="w-6 h-6 text-white" /> : <IconMicrophone className="w-6 h-6 text-white" />}
        </button>

        {callType === "video" && (
          <button onClick={toggleVideo} aria-label={isVideoOff ? "Camera on" : "Camera off"}
            className={`p-4 rounded-full transition-colors ${isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"}`}>
            {isVideoOff ? <IconVideoOff className="w-6 h-6 text-white" /> : <IconVideo className="w-6 h-6 text-white" />}
          </button>
        )}

        {callType === "video" && (
          <button onClick={toggleScreenShare} aria-label={isScreenSharing ? "Stop sharing" : "Share screen"}
            className={`p-4 rounded-full transition-colors ${isScreenSharing ? "bg-emerald-500 hover:bg-emerald-600" : "bg-gray-700 hover:bg-gray-600"}`}>
            {isScreenSharing ? <IconScreenShareOff className="w-6 h-6 text-white" /> : <IconScreenShare className="w-6 h-6 text-white" />}
          </button>
        )}

        <button onClick={toggleFullScreen} aria-label="Fullscreen" className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
          {isFullScreen ? <IconMinimize className="w-6 h-6 text-white" /> : <IconMaximize className="w-6 h-6 text-white" />}
        </button>

        <button onClick={endCall} aria-label="End call" className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors">
          <IconPhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}
