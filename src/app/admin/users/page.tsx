'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import type { UserProfile } from '@/types';

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const data: UserProfile[] = [];
      snapshot.forEach((d) => {
        const u = { uid: d.id, ...d.data() } as UserProfile;
        data.push(u);
      });
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users
    .filter((u) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (sortBy === 'correct') return (b.total_correct_answers || 0) - (a.total_correct_answers || 0);
      if (sortBy === 'streak') return (b.streak_count || 0) - (a.streak_count || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

  const toggleScholarship = async (uid: string, current: boolean) => {
    await updateDoc(doc(db, 'users', uid), { scholarship_eligible: !current });
    setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, scholarship_eligible: !current } : u));
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Total Rounds', 'Total Correct', 'Total Time(s)', 'Streak', 'Eligible', 'Joined'];
    const rows = filtered.map((u) => [
      u.name, u.email, u.total_rounds_played || 0, u.total_correct_answers || 0,
      u.total_time_seconds || 0, u.streak_count || 0, u.scholarship_eligible ? 'Yes' : 'No',
      u.created_at?.split('T')[0] || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'broquiz_users.csv'; a.click();
  };

  const resetAllFraudBadges = async () => {
    if (!window.confirm("Are you sure you want to remove the fraud_detected badge from ALL users?")) return;
    setLoading(true);
    let count = 0;
    try {
      const { deleteField } = await import('firebase/firestore');
      for (const u of users) {
        if (u.fraud_detected) {
          await updateDoc(doc(db, 'users', u.uid), { fraud_detected: false });
          count++;
        }
      }
      alert(`Cleared fraud badge from ${count} users.`);
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert('Error clearing badges');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F' }}>User Management</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          {(profile?.email === 'fayaspulivetty@gmail.com' || profile?.email === 'fayas.gimelvavteth@gmail.com') && (
            <button className="btn-secondary" onClick={resetAllFraudBadges} style={{ fontSize: 13, color: '#FF3B30', borderColor: '#FF3B3015', background: '#FF3B3010' }}>
              🧹 Reset All Fraud Badges
            </button>
          )}
          <button className="btn-secondary" onClick={exportCSV} style={{ fontSize: 13 }}>📥 Export CSV</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." style={{ maxWidth: 300 }} />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input" style={{ width: 'auto' }}>
          <option value="created_at">Join Date</option>
          <option value="correct">Total Correct</option>
          <option value="streak">Streak</option>
          <option value="name">Name</option>
        </select>
      </div>

      <div style={{ fontSize: 13, color: '#86868B', marginBottom: 12 }}>{filtered.length} users</div>

      {loading ? (
        <p style={{ color: '#6E6E73' }}>Loading...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E8ED', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E8ED' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#86868B', fontSize: 12 }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#86868B', fontSize: 12 }}>Rounds</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#86868B', fontSize: 12 }}>Correct</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#86868B', fontSize: 12 }}>Time (s)</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#86868B', fontSize: 12 }}>Streak</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#86868B', fontSize: 12 }}>Eligible</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#86868B', fontSize: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid} style={{ borderBottom: '1px solid #F5F5F7' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, color: '#1D1D1F' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#86868B' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6E6E73' }}>{u.total_rounds_played || 0}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#34C759', fontWeight: 600 }}>{u.total_correct_answers || 0}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#6E6E73' }}>{u.total_time_seconds || 0}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#FF9F0A', fontWeight: 600 }}>{u.streak_count || 0}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => toggleScholarship(u.uid, u.scholarship_eligible)}
                      style={{
                        padding: '4px 10px', borderRadius: 6,
                        background: u.scholarship_eligible ? '#34C75915' : '#F5F5F7',
                        color: u.scholarship_eligible ? '#34C759' : '#86868B',
                        border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}
                    >
                      {u.scholarship_eligible ? '✓ Yes' : 'No'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedUser(u)}
                      style={{ background: 'none', border: 'none', color: '#0071E3', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--color-bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 24,
        }} onClick={() => setSelectedUser(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, padding: 32, maxWidth: 500, width: '100%',
            maxHeight: '80vh', overflow: 'auto',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F', marginBottom: 20 }}>{selectedUser.name}</h3>
            <div style={{ fontSize: 14, color: '#6E6E73', lineHeight: 2 }}>
              <div><strong>Email:</strong> {selectedUser.email}</div>
              <div><strong>Rounds:</strong> {selectedUser.total_rounds_played || 0}</div>
              <div><strong>Correct:</strong> {selectedUser.total_correct_answers || 0}</div>
              <div><strong>Streak:</strong> 🔥 {selectedUser.streak_count || 0} (best: {selectedUser.longest_streak || 0})</div>
              <div><strong>Badges:</strong> {selectedUser.badges?.length || 0}</div>
              <div><strong>Questions Seen:</strong> {selectedUser.seen_question_ids?.length || 0}</div>
              <div><strong>Joined:</strong> {selectedUser.created_at?.split('T')[0]}</div>
              <div><strong>Last Active:</strong> {selectedUser.last_active?.split('T')[0]}</div>
            </div>
            <button className="btn-secondary" onClick={() => setSelectedUser(null)} style={{ marginTop: 20 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
