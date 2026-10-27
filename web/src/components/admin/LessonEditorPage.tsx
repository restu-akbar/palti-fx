import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Clock, RotateCcw } from 'lucide-react';
import type { EduLesson } from '../../types/admin';
import { AdminMateriService } from '../../lib/adminMateri';
import { docStats, docToMarkdown, embedLegacyVideos, markdownToDoc, youtubeUrlsIn } from '../../lib/lessonDoc';
import {
  clearLessonDraft, estimateReadingMinutes, expandMediaContent, getLessonDraftKey, readLessonDraft, writeLessonDraft,
} from '../../lib/materiContent';
import type { LessonDraft } from '../../lib/materiContent';
import { LessonEditor } from './LessonEditor';

interface LessonEditorPageProps {
  moduleId: string;
  moduleTitle: string;
  /** null = bab baru */
  lesson: EduLesson | null;
  /** Kembali ke daftar tanpa menyimpan. */
  onClose: () => void;
  /** Bab berhasil disimpan. */
  onSaved: () => void;
  notify: (text: string, error?: boolean) => void;
}

/** Menormalkan naskah lewat editor (bolak-balik) agar naskah yang belum diubah tidak dianggap "berubah". */
const normalize = (markdown: string) => docToMarkdown(markdownToDoc(markdown));

/** Draf lama menyimpan token [FOTO: …] + daftar media; kembalikan ke naskah penuh sebelum dibuka. */
const draftMarkdown = (d: LessonDraft) => normalize(expandMediaContent(d.content, d.media || []));

export const LessonEditorPage: React.FC<LessonEditorPageProps> = ({ moduleId, moduleTitle, lesson, onClose, onSaved, notify }) => {
  const draftKey = getLessonDraftKey(moduleId, lesson?.id);
  const baseline = useMemo(
    () => ({ title: lesson?.title ?? '', minutes: lesson?.minutes ?? 5, markdown: normalize(embedLegacyVideos(lesson?.content ?? '', lesson?.youtube_urls ?? [])) }),
    [lesson]
  );

  const [title, setTitle] = useState(baseline.title);
  const [minutes, setMinutes] = useState(baseline.minutes);
  const [markdown, setMarkdown] = useState(baseline.markdown);
  // Naskah awal editor; berubah hanya saat draf dipulihkan (editor dibuat ulang lewat key)
  const [editorSeed, setEditorSeed] = useState({ key: 0, markdown: baseline.markdown });
  const [uploads, setUploads] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [pendingDraft, setPendingDraft] = useState<LessonDraft | null>(() => {
    const draft = readLessonDraft(draftKey);
    if (!draft) return null;
    const differs = draft.title !== baseline.title || draft.minutes !== baseline.minutes || draftMarkdown(draft) !== baseline.markdown;
    if (!differs) clearLessonDraft(draftKey);
    return differs ? draft : null;
  });

  // URL media yang diunggah selama sesi ini (dibersihkan dari storage bila tidak dipakai saat simpan)
  const sessionUploads = useRef<Set<string>>(new Set());

  const dirty = title !== baseline.title || minutes !== baseline.minutes || markdown !== baseline.markdown;
  const stats = useMemo(() => docStats(markdown), [markdown]);
  const autoMinutes = useMemo(() => estimateReadingMinutes(markdown), [markdown]);

  const save = async () => {
    if (saving) return;
    if (!title.trim()) {
      notify('Judul bab wajib diisi.', true);
      return;
    }
    if (uploads > 0) {
      notify('Tunggu hingga unggahan media selesai sebelum menyimpan.', true);
      return;
    }
    setSaving(true);
    const input = { title, minutes, youtubeUrls: youtubeUrlsIn(markdown), content: markdown };
    const opts = { uploadedUrls: [...sessionUploads.current] };
    const res = lesson
      ? await AdminMateriService.updateLesson(lesson.id, input, opts)
      : await AdminMateriService.createLesson(moduleId, input, opts);
    setSaving(false);
    if (!res.success) {
      notify(res.error || 'Gagal menyimpan bab.', true);
      return;
    }
    clearLessonDraft(draftKey);
    notify(lesson ? `Bab "${title.trim()}" berhasil diperbarui.` : 'Bab materi baru berhasil ditambahkan.');
    onSaved();
  };
  const saveRef = useRef(save);
  saveRef.current = save;

  const requestClose = () => {
    if (saving) return;
    if (dirty) setShowDiscard(true);
    else onClose();
  };

  // Tutup tanpa menyimpan: simpan draf terakhir langsung (autosave tertunda 3 detik) agar bisa dipulihkan
  const closeKeepingDraft = () => {
    if (dirty) writeLessonDraft(draftKey, { title, minutes, content: markdown, media: [], savedAt: Date.now() });
    onClose();
  };

  const restoreDraft = () => {
    if (!pendingDraft) return;
    const md = draftMarkdown(pendingDraft);
    setTitle(pendingDraft.title);
    setMinutes(pendingDraft.minutes);
    setMarkdown(md);
    setEditorSeed((s) => ({ key: s.key + 1, markdown: md }));
    // Media di draf berasal dari unggahan sesi sebelumnya; ikut dibersihkan bila akhirnya tidak dipakai
    [...md.matchAll(/https?:\/\/[^\s)"'\]]+/g)].forEach((m) => sessionUploads.current.add(m[0]));
    setPendingDraft(null);
    notify('Draft berhasil dipulihkan.');
  };

  const discardDraft = () => {
    clearLessonDraft(draftKey);
    setPendingDraft(null);
  };

  // Autosave draf senyap (ditunda 3 detik setelah perubahan terakhir)
  useEffect(() => {
    if (!dirty || pendingDraft) return;
    const timer = window.setTimeout(() => {
      if (writeLessonDraft(draftKey, { title, minutes, content: markdown, media: [], savedAt: Date.now() })) setDraftSavedAt(Date.now());
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [dirty, pendingDraft, draftKey, title, minutes, markdown]);

  // Peringatan browser saat tab ditutup dengan perubahan/unggahan yang belum selesai
  useEffect(() => {
    if (!dirty && uploads === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, uploads]);

  // Ctrl/Cmd+S = simpan
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const statusText = uploads > 0 ? `Mengunggah ${uploads} berkas…` : saving ? 'Menyimpan…' : dirty ? 'Belum disimpan' : lesson ? 'Semua perubahan tersimpan' : 'Bab baru';

  return (
    <div className="pfx-lesson-page" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
          padding: '0.7rem 0', marginBottom: '0.75rem', background: 'var(--bg-primary, #0a0d14)', borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <button type="button" className="btn-secondary" onClick={requestClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.8rem' }}>
            <ArrowLeft size={15} /> Kembali
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {moduleTitle} <span aria-hidden>›</span> {lesson ? 'Edit Bab' : 'Bab Baru'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span role="status" style={{ fontSize: '0.78rem', color: dirty || uploads > 0 ? 'var(--gold-accent)' : 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            {dirty || uploads > 0 ? <AlertTriangle size={13} /> : <Check size={13} />}
            {statusText}
            {dirty && draftSavedAt ? ` · draf ${new Date(draftSavedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </span>
          <button type="button" className="btn-primary" onClick={() => void save()} disabled={saving || uploads > 0} title="Simpan (Ctrl+S)">
            <span>{saving ? 'Menyimpan…' : lesson ? 'Simpan Perubahan' : 'Simpan Bab'}</span>
          </button>
        </div>
      </div>

      {pendingDraft && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem',
            padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(227, 182, 79, 0.06)', border: '1px solid rgba(227, 182, 79, 0.28)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <RotateCcw size={14} color="var(--gold-accent)" />
            Ada draf yang belum disimpan ({new Date(pendingDraft.savedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}). Pulihkan?
          </span>
          <span style={{ display: 'flex', gap: '0.4rem' }}>
            <button type="button" className="btn-cancel" onClick={discardDraft} style={{ fontSize: '0.76rem', padding: '0.3rem 0.7rem' }}>Buang</button>
            <button type="button" className="btn-secondary" onClick={restoreDraft} style={{ fontSize: '0.76rem', padding: '0.3rem 0.7rem', color: 'var(--gold-accent)', borderColor: 'rgba(227, 182, 79, 0.4)' }}>
              Pulihkan Draft
            </button>
          </span>
        </div>
      )}

      <input
        className="pfx-lesson-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul bab"
        aria-label="Judul bab"
        autoFocus={!lesson}
        style={{
          width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', outline: 'none', color: '#fff',
          fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.02em', padding: '0.3rem 0',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.9rem', margin: '0.2rem 0 1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} />
          <input
            type="number"
            min={1}
            aria-label="Estimasi waktu baca (menit)"
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: '56px', padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: '#fff' }}
          />
          menit baca
        </label>
        {minutes !== autoMinutes && (
          <button type="button" onClick={() => setMinutes(autoMinutes)} style={{ background: 'none', border: 'none', color: 'var(--gold-accent)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
            Gunakan perkiraan otomatis ({autoMinutes} menit)
          </button>
        )}
        <span aria-hidden>•</span>
        <span>{stats.words} kata</span>
        <span>{stats.images} foto</span>
        <span>{stats.videos} video</span>
      </div>

      <LessonEditor
        key={editorSeed.key}
        initialMarkdown={editorSeed.markdown}
        onChange={setMarkdown}
        onUploaded={(url) => sessionUploads.current.add(url)}
        onBusyChange={setUploads}
        notify={notify}
      />

      {showDiscard && (
        <div className="pfx-modal-backdrop" style={{ zIndex: 1200 }} onClick={() => setShowDiscard(false)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={28} color="var(--gold-accent)" style={{ margin: '0 auto 0.6rem' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFF', margin: '0 0 0.5rem' }}>Tutup tanpa menyimpan?</h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem', lineHeight: 1.55 }}>
              Perubahan belum disimpan ke database. Draf tersimpan di browser ini dan bisa dipulihkan saat Anda membuka bab ini lagi. Media yang sudah terunggah tetap ada di storage sampai draf dibuang.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={closeKeepingDraft}>Tutup, Simpan Draft</button>
              <button type="button" className="btn-primary" onClick={() => setShowDiscard(false)} autoFocus><span>Lanjut Mengedit</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
