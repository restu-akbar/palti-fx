import React, { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  ChevronDown,
  Check,
  X,
  BookOpen,
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart,
  ShieldCheck,
  Wallet,
  GraduationCap,
  Lightbulb,
  Calculator,
  Zap,
  Compass,
  Clock,
  Globe,
  Trophy,
  HelpCircle,
  Copy,
  CheckCheck
} from 'lucide-react';

export interface IconPresetItem {
  id: string;
  name: string;
  category: 'trading' | 'edu' | 'finance' | 'strategy';
  keywords: string;
}

export const IONICON_PRESETS: IconPresetItem[] = [
  // 📈 Grafik & Analisis Pasar
  { id: 'trending-up-outline', name: 'Tren Naik (Bullish)', category: 'trading', keywords: 'trend up naik bull bullish chart grafik profit' },
  { id: 'trending-down-outline', name: 'Tren Turun (Bearish)', category: 'trading', keywords: 'trend down turun bear bearish chart grafik' },
  { id: 'analytics-outline', name: 'Analisis Pasar', category: 'trading', keywords: 'analytics analisis market chart data teknikal' },
  { id: 'bar-chart-outline', name: 'Grafik Batang (Bar Chart)', category: 'trading', keywords: 'bar chart grafik candlestick batang' },
  { id: 'pie-chart-outline', name: 'Distribusi Portofolio', category: 'trading', keywords: 'pie chart alokasi pembagian modal' },
  { id: 'stats-chart-outline', name: 'Statistik & Performa', category: 'trading', keywords: 'stats statistik performa winrate hasil' },
  { id: 'pulse-outline', name: 'Volatilitas & Denyut', category: 'trading', keywords: 'pulse sinyal signal volatilitas denyut' },
  { id: 'speedometer-outline', name: 'Indikator & Momentum', category: 'trading', keywords: 'speedometer indikator rsi momentum cepat' },

  // 📚 Edukasi & Pembelajaran
  { id: 'school-outline', name: 'Akademi & Silabus', category: 'edu', keywords: 'school sekolah akademi silabus kurikulum belajar' },
  { id: 'book-outline', name: 'Buku Materi Dasar', category: 'edu', keywords: 'book buku bacaan dasar materi bab' },
  { id: 'library-outline', name: 'Koleksi Modul Lengkap', category: 'edu', keywords: 'library perpustakaan koleksi kumpulan arsip' },
  { id: 'reader-outline', name: 'Artikel & Panduan Bacaan', category: 'edu', keywords: 'reader baca membaca panduan artikel naskah' },
  { id: 'ribbon-outline', name: 'Sertifikasi & Kelulusan', category: 'edu', keywords: 'ribbon pita sertifikat kelulusan lulus reward' },
  { id: 'bulb-outline', name: 'Tips & Ide Trading', category: 'edu', keywords: 'bulb lampu ide tips trik insight wawasan' },
  { id: 'document-text-outline', name: 'Jurnal & Trading Plan', category: 'edu', keywords: 'document dokumen jurnal plan aturan catatan' },

  // 🛡️ Manajemen Risiko & Finansial
  { id: 'shield-checkmark-outline', name: 'Proteksi & Stop Loss', category: 'finance', keywords: 'shield proteksi aman stop loss risk manajemen risiko' },
  { id: 'wallet-outline', name: 'Dompet & Saldo Akun', category: 'finance', keywords: 'wallet dompet saldo balance dana equity' },
  { id: 'cash-outline', name: 'Profit & Uang Tunai', category: 'finance', keywords: 'cash uang tunai profit cuan withdraw tarik' },
  { id: 'card-outline', name: 'Metode Transaksi Akun', category: 'finance', keywords: 'card kartu transaksi deposit bank pembayaran' },
  { id: 'calculator-outline', name: 'Kalkulator Lot & Pip', category: 'finance', keywords: 'calc kalkulator lot pips risiko hitung' },
  { id: 'pricetag-outline', name: 'Instrumen & Pair Forex', category: 'finance', keywords: 'pricetag harga pair simbol mata uang eurusd xauusd' },
  { id: 'lock-closed-outline', name: 'Keamanan & Psikologi', category: 'finance', keywords: 'lock kunci disiplin psikologi aman proteksi' },

  // ⚡ Strategi & Eksekusi
  { id: 'flash-outline', name: 'Eksekusi Cepat (Scalping)', category: 'strategy', keywords: 'flash kilat petir scalping eksekusi cepat order' },
  { id: 'compass-outline', name: 'Arah & Bias Harian', category: 'strategy', keywords: 'compass kompas arah navigasi bias harian tren' },
  { id: 'time-outline', name: 'Sesi Trading & Waktu', category: 'strategy', keywords: 'time waktu jam sesi london newyork tokyo sydney' },
  { id: 'globe-outline', name: 'Pasar Global & Makro', category: 'strategy', keywords: 'globe dunia global berita news ekonomi makro' },
  { id: 'trophy-outline', name: 'Pencapaian & Target', category: 'strategy', keywords: 'trophy piala juara target goal sukses reward' },
  { id: 'flag-outline', name: 'Rencana & Milestone', category: 'strategy', keywords: 'flag bendera target titik rencana milestone' },
  { id: 'flame-outline', name: 'Sinyal Panas / High Impact', category: 'strategy', keywords: 'flame api panas hot news high impact nfp' },
  { id: 'sparkles-outline', name: 'Strategi Eksklusif VIP', category: 'strategy', keywords: 'sparkles bintang kilau khusus vip master pro' },
];

/**
 * Preview gambar ikon Ionicons secara live di browser.
 * Menggunakan web component <ion-icon> dari script unpkg resmi Ionicons,
 * dengan fallback ikon Lucide bila web component sedang memuat.
 */
export function IonIconPreview({
  name,
  size = 20,
  color = 'currentColor',
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const cleanName = (name || '').trim().toLowerCase();

  const renderFallback = () => {
    if (cleanName.includes('trending-up')) return <TrendingUp size={size} color={color} />;
    if (cleanName.includes('trending-down')) return <TrendingDown size={size} color={color} />;
    if (cleanName.includes('analytics') || cleanName.includes('bar-chart') || cleanName.includes('stats')) return <BarChart2 size={size} color={color} />;
    if (cleanName.includes('pie')) return <PieChart size={size} color={color} />;
    if (cleanName.includes('book') || cleanName.includes('reader')) return <BookOpen size={size} color={color} />;
    if (cleanName.includes('school') || cleanName.includes('library')) return <GraduationCap size={size} color={color} />;
    if (cleanName.includes('shield') || cleanName.includes('lock')) return <ShieldCheck size={size} color={color} />;
    if (cleanName.includes('wallet') || cleanName.includes('cash') || cleanName.includes('card')) return <Wallet size={size} color={color} />;
    if (cleanName.includes('bulb')) return <Lightbulb size={size} color={color} />;
    if (cleanName.includes('calc')) return <Calculator size={size} color={color} />;
    if (cleanName.includes('flash') || cleanName.includes('flame')) return <Zap size={size} color={color} />;
    if (cleanName.includes('compass')) return <Compass size={size} color={color} />;
    if (cleanName.includes('time')) return <Clock size={size} color={color} />;
    if (cleanName.includes('globe')) return <Globe size={size} color={color} />;
    if (cleanName.includes('trophy') || cleanName.includes('ribbon') || cleanName.includes('flag')) return <Trophy size={size} color={color} />;
    return <BookOpen size={size} color={color} />;
  };

  if (!cleanName) {
    return <span style={{ opacity: 0.35, fontSize: `${size * 0.75}px` }}>—</span>;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size + 2}px`,
        height: `${size + 2}px`,
        lineHeight: 1,
      }}
    >
      {React.createElement('ion-icon', {
        name: cleanName,
        style: {
          fontSize: `${size}px`,
          color: color,
          display: 'block',
        },
      }, renderFallback())}
    </span>
  );
}

export function IoniconsPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'trading' | 'edu' | 'finance' | 'strategy'>('all');
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  const filteredPresets = useMemo(() => {
    const q = search.toLowerCase().trim();
    return IONICON_PRESETS.filter((item) => {
      const matchCat = category === 'all' || item.category === category;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Label & Header Akses Cepat */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <label className="pfx-label" style={{ marginBottom: 0 }}>
          Ikon Materi (Ionicons)
        </label>
        <button
          type="button"
          onClick={() => {
            setShowGuide((prev) => !prev);
            if (!showGuide) setIsOpen(false);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: showGuide ? 'var(--gold-accent)' : 'var(--text-dim)',
            fontSize: '0.72rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: showGuide ? 'rgba(227, 182, 79, 0.12)' : 'transparent',
            transition: 'all 0.15s ease',
          }}
        >
          <HelpCircle size={13} />
          <span>{showGuide ? 'Tutup Panduan' : 'Panduan Cari Ikon ↗'}</span>
        </button>
      </div>

      {/* Baris Input & Kotak Preview Gambar Kecil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Kotak Preview Gambar Kecil */}
        <div
          title={value ? `Pratinjau ikon aktif: ${value}` : 'Belum ada ikon'}
          style={{
            width: '42px',
            height: '42px',
            flexShrink: 0,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(227, 182, 79, 0.08)',
            border: '1px solid rgba(227, 182, 79, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-accent)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
            transition: 'all 0.2s ease',
          }}
        >
          <IonIconPreview name={value} size={22} color="var(--gold-accent)" />
        </div>

        {/* Input Text Nama Ikon */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            className="pfx-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="contoh: book-outline"
            style={{
              paddingRight: value ? '5.5rem' : '4.2rem',
              fontFamily: 'monospace',
              fontSize: '0.84rem',
            }}
          />

          {/* Tombol Clear & Trigger Dropdown */}
          <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {value ? (
              <button
                type="button"
                onClick={() => onChange('')}
                title="Hapus ikon"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={13} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setIsOpen((prev) => !prev);
                if (!isOpen) setShowGuide(false);
              }}
              style={{
                backgroundColor: isOpen ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid',
                borderColor: isOpen ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.1)',
                color: isOpen ? '#16110A' : 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{isOpen ? 'Tutup' : 'Pilih'}</span>
              <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          </div>
        </div>
      </div>

      {/* EXPANDABLE DROPDOWN PEMILIH IKON */}
      {isOpen && (
        <div
          style={{
            marginTop: '0.65rem',
            backgroundColor: 'rgba(12, 16, 26, 0.95)',
            backdropFilter: 'blur(36px) saturate(180%)',
            WebkitBackdropFilter: 'blur(36px) saturate(180%)',
            border: '1px solid rgba(227, 182, 79, 0.3)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
            padding: '0.85rem',
            animation: 'fadeIn 0.18s ease',
          }}
        >
          {/* Baris Pencarian */}
          <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik kata kunci... (contoh: chart, book, shield, money, flash)"
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem 0.45rem 2rem',
                fontSize: '0.8rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFF',
                outline: 'none',
              }}
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={12} />
              </button>
            ) : null}
          </div>

          {/* Kategori Tab Filter */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'trading', label: 'Trading' },
              { id: 'edu', label: 'Edukasi' },
              { id: 'finance', label: 'Finansial' },
              { id: 'strategy', label: 'Strategi' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id as any)}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: category === tab.id ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.08)',
                  backgroundColor: category === tab.id ? 'rgba(227, 182, 79, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: category === tab.id ? 'var(--gold-accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: category === tab.id ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid Ikon Hasil Pencarian */}
          <div
            style={{
              maxHeight: '190px',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '6px',
              paddingRight: '2px',
            }}
          >
            {filteredPresets.map((item) => {
              const isSelected = value === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onChange(item.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? 'rgba(227, 182, 79, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '5px',
                      backgroundColor: isSelected ? 'rgba(227, 182, 79, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? 'var(--gold-accent)' : '#FFF',
                      flexShrink: 0,
                    }}
                  >
                    <IonIconPreview name={item.id} size={18} color={isSelected ? 'var(--gold-accent)' : '#FFF'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: isSelected ? '#FFF' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.id}
                    </div>
                  </div>
                  {isSelected && <Check size={13} color="var(--gold-accent)" />}
                </div>
              );
            })}

            {filteredPresets.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '1.25rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                Tidak ada ikon yang cocok dengan kata kunci &ldquo;{search}&rdquo;.
                <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--gold-accent)' }}>
                  Anda tetap bisa mengetikkan nama ikon Ionicons apa pun secara manual!
                </div>
              </div>
            )}
          </div>

          {/* Footer Dropdown dengan Link ke Ionicons Resmi */}
          <div
            style={{
              marginTop: '0.75rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              Total {IONICON_PRESETS.length} ikon rekomendasi
            </span>
            <a
              href="https://ionic.io/ionicons"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.72rem',
                color: 'var(--gold-accent)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 500,
              }}
            >
              <span>Katalog 1.300+ Ikon (ionic.io)</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* PANDUAN PENCARIAN IKON LENGKAP */}
      {showGuide && (
        <div
          style={{
            marginTop: '0.65rem',
            padding: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(227, 182, 79, 0.05)',
            border: '1px solid rgba(227, 182, 79, 0.25)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={15} color="var(--gold-accent)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gold-accent)' }}>
                Panduan Mencari Ikon di Direktori Resmi Ionicons
              </span>
            </div>
            <a
              href="https://ionic.io/ionicons"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.72rem',
                color: 'var(--gold-accent)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(227, 182, 79, 0.12)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <span>Buka ionic.io/ionicons</span>
              <ExternalLink size={11} />
            </a>
          </div>

          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.5rem 0' }}>
            Aplikasi mobile PALTI FX menggunakan pustaka <strong>Ionicons</strong> (tersedia lebih dari 1.300 ikon). Anda bebas memasukkan nama ikon apa pun ke dalam kolom ini dengan 3 langkah mudah:
          </p>

          <ol style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', margin: '0 0 0.65rem 0', lineHeight: 1.6 }}>
            <li>
              Buka website resmi <strong>ionic.io/ionicons</strong> melalui tautan di atas.
            </li>
            <li>
              Ketik kata kunci bahasa Inggris di kolom pencarian (misal: <em>chart, trend, money, book, shield, flame, rocket</em>).
            </li>
            <li>
              Klik ikon yang dipilih, lalu salin namanya (disarankan versi <code>-outline</code>, contoh: <code>trending-up-outline</code>), dan tempelkan (paste) ke kolom di atas.
            </li>
          </ol>

          {/* Quick Copy Kata Kunci Populer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', paddingTop: '0.4rem', borderTop: '1px solid rgba(227, 182, 79, 0.12)' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginRight: '2px' }}>Kata kunci populer (klik untuk salin):</span>
            {['chart', 'trend', 'analytics', 'money', 'wallet', 'shield', 'book', 'school', 'flash', 'globe', 'trophy'].map((kw) => {
              const isCopied = copiedKeyword === kw;
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => copyKeyword(kw)}
                  title="Klik untuk menyalin kata kunci pencarian"
                  style={{
                    fontSize: '0.68rem',
                    fontFamily: 'monospace',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    border: '1px solid',
                    borderColor: isCopied ? 'var(--gold-accent)' : 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: isCopied ? 'rgba(227, 182, 79, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: isCopied ? 'var(--gold-accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <span>{kw}</span>
                  {isCopied ? <CheckCheck size={10} color="var(--gold-accent)" /> : <Copy size={10} style={{ opacity: 0.5 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
