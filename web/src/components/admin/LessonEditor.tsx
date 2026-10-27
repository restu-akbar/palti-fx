import React, { useRef, useState } from 'react';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import {
  Bold, Check, Code, Film, Image as ImageIcon, Italic, Lightbulb, Link2, List, ListOrdered, Minus, Redo2, Terminal, Undo2, Upload, X,
} from 'lucide-react';
import { extractYouTubeId } from '../../lib/adminMateri';
import { docToMarkdown, markdownToDoc } from '../../lib/lessonDoc';
import { compressImageToBlob, isVideoFileUrl } from '../../lib/materiContent';
import { MediaUploadService, validateImageFile, validateVideoFile } from '../../lib/mediaStorage';
import { LessonImage, LessonStarterKit, LessonVideo } from './lessonEditorExtensions';
import './LessonEditor.css';

interface LessonEditorProps {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  /** Dipanggil untuk setiap berkas yang berhasil diunggah (untuk pembersihan storage saat simpan). */
  onUploaded: (url: string) => void;
  /** Jumlah unggahan yang sedang berjalan. */
  onBusyChange: (count: number) => void;
  notify: (text: string, error?: boolean) => void;
}

type Dialog = null | 'image' | 'video' | 'link';

function ToolButton(props: { title: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`pfx-tool${props.active ? ' is-active' : ''}`}
      title={props.title}
      aria-label={props.title}
      aria-pressed={props.active}
      disabled={props.disabled}
      // Jaga fokus & seleksi teks di editor saat tombol diklik
      onMouseDown={(e) => e.preventDefault()}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

const normalizeHref = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

function Toolbar({ editor, openDialog }: { editor: Editor; openDialog: (d: Dialog) => void }) {
  const block = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'p';

  const setBlock = (value: string) => {
    const chain = editor.chain().focus();
    if (value === 'p') chain.setParagraph().run();
    else chain.setHeading({ level: Number(value[1]) as 1 | 2 | 3 }).run();
  };

  return (
    <div className="pfx-toolbar" role="toolbar" aria-label="Format teks">
      <ToolButton title="Urungkan (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 size={16} />
      </ToolButton>
      <ToolButton title="Ulangi (Ctrl+Y)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 size={16} />
      </ToolButton>
      <span className="pfx-tool-sep" />

      <select className="pfx-tool-select" value={block} onChange={(e) => setBlock(e.target.value)} aria-label="Gaya paragraf">
        <option value="p">Teks biasa</option>
        <option value="h1">Judul 1</option>
        <option value="h2">Judul 2</option>
        <option value="h3">Judul 3</option>
      </select>
      <span className="pfx-tool-sep" />

      <ToolButton title="Tebal (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={16} />
      </ToolButton>
      <ToolButton title="Miring (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={16} />
      </ToolButton>
      <ToolButton title="Kode sebaris" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code size={16} />
      </ToolButton>
      <ToolButton title="Tautan" active={editor.isActive('link')} onClick={() => openDialog('link')}>
        <Link2 size={16} />
      </ToolButton>
      <span className="pfx-tool-sep" />

      <ToolButton title="Daftar poin" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={16} />
      </ToolButton>
      <ToolButton title="Daftar bernomor" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={16} />
      </ToolButton>
      <ToolButton title="Catatan / Tips emas" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Lightbulb size={16} />
      </ToolButton>
      <ToolButton title="Blok kode" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Terminal size={16} />
      </ToolButton>
      <ToolButton title="Garis pemisah" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={16} />
      </ToolButton>
      <span className="pfx-tool-sep" />

      <button type="button" className="pfx-tool pfx-tool-wide" onMouseDown={(e) => e.preventDefault()} onClick={() => openDialog('image')}>
        <ImageIcon size={16} /> Foto
      </button>
      <button type="button" className="pfx-tool pfx-tool-wide" onMouseDown={(e) => e.preventDefault()} onClick={() => openDialog('video')}>
        <Film size={16} /> Video
      </button>
    </div>
  );
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ initialMarkdown, onChange, onUploaded, onBusyChange, notify }) => {
  const [dialog, setDialog] = useState<Dialog>(null);
  const uploadRef = useRef<(files: File[], pos?: number) => void>(() => {});
  const busyRef = useRef(0);
  const callbacks = useRef({ onChange, onUploaded, onBusyChange, notify });
  callbacks.current = { onChange, onUploaded, onBusyChange, notify };

  const editor = useEditor({
    extensions: [
      LessonStarterKit.configure({
        heading: { levels: [1, 2, 3] },
        underline: false,
        strike: false,
        hardBreak: false,
        link: { openOnClick: false, autolink: true, protocols: ['mailto'] },
      }),
      Placeholder.configure({ placeholder: 'Mulai menulis materi di sini… Ketik "## " untuk judul, "- " untuk daftar, atau seret foto/video ke halaman ini.' }),
      LessonImage,
      LessonVideo,
    ],
    content: markdownToDoc(initialMarkdown),
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { class: 'pfx-doc', spellcheck: 'true' },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (files.length === 0) return false; // seret-lepas internal (memindah blok) ditangani editor
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        uploadRef.current(files, pos);
        return true;
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
        if (files.length === 0) return false;
        event.preventDefault();
        uploadRef.current(files);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => callbacks.current.onChange(docToMarkdown(ed.getJSON())),
  });

  const setBusy = (delta: number) => {
    busyRef.current += delta;
    callbacks.current.onBusyChange(busyRef.current);
  };

  const insertMedia = (type: 'lessonImage' | 'lessonVideo', attrs: Record<string, unknown>, pos?: number) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    (pos === undefined ? chain.insertContent({ type, attrs }) : chain.insertContentAt(pos, { type, attrs })).run();
  };

  // Mengunggah berkas (seret-lepas, tempel, atau dari dialog) lalu menyisipkannya di posisi kursor
  const uploadFiles = async (files: File[], pos?: number) => {
    let at = pos;
    for (const file of files) {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);
      const invalid = isVideo ? validateVideoFile(file) : validateImageFile(file);
      if (invalid) {
        callbacks.current.notify(`${file.name}: ${invalid}`, true);
        continue;
      }
      setBusy(1);
      try {
        const res = isVideo
          ? await MediaUploadService.uploadLessonVideo(file)
          : await MediaUploadService.uploadLessonImage(await compressImageToBlob(file));
        if (!res.success || !res.url) {
          callbacks.current.notify(`${file.name}: ${res.error || 'Gagal mengunggah.'}`, true);
          continue;
        }
        callbacks.current.onUploaded(res.url);
        if (isVideo) insertMedia('lessonVideo', { src: res.url }, at);
        else insertMedia('lessonImage', { src: res.url, caption: '' }, at);
        at = undefined; // berkas berikutnya mengikuti posisi kursor terbaru
      } catch (err) {
        console.error(err);
        callbacks.current.notify(`${file.name}: ${err instanceof Error ? err.message : 'Gagal memproses berkas.'}`, true);
      } finally {
        setBusy(-1);
      }
    }
  };
  uploadRef.current = uploadFiles;

  if (!editor) return null;

  return (
    <div className="pfx-editor">
      <Toolbar editor={editor} openDialog={setDialog} />
      <div className="pfx-paper">
        <EditorContent editor={editor} />
      </div>
      {dialog && (
        <InsertDialog
          kind={dialog}
          editor={editor}
          onClose={() => setDialog(null)}
          onFiles={(files) => void uploadFiles(files)}
          onInsert={insertMedia}
          notify={notify}
        />
      )}
    </div>
  );
};

function InsertDialog({
  kind,
  editor,
  onClose,
  onFiles,
  onInsert,
  notify,
}: {
  kind: 'image' | 'video' | 'link';
  editor: Editor;
  onClose: () => void;
  onFiles: (files: File[]) => void;
  onInsert: (type: 'lessonImage' | 'lessonVideo', attrs: Record<string, unknown>) => void;
  notify: (text: string, error?: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [url, setUrl] = useState(() => (kind === 'link' ? ((editor.getAttributes('link').href as string) ?? '') : ''));

  const title = kind === 'image' ? 'Sisipkan Foto' : kind === 'video' ? 'Sisipkan Video' : 'Tautan';

  const submitUrl = () => {
    if (kind === 'link') {
      const href = normalizeHref(url);
      if (!href) {
        notify('Tautan tidak valid. Gunakan alamat http(s).', true);
        return;
      }
      const { empty } = editor.state.selection;
      if (empty && !editor.isActive('link')) editor.chain().focus().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
      else editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
      onClose();
      return;
    }
    const value = url.trim();
    if (kind === 'image') {
      let ok = false;
      try {
        ok = new URL(value).protocol === 'https:';
      } catch {
        ok = false;
      }
      if (!ok) {
        notify('Tautan gambar harus berupa URL https:// yang valid.', true);
        return;
      }
      onInsert('lessonImage', { src: value, caption: '' });
    } else {
      if (!extractYouTubeId(value) && !isVideoFileUrl(value)) {
        notify('Tautan harus berupa video YouTube atau berkas .mp4/.webm (https).', true);
        return;
      }
      onInsert('lessonVideo', { src: /^https?:\/\//i.test(value) ? value : `https://${value}` });
    }
    onClose();
  };

  return (
    <div className="pfx-modal-backdrop" style={{ zIndex: 1300 }} onClick={onClose}>
      <div className="pfx-modal-panel pfx-insert" onClick={(e) => e.stopPropagation()}>
        <div className="pfx-insert-head">
          <h2>{title}</h2>
          <button type="button" className="pfx-insert-x" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {kind !== 'link' && (
          <div className="pfx-insert-tabs">
            <button type="button" className={tab === 'upload' ? 'is-active' : ''} onClick={() => setTab('upload')}>
              Unggah berkas
            </button>
            <button type="button" className={tab === 'url' ? 'is-active' : ''} onClick={() => setTab('url')}>
              {kind === 'image' ? 'Dari tautan' : 'YouTube / tautan'}
            </button>
          </div>
        )}

        {kind !== 'link' && tab === 'upload' ? (
          <>
            <input
              ref={fileRef}
              type="file"
              hidden
              multiple={kind === 'image'}
              accept={kind === 'image' ? '.png,.jpg,.jpeg,.webp,.gif,.bmp,.avif' : '.mp4,.webm'}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                if (files.length) {
                  onFiles(files);
                  onClose();
                }
              }}
            />
            <button type="button" className="pfx-insert-drop" onClick={() => fileRef.current?.click()}>
              <Upload size={22} />
              <strong>Pilih berkas {kind === 'image' ? 'foto' : 'video'}</strong>
              <span>
                {kind === 'image'
                  ? 'PNG, JPG, WEBP, GIF, BMP, AVIF · otomatis dikompres · maks 5 MB setelah kompresi'
                  : 'MP4 (H.264) atau WebM · maks 50 MB · lebih besar? gunakan tautan YouTube'}
              </span>
            </button>
            <p className="pfx-insert-hint">Tips: Anda juga bisa menyeret berkas langsung ke halaman{kind === 'image' ? ' atau menempel (Ctrl+V) gambar' : ''}.</p>
          </>
        ) : (
          <>
            <input
              className="pfx-input"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submitUrl())}
              placeholder={kind === 'image' ? 'https://contoh.com/gambar.png' : kind === 'video' ? 'https://youtu.be/… atau https://…/video.mp4' : 'https://…'}
            />
            <div className="pfx-insert-actions">
              {kind === 'link' && editor.isActive('link') && (
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    editor.chain().focus().extendMarkRange('link').unsetLink().run();
                    onClose();
                  }}
                >
                  Hapus tautan
                </button>
              )}
              <button type="button" className="btn-cancel" onClick={onClose}>
                Batal
              </button>
              <button type="button" className="btn-primary" onClick={submitUrl} disabled={!url.trim()}>
                <Check size={14} /> <span>{kind === 'link' ? 'Terapkan' : 'Sisipkan'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
