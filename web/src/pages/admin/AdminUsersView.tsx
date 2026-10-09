import { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  RefreshCw, 
  UserX, 
  UserCheck, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  X,
  Users,
  ChevronRight,
  BookOpen,
  LineChart,
  Calculator,
  Award,
  Clock,
  Mail,
  Fingerprint,
  ShieldAlert
} from 'lucide-react';
import type { Profile } from '../../types/admin';
import { AdminUsersService } from '../../lib/adminUsers';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'admin'>('all');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Status Change Confirmation Modal State
  const [statusConfirm, setStatusConfirm] = useState<{
    user: Profile;
    targetStatus: 'active' | 'suspended';
  } | null>(null);

  // Role Change Confirmation Modal State
  const [roleConfirm, setRoleConfirm] = useState<{
    user: Profile;
    targetRole: 'member' | 'admin';
  } | null>(null);

  // Slide-over Drawer for Member Details
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await AdminUsersService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const notify = (text: string, error?: boolean) => {
    setFeedbackMsg({ text, error });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Metrics
  const activeCount = useMemo(() => {
    return users.filter((u) => u.status === 'active' && u.role === 'member').length;
  }, [users]);

  const suspendedCount = useMemo(() => {
    return users.filter((u) => u.status === 'suspended').length;
  }, [users]);

  const adminCount = useMemo(() => {
    return users.filter((u) => u.role === 'admin').length;
  }, [users]);

  const handleCopy = (text: string, keyIdentifier: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(keyIdentifier);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const executeToggleStatus = async () => {
    if (!statusConfirm) return;
    const { user, targetStatus } = statusConfirm;
    setActionLoadingId(user.id);
    try {
      const res = await AdminUsersService.updateUserStatus(user.id, targetStatus);
      if (res.success) {
        notify(`Status akun "${user.email}" berhasil diubah menjadi ${targetStatus === 'active' ? 'Aktif' : 'Ditangguhkan'}.`);
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: targetStatus } : u));
        if (selectedUser && selectedUser.id === user.id) {
          setSelectedUser({ ...selectedUser, status: targetStatus });
        }
      } else {
        notify(res.error || 'Gagal mengubah status akun.', true);
      }
    } catch (err: any) {
      notify(err?.message || 'Terjadi kesalahan sistem.', true);
    } finally {
      setActionLoadingId(null);
      setStatusConfirm(null);
    }
  };

  const executeToggleRole = async () => {
    if (!roleConfirm) return;
    const { user, targetRole } = roleConfirm;
    setActionLoadingId(user.id);
    try {
      const res = await AdminUsersService.updateUserRole(user.id, targetRole);
      if (res.success) {
        notify(`Peran akun "${user.email}" berhasil diubah menjadi ${targetRole === 'admin' ? 'Administrator' : 'Member VIP'}.`);
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: targetRole } : u));
        if (selectedUser && selectedUser.id === user.id) {
          setSelectedUser({ ...selectedUser, role: targetRole });
        }
      } else {
        notify(res.error || 'Gagal mengubah peran akun.', true);
      }
    } catch (err: any) {
      notify(err?.message || 'Terjadi kesalahan sistem.', true);
    } finally {
      setActionLoadingId(null);
      setRoleConfirm(null);
    }
  };

  // Subtle Avatar Initials Generator
  const getInitials = (name: string | null, email: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status & Role tab filter
      if (statusFilter === 'active' && (u.status !== 'active' || u.role !== 'member')) return false;
      if (statusFilter === 'suspended' && u.status !== 'suspended') return false;
      if (statusFilter === 'admin' && u.role !== 'admin') return false;

      // Query search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (u.full_name || '').toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchMemberId = (u.member_id || '').toLowerCase().includes(q);
        return matchName || matchEmail || matchMemberId;
      }

      return true;
    });
  }, [users, statusFilter, searchQuery]);

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* ─── Editorial Header: Unboxed, Natural & Calm ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '2.5rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div>
          {/* Section Marker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.14em', color: 'var(--gold-accent)' }}>
              03
            </span>
            <span style={{ width: '22px', height: '1px', background: 'var(--gold-border)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
              Komunitas &amp; Manajemen Akses
            </span>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 600, color: '#FFF', letterSpacing: '-0.02em' }}>
            Member &amp; Hak Akses Komunitas
          </h1>

          {/* Natural Text Metrics Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.55rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span 
              onClick={() => setStatusFilter('all')}
              style={{ cursor: 'pointer', transition: 'color 0.15s ease' }}
              title="Filter semua akun"
            >
              <strong style={{ color: statusFilter === 'all' ? 'var(--gold-accent)' : '#FFF', fontWeight: 600 }}>{users.length}</strong> Akun Terdaftar
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span 
              onClick={() => setStatusFilter('active')}
              style={{ cursor: 'pointer', transition: 'color 0.15s ease' }}
              title="Filter member aktif"
            >
              <strong style={{ color: statusFilter === 'active' ? 'var(--gold-accent)' : 'var(--success)', fontWeight: 600 }}>{activeCount}</strong> Member Aktif
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span 
              onClick={() => setStatusFilter('suspended')}
              style={{ cursor: 'pointer', transition: 'color 0.15s ease' }}
              title="Filter ditangguhkan"
            >
              <strong style={{ color: statusFilter === 'suspended' ? 'var(--gold-accent)' : 'var(--text-dim)', fontWeight: 600 }}>{suspendedCount}</strong> Ditangguhkan
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
            <span 
              onClick={() => setStatusFilter('admin')}
              style={{ cursor: 'pointer', transition: 'color 0.15s ease' }}
              title="Filter admin"
            >
              <strong style={{ color: statusFilter === 'admin' ? '#FFF' : 'var(--gold-accent)', fontWeight: 600 }}>{adminCount}</strong> Administrator
            </span>
          </div>
        </div>

        <div>
          <button 
            onClick={fetchUsers} 
            className="btn-secondary" 
            style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem' }}
            disabled={loading}
            title="Segarkan data pengguna"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
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

      {/* ─── Filter & Search Bar: Frosted Glass Card ─── */}
      <div className="pfx-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '0.85rem 1.15rem',
        flexWrap: 'wrap',
      }}>
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setStatusFilter('all')}
            className={statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.8rem' }}
          >
            Semua ({users.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={statusFilter === 'active' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.8rem' }}
          >
            Member Aktif ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={statusFilter === 'suspended' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.8rem' }}
          >
            Ditangguhkan ({suspendedCount})
          </button>
          <button
            onClick={() => setStatusFilter('admin')}
            className={statusFilter === 'admin' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.76rem', padding: '0.35rem 0.8rem' }}
          >
            Admin ({adminCount})
          </button>
        </div>

        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: '260px',
        }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={13} 
              color="var(--text-dim)" 
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              className="pfx-input"
              placeholder="Cari nama, email, ID member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                paddingLeft: '2.1rem', 
                fontSize: '0.82rem', 
                paddingRight: searchQuery ? '2rem' : '0.75rem' 
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                }}
                title="Bersihkan"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── TABEL MEMBER RESMI (Natural, Elegan & Lengkap dengan Button Detail) ─── */}
      {loading ? (
        <div style={{ padding: '4.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Memuat tabel anggota komunitas...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{
          padding: '4.5rem 2rem',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            color: 'var(--gold-accent)',
          }}>
            <Users size={18} />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.35rem', color: '#FFF' }}>
            {searchQuery || statusFilter !== 'all' ? 'Tidak Ada Pengguna yang Sesuai' : 'Belum Ada Anggota Terdaftar'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
            {searchQuery || statusFilter !== 'all'
              ? 'Silakan sesuaikan kata kunci pencarian atau ganti tab status di atas.'
              : 'Akun member baru akan tampil di sini secara otomatis setelah mendaftar dengan kode undangan VIP.'}
          </p>
        </div>
      ) : (
        <div style={{
          width: '100%',
          overflowX: 'auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.84rem',
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
                color: 'var(--text-dim)',
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                <th style={{ padding: '0.9rem 0.5rem', width: '38px', fontWeight: 600 }}>#</th>
                <th style={{ padding: '0.9rem 0.75rem', fontWeight: 600 }}>Anggota</th>
                <th style={{ padding: '0.9rem 0.75rem', fontWeight: 600 }}>ID Keanggotaan</th>
                <th style={{ padding: '0.9rem 0.75rem', fontWeight: 600 }}>Peran</th>
                <th style={{ padding: '0.9rem 0.75rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '0.9rem 0.75rem', fontWeight: 600 }}>Terdaftar</th>
                <th style={{ padding: '0.9rem 0.5rem 0.9rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, userIdx) => {
                const isSuspended = user.status === 'suspended';
                const isAdmin = user.role === 'admin';
                const isCopied = copiedKey === `id-${user.member_id}`;
                const initials = getInitials(user.full_name, user.email);

                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.045)',
                      transition: 'background-color 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedUser(user)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Col 1: Nomor Urut */}
                    <td style={{
                      padding: '1.1rem 0.5rem',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: isAdmin ? 'var(--gold-accent)' : isSuspended ? 'var(--text-dim)' : 'var(--gold-accent)',
                      opacity: isSuspended ? 0.35 : 0.85,
                    }}>
                      {String(userIdx + 1).padStart(2, '0')}
                    </td>

                    {/* Col 2: Identitas Anggota (Avatar + Nama + Email) */}
                    <td style={{ padding: '1.1rem 0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: isAdmin ? 'rgba(207, 168, 94, 0.12)' : isSuspended ? 'rgba(251, 113, 133, 0.08)' : 'rgba(255, 255, 255, 0.035)',
                          border: `1px solid ${isAdmin ? 'rgba(207, 168, 94, 0.28)' : isSuspended ? 'rgba(251, 113, 133, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          color: isAdmin ? 'var(--gold-accent)' : isSuspended ? '#FDA4AF' : '#E2E8F0',
                          flexShrink: 0,
                        }}>
                          {initials}
                        </div>

                        <div>
                          <div style={{
                            fontSize: '0.92rem',
                            fontWeight: 600,
                            color: isSuspended ? 'var(--text-secondary)' : '#FFF',
                            lineHeight: 1.25,
                          }}>
                            {user.full_name || 'Member Anonim'}
                          </div>
                          <div style={{
                            fontSize: '0.76rem',
                            color: 'var(--text-dim)',
                            marginTop: '2px',
                          }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Col 3: ID Keanggotaan Monospace */}
                    <td style={{ padding: '1.1rem 0.75rem' }}>
                      <div 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: isAdmin ? 'var(--gold-hover)' : 'var(--text-secondary)',
                          backgroundColor: 'rgba(255, 255, 255, 0.035)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}>
                          {user.member_id}
                        </span>

                        <button
                          onClick={(e) => handleCopy(user.member_id, `id-${user.member_id}`, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: isCopied ? 'var(--success)' : 'var(--text-dim)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="Salin ID Member"
                        >
                          {isCopied ? <Check size={11} color="var(--success)" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>

                    {/* Col 4: Peran */}
                    <td style={{ padding: '1.1rem 0.75rem' }}>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        color: isAdmin ? 'var(--gold-accent)' : 'var(--text-dim)',
                        backgroundColor: isAdmin ? 'rgba(207, 168, 94, 0.08)' : 'rgba(255, 255, 255, 0.025)',
                        padding: '0.12rem 0.45rem',
                        borderRadius: '4px',
                        border: `1px solid ${isAdmin ? 'rgba(207, 168, 94, 0.22)' : 'rgba(255, 255, 255, 0.06)'}`,
                      }}>
                        {isAdmin ? 'ADMINISTRATOR' : 'MEMBER VIP'}
                      </span>
                    </td>

                    {/* Col 5: Status */}
                    <td style={{ padding: '1.1rem 0.75rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.74rem',
                        fontWeight: 500,
                        color: isSuspended ? 'var(--danger)' : 'var(--success)',
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isSuspended ? 'var(--danger)' : 'var(--success)',
                          boxShadow: isSuspended ? 'none' : '0 0 6px rgba(52, 211, 153, 0.45)',
                        }} />
                        <span>{isSuspended ? 'Ditangguhkan' : 'Aktif'}</span>
                      </span>
                    </td>

                    {/* Col 6: Terdaftar */}
                    <td style={{ padding: '1.1rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Col 7: Button Detail (Aksi Utama) */}
                    <td style={{ padding: '1.1rem 0.5rem 1.1rem 0.75rem', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                        }}
                        className="btn-secondary"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.75rem',
                          gap: '0.3rem',
                        }}
                        title="Lihat rincian berkas anggota"
                      >
                        <span>Detail</span>
                        <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL POP-UP: Berkas Profil Anggota (Dipicu oleh Button Detail) ─── */}
      {selectedUser && (
        <div 
          className="pfx-modal-backdrop" 
          onClick={() => setSelectedUser(null)}
        >
          <div 
            className="pfx-modal-panel"
            style={{
              maxWidth: '520px',
              position: 'relative',
              padding: '2rem',
              overflow: 'visible',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedUser(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="Tutup"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-accent)', marginBottom: '0.25rem' }}>
                Berkas Profil Anggota
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: '#FFF', margin: 0 }}>
                Rincian Akun &amp; Hak Akses
              </h2>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Member Primary Identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: selectedUser.role === 'admin' ? 'rgba(207, 168, 94, 0.14)' : selectedUser.status === 'suspended' ? 'rgba(251, 113, 133, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${selectedUser.role === 'admin' ? 'rgba(207, 168, 94, 0.35)' : selectedUser.status === 'suspended' ? 'rgba(251, 113, 133, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: selectedUser.role === 'admin' ? 'var(--gold-accent)' : selectedUser.status === 'suspended' ? '#FDA4AF' : '#FFF',
                  flexShrink: 0,
                }}>
                  {getInitials(selectedUser.full_name, selectedUser.email)}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FFF', marginBottom: '0.2rem' }}>
                    {selectedUser.full_name || 'Member Anonim'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={12} color="var(--text-dim)" />
                    <span>{selectedUser.email}</span>
                  </div>
                </div>
              </div>

              {/* Data Ledger Points (Alami, Tanpa Box Menumpuk) */}
              <div style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '1.15rem 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
              }}>
                {/* ID Member */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>ID Keanggotaan</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--gold-accent)' }}>
                      {selectedUser.member_id}
                    </span>
                    <button
                      onClick={(e) => handleCopy(selectedUser.member_id, `modal-${selectedUser.member_id}`, e)}
                      style={{ background: 'none', border: 'none', color: copiedKey === `modal-${selectedUser.member_id}` ? 'var(--success)' : 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                      title="Salin ID"
                    >
                      {copiedKey === `modal-${selectedUser.member_id}` ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Status Keanggotaan */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Status Akses</span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 500,
                    color: selectedUser.status === 'suspended' ? 'var(--danger)' : 'var(--success)',
                  }}>
                    <span style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: selectedUser.status === 'suspended' ? 'var(--danger)' : 'var(--success)',
                    }} />
                    <span>{selectedUser.status === 'suspended' ? 'Ditangguhkan' : 'Aktif'}</span>
                  </span>
                </div>

                {/* Hak Akses Role */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Peran Sistem</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: selectedUser.role === 'admin' ? 'var(--gold-accent)' : 'var(--text-secondary)',
                    backgroundColor: selectedUser.role === 'admin' ? 'rgba(207, 168, 94, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    padding: '0.12rem 0.45rem',
                    borderRadius: '4px',
                    border: `1px solid ${selectedUser.role === 'admin' ? 'rgba(207, 168, 94, 0.22)' : 'rgba(255, 255, 255, 0.06)'}`,
                  }}>
                    {selectedUser.role === 'admin' ? 'ADMINISTRATOR' : 'MEMBER VIP'}
                  </span>
                </div>

                {/* Tanggal Terdaftar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Tanggal Terdaftar</span>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={12} color="var(--text-dim)" />
                    <span>
                      {new Date(selectedUser.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </span>
                </div>

                {/* Supabase User ID */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>ID Akun Internal</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                      <Fingerprint size={11} style={{ display: 'inline', marginRight: '4px' }} />
                      {selectedUser.id.slice(0, 8)}...
                    </span>
                    <button
                      onClick={(e) => handleCopy(selectedUser.id, `uuid-${selectedUser.id}`, e)}
                      style={{ background: 'none', border: 'none', color: copiedKey === `uuid-${selectedUser.id}` ? 'var(--success)' : 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                      title="Salin UUID"
                    >
                      {copiedKey === `uuid-${selectedUser.id}` ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Hak Fitur Aplikasi Mobile */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
                  Hak Akses Aplikasi Mobile
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: selectedUser.status === 'suspended' ? 'var(--text-dim)' : '#FFF' }}>
                    <BookOpen size={13} color={selectedUser.status === 'suspended' ? 'var(--text-dim)' : 'var(--gold-accent)'} />
                    <span>Silabus Video Forex</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: selectedUser.status === 'suspended' ? 'var(--text-dim)' : '#FFF' }}>
                    <LineChart size={13} color={selectedUser.status === 'suspended' ? 'var(--text-dim)' : 'var(--gold-accent)'} />
                    <span>Jurnal Trading Sync</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: selectedUser.status === 'suspended' ? 'var(--text-dim)' : '#FFF' }}>
                    <Calculator size={13} color={selectedUser.status === 'suspended' ? 'var(--text-dim)' : 'var(--gold-accent)'} />
                    <span>Kalkulator Risiko</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: selectedUser.status === 'suspended' ? 'var(--text-dim)' : '#FFF' }}>
                    <Award size={13} color={selectedUser.status === 'suspended' ? 'var(--text-dim)' : 'var(--gold-accent)'} />
                    <span>Medali Prestasi</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {/* Action 2: Logo Button Toggle Role (Member VIP <-> Admin) with Hover Tooltip */}
                  <div
                    style={{ position: 'relative', display: 'inline-flex' }}
                    onMouseEnter={() => setActiveTooltip('modal-role')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <button
                      onClick={() => {
                        const targetRole = selectedUser.role === 'admin' ? 'member' : 'admin';
                        setRoleConfirm({ user: selectedUser, targetRole });
                      }}
                      className="btn-secondary"
                      style={{
                        width: '38px',
                        height: '38px',
                        padding: 0,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      aria-label={selectedUser.role === 'admin' ? 'Ubah peran ke member biasa' : 'Jadikan administrator sistem'}
                    >
                      {selectedUser.role === 'admin' ? (
                        <Users size={16} color="var(--text-secondary)" />
                      ) : (
                        <ShieldCheck size={16} color="var(--gold-accent)" />
                      )}
                    </button>

                    {activeTooltip === 'modal-role' && (
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 9px)',
                        right: '0',
                        backgroundColor: 'rgba(12, 16, 25, 0.78)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        borderRadius: '7px',
                        padding: '0.38rem 0.7rem',
                        fontSize: '0.74rem',
                        fontWeight: 500,
                        color: '#FFF',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        zIndex: 100,
                        animation: 'pfxFadeIn 0.15s ease-out',
                      }}>
                        {selectedUser.role === 'admin' ? 'Ubah peran ke member biasa' : 'Jadikan administrator sistem'}
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: '14px',
                          width: 0,
                          height: 0,
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderTop: '5px solid rgba(12, 16, 25, 0.9)',
                        }} />
                      </div>
                    )}
                  </div>

                  {/* Action 1: Logo Button Toggle Suspend/Active with Hover Tooltip */}
                  <div
                    style={{ position: 'relative', display: 'inline-flex' }}
                    onMouseEnter={() => setActiveTooltip('modal-status')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <button
                      onClick={() => {
                        const target = selectedUser.status === 'suspended' ? 'active' : 'suspended';
                        setStatusConfirm({ user: selectedUser, targetStatus: target });
                      }}
                      className={selectedUser.status === 'suspended' ? 'btn-secondary' : 'btn-danger-ghost'}
                      style={{
                        width: '38px',
                        height: '38px',
                        padding: 0,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderColor: selectedUser.status === 'suspended' ? 'rgba(52, 211, 153, 0.35)' : undefined,
                        transition: 'all 0.15s ease',
                      }}
                      aria-label={selectedUser.status === 'suspended' ? 'Buka blokir akses akun' : 'Tangguhkan akses akun'}
                    >
                      {selectedUser.status === 'suspended' ? (
                        <UserCheck size={16} color="var(--success)" />
                      ) : (
                        <UserX size={16} color="var(--danger)" />
                      )}
                    </button>

                    {activeTooltip === 'modal-status' && (
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 9px)',
                        right: '0',
                        backgroundColor: 'rgba(12, 16, 25, 0.78)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        borderRadius: '7px',
                        padding: '0.38rem 0.7rem',
                        fontSize: '0.74rem',
                        fontWeight: 500,
                        color: '#FFF',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        zIndex: 100,
                        animation: 'pfxFadeIn 0.15s ease-out',
                      }}>
                        {selectedUser.status === 'suspended' ? 'Buka blokir akses akun' : 'Tangguhkan akses akun'}
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: '14px',
                          width: 0,
                          height: 0,
                          borderLeft: '5px solid transparent',
                          borderRight: '5px solid transparent',
                          borderTop: '5px solid rgba(12, 16, 25, 0.9)',
                        }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: Safeguard Konfirmasi Status Akun ─── */}
      {statusConfirm && (
        <div className="pfx-modal-backdrop" onClick={() => setStatusConfirm(null)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '440px', textAlign: 'center', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setStatusConfirm(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
              }}
              title="Tutup"
            >
              <X size={18} />
            </button>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: statusConfirm.targetStatus === 'suspended' ? 'var(--danger-bg)' : 'rgba(52, 211, 153, 0.1)',
              border: `1px solid ${statusConfirm.targetStatus === 'suspended' ? 'var(--danger-border)' : 'rgba(52, 211, 153, 0.25)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: statusConfirm.targetStatus === 'suspended' ? 'var(--danger)' : 'var(--success)',
            }}>
              {statusConfirm.targetStatus === 'suspended' ? (
                <AlertTriangle size={20} />
              ) : (
                <UserCheck size={20} />
              )}
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#FFF', marginBottom: '0.4rem' }}>
              {statusConfirm.targetStatus === 'suspended' ? 'Tangguhkan Akses Akun?' : 'Buka Blokir Akses Akun?'}
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {statusConfirm.targetStatus === 'suspended' ? (
                <>
                  Akun <strong style={{ color: '#FFF' }}>{statusConfirm.user.email}</strong> ({statusConfirm.user.member_id}) tidak akan dapat masuk ke aplikasi mobile hingga penangguhan dicabut.
                </>
              ) : (
                <>
                  Pulihkan akses login dan fitur mobile untuk akun <strong style={{ color: '#FFF' }}>{statusConfirm.user.email}</strong> ({statusConfirm.user.member_id}).
                </>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => setStatusConfirm(null)} 
                className="btn-secondary"
                disabled={actionLoadingId === statusConfirm.user.id}
              >
                Batal
              </button>
              
              <button 
                onClick={executeToggleStatus} 
                className={statusConfirm.targetStatus === 'suspended' ? 'btn-danger-ghost' : 'btn-primary'}
                style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                disabled={actionLoadingId === statusConfirm.user.id}
              >
                {statusConfirm.targetStatus === 'suspended' ? (
                  <>
                    <UserX size={13} />
                    <span>{actionLoadingId === statusConfirm.user.id ? 'Memproses...' : 'Ya, Tangguhkan'}</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={13} />
                    <span>{actionLoadingId === statusConfirm.user.id ? 'Memproses...' : 'Ya, Aktifkan'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Safeguard Konfirmasi Perubahan Peran (Role) ─── */}
      {roleConfirm && (
        <div className="pfx-modal-backdrop" onClick={() => setRoleConfirm(null)}>
          <div className="pfx-modal-panel" style={{ maxWidth: '440px', textAlign: 'center', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setRoleConfirm(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
              }}
              title="Tutup"
            >
              <X size={18} />
            </button>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: roleConfirm.targetRole === 'admin' ? 'rgba(207, 168, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${roleConfirm.targetRole === 'admin' ? 'rgba(207, 168, 94, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: roleConfirm.targetRole === 'admin' ? 'var(--gold-accent)' : '#FFF',
            }}>
              {roleConfirm.targetRole === 'admin' ? (
                <ShieldCheck size={20} />
              ) : (
                <ShieldAlert size={20} />
              )}
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#FFF', marginBottom: '0.4rem' }}>
              {roleConfirm.targetRole === 'admin' ? 'Promosikan ke Administrator?' : 'Turunkan ke Member VIP?'}
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {roleConfirm.targetRole === 'admin' ? (
                <>
                  Akun <strong style={{ color: '#FFF' }}>{roleConfirm.user.email}</strong> akan memperoleh hak penuh mengelola kurikulum materi, video YouTube, dan menerbitkan kode VIP.
                </>
              ) : (
                <>
                  Hak akses administrator untuk akun <strong style={{ color: '#FFF' }}>{roleConfirm.user.email}</strong> akan dicabut dan kembali menjadi hak akses belajar member biasa.
                </>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => setRoleConfirm(null)} 
                className="btn-secondary"
                disabled={actionLoadingId === roleConfirm.user.id}
              >
                Batal
              </button>
              
              <button 
                onClick={executeToggleRole} 
                className="btn-primary"
                style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                disabled={actionLoadingId === roleConfirm.user.id}
              >
                {actionLoadingId === roleConfirm.user.id ? 'Memproses...' : 'Ya, Ubah Peran'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
