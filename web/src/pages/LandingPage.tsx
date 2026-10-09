import React, { useRef, useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  BookOpen, 
  Calculator, 
  Award, 
  KeyRound, 
  Smartphone, 
  CheckCircle2, 
  Sparkles,
  Globe
} from 'lucide-react';

interface FeatureCardItem {
  number: string;
  tag: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  highlights: string[];
}

const FEATURE_CARDS: FeatureCardItem[] = [
  {
    number: '01',
    tag: 'VIP CURRICULUM',
    title: 'Kurikulum Bertingkat',
    description: 'Dari modul Pemula, Menengah hingga Lanjutan. Lengkap dengan video YouTube tersemat, ringkasan materi, estimasi waktu belajar, dan pelacakan bab selesai otomatis.',
    icon: <BookOpen size={28} color="#D4AF37" />,
    iconColor: '#D4AF37',
    iconBg: 'rgba(212, 175, 55, 0.15)',
    highlights: ['Video Embed YouTube', 'Tracking Bab Selesai', 'Materi Terstruktur'],
  },
  {
    number: '02',
    tag: 'RISK ENGINE',
    title: 'Kalkulator Risiko & Lot',
    description: 'Kalkulasi ukuran lot otomatis sesuai toleransi persentase risiko modal (1%-2%), nilai pips, leverage, dan instrumen (Forex Major, Gold/XAUUSD, Crypto, Index).',
    icon: <Calculator size={28} color="#10B981" />,
    iconColor: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    highlights: ['Lot Calculation Presisi', 'Proteksi Risiko Modal', 'Multi-Asset Support'],
  },
  {
    number: '03',
    tag: 'CLOUD LOG & EMOTION',
    title: 'Jurnal Transaksi Cloud',
    description: 'Catat setiap posisi BUY/SELL, rasio Risk/Reward, evaluasi emosi psikologis (Disiplin, FOMO, Balas Dendam), dan analisis setup. Tersinkronisasi aman ke database.',
    icon: <TrendingUp size={28} color="#38BDF8" />,
    iconColor: '#38BDF8',
    iconBg: 'rgba(56, 189, 248, 0.15)',
    highlights: ['Evaluasi Emosi FOMO', 'Hitung Winrate & R:R', 'Cloud Sync Otomatis'],
  },
  {
    number: '04',
    tag: 'DISCIPLINE TRACKER',
    title: 'Gamifikasi & Medali',
    description: 'Bangun kedisiplinan trading melalui streak belajar harian, buka badge pencapaian (Langkah Pertama, Master Risiko, Jurnal Rutin), dan pantau perkembangan diri secara konsisten.',
    icon: <Award size={28} color="#D4AF37" />,
    iconColor: '#D4AF37',
    iconBg: 'rgba(212, 175, 55, 0.15)',
    highlights: ['Daily Streak Counter', 'Medali & Badge Prestasi', 'Peringkat Trader'],
  },
  {
    number: '05',
    tag: 'WASALAAM RULE',
    title: 'Anti-Hilang Data (Immutability)',
    description: 'Ganti HP atau instal ulang aplikasi tanpa takut kehilangan riwayat trading. Begitu login kembali dengan Email atau Member ID, seluruh data pulih seketika.',
    icon: <ShieldCheck size={28} color="#10B981" />,
    iconColor: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.15)',
    highlights: ['Zero Data Loss', 'Dual ID Login', 'Cadangan Cloud Otomatis'],
  },
  {
    number: '06',
    tag: 'GLOBAL SESSIONS',
    title: 'Jam Sesi Pasar Forex Global',
    description: 'Pantau jam aktif dan overlap bursa dunia secara real-time (Sydney, Tokyo, London, New York) langsung di dalam aplikasi untuk menemukan volatilitas terbaik.',
    icon: <Globe size={28} color="#A78BFA" />,
    iconColor: '#A78BFA',
    iconBg: 'rgba(167, 139, 250, 0.15)',
    highlights: ['Live Session Overlap', 'Zona Waktu Otomatis', 'Peluang Volatilitas'],
  },
];

interface LandingPageProps {
  onNavigateAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateAdmin }) => {
  // Horizontal Scroll Hijacking State for Fitur Utama
  const featuresSectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [maxTranslate, setMaxTranslate] = useState(0);

  useEffect(() => {
    const calculateLayout = () => {
      if (trackRef.current) {
        const lastCard = trackRef.current.lastElementChild as HTMLElement;
        const viewportWidth = window.innerWidth;
        const startPadding = Math.max((viewportWidth - 1200) / 2, 32);
        // Target ujung kanan: tepat sejajar dengan ujung kanan label 'Indeks Fitur'
        const targetRightEdge = counterRef.current
          ? counterRef.current.getBoundingClientRect().right
          : viewportWidth - startPadding;

        if (lastCard) {
          const lastCardRight = lastCard.offsetLeft + lastCard.offsetWidth;
          // maxScroll tepat saat tepi kanan kartu terakhir sejajar dengan ujung huruf Indeks Fitur
          const maxScroll = Math.max(lastCardRight - targetRightEdge, 0);
          setMaxTranslate(maxScroll);
        } else {
          const totalTrackWidth = trackRef.current.scrollWidth;
          const maxScroll = Math.max(totalTrackWidth - targetRightEdge, 0);
          setMaxTranslate(maxScroll);
        }
      }
    };

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (featuresSectionRef.current) {
            const rect = featuresSectionRef.current.getBoundingClientRect();
            const containerHeight = rect.height;
            const windowHeight = window.innerHeight;
            const scrollableRange = containerHeight - windowHeight;

            if (scrollableRange > 0) {
              const scrolled = -rect.top;
              const progress = Math.min(Math.max(scrolled / scrollableRange, 0), 1);
              setScrollProgress(progress);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    calculateLayout();
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', calculateLayout);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateLayout);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'block', position: 'relative' }}>
      {/* ─── Navigation Header ─── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(7, 9, 14, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
        padding: '1rem 2rem',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/palti-logo.png"
              alt="PALTI FX Logo"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.25)',
                objectFit: 'cover',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '0.05em' }}>
                  PALTI
                </span>
                <span className="gold-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.3rem' }}>
                  FX
                </span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Private Trading Ecosystem
              </p>
            </div>
          </div>

          {/* Quick Menu */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#kurikulum" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
              Kurikulum
            </a>
            <a href="#fitur" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
              Fitur Aplikasi
            </a>
            <a href="#aktivasi" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
              Aktivasi VIP
            </a>
            <button 
              onClick={onNavigateAdmin} 
              className="btn-outline" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <KeyRound size={15} color="#D4AF37" />
              <span>Portal Admin</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section style={{
        padding: '5rem 2rem 4rem',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* VIP Badge */}
        <div style={{ display: 'inline-flex', marginBottom: '1.5rem' }}>
          <span className="badge badge-gold" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', gap: '0.5rem' }}>
            <Sparkles size={14} /> Ekosistem Edukasi Privat Berbasis Undangan
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
          lineHeight: 1.15,
          marginBottom: '1.5rem',
          maxWidth: '900px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Standar Tertinggi Edukasi Trading Forex &amp;{' '}
          <span className="gold-text">Manajemen Risiko Institusional</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-secondary)',
          maxWidth: '720px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.6,
        }}>
          Aplikasi mobile eksklusif untuk member terverifikasi PALTI FX. Dilengkapi kurikulum video interaktif, kalkulator lot presisi, dan jurnal transaksi berbasis cloud yang anti-hilang data.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', marginTop: '1rem' }}>
          {/* Prominent Urgent CTA Button (Plain / Static / Belum Difungsikan) */}
          <button
            type="button"
            className="btn-cta-urgent"
            onClick={(e) => e.preventDefault()}
            title="Pendaftaran & Unduhan Segera Dibuka"
          >
            <Smartphone size={26} strokeWidth={2.4} />
            <span>Unduh &amp; Aktivasi Akun</span>
          </button>

          <p style={{
            fontSize: '0.8rem',
            color: 'var(--text-dim)',
            marginTop: '0.15rem',
            letterSpacing: '0.02em',
          }}>
            Khusus member berlisensi • Kompatibel Android &amp; iOS
          </p>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginTop: '4.5rem',
        }}>
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="gold-text" style={{ fontSize: '2.4rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              100%
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Akses Privat Berbasis Undangan
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="gold-text" style={{ fontSize: '2.4rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              Multi-Video
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Embed YouTube &amp; Materi Bab
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="gold-text" style={{ fontSize: '2.4rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              Cloud Sync
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Progres Belajar &amp; Jurnal Aman
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div className="gold-text" style={{ fontSize: '2.4rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              Dual ID
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Login via Email / Member ID
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Pillars (Horizontal Scroll Hijacking from Left to Right) ─── */}
      <section id="fitur" ref={featuresSectionRef} className="horizontal-scroll-container">
        <div className="horizontal-sticky-viewport">
          {/* Section Header with Dynamic Progress */}
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            padding: '0 2rem',
            marginBottom: '1.75rem',
            boxSizing: 'border-box',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <div>
                <div style={{ marginBottom: '0.35rem' }}>
                  <span className="gold-text" style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    FITUR UTAMA APLIKASI
                  </span>
                </div>
                <h2 style={{ fontSize: 'clamp(1.9rem, 3.8vw, 2.7rem)', margin: '0 0 0.35rem 0', lineHeight: 1.15 }}>
                  Inovasi Trading <span className="gold-text">PALTI FX Mobile</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, maxWidth: '680px', lineHeight: 1.6 }}>
                  Ekosistem trading komprehensif yang memadukan kurikulum kurasi video terstruktur, kalkulator risiko modal presisi, dan sistem jurnal psikologi berbasis cloud untuk membangun profitabilitas yang konsisten.
                </p>
              </div>

              {/* Counter Indeks Fitur */}
              <div ref={counterRef} style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--gold-accent)',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                }}>
                  {String(Math.min(Math.floor(scrollProgress * FEATURE_CARDS.length) + 1, FEATURE_CARDS.length)).padStart(2, '0')}
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.95rem', fontWeight: 500 }}> / 0{FEATURE_CARDS.length}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Indeks Fitur
                </span>
              </div>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="horizontal-progress-bar">
              <div
                className="horizontal-progress-fill"
                style={{ width: `${Math.max(scrollProgress * 100, 3)}%` }}
              />
            </div>
          </div>

          {/* Horizontal Track Viewport */}
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <div
              ref={trackRef}
              className="horizontal-feature-track"
              style={{
                transform: `translate3d(-${scrollProgress * maxTranslate}px, 0, 0)`,
                paddingLeft: 'max(2rem, calc((100vw - 1200px) / 2))',
                paddingRight: '3rem',
              }}
            >
              {FEATURE_CARDS.map((card, idx) => (
                <div key={idx} className="feature-column-natural">
                  <div>
                    {/* Header: Large Minimal Number & Tag */}
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <span className="feature-number-natural">{card.number}</span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        color: 'var(--gold-accent)',
                        textTransform: 'uppercase',
                      }}>
                        {card.tag}
                      </span>
                    </div>

                    {/* Minimalist Floating Icon */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: card.iconBg,
                      border: `1px solid ${card.iconColor}25`,
                      marginBottom: '1.5rem',
                    }}>
                      {card.icon}
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: '1.65rem',
                      fontWeight: 700,
                      marginBottom: '0.85rem',
                      lineHeight: 1.25,
                      color: '#FFFFFF',
                      letterSpacing: '-0.02em',
                    }}>
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.96rem',
                      lineHeight: 1.7,
                      margin: 0,
                    }}>
                      {card.description}
                    </p>
                  </div>

                  {/* Natural Bullet Points */}
                  <div style={{
                    marginTop: '2rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}>
                    {card.highlights.map((h, hIdx) => (
                      <div key={hIdx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        fontSize: '0.86rem',
                      }}>
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: card.iconColor,
                          boxShadow: `0 0 8px ${card.iconColor}88`,
                          flexShrink: 0,
                        }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── VIP Activation Section ─── */}
      <section id="aktivasi" style={{
        padding: '5rem 2rem',
        maxWidth: '1000px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div className="glass-card pulse-glow" style={{ padding: '3.5rem 2.5rem', borderRadius: 'var(--radius-xl)' }}>
          <h2 style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>
            Cara Bergabung ke <span className="gold-text">Komunitas PALTI FX</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
            PALTI FX tidak membuka registrasi publik secara bebas demi menjaga kualitas dan fokus anggota. Setiap akun baru membutuhkan <strong>Kode Undangan Resmi</strong> dari Admin.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
            textAlign: 'left',
            marginBottom: '2.5rem',
          }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ color: 'var(--gold-500)', flexShrink: 0 }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '0.2rem' }}>1. Dapatkan Kode VIP</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hubungi Admin resmi untuk mendapatkan kode aktivasi (misal: PFX-VIP-XXXXX).</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ color: 'var(--gold-500)', flexShrink: 0 }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '0.2rem' }}>2. Buka Aplikasi Mobile</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pilih menu "Aktivasi Akun Baru" pada layar login aplikasi Expo / Android.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ color: 'var(--gold-500)', flexShrink: 0 }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '0.2rem' }}>3. Buat Sandi &amp; Belajar</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Akun Anda otomatis aktif dengan ID Member unik dan seluruh materi terbuka.</span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1.4rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(212, 175, 55, 0.06)',
            border: '1px solid rgba(212, 175, 55, 0.18)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginTop: '0.5rem',
          }}>
            <Sparkles size={16} color="var(--gold-accent)" />
            <span>Kode aktivasi VIP digenerate langsung oleh Administrator resmi PALTI FX.</span>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        padding: '2.5rem 2rem',
        backgroundColor: '#05070B',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <img
                src="/palti-logo.png"
                alt="PALTI FX Logo"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  objectFit: 'cover',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>PALTI</span>
                <span className="gold-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.1rem' }}>FX</span>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              © 2026 PALTI FX. Seluruh hak cipta dilindungi undang-undang.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <a href="#fitur">Fitur Mobile</a>
            <a href="#aktivasi">Aktivasi VIP</a>
            <button onClick={onNavigateAdmin} style={{ background: 'none', border: 'none', color: 'var(--gold-500)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
              Admin Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
