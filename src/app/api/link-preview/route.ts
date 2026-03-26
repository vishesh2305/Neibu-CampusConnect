import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const urlObj = new URL(url);
    const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '[::1]'];
    if (blocked.includes(urlObj.hostname) || urlObj.hostname.startsWith('192.168.') || urlObj.hostname.startsWith('10.') || urlObj.hostname.startsWith('172.')) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CampusConnect LinkPreview Bot/1.0" },
    });
    clearTimeout(timeout);

    const html = await res.text();

    // Parse OG tags
    const getMetaContent = (property: string): string | undefined => {
      const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
        "i"
      );
      const match = html.match(regex);
      return match?.[1] || match?.[2] || undefined;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

    const data = {
      url,
      title: getMetaContent("og:title") || titleMatch?.[1]?.trim() || undefined,
      description: getMetaContent("og:description") || getMetaContent("description") || undefined,
      image: getMetaContent("og:image") || undefined,
      domain: new URL(url).hostname,
    };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ url, domain: new URL(url).hostname }, { status: 200 });
  }
}
