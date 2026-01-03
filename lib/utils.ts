export type Platform = 'youtube' | 'instagram' | 'spotify' | 'unknown';

export interface MediaInfo {
  title: string;
  thumbnail?: string;
  duration?: string;
  platform: Platform;
  url: string;
}

/**
 * Detects the platform from a given URL
 */
export function detectPlatform(url: string): Platform {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    if (hostname.includes('instagram.com')) {
      return 'instagram';
    }
    if (hostname.includes('spotify.com') || hostname.includes('open.spotify.com')) {
      return 'spotify';
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Validates if a URL is properly formatted
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a YouTube ID is a playlist ID
 */
export function isPlaylistId(id: string): boolean {
  // Playlist IDs typically start with "PL", "UU", "LL", "FL", "RD", "OL", etc.
  return /^(PL|UU|LL|FL|RD|OL|UL|PU|LL)/i.test(id) || id.length > 11;
}

/**
 * Extracts video ID from YouTube URL
 * Supports regular videos, Shorts, and youtu.be links
 * Returns null if it's a playlist
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    // YouTube Shorts: youtube.com/shorts/VIDEO_ID
    /(?:youtube\.com\/shorts\/)([^&\n?#\/]+)/,
    // Regular videos: youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    // Fallback for watch URLs with other parameters
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const id = match[1];
      // Check if it's a playlist ID
      if (isPlaylistId(id)) {
        return null; // Return null for playlists
      }
      return id;
    }
  }
  return null;
}

/**
 * Extracts Instagram shortcode from URL
 */
export function extractInstagramShortcode(url: string): string | null {
  const patterns = [
    /instagram\.com\/(?:p|reel|tv)\/([^\/\?]+)/,
    /instagram\.com\/reel\/([^\/\?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Formats duration in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extracts Spotify track, album, or playlist ID from URL
 */
export function extractSpotifyId(url: string): { type: 'track' | 'album' | 'playlist' | null; id: string | null } {
  const trackMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (trackMatch) {
    return { type: 'track', id: trackMatch[1] };
  }
  
  const albumMatch = url.match(/spotify\.com\/album\/([a-zA-Z0-9]+)/);
  if (albumMatch) {
    return { type: 'album', id: albumMatch[1] };
  }
  
  const playlistMatch = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (playlistMatch) {
    return { type: 'playlist', id: playlistMatch[1] };
  }
  
  return { type: null, id: null };
}



