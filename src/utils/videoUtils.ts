/**
 * Video processing, poster frame capture, and formatting utilities
 */

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export interface ParsedVideoSource {
  type: 'youtube' | 'vimeo' | 'html5' | 'empty';
  embedUrl?: string;
  directUrl?: string;
  videoId?: string;
}

/**
 * Parses any video URL (YouTube, Vimeo, direct MP4/WebM, blob) into a unified format
 */
export function parseVideoSource(rawUrl?: string, autoplay = true): ParsedVideoSource {
  if (!rawUrl || !rawUrl.trim()) {
    return { type: 'empty' };
  }

  const url = rawUrl.trim();

  // YouTube detection
  // Supports: youtube.com/watch?v=xxx, youtu.be/xxx, youtube.com/embed/xxx, youtube.com/shorts/xxx
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    const autoPlayParam = autoplay ? 'autoplay=1&mute=1&loop=1&playlist=' + videoId + '&playsinline=1' : 'autoplay=0';
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?${autoPlayParam}&rel=0&modestbranding=1&enablejsapi=1`,
      directUrl: url,
    };
  }

  // Vimeo detection
  // Supports: vimeo.com/12345678, player.vimeo.com/video/12345678
  const vimeoMatch = url.match(/(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|video\/|)|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    const autoPlayParam = autoplay ? 'autoplay=1&muted=1&loop=1&playsinline=1' : 'autoplay=0';
    return {
      type: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?${autoPlayParam}&dnt=1`,
      directUrl: url,
    };
  }

  // Direct HTML5 video (mp4, webm, ogg, blob, data URL, cloud storage stream)
  return {
    type: 'html5',
    directUrl: url,
  };
}


/**
 * Extracts a high quality frame from a video file or URL to serve as poster/thumbnail
 */
export function captureVideoFrame(
  source: File | string,
  targetTimeSeconds = 1
): Promise<{ posterUrl: string; duration: number }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let objectUrlToRevoke: string | null = null;
    if (typeof source === 'string') {
      video.src = source;
    } else {
      objectUrlToRevoke = URL.createObjectURL(source);
      video.src = objectUrlToRevoke;
    }

    const fallbackPoster = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';

    const cleanup = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
      video.removeAttribute('src');
      video.load();
    };

    // Timeout safeguard: If video cannot be decoded in 4 seconds, return fallback
    const timer = setTimeout(() => {
      cleanup();
      resolve({ posterUrl: fallbackPoster, duration: 60 });
    }, 4000);

    video.onloadedmetadata = () => {
      // Seek to target frame
      const seekTime = Math.min(
        targetTimeSeconds,
        video.duration > 1 ? video.duration / 2 : 0.5
      );
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        // Standard high definition 16:9 poster dimensions
        canvas.width = Math.min(video.videoWidth || 1280, 1280);
        canvas.height = Math.min(video.videoHeight || 720, 720);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          cleanup();
          resolve({
            posterUrl: dataUrl,
            duration: Math.round(video.duration || 60),
          });
          return;
        }
      } catch (err) {
        console.warn('Could not extract canvas frame from video (cross-origin or codec):', err);
      }
      cleanup();
      resolve({
        posterUrl: fallbackPoster,
        duration: Math.round(video.duration || 60),
      });
    };

    video.onerror = () => {
      clearTimeout(timer);
      cleanup();
      resolve({ posterUrl: fallbackPoster, duration: 60 });
    };
  });
}
