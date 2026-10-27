import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Film, Trash2 } from 'lucide-react';
import { extractYouTubeId } from '../../lib/adminMateri';
import { isVideoFileUrl } from '../../lib/materiContent';

/**
 * Skema editor dibatasi mengikuti apa yang dapat dirender aplikasi mobile, supaya
 * "yang terlihat di editor" = "yang tampil di aplikasi":
 *  - judul tanpa format inline, daftar tanpa tingkat bersarang, tips hanya berisi paragraf
 *  - tebal/miring/kode/tautan tidak boleh ditumpuk (parser mobile tidak mendukungnya)
 */
const SCHEMA_TWEAKS: Record<string, Record<string, unknown>> = {
  heading: { marks: '' },
  listItem: { content: 'paragraph' },
  blockquote: { content: 'paragraph+' },
  bold: { excludes: 'italic code link' },
  italic: { excludes: 'bold code link' },
  link: { excludes: 'bold italic code' },
};

export const LessonStarterKit = StarterKit.extend({
  addExtensions() {
    return (this.parent?.() ?? []).map((ext) => (SCHEMA_TWEAKS[ext.name] ? ext.extend(SCHEMA_TWEAKS[ext.name] as never) : ext));
  },
});

function MediaFrame({ label, onDelete, children }: { label: string; onDelete: () => void; children: React.ReactNode }) {
  return (
    <NodeViewWrapper className="pfx-media" data-drag-handle>
      <div className="pfx-media-bar" contentEditable={false}>
        <span className="pfx-media-label">{label}</span>
        <button type="button" className="pfx-media-del" onClick={onDelete} title="Hapus dari naskah (file di storage ikut terhapus setelah disimpan)">
          <Trash2 size={13} /> Hapus
        </button>
      </div>
      {children}
    </NodeViewWrapper>
  );
}

function ImageView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { src, caption } = node.attrs as { src: string; caption: string };
  return (
    <MediaFrame label="Foto" onDelete={deleteNode}>
      <img src={src} alt={caption || 'Foto materi'} className="pfx-media-img" draggable={false} />
      <input
        className="pfx-media-caption"
        value={caption}
        placeholder="Tambahkan keterangan foto (opsional)"
        onChange={(e) => updateAttributes({ caption: e.target.value })}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </MediaFrame>
  );
}

function VideoView({ node, deleteNode }: NodeViewProps) {
  const src = String(node.attrs.src);
  const ytId = extractYouTubeId(src);
  return (
    <MediaFrame label={ytId ? 'Video YouTube' : 'Video unggahan'} onDelete={deleteNode}>
      {ytId ? (
        <div className="pfx-media-embed">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0`}
            title="Video materi"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : isVideoFileUrl(src) ? (
        <video src={src} controls preload="metadata" className="pfx-media-video" />
      ) : (
        <div className="pfx-media-broken">
          <Film size={16} /> Video tidak dikenali: {src}
        </div>
      )}
    </MediaFrame>
  );
}

export const LessonImage = Node.create({
  name: 'lessonImage',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: '' }, caption: { default: '' } };
  },
  parseHTML() {
    return [{ tag: 'figure[data-lesson-image]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes({ 'data-lesson-image': '' }, HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});

export const LessonVideo = Node.create({
  name: 'lessonVideo',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: '' } };
  },
  parseHTML() {
    return [{ tag: 'div[data-lesson-video]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-lesson-video': '' }, HTMLAttributes)];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VideoView);
  },
});
