"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/userStore";
import {
  IconMapPin,
  IconRadar2,
  IconUser,
  IconMessage,
  IconRefresh,
  IconShieldLock,
  IconWifi,
  IconBluetooth,
} from "@tabler/icons-react";
import Link from "next/link";

interface NearbyUser {
  userId: string;
  distance: number; // meters
  name?: string;
  image?: string;
  major?: string;
}

export default function NearbyUsers() {
  const { data: session } = useSession();
  const { socket } = useUserStore();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [radiusKm, setRadiusKm] = useState(1); // Default 1km
  const [error, setError] = useState<string | null>(null);
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [discoveryMode, setDiscoveryMode] = useState<"gps" | "bluetooth">(
    "gps"
  );
  const [bluetoothDevices, setBluetoothDevices] = useState<Array<{ name: string; id: string }>>([]);
  const [, setIsScanning] = useState(false);

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  const discoverNearby = useCallback(() => {
    if (!socket || !session?.user || !myLocation) return;

    setLoading(true);
    socket.emit("discover-nearby", {
      userId: session.user.id,
      lat: myLocation.lat,
      lng: myLocation.lng,
      radiusKm,
    });
  }, [socket, session, myLocation, radiusKm]);

  // Enable location
  const enableLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation({ lat: latitude, lng: longitude });
        setLocationEnabled(true);
        setError(null);
        setLoading(false);

        // Update server with location
        if (socket && session?.user) {
          socket.emit("update-location", {
            userId: session.user.id,
            lat: latitude,
            lng: longitude,
          });
        }
      },
      () => {
        setError(
          "Location access denied. Please enable location services to discover nearby users."
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [socket, session]);

  // Watch position for real-time updates
  useEffect(() => {
    if (!locationEnabled || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMyLocation({ lat: latitude, lng: longitude });
        if (socket && session?.user) {
          socket.emit("update-location", {
            userId: session.user.id,
            lat: latitude,
            lng: longitude,
          });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [locationEnabled, socket, session]);

  // Listen for nearby results
  useEffect(() => {
    if (!socket) return;

    const handleNearbyResults = async (
      results: Array<{ userId: string; distance: number }>
    ) => {
      // Fetch user profiles
      if (results.length === 0) {
        setNearbyUsers([]);
        setLoading(false);
        return;
      }

      try {
        const userIds = results.map((r) => r.userId);
        const res = await fetch("/api/users/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds }),
        });

        if (res.ok) {
          const profiles = await res.json();
          const enriched = results.map((r) => {
            const profile = profiles.find(
              (p: { _id?: string; id?: string }) => p._id === r.userId || p.id === r.userId
            );
            return {
              ...r,
              name: profile?.name || "Unknown User",
              image: profile?.image,
              major: profile?.major,
            };
          });
          setNearbyUsers(enriched);
        }
      } catch {
        setNearbyUsers(
          results.map((r) => ({ ...r, name: "Unknown User" }))
        );
      }
      setLoading(false);
    };

    socket.on("nearby-users-result", handleNearbyResults);
    return () => {
      socket.off("nearby-users-result", handleNearbyResults);
    };
  }, [socket]);

  // Auto-discover when location updates
  useEffect(() => {
    if (locationEnabled && myLocation && socket) {
      discoverNearby();
    }
  }, [locationEnabled, myLocation, radiusKm, discoverNearby]);

  // Bluetooth discovery (Web Bluetooth API)
  const discoverBluetooth = async () => {
    if (!("bluetooth" in navigator)) {
      setError("Bluetooth is not supported in this browser. Try Chrome.");
      return;
    }

    setIsScanning(true);
    try {
      // @ts-expect-error - Web Bluetooth API not in standard TS types
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [],
      });
      setBluetoothDevices((prev: Array<{ name: string; id: string }>) => [
        ...prev,
        { name: device.name || "Unknown Device", id: device.id },
      ]);
    } catch (err) {
      console.error("Bluetooth scan failed:", err);
    }
    setIsScanning(false);
  };

  if (!locationEnabled) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-600/20 flex items-center justify-center">
            <IconRadar2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Discover Nearby Users
          </h2>
          <p className="text-gray-400 mb-2 max-w-md mx-auto">
            Find students around your campus or locality. Connect with people
            who are physically close to you.
          </p>

          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
            <IconShieldLock className="w-4 h-4" />
            <span>Your exact location is never shared with other users</span>
          </div>

          {error && (
            <div className="bg-red-900/20 text-red-400 px-4 py-2 rounded-lg mb-4 max-w-md mx-auto">
              {error}
            </div>
          )}

          <button
            onClick={enableLocation}
            disabled={loading}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Getting location...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <IconMapPin className="w-5 h-5" />
                Enable Location
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Nearby Users</h1>
          <p className="text-gray-400 text-sm">
            {nearbyUsers.length} user{nearbyUsers.length !== 1 ? "s" : ""}{" "}
            found within {radiusKm}km
          </p>
        </div>
        <button
          onClick={discoverNearby}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#2e2e3e] hover:bg-[#3e3e4e] rounded-lg transition-colors text-white"
        >
          <IconRefresh
            className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-[#1e1e2e] rounded-lg">
        {/* Discovery Mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDiscoveryMode("gps")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
              discoveryMode === "gps"
                ? "bg-emerald-600 text-white"
                : "bg-[#2e2e3e] text-gray-300 hover:bg-[#3e3e4e]"
            }`}
          >
            <IconWifi className="w-4 h-4" />
            GPS
          </button>
          <button
            onClick={() => {
              setDiscoveryMode("bluetooth");
              discoverBluetooth();
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
              discoveryMode === "bluetooth"
                ? "bg-emerald-600 text-white"
                : "bg-[#2e2e3e] text-gray-300 hover:bg-[#3e3e4e]"
            }`}
          >
            <IconBluetooth className="w-4 h-4" />
            Bluetooth
          </button>
        </div>

        {/* Radius slider */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <span className="text-gray-400 text-sm">Radius:</span>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
            className="flex-1 accent-emerald-600"
          />
          <span className="text-white text-sm font-mono w-14">
            {radiusKm}km
          </span>
        </div>
      </div>

      {/* Bluetooth Devices */}
      {discoveryMode === "bluetooth" && bluetoothDevices.length > 0 && (
        <div className="mb-6 p-4 bg-[#1e1e2e] rounded-lg">
          <h3 className="text-white font-semibold mb-3">
            Bluetooth Devices Found
          </h3>
          <div className="space-y-2">
            {bluetoothDevices.map((device, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 bg-[#2e2e3e] rounded-lg"
              >
                <IconBluetooth className="w-5 h-5 text-emerald-400" />
                <span className="text-white">{device.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Grid */}
      {loading && nearbyUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/20 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-400 mt-4">Scanning nearby...</p>
        </div>
      ) : nearbyUsers.length === 0 ? (
        <div className="text-center py-16">
          <IconRadar2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            No users found nearby
          </p>
          <p className="text-gray-500 text-sm">
            Try increasing the radius or check back later
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nearbyUsers.map((user) => (
            <div
              key={user.userId}
              className="bg-[#1e1e2e] rounded-xl p-4 hover:bg-[#1e1e2e] transition-all hover:scale-[1.02] border border-[#2e2e3e]"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#2e2e3e] overflow-hidden flex items-center justify-center">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <IconUser className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{user.name}</h3>
                  {user.major && (
                    <p className="text-gray-400 text-xs">{user.major}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 mb-3">
                <IconMapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">
                  {formatDistance(user.distance)}
                </span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/profile/${user.userId}`}
                  className="flex-1 text-center py-2 bg-[#2e2e3e] hover:bg-[#3e3e4e] text-white text-sm rounded-lg transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  href={`/messages?userId=${user.userId}`}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors"
                >
                  <IconMessage className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
