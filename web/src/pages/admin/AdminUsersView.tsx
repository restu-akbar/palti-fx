import { useEffect, useState } from 'react';
import { 
  Search, 
  RefreshCw, 
  UserX, 
  UserCheck
} from 'lucide-react';
import type { Profile } from '../../types/admin';
import { AdminUsersService } from '../../lib/adminUsers';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'member' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all');

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

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

  const handleToggleStatus = async (user: Profile) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const confirmText = newStatus === 'suspended'
      ? `Tangguhkan akun "${user.email}"? Pengguna tidak akan dapat mengakses aplikasi.`
      : `Buka kembali blokir akun "${user.email}"?`;

    if (!window.confirm(confirmText)) return;

    setActionLoadingId(user.id);
    try {
      const res = await AdminUsersService.updateUserStatus(user.id, newStatus);
      if (res.success) {
        notify(`Status akun "${user.email}" diubah menjadi ${newStatus === 'active' ? 'Aktif' : 'Ditangguhkan'}.`);
        fetchUsers();
      } else {
        notify(res.error || 'Gagal mengubah status akun.', true);
      }
    } catch (err: any) {
      notify(err?.message || 'Terjadi kesalahan sistem.', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchQuery = 
      u.email.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      u.member_id.toLowerCase().includes(q);

    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;

    return matchQuery && matchRole && matchStatus;
  });

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>
            Member &amp; Hak Akses
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Pemantauan akun anggota, validasi ID Member, dan pengelolaan penangguhan akun.
          </p>
        </div>

        <button onClick={fetchUsers} className="btn-secondary" disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Segarkan</span>
        </button>
      </div>

      {feedbackMsg && (
        <div style={{
          padding: '0.65rem 1rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.25rem',
          backgroundColor: feedbackMsg.error ? 'var(--danger-bg)' : 'var(--success-bg)',
          border: `1px solid ${feedbackMsg.error ? 'var(--danger-border)' : 'var(--success-border)'}`,
          color: feedbackMsg.error ? '#FDA4AF' : '#6EE7B7',
          fontSize: '0.84rem',
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Integrated Search and Filter Toolbar */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            className="pfx-input"
            placeholder="Cari Nama, Email, atau ID Member (PFX-XXXXXXXX)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.2rem' }}
          />
          <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {/* Role Filter */}
        <div style={{ width: '140px' }}>
          <select
            className="pfx-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
          >
            <option value="all">Semua Peran</option>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ width: '140px' }}>
          <select
            className="pfx-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="suspended">Ditangguhkan</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="pfx-table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Memuat data pengguna...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Tidak ada akun yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <table className="pfx-table">
            <thead>
              <tr>
                <th>ID Member</th>
                <th>Nama &amp; Email</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Bergabung</th>
                <th style={{ textAlign: 'right', width: '140px' }}>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const isActionLoading = actionLoadingId === user.id;

                return (
                  <tr key={user.id}>
                    {/* Member ID */}
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        {user.member_id}
                      </span>
                    </td>

                    {/* Name & Email */}
                    <td>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{user.full_name || 'Tanpa Nama'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user.email}</div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <span className={`pfx-badge ${user.role === 'admin' ? 'pfx-badge-gold' : 'pfx-badge-neutral'}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`pfx-badge ${user.status === 'active' ? 'pfx-badge-success' : 'pfx-badge-danger'}`}>
                        {user.status === 'active' ? 'Aktif' : 'Ditangguhkan'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      {user.role === 'admin' ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Sistem</span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={user.status === 'active' ? 'btn-danger-ghost' : 'btn-secondary'}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                          disabled={isActionLoading}
                        >
                          {user.status === 'active' ? (
                            <>
                              <UserX size={12} />
                              <span>Tangguhkan</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={12} color="var(--success)" />
                              <span style={{ color: 'var(--success)' }}>Aktifkan</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
