import React from 'react';
import { Film, Lightbulb, Camera } from 'lucide-react';
import type { EmbeddedMediaItem } from '../../lib/materiContent';
import { extractYouTubeId } from '../../lib/adminMateri';
import { isVideoFileUrl } from '../../lib/materiContent';

/**
 * MobileRichText - Replikasi 1:1 parser dan styling RichText dari aplikasi mobile PALTI FX (src/screens/EduScreens.tsx)
 * Mendukung format:
 * - ## Judul kecil (dengan aksen bar emas #E3B64F)
 * - - Poin daftar (dengan bullet wajik emas 45deg)
 * - > Catatan penting / tips (dengan kartu gradien emas & badge bohlam)
 * - Baris biasa / paragraf (dengan warna teks gading & tipografi mobile)
 */
// Helper untuk memformat teks inline: **tebal**, *miring*, `kode`, dan [tautan](url)
const formatInlineText = (text: string): React.ReactNode => {
  if (!text) return text;
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} style={{ color: '#F5F2EA', fontWeight: 700 }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} style={{ color: '#E3B64F', fontStyle: 'italic' }}>
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} style={{
          backgroundColor: 'rgba(227, 182, 79, 0.12)',
          color: '#F7DC8E',
          padding: '2px 6px',
          borderRadius: '5px',
          fontSize: '0.88em',
          fontFamily: 'monospace',
          border: '1px solid rgba(227, 182, 79, 0.25)',
        }}>
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#E3B64F', textDecoration: 'underline' }}
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

/**
 * MobileRichText - Replikasi 1:1 parser dan styling RichText dari aplikasi mobile PALTI FX (src/screens/EduScreens.tsx)
 * Mendukung format:
 * - # Judul Utama (dengan bar emas)
 * - ## Judul Sub-bab (dengan bar emas 20px)
 * - ### Sub-judul kecil
 * - - Poin daftar / * Poin daftar (dengan bullet wajik emas 45deg)
 * - 1. Poin bernomor (dengan badge nomor bulat)
 * - > Catatan penting / tips (dengan kartu gradien emas & badge bohlam) - mendukung multi-baris
 * - ``` Kode / blok rumus monospace
 * - --- atau *** Garis pemisah tipis
 * - Baris biasa / paragraf (dengan warna teks gading & tipografi mobile yang rapi dan mengalir)
/**
 * MobileRichText - Replikasi parser dan styling RichText dari aplikasi mobile PALTI FX
 */
export const MobileRichText: React.FC<{
  content: string;
  onImageClick?: (url: string, caption?: string) => void;
  embeddedMediaList?: EmbeddedMediaItem[];
}> = ({ content, onImageClick, embeddedMediaList }) => {
  if (!content || !content.trim()) {
    return (
      <div style={{ color: '#7A766E', fontStyle: 'italic', fontSize: '13px', padding: '1.5rem 0', textAlign: 'center' }}>
        Belum ada konten tertulis untuk materi ini.
      </div>
    );
  }

  const blocks: React.ReactNode[] = [];
  let paraLines: string[] = [];
  let tipLines: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushPara = (key: string) => {
    if (paraLines.length > 0) {
      blocks.push(
        <div
          key={key}
          style={{
            color: '#B4AFA4',
            fontSize: '15px',
            lineHeight: '26px',
            marginBottom: '14px',
          }}
        >
          {paraLines.map((line, pIdx) => (
            <React.Fragment key={pIdx}>
              {formatInlineText(line)}
              {pIdx < paraLines.length - 1 ? (line.endsWith(':') ? <br /> : ' ') : null}
            </React.Fragment>
          ))}
        </div>
      );
      paraLines = [];
    }
  };

  const flushTip = (key: string) => {
    if (tipLines.length > 0) {
      blocks.push(
        <div
          key={key}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            borderRadius: '18px',
            border: '1px solid rgba(227, 182, 79, 0.28)',
            background: 'linear-gradient(135deg, rgba(227, 182, 79, 0.16) 0%, rgba(227, 182, 79, 0.04) 100%)',
            padding: '16px',
            margin: '16px 0',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '14px',
              backgroundColor: '#E3B64F',
              boxShadow: '0 0 12px rgba(227, 182, 79, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px',
            }}
          >
            <Lightbulb size={16} color="#16110A" />
          </div>
          <div
            style={{
              color: '#F5F2EA',
              fontSize: '14.5px',
              fontWeight: 500,
              lineHeight: '24px',
              flex: 1,
            }}
          >
            {tipLines.map((tLine, tIdx) => (
              <div key={tIdx} style={{ marginBottom: tIdx < tipLines.length - 1 ? '6px' : '0' }}>
                {formatInlineText(tLine)}
              </div>
            ))}
          </div>
        </div>
      );
      tipLines = [];
    }
  };

  const flushCode = (key: string) => {
    if (codeLines.length > 0) {
      blocks.push(
        <div
          key={key}
          style={{
            backgroundColor: '#0F0F13',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            borderRadius: '14px',
            padding: '14px 16px',
            color: '#F7DC8E',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '21px',
            margin: '14px 0',
            overflowX: 'auto',
            whiteSpace: 'pre',
          }}
        >
          {codeLines.join('\n')}
        </div>
      );
      codeLines = [];
    }
  };

  const flushAll = (keyPrefix: string) => {
    flushPara(keyPrefix + '-p');
    flushTip(keyPrefix + '-tip');
    flushCode(keyPrefix + '-code');
  };

  const rawLines = content.split('\n');

  rawLines.forEach((raw, i) => {
    const trimmed = raw.trim();

    // Cek blok kode ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCode('code-' + i);
      } else {
        flushAll('before-code-' + i);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(raw);
      return;
    }

    // Baris kosong
    if (!trimmed) {
      flushAll('blank-' + i);
      return;
    }

    // Baris catatan / tips (> )
    if (trimmed.startsWith('> ')) {
      flushPara('pre-tip-' + i);
      tipLines.push(trimmed.slice(2).trim());
      return;
    } else if (tipLines.length > 0) {
      flushTip('tip-' + i);
    }

    // Garis horizontal pembatas (--- atau ***)
    if (trimmed === '---' || trimmed === '***') {
      flushAll('div-' + i);
      blocks.push(
        <div
          key={'div-' + i}
          style={{
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            margin: '20px 0',
          }}
        />
      );
      return;
    }

    // 1. Cek Foto / Gambar Inline (Semua Format: PNG, JPG, JPEG, WEBP, GIF, SVG, BMP, AVIF, Data URL, atau Wrapper Tag)
    const imgMdMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    const imgTagMatch = trimmed.match(/^\[(?:foto|gambar|image|img)(?::|\s+)(.*?)\]$/i);
    const imgEmbedMatch = trimmed.match(/^\[(?:foto|gambar|media_foto):\s*(.*?)\s*\|\s*id=["'](.*?)["']\]$/i);
    const isDirectImgUrl = /^(https?:\/\/.*?\.(?:png|jpg|jpeg|webp|gif|svg|avif|bmp)(?:\?.*)?)$/i.test(trimmed) || 
                           /^data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml|bmp|avif);base64,/i.test(trimmed);

    let imgSrc: string | null = null;
    let imgCaption = '';

    if (imgEmbedMatch) {
      const mediaId = imgEmbedMatch[2];
      const found = embeddedMediaList?.find((m) => m.id === mediaId);
      if (found) {
        imgSrc = found.src;
        imgCaption = found.caption || imgEmbedMatch[1];
      }
    } else if (imgMdMatch) {
      imgCaption = imgMdMatch[1].trim();
      imgSrc = imgMdMatch[2].trim();
    } else if (imgTagMatch) {
      imgSrc = imgTagMatch[1].trim();
    } else if (isDirectImgUrl) {
      imgSrc = trimmed;
    }

    if (imgSrc) {
      flushAll('img-pre-' + i);
      blocks.push(
        <div
          key={'inline-img-' + i}
          style={{
            margin: '22px 0',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: 'rgba(12, 16, 26, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
          }}
        >
          <div style={{ position: 'relative', textAlign: 'center', backgroundColor: '#07090E', padding: '6px' }}>
            <img
              src={imgSrc}
              alt={imgCaption || 'Gambar Materi Edukasi'}
              style={{
                width: '100%',
                maxHeight: '460px',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
                borderRadius: '12px',
                cursor: onImageClick ? 'zoom-in' : 'default',
                transition: 'transform 0.2s ease',
              }}
              onClick={() => onImageClick?.(imgSrc!, imgCaption)}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0.35';
              }}
            />
          </div>
          {imgCaption && (
            <div style={{
              padding: '9px 14px',
              backgroundColor: 'rgba(18, 22, 32, 0.95)',
              fontSize: '12.5px',
              color: '#B4AFA4',
              fontStyle: 'italic',
              borderTop: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={13} color="#E3B64F" />
                <span>{imgCaption}</span>
              </span>
              {onImageClick && (
                <span style={{ fontSize: '11px', color: '#7A766E', fontStyle: 'normal', cursor: 'pointer' }}>
                  Perbesar
                </span>
              )}
            </div>
          )}
        </div>
      );
      return;
    }

    // 2a. Video berkas unggahan (MP4/WebM): token [VIDEO: ... | url="..."] atau URL polos
    const fileVideoUrl = (trimmed.match(/^\[(?:VIDEO|video):.*?\|\s*url=["'](.*?)["']/)?.[1] ?? trimmed).trim();
    if (isVideoFileUrl(fileVideoUrl)) {
      flushAll('vf-pre-' + i);
      blocks.push(
        <div
          key={'inline-vf-' + i}
          style={{
            margin: '22px 0',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#000',
            border: '1px solid rgba(227, 182, 79, 0.28)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.65)',
          }}
        >
          <video src={fileVideoUrl} controls playsInline preload="metadata" style={{ width: '100%', display: 'block', maxHeight: '420px' }} />
        </div>
      );
      return;
    }

    // 2. Cek Video YouTube Inline (Bisa diletakkan di posisi mana saja dalam naskah)
    // Format: [VIDEO: ... | url="..." | id="..."], URL langsung, [video: url], atau [video](url)
    const videoEmbedMatch = trimmed.match(/^\[(?:VIDEO|video):\s*(.*?)(?:\s*\|\s*url=["'](.*?)["'])?(?:\s*\|\s*id=["'](.*?)["'])?\]$/i);
    const ytTagMatch = trimmed.match(/^\[video(?::|\s+)(.*?)\]$/i) || 
                       trimmed.match(/^!?\[(?:video|youtube)\]\((.*?)\)$/i);
    const potentialYtUrl = videoEmbedMatch && videoEmbedMatch[2]
      ? videoEmbedMatch[2].trim()
      : videoEmbedMatch && videoEmbedMatch[1] && (videoEmbedMatch[1].startsWith('http') || extractYouTubeId(videoEmbedMatch[1]))
      ? videoEmbedMatch[1].trim()
      : ytTagMatch
      ? ytTagMatch[1].trim()
      : trimmed;
    const inlineYtId = extractYouTubeId(potentialYtUrl);

    if (inlineYtId && (videoEmbedMatch || ytTagMatch || potentialYtUrl.startsWith('http://') || potentialYtUrl.startsWith('https://'))) {
      flushAll('yt-pre-' + i);
      blocks.push(
        <div
          key={'inline-yt-' + i}
          style={{
            margin: '22px 0',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#000',
            border: '1px solid rgba(227, 182, 79, 0.28)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.65)',
          }}
        >
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              src={`https://www.youtube.com/embed/${inlineYtId}?rel=0`}
              title={`Video Materi #${i + 1}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div style={{
            padding: '8px 14px',
            backgroundColor: 'rgba(18, 22, 32, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: '#B4AFA4',
            borderTop: '1px solid rgba(255, 255, 255, 0.07)',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Film size={13} color="#E3B64F" />
              <span style={{ fontWeight: 600, color: '#F5F2EA' }}>Video Materi YouTube</span>
            </span>
            <span style={{ color: '#7A766E', fontFamily: 'monospace' }}>ID: {inlineYtId}</span>
          </div>
        </div>
      );
      return;
    }

    // Judul Utama (# )
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      flushAll('h1-pre-' + i);
      blocks.push(
        <div
          key={'h1-' + i}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '24px',
            marginBottom: '12px',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '24px',
              borderRadius: '2px',
              backgroundColor: '#E3B64F',
              boxShadow: '0 0 10px rgba(227, 182, 79, 0.4)',
              flexShrink: 0,
            }}
          />
          <h3
            style={{
              color: '#F5F2EA',
              fontSize: '21px',
              fontWeight: 800,
              letterSpacing: '-0.4px',
              lineHeight: 1.25,
              margin: 0,
              flex: 1,
            }}
          >
            {formatInlineText(trimmed.slice(2))}
          </h3>
        </div>
      );
      return;
    }

    // Judul Sub-bab (## )
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      flushAll('h2-pre-' + i);
      blocks.push(
        <div
          key={'h2-' + i}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '22px',
            marginBottom: '10px',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '4px',
              height: '20px',
              borderRadius: '2px',
              backgroundColor: '#E3B64F',
              boxShadow: '0 0 8px rgba(227, 182, 79, 0.4)',
              flexShrink: 0,
            }}
          />
          <h4
            style={{
              color: '#F5F2EA',
              fontSize: '18.5px',
              fontWeight: 800,
              letterSpacing: '-0.3px',
              lineHeight: 1.3,
              margin: 0,
              flex: 1,
            }}
          >
            {formatInlineText(trimmed.slice(3))}
          </h4>
        </div>
      );
      return;
    }

    // Sub-judul kecil (### )
    if (trimmed.startsWith('### ')) {
      flushAll('h3-pre-' + i);
      blocks.push(
        <h5
          key={'h3-' + i}
          style={{
            color: '#F5F2EA',
            fontSize: '16px',
            fontWeight: 700,
            marginTop: '18px',
            marginBottom: '8px',
          }}
        >
          {formatInlineText(trimmed.slice(4))}
        </h5>
      );
      return;
    }

    // Poin daftar (- atau *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushAll('bullet-pre-' + i);
      const bulletText = trimmed.slice(2).trim();
      blocks.push(
        <div
          key={'bullet-' + i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '11px',
            marginBottom: '9px',
            paddingLeft: '2px',
          }}
        >
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '2px',
              backgroundColor: '#E3B64F',
              transform: 'rotate(45deg)',
              marginTop: '9px',
              boxShadow: '0 0 6px rgba(227, 182, 79, 0.4)',
              flexShrink: 0,
            }}
          />
          <div
            style={{
              color: '#B4AFA4',
              fontSize: '15px',
              lineHeight: '25px',
              flex: 1,
            }}
          >
            {formatInlineText(bulletText)}
          </div>
        </div>
      );
      return;
    }

    // Poin bernomor (1., 2., dst.)
    if (/^\d+\.\s+/.test(trimmed)) {
      flushAll('num-pre-' + i);
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      const num = match ? match[1] : '';
      const text = match ? match[2] : trimmed;
      blocks.push(
        <div
          key={'num-' + i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '11px',
            marginBottom: '9px',
            paddingLeft: '2px',
          }}
        >
          <div
            style={{
              minWidth: '22px',
              height: '22px',
              borderRadius: '11px',
              backgroundColor: 'rgba(227, 182, 79, 0.14)',
              border: '1px solid rgba(227, 182, 79, 0.35)',
              color: '#E3B64F',
              fontSize: '11.5px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '2px',
              flexShrink: 0,
            }}
          >
            {num}
          </div>
          <div
            style={{
              color: '#B4AFA4',
              fontSize: '15px',
              lineHeight: '25px',
              flex: 1,
            }}
          >
            {formatInlineText(text)}
          </div>
        </div>
      );
      return;
    }

    // Baris paragraf biasa
    paraLines.push(trimmed);
  });

  flushAll('final');
  return <div style={{ wordBreak: 'break-word' }}>{blocks}</div>;
};
