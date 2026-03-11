const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{6,}$/;

export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0] ?? '';
      return YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com' ||
      host === 'www.youtube-nocookie.com'
    ) {
      if (parsed.pathname.startsWith('/watch')) {
        const id = parsed.searchParams.get('v') ?? '';
        return YOUTUBE_ID_PATTERN.test(id) ? id : null;
      }

      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length >= 2 && ['embed', 'shorts', 'live'].includes(segments[0])) {
        const id = segments[1] ?? '';
        return YOUTUBE_ID_PATTERN.test(id) ? id : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

export function isValidYouTubeUrl(url: string): boolean {
  return getYouTubeEmbedUrl(url) !== null;
}
