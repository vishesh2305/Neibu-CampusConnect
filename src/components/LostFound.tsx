"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  IconSearch,
  IconPlus,
  IconMapPin,
  IconClock,
  IconMessage,
  IconX,
  IconPhoto,
  IconEye,
  IconCheck,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface LostFoundItem {
  _id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  images: string[];
  contactInfo?: string;
  reporterId: string;
  reporterName: string;
  reporterImage?: string;
  status: "open" | "resolved";
  createdAt: string;
}

const ITEM_CATEGORIES = [
  "Electronics",
  "Wallet/Purse",
  "Keys",
  "ID Card",
  "Clothing",
  "Books",
  "Water Bottle",
  "Headphones",
  "Charger",
  "Other",
];

export default function LostFound() {
  const { data: session } = useSession();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "lost" | "found">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);

  // Form state
  const [formType, setFormType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formCategory, setFormCategory] = useState("Electronics");
  const [formLocation, setFormLocation] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [contactInfo, setContactInfo] = useState("");
  const [formImages, setFormImages] = useState<File[]>([]);
  const [formPreviews, setFormPreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [activeTab, searchQuery]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("type", activeTab);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/lost-found?${params}`);
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setFormImages(files);
    setFormPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setCreating(true);

    try {
      const formData = new FormData();
      formData.append("type", formType);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", formCategory);
      formData.append("location", formLocation);
      formData.append("date", formDate);
      formData.append("contactInfo", contactInfo);
      formImages.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/lost-found", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowCreateForm(false);
        setTitle("");
        setDescription("");
        setFormLocation("");
        setContactInfo("");
        setFormImages([]);
        setFormPreviews([]);
        fetchItems();
      }
    } catch (error) {
      console.error("Failed to create item:", error);
    } finally {
      setCreating(false);
    }
  };

  const markResolved = async (itemId: string) => {
    try {
      const res = await fetch(`/api/lost-found/${itemId}/resolve`, { method: "POST" });
      if (res.ok) {
        setItems((prev) => prev.map((item) => (item._id === itemId ? { ...item, status: "resolved" } : item)));
        if (selectedItem?._id === itemId) {
          setSelectedItem((prev) => prev ? { ...prev, status: "resolved" } : null);
        }
      }
    } catch {}
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Lost & Found</h1>
          <p className="text-gray-400 text-sm">Help reunite items with their owners</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition-colors"
        >
          <IconPlus className="w-5 h-5" />
          Report Item
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          {(["all", "lost", "found"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? tab === "lost"
                    ? "bg-red-600 text-white"
                    : tab === "found"
                      ? "bg-green-600 text-white"
                      : "bg-emerald-600 text-white"
                  : "bg-[#1e1e2e] text-gray-300 hover:bg-[#2e2e3e]"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lost & found items..."
            className="w-full pl-10 pr-4 py-2 bg-[#1e1e2e] border border-[#2e2e3e] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#1e1e2e] rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <IconEye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No items reported</p>
          <p className="text-gray-500 text-sm">Check back later or report an item</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelectedItem(item)}
              className={`bg-[#1e1e2e] rounded-xl overflow-hidden cursor-pointer hover:ring-1 transition-all hover:scale-[1.02] ${
                item.type === "lost" ? "hover:ring-red-500/50" : "hover:ring-green-500/50"
              }`}
            >
              {/* Image or placeholder */}
              <div className="w-full h-32 bg-[#12121a] relative">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IconPhoto className="w-8 h-8 text-gray-500" />
                  </div>
                )}
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                  item.type === "lost" ? "bg-red-600 text-white" : "bg-green-600 text-white"
                }`}>
                  {item.type}
                </div>
                {item.status === "resolved" && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-900/80 text-green-400 text-xs rounded-full font-semibold flex items-center gap-1">
                    <IconCheck className="w-3 h-3" />
                    Resolved
                  </div>
                )}
              </div>

              <div className="p-3">
                <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-gray-400 text-xs line-clamp-2 mb-2">{item.description}</p>
                <div className="flex items-center gap-3 text-gray-500 text-xs">
                  <span className="flex items-center gap-1">
                    <IconMapPin className="w-3 h-3" />
                    {item.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <IconClock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center overflow-y-auto">
          <div className="max-w-lg w-full mx-4 my-8 bg-[#16161e] rounded-xl p-6 border border-[#2e2e3e]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Report an Item</h2>
              <button onClick={() => setShowCreateForm(false)} className="p-1 rounded-full hover:bg-[#1e1e2e]" aria-label="Close report form">
                <IconX className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={createItem} className="space-y-4">
              {/* Type selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormType("lost")}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    formType === "lost" ? "bg-red-600 text-white" : "bg-[#1e1e2e] text-gray-300"
                  }`}
                >
                  I Lost Something
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("found")}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    formType === "found" ? "bg-green-600 text-white" : "bg-[#1e1e2e] text-gray-300"
                  }`}
                >
                  I Found Something
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">What is it?</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="e.g., Blue water bottle"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  placeholder="Describe the item in detail..."
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {ITEM_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Where was it lost/found?"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Contact Info (optional)</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Phone or email for contact"
                />
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Photos (up to 3)</label>
                <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" id="lf-images" />
                <label htmlFor="lf-images" className="flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-[#2e2e3e] rounded-lg cursor-pointer hover:border-[#3e3e4e] transition-colors">
                  <IconPhoto className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-400">Add photos</span>
                </label>
                {formPreviews.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {formPreviews.map((src, i) => (
                      <img key={i} src={src} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={creating}
                className={`w-full py-2 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                  formType === "lost" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {creating ? "Submitting..." : `Report ${formType === "lost" ? "Lost" : "Found"} Item`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center overflow-y-auto">
          <div className="max-w-lg w-full mx-4 my-8 bg-[#16161e] rounded-xl overflow-hidden border border-[#2e2e3e]">
            <div className="w-full h-56 bg-[#12121a] relative">
              {selectedItem.images?.[0] ? (
                <img src={selectedItem.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <IconPhoto className="w-16 h-16 text-gray-500" />
                </div>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 p-1 bg-black/50 rounded-full"
                aria-label="Close item details"
              >
                <IconX className="w-5 h-5 text-white" />
              </button>
              <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-bold uppercase ${
                selectedItem.type === "lost" ? "bg-red-600 text-white" : "bg-green-600 text-white"
              }`}>
                {selectedItem.type}
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">{selectedItem.title}</h2>

              <div className="flex flex-wrap gap-2 mb-4 text-sm">
                <span className="px-2 py-0.5 bg-[#1e1e2e] rounded text-gray-300">{selectedItem.category}</span>
                <span className="flex items-center gap-1 text-gray-400">
                  <IconMapPin className="w-3 h-3" />
                  {selectedItem.location}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <IconClock className="w-3 h-3" />
                  {new Date(selectedItem.date).toLocaleDateString()}
                </span>
              </div>

              <p className="text-gray-300 mb-4">{selectedItem.description}</p>

              {selectedItem.contactInfo && (
                <p className="text-gray-400 text-sm mb-4">Contact: {selectedItem.contactInfo}</p>
              )}

              {/* Reporter info */}
              <div className="flex items-center gap-3 p-3 bg-[#1e1e2e] rounded-lg mb-4">
                <div className="w-10 h-10 rounded-full bg-[#2e2e3e] overflow-hidden flex items-center justify-center">
                  {selectedItem.reporterImage ? (
                    <img src={selectedItem.reporterImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{selectedItem.reporterName?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{selectedItem.reporterName}</p>
                  <p className="text-gray-500 text-xs">
                    Reported {formatDistanceToNow(new Date(selectedItem.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {selectedItem.reporterId === session?.user?.id && selectedItem.status === "open" && (
                  <button
                    onClick={() => markResolved(selectedItem._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <IconCheck className="w-5 h-5" />
                    Mark Resolved
                  </button>
                )}
                {selectedItem.reporterId !== session?.user?.id && (
                  <Link
                    href={`/messages?userId=${selectedItem.reporterId}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold transition-colors"
                  >
                    <IconMessage className="w-5 h-5" />
                    Contact Reporter
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
