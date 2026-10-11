import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Pencil,
  ArrowUp, 
  ArrowDown, 
  Video, 
  Clock, 
  Eye, 
  X, 
  Check, 
  AlertTriangle, 
  Play, 
  Film, 
  BookOpen,
  Smartphone,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCheck,
  Lightbulb,
  ArrowRight,
  Image as ImageIcon,
  Upload,
  Camera
} from 'lucide-react';
import type { EduLesson, EduModule } from '../../types/admin';
import { AdminMateriService, extractYouTubeId } from '../../lib/adminMateri';
import { IoniconsPicker, IonIconPreview } from '../../components/admin/IoniconsPicker';

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
 * Kompresi dan konversi file foto/gambar ke Data URL untuk semua format:
 * PNG, JPG, JPEG, WEBP, GIF, SVG, BMP, AVIF.
 * Menjaga ukuran tetap optimal (< 350KB) agar performa database dan rendering instan.
 */
function compressImageFile(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    // Format SVG dan GIF animasi tidak di-rasterize melalui Canvas (pertahankan animasi & ketajaman vektor)
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch (_) {}
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * MobileRichText - Replikasi parser dan styling RichText dari aplikasi mobile PALTI FX
 * Mendukung format:
 * - Foto/Gambar inline (semua format: PNG, JPG, JPEG, WEBP, GIF, SVG, BMP, AVIF)
 * - Video YouTube inline (bisa diletakkan di mana saja dalam naskah)
 * - # Judul Utama (dengan bar emas)
 * - ## Judul Sub-bab (dengan bar emas 20px)
 * - ### Sub-judul kecil
 * - - Poin daftar / * Poin daftar (dengan bullet wajik emas 45deg)
 * - 1. Poin bernomor (dengan badge nomor bulat)
 * - > Catatan penting / tips (dengan kartu gradien emas & badge bohlam) - mendukung multi-baris
 * - ``` Kode / blok rumus monospace
 * - --- atau *** Garis pemisah tipis
 * - Baris biasa / paragraf (dengan warna teks gading & tipografi mobile yang rapi)
 * - Format inline: **tebal**, *miring*, `kode`, [link](url)
 */
const MobileRichText: React.FC<{
  content: string;
  onImageClick?: (url: string, caption?: string) => void;
}> = ({ content, onImageClick }) => {
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

    // 1. Cek Foto / Gambar Inline (Semua Format: PNG, JPG, JPEG, WEBP, GIF, SVG, BMP, AVIF, Data URL)
    // Format: ![caption](url) atau [foto: url] atau [gambar: url] atau [image: url] atau tautan langsung
    const imgMdMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    const imgTagMatch = trimmed.match(/^\[(?:foto|gambar|image|img)(?::|\s+)(.*?)\]$/i);
    const isDirectImgUrl = /^(https?:\/\/.*?\.(?:png|jpg|jpeg|webp|gif|svg|avif|bmp)(?:\?.*)?)$/i.test(trimmed) || 
                           /^data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml|bmp|avif);base64,/i.test(trimmed);

    let imgSrc: string | null = null;
    let imgCaption = '';

    if (imgMdMatch) {
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
                <span style={{ color: '#E3B64F', fontStyle: 'normal' }}>📸</span>
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

    // 2. Cek Video YouTube Inline (Bisa diletakkan di posisi mana saja dalam naskah)
    // Format: URL langsung (https://youtu.be/... atau https://youtube.com/...)
    // atau tag: [video: url] atau [video](url) atau ![video](url)
    const ytTagMatch = trimmed.match(/^\[video(?::|\s+)(.*?)\]$/i) || 
                       trimmed.match(/^!?\[(?:video|youtube)\]\((.*?)\)$/i);
    const potentialYtUrl = ytTagMatch ? ytTagMatch[1].trim() : trimmed;
    const inlineYtId = extractYouTubeId(potentialYtUrl);

    if (inlineYtId && (ytTagMatch || potentialYtUrl.startsWith('http://') || potentialYtUrl.startsWith('https://'))) {
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

export const AdminMateriView: React.FC = () => {
  const [modules, setModules] = useState<EduModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModId, setSelectedModId] = useState<string | null>(null);

  // Modals state
  const [showModModal, setShowModModal] = useState(false);
  const [editingModule, setEditingModule] = useState<EduModule | null>(null);
  const [modTitle, setModTitle] = useState('');
  const [modSubtitle, setModSubtitle] = useState('');
  const [modLevel, setModLevel] = useState<'Pemula' | 'Menengah' | 'Lanjutan'>('Pemula');
  const [modIcon, setModIcon] = useState('school-outline');

  const [showLesModal, setShowLesModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<EduLesson | null>(null);
  const [lesTitle, setLesTitle] = useState('');
  const [lesMinutes, setLesMinutes] = useState(5);
  const [lesUrls, setLesUrls] = useState<string[]>([]);
  const [inputUrl, setInputUrl] = useState('');
  const [lesContent, setLesContent] = useState('');

  // Media Insertion State
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showInsertImgModal, setShowInsertImgModal] = useState(false);
  const [imgTab, setImgTab] = useState<'upload' | 'url'>('upload');
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [imgCaptionInput, setImgCaptionInput] = useState('');
  const [imgPreviewData, setImgPreviewData] = useState<string | null>(null);
  const [imgCompressing, setImgCompressing] = useState(false);

  const [showInsertVideoModal, setShowInsertVideoModal] = useState(false);
  const [videoModalUrl, setVideoModalUrl] = useState('');

  // Lightbox Modal State
  const [lightboxImg, setLightboxImg] = useState<{ url: string; caption?: string } | null>(null);

  // Preview Modal
  const [previewLesson, setPreviewLesson] = useState<EduLesson | null>(null);
  const [previewVideoIdx, setPreviewVideoIdx] = useState(0);
  const [previewMode, setPreviewMode] = useState<'mobile_vip' | 'pure_text'>('mobile_vip');
  const [copiedText, setCopiedText] = useState(false);

  const previewParentModule = useMemo(() => {
    if (!previewLesson) return null;
    return modules.find((m) => m.lessons?.some((l) => l.id === previewLesson.id)) || null;
  }, [previewLesson, modules]);

  const previewChapterIndex = useMemo(() => {
    if (!previewLesson || !previewParentModule?.lessons) return 1;
    const idx = previewParentModule.lessons.findIndex((l) => l.id === previewLesson.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [previewLesson, previewParentModule]);

  const previewTotalChapters = useMemo(() => {
    return previewParentModule?.lessons?.length || 1;
  }, [previewParentModule]);

  const textWordCount = useMemo(() => {
    if (!previewLesson?.content) return 0;
    return previewLesson.content.trim().split(/\s+/).filter(Boolean).length;
  }, [previewLesson]);

  const textCharCount = useMemo(() => {
    return previewLesson?.content?.length || 0;
  }, [previewLesson]);

  const handleCopyPureText = () => {
    if (!previewLesson?.content) return;
    navigator.clipboard.writeText(previewLesson.content);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Delete Confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'module' | 'lesson'; id: string; name: string } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await AdminMateriService.getModules();
      setModules(data);
      if (data.length > 0 && (!selectedModId || !data.some(m => m.id === selectedModId))) {
        setSelectedModId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const notify = (text: string, error?: boolean) => {
    setFeedbackMsg({ text, error });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const selectedModule = modules.find((m) => m.id === selectedModId) || modules[0] || null;
  const selectedModIdx = selectedModule ? modules.findIndex((m) => m.id === selectedModule.id) : 0;

  // Overview metrics
  const totalLessons = useMemo(() => {
    return modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  }, [modules]);

  const totalVideos = useMemo(() => {
    return modules.reduce((acc, m) => {
      return acc + (m.lessons?.reduce((lAcc, l) => lAcc + (l.youtube_urls?.length || 0), 0) || 0);
    }, 0);
  }, [modules]);

  /* ─── Handlers Modul ─── */
  const handleOpenAddModule = () => {
    setEditingModule(null);
    setModTitle('');
    setModSubtitle('');
    setModLevel('Pemula');
    setModIcon('school-outline');
    setShowModModal(true);
  };

  const handleOpenEditModule = (mod: EduModule) => {
    setEditingModule(mod);
    setModTitle(mod.title);
    setModSubtitle(mod.subtitle || '');
    setModLevel(mod.level);
    setModIcon(mod.icon || 'school-outline');
    setShowModModal(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTitle.trim()) {
      notify('Judul modul wajib diisi.', true);
      return;
    }
    setActionLoading(true);

    if (editingModule) {
      const res = await AdminMateriService.updateModule(editingModule.id, {
        title: modTitle,
        subtitle: modSubtitle,
        level: modLevel,
        icon: modIcon,
      });
      if (res.success) {
        notify(`Modul "${modTitle.trim()}" berhasil diperbarui.`);
        setShowModModal(false);
        setEditingModule(null);
        fetchModules();
      } else {
        notify(res.error || 'Gagal memperbarui modul.', true);
      }
    } else {
      const res = await AdminMateriService.createModule({
        title: modTitle,
        subtitle: modSubtitle,
        level: modLevel,
        icon: modIcon,
      });
      if (res.success) {
        notify('Modul baru berhasil ditambahkan.');
        setShowModModal(false);
        fetchModules();
      } else {
        notify(res.error || 'Gagal tambah modul.', true);
      }
    }
    setActionLoading(false);
  };

  const handleMoveModule = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= modules.length) return;

    const reordered = [...modules];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setModules(reordered);

    const orderedIds = reordered.map((m) => m.id);
    await AdminMateriService.reorderModules(orderedIds);
  };

  /* ─── Handlers Bab ─── */
  const handleOpenAddLesson = () => {
    if (!selectedModule) return;
    setEditingLesson(null);
    setLesTitle('');
    setLesMinutes(5);
    setLesUrls([]);
    setInputUrl('');
    setLesContent('');
    setShowLesModal(true);
  };

  const handleOpenEditLesson = (les: EduLesson) => {
    setEditingLesson(les);
    setLesTitle(les.title);
    setLesMinutes(les.minutes);
    setLesUrls([...(les.youtube_urls || [])]);
    setInputUrl('');
    setLesContent(les.content || '');
    setShowLesModal(true);
  };

  const handleAddVideoUrl = () => {
    if (!inputUrl.trim()) return;
    const ytid = extractYouTubeId(inputUrl);
    if (!ytid) {
      notify('Tautan YouTube tidak valid. Pastikan format link benar (contoh: https://youtu.be/... atau watch?v=...)', true);
      return;
    }
    setLesUrls([...lesUrls, inputUrl.trim()]);
    setInputUrl('');
  };

  const handleRemoveVideoUrl = (idx: number) => {
    setLesUrls(lesUrls.filter((_, i) => i !== idx));
  };

  const insertAtCursor = (textToInsert: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) {
      setLesContent((prev) => (prev ? prev + '\n\n' + textToInsert : textToInsert));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prev = lesContent;
    const newContent = prev.substring(0, start) + textToInsert + prev.substring(end);
    setLesContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 50);
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgCompressing(true);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setImgPreviewData(compressedDataUrl);
    } catch (err) {
      console.error(err);
      notify('Gagal memproses berkas gambar.', true);
    } finally {
      setImgCompressing(false);
    }
  };

  const handleConfirmInsertImage = () => {
    const src = imgTab === 'upload' ? imgPreviewData : imgUrlInput.trim();
    if (!src) {
      notify('Pilih berkas foto atau masukkan tautan URL terlebih dahulu.', true);
      return;
    }
    const caption = imgCaptionInput.trim();
    const markdown = caption ? `\n\n![${caption}](${src})\n\n` : `\n\n![](${src})\n\n`;
    insertAtCursor(markdown);
    setShowInsertImgModal(false);
    setImgPreviewData(null);
    setImgUrlInput('');
    setImgCaptionInput('');
    notify('Foto berhasil disisipkan ke dalam naskah.');
  };

  const handleConfirmInsertVideo = () => {
    const url = videoModalUrl.trim();
    if (!url) return;
    const ytid = extractYouTubeId(url);
    if (!ytid) {
      notify('Tautan YouTube tidak valid. Pastikan format link benar (contoh: https://youtu.be/... atau watch?v=...)', true);
      return;
    }
    insertAtCursor(`\n\n${url}\n\n`);
    if (!lesUrls.some((u) => extractYouTubeId(u) === ytid)) {
      setLesUrls((prev) => [...prev, url]);
    }
    setShowInsertVideoModal(false);
    setVideoModalUrl('');
    notify('Video YouTube berhasil disisipkan ke dalam naskah.');
  };

  const contentVideoCount = useMemo(() => {
    if (!lesContent) return 0;
    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;
    const matches = lesContent.match(ytRegex);
    return matches ? matches.length : 0;
  }, [lesContent]);

  const contentImageCount = useMemo(() => {
    if (!lesContent) return 0;
    const imgRegex = /!\[.*?\]\(.*?\)|\[(?:foto|gambar|image|img):.*?\]/gi;
    const matches = lesContent.match(imgRegex);
    return matches ? matches.length : 0;
  }, [lesContent]);

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule || !lesTitle.trim()) {
      notify('Judul bab wajib diisi.', true);
      return;
    }
    setActionLoading(true);

    // Otomatis sinkronkan seluruh video YouTube yang ada di dalam naskah ke daftar youtubeUrls
    const contentUrls: string[] = [];
    const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;
    let ytMatch;
    while ((ytMatch = ytRegex.exec(lesContent)) !== null) {
      const full = ytMatch[0];
      const norm = full.startsWith('http') ? full : `https://${full}`;
      if (!contentUrls.includes(norm)) contentUrls.push(norm);
    }
    const combinedUrls = [...lesUrls];
    contentUrls.forEach((u) => {
      const id = extractYouTubeId(u);
      if (id && !combinedUrls.some((existing) => extractYouTubeId(existing) === id)) {
        combinedUrls.push(u);
      }
    });

    if (editingLesson) {
      const res = await AdminMateriService.updateLesson(editingLesson.id, {
        title: lesTitle,
        minutes: lesMinutes,
        youtubeUrls: combinedUrls,
        content: lesContent,
      });
      if (res.success) {
        notify(`Bab "${lesTitle.trim()}" berhasil diperbarui.`);
        setShowLesModal(false);
        setEditingLesson(null);
        fetchModules();
      } else {
        notify(res.error || 'Gagal memperbarui bab.', true);
      }
    } else {
      const res = await AdminMateriService.createLesson(selectedModule.id, {
        title: lesTitle,
        minutes: lesMinutes,
        youtubeUrls: combinedUrls,
        content: lesContent,
      });
      if (res.success) {
        notify('Bab materi baru berhasil ditambahkan.');
        setShowLesModal(false);
        fetchModules();
      } else {
        notify(res.error || 'Gagal membuat bab.', true);
      }
    }
    setActionLoading(false);
  };

  const handleMoveLesson = async (index: number, direction: 'up' | 'down') => {
    if (!selectedModule) return;
    const lessons = selectedModule.lessons || [];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= lessons.length) return;

    const reordered = [...lessons];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const updatedModules = modules.map((m) => (m.id === selectedModule.id ? { ...m, lessons: reordered } : m));
    setModules(updatedModules);

    const orderedIds = reordered.map((l) => l.id);
    await AdminMateriService.reorderLessons(orderedIds);
  };

  /* ─── Delete Execution ─── */
  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);

    if (deleteConfirm.type === 'module') {
      const res = await AdminMateriService.deleteModule(deleteConfirm.id);
      if (res.success) {
        notify(`Modul "${deleteConfirm.name}" berhasil dihapus.`);
        fetchModules();
      } else {
        notify(res.error || 'Gagal menghapus modul.', true);
      }
    } else {
      const res = await AdminMateriService.deleteLesson(deleteConfirm.id);
      if (res.success) {
        notify(`Bab "${deleteConfirm.name}" berhasil dihapus.`);
        fetchModules();
      } else {
        notify(res.error || 'Gagal menghapus bab.', true);
      }
    }
    setActionLoading(false);
    setDeleteConfirm(null);
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* ─── Editorial Header: Unboxed, Natural & Calm ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '2.75rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div>
          {/* Section Marker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--gold-accent)' }}>
              01
            </span>
            <span style={{ width: '22px', height: '1px', background: 'var(--gold-border)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
              Kurikulum &amp; Materi Edukasi
            </span>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 600, color: '#FFF', letterSpacing: '-0.02em' }}>
            Silabus Pembelajaran Forex
          </h1>

          {/* Natural Text Metrics Bar (Tanpa Card) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.55rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span>
              <strong style={{ color: '#FFF', fontWeight: 600 }}>{modules.length}</strong> Modul
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span>
              <strong style={{ color: '#FFF', fontWeight: 600 }}>{totalLessons}</strong> Bab Materi
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span>
              <strong style={{ color: 'var(--gold-accent)', fontWeight: 600 }}>{totalVideos}</strong> Video YouTube
            </span>
          </div>
        </div>

        <div>
          <button onClick={handleOpenAddModule} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
            <Plus size={15} />
            <span>Tambah Modul</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.75rem',
          backgroundColor: feedbackMsg.error ? 'var(--danger-bg)' : 'var(--success-bg)',
          border: `1px solid ${feedbackMsg.error ? 'var(--danger-border)' : 'var(--success-border)'}`,
          color: feedbackMsg.error ? '#FDA4AF' : '#6EE7B7',
          fontSize: '0.84rem',
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Memuat kurikulum edukasi...
        </div>
      ) : modules.length === 0 ? (
        <div style={{
          padding: '4.5rem 2rem',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <BookOpen size={36} color="var(--gold-accent)" style={{ opacity: 0.8, marginBottom: '0.75rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
            Belum Ada Modul Edukasi
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
            Kurikulum masih kosong. Mulai rancang materi trading Anda dengan menambahkan modul pembelajaran pertama.
          </p>
          <button onClick={handleOpenAddModule} className="btn-primary">
            <Plus size={15} />
            <span>Tambah Modul Sekarang</span>
          </button>
        </div>
      ) : (
        /* ─── Seamless Two-Column Workspace (Unboxed, Natural Flow) ─── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '290px 1fr',
          gap: '2.5rem',
          alignItems: 'start',
        }}>
          {/* ─── Sisi Kiri: Navigasi Indeks Modul (Unboxed, Nyaru) ─── */}
          <div style={{
            padding: 0,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.65rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-dim)',
              }}>
                Daftar Modul ({modules.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {modules.map((mod, modIdx) => {
                const isSelected = selectedModId === mod.id;
                const lessonCount = mod.lessons?.length || 0;

                return (
                  <div
                    key={mod.id}
                    onClick={() => setSelectedModId(mod.id)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.045)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.65rem',
                      transition: 'all 0.15s ease',
                      border: isSelected ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
                      boxShadow: isSelected ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08)' : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          color: isSelected ? 'var(--gold-accent)' : 'var(--text-dim)',
                        }}>
                          {String(modIdx + 1).padStart(2, '0')}
                        </span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.7rem' }}>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '1px' }}>
                          <IonIconPreview name={mod.icon || 'school-outline'} size={12} color={isSelected ? 'var(--gold-accent)' : 'var(--text-dim)'} />
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {mod.level}
                        </span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '0.7rem' }}>•</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {lessonCount} Bab
                        </span>
                      </div>

                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? '#FFF' : 'var(--text-secondary)',
                        lineHeight: 1.35,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {mod.title}
                      </div>
                    </div>

                    {/* Order & Edit buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditModule(mod)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '3px',
                          display: 'inline-flex',
                          marginRight: '2px',
                        }}
                        title="Edit Modul"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleMoveModule(modIdx, 'up')}
                        disabled={modIdx === 0}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: modIdx === 0 ? 'rgba(255, 255, 255, 0.06)' : 'var(--text-dim)',
                          cursor: modIdx === 0 ? 'default' : 'pointer',
                          padding: '3px',
                          display: 'inline-flex',
                        }}
                        title="Geser Naik"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => handleMoveModule(modIdx, 'down')}
                        disabled={modIdx === modules.length - 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: modIdx === modules.length - 1 ? 'rgba(255, 255, 255, 0.06)' : 'var(--text-dim)',
                          cursor: modIdx === modules.length - 1 ? 'default' : 'pointer',
                          padding: '3px',
                          display: 'inline-flex',
                        }}
                        title="Geser Turun"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Sisi Kanan: Detail Modul & Garis Silabus (Natural Syllabus Canvas) ─── */}
          {selectedModule && (
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header Modul Terpilih (Unboxed, Nyaru) */}
              <div style={{
                marginBottom: '1.75rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--gold-accent)',
                      }}>
                        MODUL {String(selectedModIdx + 1).padStart(2, '0')} / {String(modules.length).padStart(2, '0')}
                      </span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        letterSpacing: '0.04em',
                      }}>
                        Tingkat {selectedModule.level}
                      </span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                      <span style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-dim)',
                      }}>
                        Tersimpan di Cloud
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(227, 182, 79, 0.1)',
                          border: '1px solid rgba(227, 182, 79, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--gold-accent)',
                          flexShrink: 0,
                        }}
                        title={`Ikon: ${selectedModule.icon || 'school-outline'}`}
                      >
                        <IonIconPreview name={selectedModule.icon || 'school-outline'} size={20} color="var(--gold-accent)" />
                      </div>
                      <h2 style={{
                        fontSize: '1.45rem',
                        fontWeight: 600,
                        color: '#FFF',
                        letterSpacing: '-0.015em',
                        lineHeight: 1.3,
                        margin: 0,
                      }}>
                        {selectedModule.title}
                      </h2>
                    </div>

                    {selectedModule.subtitle && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '700px' }}>
                        {selectedModule.subtitle}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <button
                      onClick={handleOpenAddLesson}
                      className="btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                    >
                      <Plus size={14} />
                      <span>Tambah Bab</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModule(selectedModule)}
                      className="btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.5rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Edit Modul Ini"
                    >
                      <Pencil size={13} />
                      <span>Edit Modul</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirm({ type: 'module', id: selectedModule.id, name: selectedModule.title })}
                      className="btn-danger-ghost"
                      style={{ fontSize: '0.78rem', padding: '0.5rem 0.75rem' }}
                      title="Hapus Modul Ini"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-Header Silabus */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-dim)',
                }}>
                  Bab Pembelajaran ({selectedModule.lessons?.length || 0})
                </div>
              </div>

              {(!selectedModule.lessons || selectedModule.lessons.length === 0) ? (
                <div style={{
                  padding: '4rem 1.5rem',
                  textAlign: 'center',
                }}>
                  <BookOpen size={30} color="var(--gold-accent)" style={{ opacity: 0.7, marginBottom: '0.75rem' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
                    Belum Ada Bab Materi
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
                    Modul ini belum memiliki bab pembelajaran. Mulai masukkan materi video dan naskah panduan silabus trading.
                  </p>
                  <button onClick={handleOpenAddLesson} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}>
                    <Plus size={14} />
                    <span>Tambah Bab Pertama</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {selectedModule.lessons.map((les, lesIdx) => {
                    const videoCount = les.youtube_urls?.length || 0;

                    return (
                      <div
                        key={les.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1.15rem 1.25rem',
                          borderBottom: lesIdx === selectedModule.lessons!.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        {/* Sisi Kiri: Nomor + Judul + Metadata */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                          <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: 'var(--gold-accent)',
                            opacity: 0.85,
                            width: '28px',
                            paddingTop: '2px',
                            flexShrink: 0,
                          }}>
                            {String(lesIdx + 1).padStart(2, '0')}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.95rem',
                              fontWeight: 500,
                              color: '#FFF',
                              lineHeight: 1.4,
                              marginBottom: '0.35rem',
                            }}>
                              {les.title}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Clock size={12} color="var(--text-dim)" />
                                <span>{les.minutes} menit baca</span>
                              </span>

                              <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>

                              {videoCount > 0 ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--info)' }}>
                                  <Video size={12} />
                                  <span>{videoCount} Video YouTube</span>
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-dim)' }}>
                                  <BookOpen size={12} />
                                  <span>Teks Silabus</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Sisi Kanan: Aksi Cepat */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {/* Order arrow buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginRight: '0.35rem' }}>
                            <button
                              onClick={() => handleMoveLesson(lesIdx, 'up')}
                              disabled={lesIdx === 0}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: lesIdx === 0 ? 'rgba(255, 255, 255, 0.06)' : 'var(--text-dim)',
                                cursor: lesIdx === 0 ? 'default' : 'pointer',
                                padding: '3px',
                                display: 'inline-flex',
                              }}
                              title="Geser Naik"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              onClick={() => handleMoveLesson(lesIdx, 'down')}
                              disabled={lesIdx === selectedModule.lessons!.length - 1}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: lesIdx === selectedModule.lessons!.length - 1 ? 'rgba(255, 255, 255, 0.06)' : 'var(--text-dim)',
                                cursor: lesIdx === selectedModule.lessons!.length - 1 ? 'default' : 'pointer',
                                padding: '3px',
                                display: 'inline-flex',
                              }}
                              title="Geser Turun"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>

                          {/* Preview Button */}
                          <button
                            onClick={() => {
                              setPreviewLesson(les);
                              setPreviewVideoIdx(0);
                            }}
                            className="btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Buka Pratinjau Bab"
                          >
                            <Eye size={12} />
                            <span>Pratinjau</span>
                          </button>

                          {/* Edit Button (Icon Pensil diantara Pratinjau dan Hapus) */}
                          <button
                            onClick={() => handleOpenEditLesson(les)}
                            className="btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Edit Bab"
                          >
                            <Pencil size={12} />
                          </button>

                          {/* Delete Button (Konsisten seperti Pratinjau dengan teks 'Hapus') */}
                          <button
                            onClick={() => setDeleteConfirm({ type: 'lesson', id: les.id, name: les.title })}
                            className="btn-danger-ghost"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Hapus Bab"
                          >
                            <Trash2 size={12} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL: Tambah / Edit Modul Edukasi (Tata Letak Rapih) ─── */}
      {showModModal && (
        <div className="pfx-modal-backdrop" onClick={() => setShowModModal(false)}>
          <div
            className="pfx-modal-panel"
            style={{ maxWidth: '640px', width: '100%', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.35rem' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Silabus Kurikulum {editingModule ? '• Ubah Modul' : '• Modul Baru'}
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF', margin: '0.2rem 0 0' }}>
                  {editingModule ? 'Edit Modul Edukasi' : 'Tambah Modul Baru'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModule}>
              {/* Seksi 1: Informasi Utama Modul */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                marginBottom: '1rem',
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="pfx-label">
                    Judul Modul <span style={{ color: 'var(--gold-accent)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="pfx-input"
                    placeholder="Contoh: Fondasi Pasar Forex & Karakteristik Pair"
                    value={modTitle}
                    onChange={(e) => setModTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="pfx-label">Sub-judul / Deskripsi Ringkas</label>
                  <input
                    type="text"
                    className="pfx-input"
                    placeholder="Contoh: Pengenalan struktur pasar, likuiditas, dan sesi Tokyo/London/NY"
                    value={modSubtitle}
                    onChange={(e) => setModSubtitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Seksi 2: Pengaturan Level & Tampilan Ikon */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
                padding: '1.15rem',
                marginBottom: '1.25rem',
              }}>
                {/* Pilihan Level (3 Pills Cepat) */}
                <div style={{ marginBottom: '1.15rem' }}>
                  <label className="pfx-label">Tingkat Kesulitan (Level)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {(['Pemula', 'Menengah', 'Lanjutan'] as const).map((lvl) => {
                      const isSelected = modLevel === lvl;
                      const color = lvl === 'Pemula' ? '#34D399' : lvl === 'Menengah' ? 'var(--gold-accent)' : '#A78BFA';
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setModLevel(lvl)}
                          style={{
                            padding: '0.55rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid',
                            borderColor: isSelected ? color : 'rgba(255, 255, 255, 0.08)',
                            backgroundColor: isSelected ? `${color}1A` : 'rgba(255, 255, 255, 0.03)',
                            color: isSelected ? '#FFF' : 'var(--text-secondary)',
                            fontWeight: isSelected ? 600 : 400,
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color }} />
                          <span>{lvl}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pemilih Ikon Ionicons dengan Live Preview, Dropdown, dan Panduan Pencarian */}
                <IoniconsPicker value={modIcon} onChange={setModIcon} />
              </div>

              {/* Footer Modal */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Tersimpan langsung ke database
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowModModal(false)} className="btn-secondary">
                    Batal
                  </button>
                  <button type="submit" className="btn-primary" disabled={actionLoading}>
                    <span>{actionLoading ? 'Menyimpan...' : editingModule ? 'Simpan Perubahan' : 'Simpan Modul'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Tambah / Edit Bab Materi (Tata Letak Ergonomis & Rapih) ─── */}
      {showLesModal && (
        <div className="pfx-modal-backdrop" onClick={() => setShowLesModal(false)}>
          <div
            className="pfx-modal-panel"
            style={{ maxWidth: '820px', width: '100%', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal dengan Close Button */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Bab Pembelajaran • {selectedModule?.title} {editingLesson ? '• Ubah Bab' : '• Bab Baru'}
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF', margin: '0.2rem 0 0' }}>
                  {editingLesson ? 'Edit Bab Pembelajaran' : 'Tambah Bab Baru'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLesModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson}>
              {/* Seksi 1: Identitas Bab (Judul Bab & Estimasi Waktu Baca) */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1rem',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 170px', gap: '1rem', alignItems: 'flex-start' }}>
                  <div>
                    <label className="pfx-label">
                      Judul Bab <span style={{ color: 'var(--gold-accent)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="pfx-input"
                      placeholder="Contoh: Sesi London Breakout & Validasi Entry"
                      value={lesTitle}
                      onChange={(e) => setLesTitle(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="pfx-label">Estimasi Waktu</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="1"
                        className="pfx-input"
                        value={lesMinutes}
                        onChange={(e) => setLesMinutes(Math.max(1, Number(e.target.value) || 1))}
                        required
                        style={{ paddingRight: '4.5rem' }}
                      />
                      <span style={{
                        position: 'absolute',
                        right: '32px',
                        fontSize: '0.78rem',
                        color: 'var(--text-dim)',
                        pointerEvents: 'none',
                      }}>
                        menit
                      </span>
                      <div style={{
                        position: 'absolute',
                        right: '4px',
                        top: '4px',
                        bottom: '4px',
                        width: '22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}>
                        <button
                          type="button"
                          onClick={() => setLesMinutes((prev) => prev + 1)}
                          style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.09)',
                            borderRadius: '3px',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          title="Tambah 1 menit"
                        >
                          <ChevronUp size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setLesMinutes((prev) => Math.max(1, prev - 1))}
                          style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.09)',
                            borderRadius: '3px',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          title="Kurang 1 menit"
                        >
                          <ChevronDown size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seksi 2: Workspace Naskah Silabus & Media Toolbar (Pusat Aktivitas) */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1rem',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.65rem',
                  flexWrap: 'wrap',
                  gap: '0.6rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingBottom: '0.65rem',
                }}>
                  {/* Media Insert Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowInsertVideoModal(true)}
                      className="btn-secondary"
                      style={{
                        fontSize: '0.76rem',
                        padding: '0.35rem 0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        borderColor: 'rgba(227, 182, 79, 0.3)',
                        backgroundColor: 'rgba(227, 182, 79, 0.08)',
                        color: 'var(--gold-accent)',
                      }}
                      title="Sisipkan Video YouTube ke Posisi Kursor di Naskah"
                    >
                      <Film size={13} color="var(--gold-accent)" />
                      <span>+ Sisipkan Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setImgPreviewData(null);
                        setImgCaptionInput('');
                        setImgUrlInput('');
                        setShowInsertImgModal(true);
                      }}
                      className="btn-secondary"
                      style={{
                        fontSize: '0.76rem',
                        padding: '0.35rem 0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        backgroundColor: 'rgba(56, 189, 248, 0.08)',
                        color: '#38BDF8',
                      }}
                      title="Sisipkan Foto / Gambar ke Posisi Kursor (Semua Format: PNG, JPG, WEBP, GIF, SVG, BMP, AVIF)"
                    >
                      <ImageIcon size={13} color="#38BDF8" />
                      <span>+ Sisipkan Foto</span>
                    </button>

                    {/* Separator */}
                    <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 0.15rem' }} />

                    {/* Quick Markdown Formats */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => insertAtCursor('\n\n## Judul Sub-bab\n')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.72rem',
                          padding: '3px 7px',
                          cursor: 'pointer',
                        }}
                        title="Sub-bab H2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertAtCursor('\n- Poin materi')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.72rem',
                          padding: '3px 7px',
                          cursor: 'pointer',
                        }}
                        title="Poin Daftar"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        onClick={() => insertAtCursor('\n> Catatan penting / tips edukasi\n')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '4px',
                          color: 'var(--gold-accent)',
                          fontSize: '0.72rem',
                          padding: '3px 7px',
                          cursor: 'pointer',
                        }}
                        title="Tips Emas"
                      >
                        Tips
                      </button>
                    </div>
                  </div>

                  {/* Real-time Counters */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.74rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>
                      {lesContent.trim().split(/\s+/).filter(Boolean).length} kata
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
                    <span style={{
                      color: contentVideoCount > 0 ? 'var(--gold-accent)' : 'var(--text-dim)',
                      fontWeight: contentVideoCount > 0 ? 600 : 400,
                    }}>
                      {contentVideoCount} Video di Naskah
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
                    <span style={{
                      color: contentImageCount > 0 ? '#38BDF8' : 'var(--text-dim)',
                      fontWeight: contentImageCount > 0 ? 600 : 400,
                    }}>
                      {contentImageCount} Foto di Naskah
                    </span>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  ref={contentTextareaRef}
                  className="pfx-textarea"
                  style={{
                    minHeight: '230px',
                    fontSize: '0.88rem',
                    lineHeight: 1.65,
                    fontFamily: 'inherit',
                    padding: '0.85rem',
                  }}
                  placeholder="Ketik silabus penjelasan materi di sini... Gunakan tombol toolbar di atas untuk menyisipkan video dan gambar di posisi mana saja yang Anda inginkan."
                  value={lesContent}
                  onChange={(e) => setLesContent(e.target.value)}
                />

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.45rem',
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                }}>
                  <span>Tip: Video dan foto yang disisipkan akan muncul tepat di posisi kursor tersebut.</span>
                  <span>Markdown didukung: ## Subjudul, - List, &gt; Tips</span>
                </div>
              </div>

              {/* Seksi 3: Koleksi Video YouTube Tersemat Bab Ini */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Film size={14} color="var(--gold-accent)" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFF' }}>
                      Video YouTube Terdaftar Bab Ini
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-secondary)',
                    }}>
                      {lesUrls.length} Video
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Video yang belum disisipkan ke naskah akan tampil di header atas bab.
                  </span>
                </div>

                {/* Quick Add URL Box */}
                <div style={{ display: 'flex', gap: '0.45rem', marginBottom: lesUrls.length > 0 ? '0.75rem' : 0 }}>
                  <input
                    type="url"
                    className="pfx-input"
                    placeholder="Tempel URL YouTube (https://youtu.be/... atau watch?v=...)"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddVideoUrl}
                    className="btn-secondary"
                    style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Plus size={14} />
                    <span>Tambah Video</span>
                  </button>
                </div>

                {/* Daftar Video Tersemat */}
                {lesUrls.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {lesUrls.map((url, idx) => {
                      const ytid = extractYouTubeId(url);
                      const isPlacedInContent = ytid ? lesContent.includes(ytid) : lesContent.includes(url);
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(255, 255, 255, 0.035)',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                            <Film size={13} color="var(--info)" style={{ flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '340px' }}>
                              Video #{idx + 1}: {url}
                            </span>
                            {isPlacedInContent ? (
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(52, 211, 153, 0.14)',
                                color: '#34D399',
                                border: '1px solid rgba(52, 211, 153, 0.25)',
                                whiteSpace: 'nowrap',
                              }}>
                                ✓ Di Naskah
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                color: '#38BDF8',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                whiteSpace: 'nowrap',
                              }}>
                                📌 Header Atas
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => insertAtCursor(`\n\n${url}\n\n`)}
                              className="btn-secondary"
                              style={{ fontSize: '0.72rem', padding: '0.22rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                              title="Sisipkan video ini langsung ke posisi kursor di naskah"
                            >
                              <Plus size={11} />
                              <span>{isPlacedInContent ? 'Sisipkan Lagi' : 'Sisipkan ke Naskah'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveVideoUrl(idx)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '3px' }}
                              title="Hapus Video Ini"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Modul: {selectedModule?.title}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowLesModal(false)} className="btn-secondary">
                    Batal
                  </button>
                  <button type="submit" className="btn-primary" disabled={actionLoading}>
                    <span>{actionLoading ? 'Menyimpan...' : editingLesson ? 'Simpan Perubahan' : 'Simpan Bab'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Pratinjau Bab (Dual Mode: VIP Mobile Simulator & Pure Text) ─── */}
      {previewLesson && (
        <div className="pfx-modal-backdrop" onClick={() => setPreviewLesson(null)}>
          <div
            className="pfx-modal-panel"
            style={{ maxWidth: '860px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header & Dual Mode Switcher */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              paddingBottom: '0.85rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {previewParentModule?.title ? `${previewParentModule.title} · ` : ''}Pratinjau Bab
                  </span>
                  <span className="pfx-badge pfx-badge-gold" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                    {previewLesson.minutes} Menit
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF', margin: 0 }}>
                  {previewLesson.title}
                </h2>
              </div>

              {/* Mode Switcher Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.28)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('mobile_vip')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.38rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: previewMode === 'mobile_vip' ? 600 : 500,
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: previewMode === 'mobile_vip' ? 'var(--gold-accent)' : 'transparent',
                      color: previewMode === 'mobile_vip' ? '#080B10' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Smartphone size={13} />
                    <span>Tampilan VIP Mobile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewMode('pure_text')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.38rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: previewMode === 'pure_text' ? 600 : 500,
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: previewMode === 'pure_text' ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                      color: previewMode === 'pure_text' ? '#FFF' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <FileText size={13} />
                    <span>Teks Murni (Pure)</span>
                  </button>
                </div>

                <button
                  onClick={() => setPreviewLesson(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                  }}
                  title="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Metrics & Quick Action Bar (Konsisten di kedua mode pratinjau) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>
                  <strong style={{ color: '#FFF' }}>{textWordCount}</strong> Kata
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
                <span>
                  <strong style={{ color: '#FFF' }}>{textCharCount}</strong> Karakter
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
                <span>
                  Estimasi <strong style={{ color: 'var(--gold-accent)' }}>{previewLesson.minutes} Menit</strong> Baca
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyPureText}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', gap: '0.35rem' }}
              >
                {copiedText ? (
                  <>
                    <CheckCheck size={13} color="var(--success)" />
                    <span style={{ color: 'var(--success)' }}>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Salin Naskah Teks</span>
                  </>
                )}
              </button>
            </div>

            {/* Reading Surface Card (Ukuran & tampilan card konsisten di kedua mode) */}
            <div style={{
              backgroundColor: 'rgba(12, 16, 26, 0.38)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              padding: '2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.11)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
              maxHeight: '520px',
              overflowY: 'auto',
            }}>
              {previewMode === 'mobile_vip' ? (
                /* ─── TAMPILAN VIP MOBILE: REAL LOOKS MATERI TERFORMAT ─── */
                <div>
                  {/* Eyebrow & Chapter Header */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#E3B64F',
                      letterSpacing: '1.6px',
                      textTransform: 'uppercase',
                      marginBottom: '6px',
                    }}>
                      {previewParentModule?.title
                        ? `${previewParentModule.title.toUpperCase()} · BAB ${previewChapterIndex}/${previewTotalChapters}`
                        : 'AKADEMI PALTI FX'}
                    </div>

                    <h1 style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: '#F5F2EA',
                      letterSpacing: '-0.4px',
                      lineHeight: 1.3,
                      margin: '0 0 14px',
                    }}>
                      {previewLesson.title}
                    </h1>

                    {/* Mobile Meta Chips Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#B4AFA4',
                        backgroundColor: 'rgba(180, 175, 164, 0.08)',
                        border: '1px solid rgba(180, 175, 164, 0.22)',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        letterSpacing: '0.2px',
                      }}>
                        <Clock size={11} />
                        <span>{previewLesson.minutes} menit baca</span>
                      </span>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#35C98A',
                        backgroundColor: 'rgba(53, 201, 138, 0.12)',
                        border: '1px solid rgba(53, 201, 138, 0.28)',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        letterSpacing: '0.2px',
                      }}>
                        <Check size={11} />
                        <span>Materi VIP</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      height: '4px',
                      borderRadius: '2px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden',
                      marginBottom: '20px',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round((previewChapterIndex / previewTotalChapters) * 100)}%`,
                        backgroundColor: '#E3B64F',
                        borderRadius: '2px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>

                  {/* Embedded Video Top Section (HANYA jika video BELUM disisipkan di dalam naskah) */}
                  {(() => {
                    const content = previewLesson.content || '';
                    const unplaced = (previewLesson.youtube_urls || []).filter((url) => {
                      const ytid = extractYouTubeId(url);
                      if (!ytid) return false;
                      return !content.includes(ytid) && !content.includes(url);
                    });

                    if (unplaced.length === 0) return null;

                    const safeIdx = Math.min(previewVideoIdx, unplaced.length - 1);
                    const currentUrl = unplaced[safeIdx];
                    const videoId = extractYouTubeId(currentUrl);

                    return (
                      <div style={{ marginBottom: '22px' }}>
                        {unplaced.length > 1 && (
                          <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '2px' }}>
                            {unplaced.map((_, vIdx) => (
                              <button
                                key={vIdx}
                                type="button"
                                onClick={() => setPreviewVideoIdx(vIdx)}
                                style={{
                                  padding: '0.3rem 0.75rem',
                                  fontSize: '0.75rem',
                                  fontWeight: safeIdx === vIdx ? 600 : 500,
                                  borderRadius: '8px',
                                  border: safeIdx === vIdx ? '1px solid #E3B64F' : '1px solid rgba(255,255,255,0.08)',
                                  backgroundColor: safeIdx === vIdx ? 'rgba(227, 182, 79, 0.16)' : 'rgba(255,255,255,0.02)',
                                  color: safeIdx === vIdx ? '#E3B64F' : '#B4AFA4',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <Play size={11} />
                                <span>Video #{vIdx + 1}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {videoId && (
                          <div style={{
                            position: 'relative',
                            paddingBottom: '56.25%',
                            height: 0,
                            overflow: 'hidden',
                            borderRadius: '16px',
                            backgroundColor: '#000',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                          }}>
                            <iframe
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                              title={previewLesson.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* RichText Content dengan Media Inline dan Zoom Foto */}
                  <div style={{ minHeight: '60px' }}>
                    <MobileRichText
                      content={previewLesson.content}
                      onImageClick={(url, caption) => setLightboxImg({ url, caption })}
                    />
                  </div>

                  {/* Simulated Mobile Action Buttons (Rapi, terpisah, tidak tabrakan) */}
                  <div style={{
                    marginTop: '2.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}>
                    <button
                      type="button"
                      style={{
                        padding: '12px 24px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #F7DC8E 0%, #E3B64F 50%, #B8892A 100%)',
                        boxShadow: '0 4px 14px rgba(227, 182, 79, 0.28)',
                        color: '#16110A',
                        fontWeight: 800,
                        fontSize: '14px',
                        letterSpacing: '0.2px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <span>Selesai &amp; lanjut</span>
                      <ArrowRight size={16} color="#16110A" />
                    </button>

                    <button
                      type="button"
                      style={{
                        padding: '11px 20px',
                        borderRadius: '14px',
                        border: '1px solid rgba(227, 182, 79, 0.35)',
                        backgroundColor: 'rgba(227, 182, 79, 0.08)',
                        color: '#E3B64F',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <span>Tandai belum selesai</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ─── FULL TEXT PURE READER MODE ─── */
                <div>
                  <h1 style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: '#FFF',
                    letterSpacing: '-0.015em',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  }}>
                    {previewLesson.title}
                  </h1>

                  <div style={{
                    fontSize: '0.92rem',
                    lineHeight: 1.85,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--font-sans)',
                  }}>
                    {previewLesson.content || 'Belum ada konten tertulis untuk bab ini.'}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setPreviewLesson(null)} className="btn-secondary">
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Delete Safeguard Confirmation ─── */}
      {deleteConfirm && (
        <div className="pfx-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <AlertTriangle size={20} color="var(--danger)" />
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
              Hapus {deleteConfirm.type === 'module' ? 'Modul' : 'Bab'}?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Tindakan ini tidak dapat dibatalkan. "{deleteConfirm.name}" akan dihapus permanen dari Supabase.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">
                Batal
              </button>
              <button onClick={executeDelete} className="btn-danger-ghost" disabled={actionLoading}>
                <Trash2 size={13} />
                <span>{actionLoading ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Lightbox Zoom Foto Resolusi Penuh ─── */}
      {lightboxImg && (
        <div
          className="pfx-modal-backdrop"
          style={{ zIndex: 9999, padding: '1.5rem', backgroundColor: 'rgba(0, 0, 0, 0.88)' }}
          onClick={() => setLightboxImg(null)}
        >
          <div
            style={{
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImg(null)}
              style={{
                position: 'absolute',
                top: '-42px',
                right: 0,
                background: 'none',
                border: 'none',
                color: '#FFF',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
              }}
              title="Tutup"
            >
              <span>Tutup</span>
              <X size={18} />
            </button>

            <img
              src={lightboxImg.url}
              alt={lightboxImg.caption || 'Preview'}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            />

            {lightboxImg.caption && (
              <div style={{
                marginTop: '12px',
                color: '#F5F2EA',
                fontSize: '0.88rem',
                textAlign: 'center',
                backgroundColor: 'rgba(12, 16, 26, 0.85)',
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                📸 {lightboxImg.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: Sisipkan Foto / Gambar (Semua Format: PNG, JPG, WEBP, GIF, SVG, BMP, AVIF) ─── */}
      {showInsertImgModal && (
        <div className="pfx-modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setShowInsertImgModal(false)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '540px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Media &amp; Ilustrasi Silabus
                </span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#FFF', margin: '0.2rem 0 0' }}>
                  Sisipkan Foto / Gambar Materi
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInsertImgModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs: Upload Berkas vs Tautan URL */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setImgTab('upload')}
                className="btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.85rem',
                  backgroundColor: imgTab === 'upload' ? 'rgba(227, 182, 79, 0.16)' : 'transparent',
                  borderColor: imgTab === 'upload' ? 'var(--gold-accent)' : 'rgba(255,255,255,0.1)',
                  color: imgTab === 'upload' ? 'var(--gold-accent)' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Upload size={13} />
                <span>Unggah Berkas (Semua Format)</span>
              </button>

              <button
                type="button"
                onClick={() => setImgTab('url')}
                className="btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.85rem',
                  backgroundColor: imgTab === 'url' ? 'rgba(227, 182, 79, 0.16)' : 'transparent',
                  borderColor: imgTab === 'url' ? 'var(--gold-accent)' : 'rgba(255,255,255,0.1)',
                  color: imgTab === 'url' ? 'var(--gold-accent)' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <ImageIcon size={13} />
                <span>Tautan / URL Web</span>
              </button>
            </div>

            {imgTab === 'upload' ? (
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="pfx-label">Pilih Berkas Foto (PNG, JPG, WEBP, GIF, SVG, BMP, AVIF)</label>
                <input
                  type="file"
                  id="pfx-img-file-input"
                  accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg,.bmp,.avif"
                  onChange={handleImageFileSelect}
                  style={{ display: 'none' }}
                />

                <div
                  onClick={() => document.getElementById('pfx-img-file-input')?.click()}
                  style={{
                    padding: '1.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)')}
                >
                  <Camera size={28} color="var(--gold-accent)" style={{ margin: '0 auto 0.6rem', opacity: 0.8 }} />
                  <div style={{ color: '#FFF', fontSize: '0.86rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                    {imgCompressing ? 'Memproses berkas foto...' : 'Klik untuk memilih berkas dari komputer / HP'}
                  </div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>
                    Mendukung semua format gambar (PNG, JPG, JPEG, WEBP, GIF, SVG, BMP, AVIF)
                  </div>
                </div>

                {imgPreviewData && (
                  <div style={{ marginTop: '0.85rem', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '180px', backgroundColor: '#000', textAlign: 'center' }}>
                    <img src={imgPreviewData} alt="Pratinjau" style={{ maxHeight: '180px', width: 'auto', margin: '0 auto', display: 'block' }} />
                    <button
                      type="button"
                      onClick={() => setImgPreviewData(null)}
                      style={{ position: 'absolute', top: '6px', right: '6px', backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', color: '#FDA4AF', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                      title="Hapus foto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="pfx-label">Tautan / URL Gambar</label>
                <input
                  type="url"
                  className="pfx-input"
                  placeholder="Contoh: https://i.imgur.com/example.png atau URL web"
                  value={imgUrlInput}
                  onChange={(e) => setImgUrlInput(e.target.value)}
                />

                {imgUrlInput.trim() && (
                  <div style={{ marginTop: '0.85rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '160px', backgroundColor: '#000', textAlign: 'center' }}>
                    <img src={imgUrlInput.trim()} alt="Pratinjau URL" style={{ maxHeight: '160px', width: 'auto', margin: '0 auto', display: 'block' }} onError={(e) => ((e.currentTarget as HTMLElement).style.display = 'none')} />
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="pfx-label">Keterangan / Caption Gambar (Opsional)</label>
              <input
                type="text"
                className="pfx-input"
                placeholder="Contoh: Analisis Candlestick Pinbar Sesi Tokyo"
                value={imgCaptionInput}
                onChange={(e) => setImgCaptionInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setShowInsertImgModal(false)} className="btn-secondary">
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmInsertImage}
                className="btn-primary"
                disabled={imgCompressing || (imgTab === 'upload' ? !imgPreviewData : !imgUrlInput.trim())}
              >
                <span>Sisipkan Foto ke Naskah</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Sisipkan Video YouTube ke Posisi Kursor ─── */}
      {showInsertVideoModal && (
        <div className="pfx-modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setShowInsertVideoModal(false)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '520px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Video Pembelajaran
                </span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#FFF', margin: '0.2rem 0 0' }}>
                  Sisipkan Video YouTube
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.4rem 0 0' }}>
                  Video akan disisipkan tepat pada posisi kursor di dalam naskah penjelasan materi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInsertVideoModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="pfx-label">Tautan / URL YouTube</label>
              <input
                type="url"
                className="pfx-input"
                placeholder="Tempel tautan (https://youtu.be/... atau watch?v=...)"
                value={videoModalUrl}
                onChange={(e) => setVideoModalUrl(e.target.value)}
                autoFocus
              />

              {videoModalUrl.trim() && (() => {
                const ytid = extractYouTubeId(videoModalUrl);
                if (ytid) {
                  return (
                    <div style={{ marginTop: '0.65rem', fontSize: '0.78rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Check size={13} />
                      <span>Format URL valid (ID: {ytid})</span>
                    </div>
                  );
                } else {
                  return (
                    <div style={{ marginTop: '0.65rem', fontSize: '0.78rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <AlertTriangle size={13} />
                      <span>Format tautan YouTube tidak dikenali.</span>
                    </div>
                  );
                }
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => setShowInsertVideoModal(false)} className="btn-secondary">
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmInsertVideo}
                className="btn-primary"
                disabled={!extractYouTubeId(videoModalUrl)}
              >
                <span>Sisipkan Video ke Naskah</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
