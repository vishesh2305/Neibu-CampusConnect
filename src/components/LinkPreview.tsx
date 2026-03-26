"use client";

import { useState, useEffect } from "react";

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
}

// Detect URLs in text
const URL_REGEX = /https?:\/\/[^\s<]+/g;

export function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) || [];
}

export default function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPreview = async () => {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (res.ok && !cancelled) {
          const preview = await res.json();
          setData(preview);
        }
      } catch {
        // Silently fail - link preview is non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPreview();
    return () => { cancelled = true; };
  }, [url]);

  if (loading || !data?.title) return null;

  const domain = data.domain || new URL(url).hostname;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 rounded-xl overflow-hidden border border-[#2e2e3e] hover:border-[#3e3e4e] transition-colors bg-[#12121a]"
    >
      {data.image && (
        <div className="w-full h-36 bg-[#1e1e2e]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <p className="text-xs text-emerald-400 mb-1">{domain}</p>
        <p className="text-sm text-white font-medium line-clamp-1">{data.title}</p>
        {data.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{data.description}</p>
        )}
      </div>
    </a>
  );
}
