"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  IconPlus,
  IconSearch,
  IconMapPin,
  IconTag,
  IconMessage,
  IconX,
  IconPhoto,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: "new" | "like-new" | "good" | "fair";
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerImage?: string;
  status: "active" | "sold" | "reserved";
  location?: string;
  createdAt: string;
}

const CATEGORIES = [
  "All",
  "Textbooks",
  "Electronics",
  "Furniture",
  "Clothing",
  "Tickets",
  "Services",
  "Supplies",
  "Other",
];

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function Marketplace() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Textbooks");
  const [condition, setCondition] = useState("good");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [selectedCategory, searchQuery]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      if (searchQuery) params.set("q", searchQuery);

      const res = await fetch(`/api/marketplace?${params}`);
      if (res.ok) {
        setListings(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    setImages(files);
    const previews = files.map((f) => URL.createObjectURL(f));
    setImagePreviews(previews);
  };

  const createListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setCreating(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("condition", condition);
      formData.append("location", location);
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/marketplace", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowCreateForm(false);
        setTitle("");
        setDescription("");
        setPrice("");
        setImages([]);
        setImagePreviews([]);
        fetchListings();
      }
    } catch (error) {
      console.error("Failed to create listing:", error);
    } finally {
      setCreating(false);
    }
  };

  const filteredListings = listings;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Campus Marketplace</h1>
          <p className="text-gray-400 text-sm">Buy, sell, and trade with students</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition-colors"
        >
          <IconPlus className="w-5 h-5" />
          Sell Item
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search marketplace..."
            className="w-full pl-10 pr-4 py-2 bg-[#1e1e2e] border border-[#2e2e3e] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white"
                  : "bg-[#1e1e2e] text-gray-300 hover:bg-[#2e2e3e]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#1e1e2e] rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-16">
          <IconTag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No listings found</p>
          <p className="text-gray-500 text-sm">Be the first to sell something!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredListings.map((listing) => (
            <div
              key={listing._id}
              onClick={() => setSelectedListing(listing)}
              className="bg-[#1e1e2e] rounded-xl overflow-hidden cursor-pointer hover:ring-1 hover:ring-[#3e3e4e] transition-all hover:scale-[1.02]"
            >
              {/* Image */}
              <div className="w-full h-40 bg-[#12121a] relative">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IconPhoto className="w-10 h-10 text-gray-500" />
                  </div>
                )}
                {listing.status !== "active" && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-semibold uppercase">
                    {listing.status}
                  </div>
                )}
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  listing.condition === "new" ? "bg-green-600 text-white" :
                  listing.condition === "like-new" ? "bg-emerald-600 text-white" :
                  "bg-[#2e2e3e] text-gray-200"
                }`}>
                  {listing.condition === "like-new" ? "Like New" : listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-white font-semibold text-sm truncate flex-1">{listing.title}</h3>
                  <span className="text-green-400 font-bold text-sm ml-2">
                    ${listing.price}
                  </span>
                </div>
                <p className="text-gray-400 text-xs line-clamp-2 mb-2">{listing.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs">
                    {formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true })}
                  </span>
                  {listing.location && (
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <IconMapPin className="w-3 h-3" />
                      {listing.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center overflow-y-auto">
          <div className="max-w-lg w-full mx-4 my-8 bg-[#16161e] rounded-xl p-6 border border-[#2e2e3e]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Create Listing</h2>
              <button onClick={() => setShowCreateForm(false)} className="p-1 rounded-full hover:bg-[#1e1e2e]" aria-label="Close create listing">
                <IconX className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={createListing} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="What are you selling?"
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
                  placeholder="Describe your item..."
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-300 mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-300 mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-[#12121a] border border-[#2e2e3e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="e.g., Library"
                  />
                </div>
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">Photos (up to 4)</label>
                <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" id="listing-images" />
                <label htmlFor="listing-images" className="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-[#2e2e3e] rounded-lg cursor-pointer hover:border-[#3e3e4e] transition-colors">
                  <IconPhoto className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-400">Click to add photos</span>
                </label>
                {imagePreviews.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {imagePreviews.map((src, i) => (
                      <img key={i} src={src} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Post Listing"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center overflow-y-auto">
          <div className="max-w-lg w-full mx-4 my-8 bg-[#16161e] rounded-xl overflow-hidden border border-[#2e2e3e]">
            {/* Images */}
            <div className="w-full h-64 bg-[#12121a] relative">
              {selectedListing.images?.[0] ? (
                <img src={selectedListing.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <IconPhoto className="w-16 h-16 text-gray-500" />
                </div>
              )}
              <button
                onClick={() => setSelectedListing(null)}
                className="absolute top-3 right-3 p-1 bg-black/50 rounded-full"
                aria-label="Close listing details"
              >
                <IconX className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-bold text-white">{selectedListing.title}</h2>
                <span className="text-2xl font-bold text-green-400">${selectedListing.price}</span>
              </div>

              <div className="flex items-center gap-3 mb-4 text-sm text-gray-400">
                <span className="px-2 py-0.5 bg-[#1e1e2e] rounded">{selectedListing.category}</span>
                <span className="px-2 py-0.5 bg-[#1e1e2e] rounded capitalize">{selectedListing.condition}</span>
                {selectedListing.location && (
                  <span className="flex items-center gap-1">
                    <IconMapPin className="w-3 h-3" />
                    {selectedListing.location}
                  </span>
                )}
              </div>

              <p className="text-gray-300 mb-4">{selectedListing.description}</p>

              {/* Seller info */}
              <div className="flex items-center gap-3 p-3 bg-[#1e1e2e] rounded-lg mb-4">
                <div className="w-10 h-10 rounded-full bg-[#2e2e3e] overflow-hidden flex items-center justify-center">
                  {selectedListing.sellerImage ? (
                    <img src={selectedListing.sellerImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{selectedListing.sellerName?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{selectedListing.sellerName}</p>
                  <p className="text-gray-500 text-xs">
                    Listed {formatDistanceToNow(new Date(selectedListing.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {selectedListing.sellerId !== session?.user?.id && (
                <Link
                  href={`/messages?userId=${selectedListing.sellerId}`}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold transition-colors"
                >
                  <IconMessage className="w-5 h-5" />
                  Message Seller
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
