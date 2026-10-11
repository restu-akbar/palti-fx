import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { DashboardStats, Profile } from '../../types/admin';
import { AdminUsersService } from '../../lib/adminUsers';

interface AdminDashboardViewProps {
  currentAdmin: Profile;
  onNavigateTab: (tab: 'materi' | 'invitations' | 'users') => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ currentAdmin, onNavigateTab }) => {
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    active_users: 0,
    total_modules: 0,
    total_lessons: 0,
    active_invites: 0,
    used_invites: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await AdminUsersService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh saat kembali fokus ke tab/halaman
    const handleFocus = () => fetchStats();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* ─── Header: Highlighted & Grand Executive Typography ─── */}
      <div style={{
        marginBottom: '4.5rem',
        paddingBottom: '2rem',
      }}>
        <div style={{
          fontSize: '0.92rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          color: 'var(--gold-accent)',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <span>Executive Overview</span>
        </div>
        <h1 style={{
          fontSize: '3.6rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.03em',
          lineHeight: 1.08,
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F5E6BE 45%, #CFB066 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Ringkasan Ekosistem
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1.3rem',
          fontWeight: 400,
          lineHeight: 1.6,
          maxWidth: '780px',
          marginTop: '0.5rem',
        }}>
          Selamat datang kembali, <strong style={{ color: '#FFF', fontWeight: 600 }}>{currentAdmin.full_name || 'Admin'}</strong>. Seluruh metrik operasional dan performa platform dalam kendali terpusat Anda.
        </p>
      </div>

      {/* ─── Seamless Natural Flow (Tanpa Card, Bersatu Dengan Background) ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4.5rem' }}>

        {/* ─── 1. Kurikulum & Materi ─── */}
        <section style={{
          maxWidth: '820px',
          textAlign: 'left',
          position: 'relative',
        }}>
          {/* Section Marker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: 'var(--gold-accent)',
            }}>
              01
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
            }}>
              Kurikulum &amp; Materi
            </span>
          </div>

          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: 600,
            color: '#FFF',
            letterSpacing: '-0.015em',
            marginBottom: '1rem',
          }}>
            Silabus &amp; Multi-Video Pembelajaran
          </h2>

          {/* Typographic Metrics: Left-Aligned (Modul Silabus, Bab, Subbab, Video YouTube) */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: '#FFF',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {loading ? '—' : stats.total_modules}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginLeft: '0.6rem',
              }}>
                Modul Silabus
              </span>
            </div>

            <div>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: '#FFF',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {loading ? '—' : (stats.total_chapters ?? stats.total_modules)}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginLeft: '0.6rem',
              }}>
                Bab
              </span>
            </div>

            <div>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--gold-accent)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {loading ? '—' : stats.total_lessons}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginLeft: '0.6rem',
              }}>
                Subbab
              </span>
            </div>

            <div>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--gold-hover)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {loading ? '—' : (stats.total_videos ?? 0)}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginLeft: '0.6rem',
              }}>
                Video YouTube
              </span>
            </div>
          </div>

          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '1.35rem',
            maxWidth: '640px',
          }}>
            Kurikulum edukasi trading terstruktur dari tingkat Pemula, Menengah hingga Lanjutan. Lengkap dengan sematan multi-video YouTube, durasi estimasi baca, dan teks panduan silabus yang langsung tersinkronisasi ke aplikasi mobile member.
          </p>

          <button
            onClick={() => onNavigateTab('materi')}
            className="editorial-link"
            style={{
              fontSize: '1.08rem',
              fontWeight: 600,
              gap: '0.65rem',
              transformOrigin: 'left center',
              transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span>Kelola Kurikulum &amp; Bab</span>
            <ArrowRight size={17} />
          </button>
        </section>

        {/* ─── 2. Kode Undangan VIP (Kanan) ─── */}
        <section style={{
          maxWidth: '820px',
          marginLeft: 'auto',
          textAlign: 'right',
          position: 'relative',
        }}>
          {/* Section Marker */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.65rem',
            marginBottom: '0.85rem',
          }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
            }}>
              Akses Privat Komunitas
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: 'var(--gold-accent)',
            }}>
              02
            </span>
          </div>

          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: 600,
            color: '#FFF',
            letterSpacing: '-0.015em',
            marginBottom: '1rem',
          }}>
            Sistem Kode Undangan VIP
          </h2>

          {/* Typographic Metrics: Right-Aligned */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'flex-end',
            gap: '2.5rem',
            marginBottom: '1.25rem',
          }}>
            <div>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--gold-hover)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {loading ? '—' : stats.active_invites}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginLeft: '0.6rem',
              }}>
                Kode Siap Pakai
              </span>
            </div>

            <div>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--text-secondary)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {loading ? '—' : stats.used_invites}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginLeft: '0.6rem',
              }}>
                Telah Teraktivasi
              </span>
            </div>
          </div>

          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '1.35rem',
            maxWidth: '640px',
            marginLeft: 'auto',
          }}>
            Pintu gerbang akses privat komunitas PALTI FX. Terbitkan kode unik secara acak 1-klik (contoh: PFX-VIP-XXXXX) atau buat kode kustom untuk batch tertentu. Pantau masa berlaku dan identitas member yang mengaktivasinya secara transparan.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onNavigateTab('invitations')}
              className="editorial-link"
              style={{
                fontSize: '1.08rem',
                fontWeight: 600,
                gap: '0.65rem',
                transformOrigin: 'right center',
                transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span>Kelola Kode Undangan VIP</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </section>

        {/* ─── 3. Member & Akses ─── */}
        <section style={{
          maxWidth: '820px',
          textAlign: 'left',
          position: 'relative',
        }}>
          {/* Section Marker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: 'var(--gold-accent)',
            }}>
              03
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
            }}>
              Database Keanggotaan
            </span>
          </div>

          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: 600,
            color: '#FFF',
            letterSpacing: '-0.015em',
            marginBottom: '1rem',
          }}>
            Manajemen Member &amp; Hak Akses
          </h2>

          {/* Typographic Metrics: Left-Aligned (Member Aktif, Admin Terdaftar, Total Akun) */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--success)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {loading ? '—' : stats.active_users}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginLeft: '0.6rem',
              }}>
                Member Aktif
              </span>
            </div>

            <div>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--gold-accent)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {loading ? '—' : (stats.total_admins ?? 0)}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginLeft: '0.6rem',
              }}>
                Admin Terdaftar
              </span>
            </div>

            <div>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: '#FFF',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {loading ? '—' : stats.total_users}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginLeft: '0.6rem',
              }}>
                Total Akun Terdaftar
              </span>
            </div>
          </div>

          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '1.35rem',
            maxWidth: '640px',
          }}>
            Daftar seluruh akun trader anggota terverifikasi yang dilengkapi format unik ID Member (PFX-XXXXXXXX). Akses kendali langsung untuk meninjau status profil, tanggal bergabung, serta opsi penangguhan akun secara instan.
          </p>

          <button
            onClick={() => onNavigateTab('users')}
            className="editorial-link"
            style={{
              fontSize: '1.08rem',
              fontWeight: 600,
              gap: '0.65rem',
              transformOrigin: 'left center',
              transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span>Buka Manajemen Member</span>
            <ArrowRight size={17} />
          </button>
        </section>

      </div>
    </div>
  );
};
