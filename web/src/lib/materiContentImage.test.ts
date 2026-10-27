import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { compressImageToBlob } from './materiContent';

let decodeOk = true;
let width = 3000;
const toBlobTypes: (string | undefined)[] = [];
let webpSupported = true;
const drawImage = vi.fn();

class FakeImage {
  width = width;
  height = 1500;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_v: string) {
    queueMicrotask(() => (decodeOk ? this.onload?.() : this.onerror?.()));
  }
}

beforeEach(() => {
  decodeOk = true;
  width = 3000;
  webpSupported = true;
  toBlobTypes.length = 0;
  drawImage.mockClear();
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() }));
  vi.stubGlobal('Image', FakeImage);
  (window as unknown as { Image: unknown }).Image = FakeImage;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as never);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb, type) {
    toBlobTypes.push(type);
    const t = type === 'image/webp' && !webpSupported ? 'image/png' : type;
    cb(new Blob(['x'], { type: t }));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const file = (type = 'image/png') => new File(['x'], 'a.png', { type });

describe('compressImageToBlob', () => {
  it('GIF dikembalikan apa adanya agar animasi tidak hilang', async () => {
    const gif = file('image/gif');
    expect(await compressImageToBlob(gif)).toBe(gif);
  });

  it('mengecilkan lebar ke 1200px dan menghasilkan WebP', async () => {
    const blob = await compressImageToBlob(file());
    expect(blob.type).toBe('image/webp');
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1200, 600);
  });

  it('tidak membesarkan gambar yang sudah kecil', async () => {
    width = 800;
    await compressImageToBlob(file());
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 800, 1500);
  });

  it('fallback ke JPEG bila browser tidak mendukung WebP', async () => {
    webpSupported = false;
    const blob = await compressImageToBlob(file());
    expect(blob.type).toBe('image/jpeg');
    expect(toBlobTypes).toEqual(['image/webp', 'image/jpeg']);
  });

  it('menolak berkas yang tidak dapat didekode sebagai gambar', async () => {
    decodeOk = false;
    await expect(compressImageToBlob(file())).rejects.toMatchObject({ message: 'Berkas bukan gambar yang valid.' });
  });

  it('menolak bila canvas tidak tersedia', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(compressImageToBlob(file())).rejects.toMatchObject({ message: expect.stringMatching(/tidak mendukung/) });
  });
});
