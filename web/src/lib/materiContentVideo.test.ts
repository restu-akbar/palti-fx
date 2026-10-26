import { describe, expect, it } from 'vitest';
import { isVideoFileUrl } from './materiContent';

const URL_MP4 = 'https://x.supabase.co/storage/v1/object/public/lesson-videos/lessons/2026/10/abc.mp4';

describe('isVideoFileUrl', () => {
  it('mengenali URL MP4/WebM, dengan atau tanpa query', () => {
    expect(isVideoFileUrl(URL_MP4)).toBe(true);
    expect(isVideoFileUrl(`${URL_MP4}?t=1`)).toBe(true);
    expect(isVideoFileUrl('https://a.b/c.WEBM')).toBe(true);
  });

  it('menolak YouTube, gambar, dan skema non-http', () => {
    expect(isVideoFileUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(false);
    expect(isVideoFileUrl('https://a.b/c.png')).toBe(false);
    expect(isVideoFileUrl('javascript:alert(1)//x.mp4')).toBe(false);
    expect(isVideoFileUrl('')).toBe(false);
  });
});
