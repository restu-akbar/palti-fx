import { useEffect, useState } from 'react';
import { 
  ArrowRight, 
  RefreshCw
} from 'lucide-react';
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
  }, []);

  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* ─── Header: Calm & Minimalist ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '4.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-dim)',
            marginBottom: '0.35rem',
          }}>
            Executive Overview
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 600, color: '#FFF', letterSpacing: '-0.02em' }}>
            Ringkasan Ekosistem
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Selamat datang kembali, {currentAdmin.full_name || 'Admin'}.
          </p>
        </div>

        <button 
          onClick={fetchStats} 
          className="btn-secondary" 
          style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
          disabled={loading}
          title="Segarkan data statistik"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* ─── Seamless Natural Flow (Menjorok Bergantian, Nyatu Tanpa Card) ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5.5rem' }}>

        {/* ─── 1. ATAS KIRI: Kurikulum & Materi (Menjorok dari Kiri, Teks & Paragraf Start Kiri) ─── */}
        <section style={{
          maxWidth: '720px',
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
            <span style={{ width: '22px', height: '1px', background: 'var(--gold-border)' }} />
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

          {/* Typographic Metrics: Left-Aligned */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2rem', marginBottom: '1.25rem' }}>
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

            <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.12)' }} />

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
                Bab &amp; Video YouTube
              </span>
            </div>
          </div>

          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '1.35rem',
            maxWidth: '620px',
          }}>
            Kurikulum edukasi trading terstruktur dari tingkat Pemula, Menengah hingga Lanjutan. Lengkap dengan sematan multi-video YouTube, durasi estimasi baca, dan teks panduan silabus yang langsung tersinkronisasi ke aplikasi mobile member.
          </p>

          <button
            onClick={() => onNavigateTab('materi')}
            className="editorial-link"
          >
            <span>Kelola Kurikulum &amp; Bab</span>
            <ArrowRight size={14} />
          </button>
        </section>

        {/* ─── 2. BAWAH DARI KANAN: Kode Undangan VIP (Menjorok dari Kanan, Teks & Paragraf Start Kanan) ─── */}
        <section style={{
          maxWidth: '720px',
          marginLeft: 'auto',
          textAlign: 'right',
          position: 'relative',
        }}>
          {/* Section Marker (Right Aligned) */}
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
            <span style={{ width: '22px', height: '1px', background: 'var(--gold-border)' }} />
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
            gap: '2rem',
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

            <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.12)' }} />

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
            maxWidth: '620px',
            marginLeft: 'auto',
          }}>
            Pintu gerbang akses privat komunitas PALTI FX. Terbitkan kode unik secara acak 1-klik (contoh: PFX-VIP-XXXXX) atau buat kode kustom untuk batch tertentu. Pantau masa berlaku dan identitas member yang mengaktivasinya secara transparan.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => onNavigateTab('invitations')}
              className="editorial-link"
            >
              <span>Kelola Kode Undangan VIP</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* ─── 3. TERUS BAWAH DARI KIRI: Member & Akses (Menjorok dari Kiri, Teks & Paragraf Start Kiri) ─── */}
        <section style={{
          maxWidth: '720px',
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
            <span style={{ width: '22px', height: '1px', background: 'var(--gold-border)' }} />
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

          {/* Typographic Metrics: Left-Aligned */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2rem', marginBottom: '1.25rem' }}>
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

            <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.12)' }} />

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
            maxWidth: '620px',
          }}>
            Daftar seluruh akun trader anggota terverifikasi yang dilengkapi format unik ID Member (PFX-XXXXXXXX). Akses kendali langsung untuk meninjau status profil, tanggal bergabung, serta opsi penangguhan akun secara instan.
          </p>

          <button
            onClick={() => onNavigateTab('users')}
            className="editorial-link"
          >
            <span>Buka Manajemen Member</span>
            <ArrowRight size={14} />
          </button>
        </section>

      </div>
    </div>
  );
};
