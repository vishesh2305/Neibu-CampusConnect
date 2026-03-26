"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { MapPinIcon, ClockIcon } from "@heroicons/react/24/solid";
import RsvpButton from "./RsvpButton";
import { EventCardSkeleton } from "./ui/skeleton";

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  rsvpCount: number;
  hasRsvpd: boolean;
}

export default function EventList() {
  const { socket } = useUserStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Real-time: listen for new events
  useEffect(() => {
    if (!socket) return;

    const handleNewEvent = (event: Event) => {
      setEvents((prev) => {
        if (prev.some((e) => e._id === event._id)) return prev;
        return [event, ...prev];
      });
    };

    socket.on("receive-new-event", handleNewEvent);
    return () => {
      socket.off("receive-new-event", handleNewEvent);
    };
  }, [socket]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-white">Upcoming Events</h2>
      <div className="space-y-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)
          : events.map((event) => (
              <div
                key={event._id}
                className="p-5 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl hover:border-amber-500/30 transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">{event.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                  </div>
                  <RsvpButton
                    eventId={event._id}
                    initialRsvpCount={event.rsvpCount}
                    hasRsvpd={event.hasRsvpd}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-3 border-t border-[#2e2e3e] pt-3">
                  <span className="flex items-center gap-1.5 text-amber-400/80">
                    <ClockIcon className="h-4 w-4" />{" "}
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    at {event.time}
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400/80">
                    <MapPinIcon className="h-4 w-4" /> {event.location}
                  </span>
                </div>
              </div>
            ))}
        {!loading && events.length === 0 && (
          <p className="text-center text-gray-500 pt-8">
            No upcoming events. Create one to get started!
          </p>
        )}
      </div>
    </div>
  );
}
