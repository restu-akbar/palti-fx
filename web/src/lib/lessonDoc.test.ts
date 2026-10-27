import { describe, expect, it } from 'vitest';
import { docStats, docToMarkdown, embedLegacyVideos, markdownToDoc, parseInline, youtubeUrlsIn } from './lessonDoc';

const IMG = 'https://x.supabase.co/storage/v1/object/public/lesson-images/lessons/2026/10/a.webp';
const MP4 = 'https://x.supabase.co/storage/v1/object/public/lesson-videos/lessons/2026/10/b.mp4';
const YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const roundTrip = (md: string) => docToMarkdown(markdownToDoc(md));

describe('markdownToDoc', () => {
  it('mengenali semua jenis blok yang didukung mobile', () => {
    const doc = markdownToDoc(
      [
        '# Judul',
        '## Sub',
        '### Kecil',
        'Paragraf **tebal**',
        '- a',
        '- b',
        '1. satu',
        '2. dua',
        '> tips 1',
        '> tips 2',
        '---',
        '```',
        'kode',
        '```',
        `![cap](${IMG})`,
        YT,
        MP4,
      ].join('\n')
    );
    expect(doc.content!.map((n) => n.type)).toEqual([
      'heading', 'heading', 'heading', 'paragraph', 'bulletList', 'orderedList', 'blockquote', 'horizontalRule',
      'codeBlock', 'lessonImage', 'lessonVideo', 'lessonVideo',
    ]);
    expect(doc.content![0].attrs).toEqual({ level: 1 });
    expect(doc.content![4].content).toHaveLength(2);
    expect(doc.content![6].content).toHaveLength(2);
    expect(doc.content![9].attrs).toEqual({ src: IMG, caption: 'cap' });
  });

  it('baris paragraf berurutan digabung dengan spasi seperti di mobile', () => {
    const doc = markdownToDoc('baris satu\nbaris dua\n\nparagraf baru');
    expect(doc.content).toHaveLength(2);
    expect(doc.content![0].content![0].text).toBe('baris satu baris dua');
  });

  it('naskah kosong menghasilkan satu paragraf kosong', () => {
    expect(markdownToDoc('').content).toEqual([{ type: 'paragraph' }]);
  });

  it('bentuk lama: tag foto, URL foto polos, token & tag video', () => {
    const doc = markdownToDoc(
      [
        `[foto: ${IMG}]`,
        'https://cdn.test/a.png',
        'data:image/png;base64,AAAA',
        `[VIDEO: Video (b.mp4) | url="${MP4}" | id="video_1"]`,
        '[video: youtu.be/dQw4w9WgXcQ]',
        `[video](${YT})`,
        'youtu.be/dQw4w9WgXcQ',
      ].join('\n\n')
    );
    expect(doc.content!.map((n) => [n.type, n.attrs?.src])).toEqual([
      ['lessonImage', IMG],
      ['lessonImage', 'https://cdn.test/a.png'],
      ['lessonImage', 'data:image/png;base64,AAAA'],
      ['lessonVideo', MP4],
      ['lessonVideo', 'https://youtu.be/dQw4w9WgXcQ'],
      ['lessonVideo', YT],
      ['paragraph', undefined],
    ]);
  });

  it('daftar bernomor dan poin yang bergantian menjadi dua daftar', () => {
    const doc = markdownToDoc('- a\n1. b');
    expect(doc.content!.map((n) => n.type)).toEqual(['bulletList', 'orderedList']);
  });

  it('blok kode yang tidak ditutup tetap terbaca', () => {
    expect(markdownToDoc('```\nabc').content![0]).toEqual({ type: 'codeBlock', content: [{ type: 'text', text: 'abc' }] });
  });
});

describe('parseInline', () => {
  it('tebal, miring, kode, tautan, dan teks biasa', () => {
    expect(parseInline('a **b** *c* `d` [e](https://f.g) h')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'text', text: 'b', marks: [{ type: 'bold' }] },
      { type: 'text', text: ' ' },
      { type: 'text', text: 'c', marks: [{ type: 'italic' }] },
      { type: 'text', text: ' ' },
      { type: 'text', text: 'd', marks: [{ type: 'code' }] },
      { type: 'text', text: ' ' },
      { type: 'text', text: 'e', marks: [{ type: 'link', attrs: { href: 'https://f.g' } }] },
      { type: 'text', text: ' h' },
    ]);
  });
});

describe('docToMarkdown', () => {
  it('naskah kanonis tidak berubah setelah bolak-balik', () => {
    const md = [
      '# Judul',
      'Paragraf dengan **tebal**, *miring*, `kode`, dan [tautan](https://a.b).',
      '## Poin',
      '- satu\n- dua',
      '1. pertama\n2. kedua',
      '> Catatan **penting**',
      '---',
      '```\nbaris 1\nbaris 2\n```',
      `![Analisis](${IMG})`,
      YT,
      MP4,
    ].join('\n\n');
    expect(roundTrip(md)).toBe(md);
  });

  it('menormalkan nomor daftar dan menghapus paragraf kosong', () => {
    expect(roundTrip('1. a\n5. b\n\n\n\nteks')).toBe('1. a\n2. b\n\nteks');
  });

  it('tanda tidak ditumpuk (parser mobile tidak mendukung): kode > tautan > tebal > miring', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'a', marks: [{ type: 'bold' }, { type: 'italic' }] },
            { type: 'text', text: ' ' },
            { type: 'text', text: 'b', marks: [{ type: 'italic' }] },
            { type: 'text', text: ' ' },
            { type: 'text', text: 'c', marks: [{ type: 'bold' }, { type: 'code' }] },
          ],
        },
      ],
    };
    expect(docToMarkdown(doc)).toBe('**a** *b* `c`');
  });

  it('judul memakai teks polos dan dibatasi level 1-3', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 6 }, content: [{ type: 'text', text: 'X', marks: [{ type: 'bold' }] }] },
        { type: 'heading', attrs: { level: 2 } },
      ],
    };
    expect(docToMarkdown(doc)).toBe('### X');
  });

  it('keterangan foto dibersihkan dari karakter yang memutus sintaks; foto tanpa src dibuang', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'lessonImage', attrs: { src: IMG, caption: 'a [b] (c)\nd' } },
        { type: 'lessonImage', attrs: { src: '', caption: 'x' } },
      ],
    };
    expect(docToMarkdown(doc)).toBe(`![a b c d](${IMG})`);
  });

  it('dua tips berurutan dipisah baris kosong agar tidak menyatu di mobile', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }] },
        { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'b' }] }] },
      ],
    };
    expect(docToMarkdown(doc)).toBe('> a\n\n> b');
  });

  it('jenis node tak dikenal diabaikan', () => {
    expect(docToMarkdown({ type: 'doc', content: [{ type: 'mystery' }] })).toBe('');
    expect(docToMarkdown({ type: 'doc' })).toBe('');
  });
});

describe('youtubeUrlsIn & docStats', () => {
  it('mengumpulkan URL YouTube unik', () => {
    expect(youtubeUrlsIn(`${YT}\n\nhttps://youtu.be/dQw4w9WgXcQ\n\nyoutube.com/shorts/aaaaaaaaaaa`)).toEqual([
      YT,
      'https://youtube.com/shorts/aaaaaaaaaaa',
    ]);
  });

  it('menghitung kata, foto, dan video', () => {
    expect(docStats(`# Judul\n\nsatu dua tiga\n\n![x](${IMG})\n\n${MP4}\n\n${YT}`)).toEqual({ words: 4, images: 1, videos: 2 });
  });
});

describe('embedLegacyVideos', () => {
  it('menyematkan video youtube_urls yang belum ada di naskah, di bagian atas', () => {
    expect(embedLegacyVideos('## Bab', ['https://youtu.be/abcdefghijk', 'youtube.com/shorts/zzzzzzzzzzz'])).toBe(
      'https://youtu.be/abcdefghijk\n\nhttps://youtube.com/shorts/zzzzzzzzzzz\n\n## Bab'
    );
  });

  it('tidak menggandakan video yang sudah ada di naskah atau duplikat di daftar', () => {
    const md = `teks\n\n${YT}`;
    expect(embedLegacyVideos(md, ['https://youtu.be/dQw4w9WgXcQ'])).toBe(md);
    expect(embedLegacyVideos('x', ['https://youtu.be/abcdefghijk', 'https://youtu.be/abcdefghijk'])).toBe('https://youtu.be/abcdefghijk\n\nx');
  });

  it('mengabaikan URL bukan YouTube/kosong dan naskah kosong tidak menyisakan baris kosong', () => {
    expect(embedLegacyVideos('', ['', 'https://contoh.com'])).toBe('');
    expect(embedLegacyVideos('', ['https://youtu.be/abcdefghijk'])).toBe('https://youtu.be/abcdefghijk');
    expect(embedLegacyVideos('x', undefined as unknown as string[])).toBe('x');
  });
});
