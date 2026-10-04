import { 
  ShieldCheck, 
  TrendingUp, 
  BookOpen, 
  Calculator, 
  Award, 
  KeyRound, 
  Smartphone, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onNavigateAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateAdmin }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FFE082 0%, #D4AF37 50%, #996515 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#07090E',
              fontWeight: 900,
              fontSize: '1.25rem',
              boxShadow: '0 0 20px rgba(212, 175, 55, 0.35)',
            }}>
              P
            </div>
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

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#aktivasi" className="btn-gold" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            <Smartphone size={20} />
            <span>Unduh &amp; Aktivasi Akun</span>
          </a>
          <button onClick={onNavigateAdmin} className="btn-outline" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
            <KeyRound size={20} color="#D4AF37" />
            <span>Masuk Backoffice Admin</span>
          </button>
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

      {/* ─── Feature Pillars ─── */}
      <section id="fitur" style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>
            Fitur Utama <span className="gold-text">Aplikasi Mobile PALTI FX</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Dirancang khusus bagi trader yang mengutamakan disiplin, akurasi perhitungan, dan ketahanan psikologi trading.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}>
          {/* Card 1 */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'rgba(212, 175, 55, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <BookOpen size={28} color="#D4AF37" />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Kurikulum Bertingkat</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Dari modul Pemula, Menengah hingga Lanjutan. Lengkap dengan video YouTube tersemat, ringkasan bacaan, estimasi menit belajar, dan pelacakan bab selesai otomatis.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <Calculator size={28} color="#10B981" />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Kalkulator Risiko &amp; Lot</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Kalkulasi ukuran lot otomatis sesuai toleransi risiko persentase modal, nilai pips, leverage, dan instrumen (Forex Major, Gold/XAUUSD, Crypto, Index).
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <TrendingUp size={28} color="#38BDF8" />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Jurnal Transaksi Cloud</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Catat setiap posisi BUY/SELL, rasio Risk/Reward, evaluasi emosi (Disiplin, FOMO, Balas Dendam), dan analisis setup. Data otomatis disinkronkan ke cloud.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'rgba(212, 175, 55, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <Award size={28} color="#D4AF37" />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Gamifikasi &amp; Medali</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Pertahankan streak belajar harian, buka badge pencapaian (Langkah Pertama, Master Risiko, Jurnal Rutin), dan pantau perkembangan diri secara konsisten.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <ShieldCheck size={28} color="#10B981" />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Anti-Hilang Data (Wasalaam Rule)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Ganti HP atau instal ulang aplikasi tanpa takut kehilangan riwayat. Begitu login kembali dengan Email atau Member ID, seluruh data langsung pulih seketika.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'rgba(212, 175, 55, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <KeyRound size={28} color="#D4AF37" />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Web Admin Backoffice</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Portal terpisah untuk Admin mengelola materi silabus, membuat kode undangan VIP fleksibel, dan memonitor status keaktifan komunitas secara real-time.
            </p>
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

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={onNavigateAdmin} className="btn-gold" style={{ padding: '0.9rem 2rem' }}>
              <KeyRound size={18} />
              <span>Login Administrator Web</span>
            </button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>PALTI</span>
              <span className="gold-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.1rem' }}>FX</span>
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
