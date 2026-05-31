import type { WorkSearchResult } from "@/types/domain";

interface JikanAnime {
  mal_id: number;
  title: string;
  title_japanese?: string;
  images?: { jpg?: { image_url?: string; large_image_url?: string } };
  episodes?: number;
  duration?: string;
  synopsis?: string;
}

interface JikanManga {
  mal_id: number;
  title: string;
  title_japanese?: string;
  images?: { jpg?: { image_url?: string; large_image_url?: string } };
  chapters?: number;
  synopsis?: string;
}

interface AniListMedia {
  id: number;
  type: "ANIME" | "MANGA";
  title?: { romaji?: string; english?: string; native?: string };
  coverImage?: { large?: string; extraLarge?: string };
  episodes?: number;
  chapters?: number;
  duration?: number;
  description?: string;
  format?: string;
}

const ANILIST_QUERY = `
query SearchMedia($search: String!) {
  Page(page: 1, perPage: 8) {
    media(search: $search, type_in: [ANIME, MANGA], sort: SEARCH_MATCH) {
      id
      type
      format
      episodes
      chapters
      duration
      description(asHtml: false)
      title { romaji english native }
      coverImage { large extraLarge }
    }
  }
}
`;

export async function searchMedia(query: string): Promise<WorkSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const [jikanAnime, jikanManga, anilist] = await Promise.allSettled([
    searchJikanAnime(trimmed),
    searchJikanManga(trimmed),
    searchAniList(trimmed)
  ]);

  return [jikanAnime, jikanManga, anilist]
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((item, index, all) => all.findIndex((candidate) => candidate.source === item.source && candidate.externalId === item.externalId) === index)
    .slice(0, 16);
}

async function searchJikanAnime(query: string): Promise<WorkSearchResult[]> {
  const url = new URL("https://api.jikan.moe/v4/anime");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  const response = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error("Jikan anime search failed.");
  const json = (await response.json()) as { data: JikanAnime[] };
  return json.data.map((anime) => ({
    source: "jikan",
    externalId: `anime_${anime.mal_id}`,
    title: anime.title,
    originalTitle: anime.title_japanese,
    coverUrl: anime.images?.jpg?.large_image_url ?? anime.images?.jpg?.image_url,
    format: "anime",
    kind: "listening",
    totalUnits: anime.episodes,
    averageMinutes: parseDurationMinutes(anime.duration) ?? 21,
    description: anime.synopsis
  }));
}

async function searchJikanManga(query: string): Promise<WorkSearchResult[]> {
  const url = new URL("https://api.jikan.moe/v4/manga");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  const response = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error("Jikan manga search failed.");
  const json = (await response.json()) as { data: JikanManga[] };
  return json.data.map((manga) => ({
    source: "jikan",
    externalId: `manga_${manga.mal_id}`,
    title: manga.title,
    originalTitle: manga.title_japanese,
    coverUrl: manga.images?.jpg?.large_image_url ?? manga.images?.jpg?.image_url,
    format: "manga",
    kind: "reading",
    totalUnits: manga.chapters,
    averageMinutes: 8,
    description: manga.synopsis
  }));
}

async function searchAniList(query: string): Promise<WorkSearchResult[]> {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: ANILIST_QUERY, variables: { search: query } })
  });
  if (!response.ok) throw new Error("AniList search failed.");
  const json = (await response.json()) as { data?: { Page?: { media?: AniListMedia[] } } };
  return (json.data?.Page?.media ?? []).map((media) => ({
    source: "anilist",
    externalId: String(media.id),
    title: media.title?.english ?? media.title?.romaji ?? media.title?.native ?? "Untitled",
    originalTitle: media.title?.native,
    coverUrl: media.coverImage?.extraLarge ?? media.coverImage?.large,
    format: media.type === "ANIME" ? "anime" : media.format === "NOVEL" ? "light_novel" : "manga",
    kind: media.type === "ANIME" ? "listening" : "reading",
    totalUnits: media.type === "ANIME" ? media.episodes : media.chapters,
    averageMinutes: media.type === "ANIME" ? media.duration ?? 21 : 8,
    description: stripHtml(media.description)
  }));
}

function parseDurationMinutes(duration?: string) {
  if (!duration) return undefined;
  const match = duration.match(/(\d+)\s*min/i);
  return match ? Number(match[1]) : undefined;
}

function stripHtml(value?: string) {
  return value?.replace(/<[^>]+>/g, "").replaceAll("&quot;", "\"").replaceAll("&#039;", "'").trim();
}
