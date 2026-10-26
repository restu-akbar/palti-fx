import { extractYouTubeId } from './adminMateri';
import { isVideoFileUrl } from './materiContent';

/**
 * Konversi dua arah antara naskah materi (teks format ringan yang dibaca aplikasi mobile)
 * dan dokumen editor visual (struktur JSON ala ProseMirror/TipTap).
 *
 * Format naskah mengikuti parser mobile (`RichText` di EduScreens.tsx), sehingga hasil simpan
 * dari editor tetap tampil benar di aplikasi dan data lama tetap bisa dibuka:
 *   # / ## / ### judul · 1. daftar bernomor · - daftar poin · > catatan/tips · --- pemisah
 *   ``` blok kode · ![keterangan](url) foto · baris URL video (YouTube / MP4 / WebM)
 *   inline: **tebal**  *miring*  `kode`  [teks](url)
 */

export interface DocMark {
  type: string;
  attrs?: { href: string };
}
export interface DocNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: DocMark[];
  text?: string;
}

const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

const text = (value: string, marks?: DocMark[]): DocNode => ({ type: 'text', text: value, ...(marks ? { marks } : {}) });

/** Teks satu baris (dengan **tebal**, *miring*, `kode`, [tautan](url)) menjadi node inline. */
export function parseInline(source: string): DocNode[] {
  const out: DocNode[] = [];
  let last = 0;
  for (const m of source.matchAll(INLINE_RE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text(source.slice(last, at)));
    const token = m[0];
    if (token.startsWith('**')) out.push(text(token.slice(2, -2), [{ type: 'bold' }]));
    else if (token.startsWith('*')) out.push(text(token.slice(1, -1), [{ type: 'italic' }]));
    else if (token.startsWith('`')) out.push(text(token.slice(1, -1), [{ type: 'code' }]));
    else {
      const link = token.match(/^\[(.*?)\]\((.*?)\)$/);
      if (link && link[1]) out.push(text(link[1], [{ type: 'link', attrs: { href: link[2] } }]));
      else out.push(text(token));
    }
    last = at + token.length;
  }
  if (last < source.length) out.push(text(source.slice(last)));
  return out;
}

const paragraph = (src: string): DocNode => {
  const content = parseInline(src);
  return content.length ? { type: 'paragraph', content } : { type: 'paragraph' };
};

const plainBlock = (type: string, attrs: Record<string, unknown> | undefined, src: string): DocNode => ({
  type,
  ...(attrs ? { attrs } : {}),
  ...(src ? { content: [text(src)] } : {}),
});

const image = (src: string, caption = ''): DocNode => ({ type: 'lessonImage', attrs: { src, caption } });
const video = (src: string): DocNode => ({ type: 'lessonVideo', attrs: { src } });

const isDirectImageUrl = (line: string) =>
  /^(https?:\/\/.*?\.(?:png|jpg|jpeg|webp|gif|svg|avif|bmp)(?:\?.*)?)$/i.test(line) ||
  /^data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml|bmp|avif);base64,/i.test(line);

/** URL video dari satu baris naskah (token, tag, atau URL polos), atau null bila bukan baris video. */
function videoUrlOf(line: string): string | null {
  const token = line.match(/^\[(?:VIDEO|video):\s*(.*?)(?:\s*\|\s*url=["'](.*?)["'])?(?:\s*\|\s*id=["'](.*?)["'])?\]$/i);
  const tag = line.match(/^\[video(?::|\s+)(.*?)\]$/i) || line.match(/^!?\[(?:video|youtube)\]\((.*?)\)$/i);
  const candidate =
    token && token[2]
      ? token[2].trim()
      : token && token[1] && (token[1].startsWith('http') || extractYouTubeId(token[1]))
        ? token[1].trim()
        : tag
          ? tag[1].trim()
          : line;

  if (isVideoFileUrl(candidate)) return candidate;
  if (extractYouTubeId(candidate) && (token || tag || /^https?:\/\//i.test(candidate))) {
    return /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  }
  return null;
}

/** Naskah materi (teks format ringan) menjadi dokumen editor. */
export function markdownToDoc(markdown: string): DocNode {
  const blocks: DocNode[] = [];
  let para: string[] = [];
  let tips: string[] = [];
  let code: string[] = [];
  let inCode = false;
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) blocks.push(paragraph(para.join(' ')));
    para = [];
  };
  const flushTips = () => {
    if (tips.length) blocks.push({ type: 'blockquote', content: tips.map(paragraph) });
    tips = [];
  };
  const flushList = () => {
    if (list) {
      blocks.push({
        type: list.ordered ? 'orderedList' : 'bulletList',
        content: list.items.map((item) => ({ type: 'listItem', content: [paragraph(item)] })),
      });
    }
    list = null;
  };
  const flushAll = () => {
    flushPara();
    flushTips();
    flushList();
  };

  for (const raw of (markdown || '').split('\n')) {
    const line = raw.trim();

    if (line.startsWith('```')) {
      if (inCode) {
        blocks.push(plainBlock('codeBlock', undefined, code.join('\n')));
        code = [];
        inCode = false;
      } else {
        flushAll();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(raw);
      continue;
    }

    if (!line) {
      flushAll();
      continue;
    }

    if (line.startsWith('> ')) {
      flushPara();
      flushList();
      tips.push(line.slice(2).trim());
      continue;
    }
    flushTips();

    if (line === '---' || line === '***') {
      flushAll();
      blocks.push({ type: 'horizontalRule' });
      continue;
    }

    const imgMd = line.match(/^!\[(.*?)\]\((.*?)\)$/);
    const imgTag = line.match(/^\[(?:foto|gambar|image|img)(?::|\s+)(.*?)\]$/i);
    if (imgMd || imgTag || isDirectImageUrl(line)) {
      flushAll();
      blocks.push(imgMd ? image(imgMd[2].trim(), imgMd[1].trim()) : image(imgTag ? imgTag[1].trim() : line));
      continue;
    }

    const videoUrl = videoUrlOf(line);
    if (videoUrl) {
      flushAll();
      blocks.push(video(videoUrl));
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushAll();
      blocks.push(plainBlock('heading', { level: heading[1].length }, heading[2]));
      continue;
    }

    const num = line.match(/^\d+\.\s+(.+)$/);
    const bullet = !num && (line.startsWith('- ') || line.startsWith('* ')) ? line.slice(2) : null;
    if (num || bullet !== null) {
      flushPara();
      const ordered = !!num;
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push(num ? num[1] : (bullet as string));
      continue;
    }

    flushList();
    para.push(line);
  }

  if (inCode) blocks.push(plainBlock('codeBlock', undefined, code.join('\n')));
  flushAll();
  return { type: 'doc', content: blocks.length ? blocks : [{ type: 'paragraph' }] };
}

/** Satu node teks inline menjadi sintaks naskah. Tanda tidak ditumpuk karena parser mobile tidak mendukungnya. */
function inlineText(node: DocNode): string {
  const value = node.text ?? '';
  const marks = node.marks ?? [];
  const has = (t: DocMark['type']) => marks.find((m) => m.type === t);
  if (!value) return '';
  if (has('code')) return `\`${value}\``;
  const link = has('link');
  if (link?.attrs?.href) return `[${value}](${link.attrs.href})`;
  if (has('bold')) return `**${value}**`;
  if (has('italic')) return `*${value}*`;
  return value;
}

const inlineOf = (node: DocNode) => (node.content ?? []).map(inlineText).join('');
const plainOf = (node: DocNode) => (node.content ?? []).map((n) => n.text ?? '').join('');

/** Dokumen editor menjadi naskah materi (teks format ringan). */
export function docToMarkdown(doc: DocNode): string {
  const out: string[] = [];

  for (const node of doc.content ?? []) {
    switch (node.type) {
      case 'paragraph': {
        const line = inlineOf(node).trim();
        if (line) out.push(line);
        break;
      }
      case 'heading': {
        const level = Math.min(3, Math.max(1, Number(node.attrs?.level) || 1));
        const line = plainOf(node).trim();
        if (line) out.push(`${'#'.repeat(level)} ${line}`);
        break;
      }
      case 'bulletList':
      case 'orderedList': {
        const ordered = node.type === 'orderedList';
        const items = (node.content ?? [])
          .map((li) => (li.content ?? []).map(inlineOf).join(' ').trim())
          .filter(Boolean)
          .map((item, i) => (ordered ? `${i + 1}. ${item}` : `- ${item}`));
        if (items.length) out.push(items.join('\n'));
        break;
      }
      case 'blockquote': {
        const lines = (node.content ?? []).map((p) => inlineOf(p).trim()).filter(Boolean);
        if (lines.length) out.push(lines.map((l) => `> ${l}`).join('\n'));
        break;
      }
      case 'codeBlock':
        out.push('```\n' + plainOf(node) + '\n```');
        break;
      case 'horizontalRule':
        out.push('---');
        break;
      case 'lessonImage': {
        const src = String(node.attrs?.src ?? '').trim();
        // Karakter penutup markdown di keterangan akan memutus sintaks foto
        const caption = String(node.attrs?.caption ?? '').replace(/[[\]()\n]/g, ' ').replace(/\s+/g, ' ').trim();
        if (src) out.push(`![${caption}](${src})`);
        break;
      }
      case 'lessonVideo': {
        const src = String(node.attrs?.src ?? '').trim();
        if (src) out.push(src);
        break;
      }
      default:
        break;
    }
  }

  return out.join('\n\n');
}

/** URL YouTube unik yang ada di naskah (untuk kolom youtube_urls). */
export function youtubeUrlsIn(markdown: string): string[] {
  const urls: string[] = [];
  const re = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;
  for (const m of markdown.matchAll(re)) {
    const url = m[0].startsWith('http') ? m[0] : `https://${m[0]}`;
    const id = extractYouTubeId(url);
    if (id && !urls.some((u) => extractYouTubeId(u) === id)) urls.push(url);
  }
  return urls;
}

/** Statistik singkat untuk bar status editor. */
export function docStats(markdown: string): { words: number; images: number; videos: number } {
  const doc = markdownToDoc(markdown);
  let images = 0;
  let videos = 0;
  const words: string[] = [];
  const walk = (n: DocNode) => {
    if (n.type === 'lessonImage') images++;
    else if (n.type === 'lessonVideo') videos++;
    else if (n.text) words.push(n.text);
    n.content?.forEach(walk);
  };
  walk(doc);
  return { words: words.join(' ').split(/\s+/).filter(Boolean).length, images, videos };
}

/**
 * Bab lama menyimpan sebagian video di kolom youtube_urls tanpa menyebutnya di naskah (mobile menampilkannya
 * di bagian atas bab). Sematkan video itu di awal naskah agar terlihat dan bisa diatur di editor, dan tidak
 * hilang saat bab disimpan ulang (kolom youtube_urls diturunkan dari isi naskah).
 */
export function embedLegacyVideos(markdown: string, youtubeUrls: string[]): string {
  const present = new Set(youtubeUrlsIn(markdown).map((u) => extractYouTubeId(u)));
  const missing = (youtubeUrls || [])
    .map((u) => (u || '').trim())
    .filter((u) => {
      const id = extractYouTubeId(u);
      if (!id || present.has(id)) return false;
      present.add(id);
      return true;
    })
    .map((u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`));
  if (missing.length === 0) return markdown;
  return [...missing, markdown].filter((part) => part.trim()).join('\n\n');
}
