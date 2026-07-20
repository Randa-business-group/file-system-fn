export type HeroVideoSource =
  | {
      kind: "youtube";
      videoId: string;
      embedUrl: string;
      heroEmbedUrl: string;
      posterUrl: string;
    }
  | { kind: "direct"; src: string; posterUrl?: string };

function buildYouTubeEmbedUrl(
  videoId: string,
  params: Record<string, string | number>,
) {
  const search = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
  return `https://www.youtube-nocookie.com/embed/${videoId}?${search.toString()}`;
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }

  return null;
}

export function parseHeroVideoUrl(
  url: string,
  posterUrl?: string,
): HeroVideoSource {
  const trimmed = url.trim();
  const youtubeId = extractYouTubeId(trimmed);

  if (youtubeId) {
    return {
      kind: "youtube",
      videoId: youtubeId,
      embedUrl: buildYouTubeEmbedUrl(youtubeId, {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
      }),
      heroEmbedUrl: buildYouTubeEmbedUrl(youtubeId, {
        autoplay: 1,
        mute: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        loop: 1,
        playlist: youtubeId,
      }),
      posterUrl:
        posterUrl ?? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
    };
  }

  return {
    kind: "direct",
    src: trimmed,
    posterUrl,
  };
}

export function formatVideoTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
