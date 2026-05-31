import { NextResponse } from "next/server";
import { searchMedia } from "@/lib/api/media-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchMedia(query);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "搜索失败。", results: [] },
      { status: 502 }
    );
  }
}
