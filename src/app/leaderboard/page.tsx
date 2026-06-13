'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateLeaderboardTier, getLeaderboardTierColor } from '@/lib/gamification';
import { motion } from 'framer-motion';
import type { ProfileType } from '@/types';

interface LeaderboardUser {
  uid: string;
  name: string;
  avatar_url: string;
  total_xp: number;
  profile_type: ProfileType;
  badges: string[];
  levels: Record<string, { best_score: number; passed: boolean }>;
  anonymous_leaderboard: boolean;
  scholarship_eligible: boolean;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ProfileType>('all');
  const [levelFilter, setLevelFilter] = useState<'overall' | '1' | '2' | '3' | '4'>('overall');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('total_xp', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const data: LeaderboardUser[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        if (d.onboarding_complete) {
          data.push({ uid: doc.id, ...d } as LeaderboardUser);
        }
      });
      setUsers(data);
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const getScore = (u: LeaderboardUser): number => {
    if (levelFilter === 'overall') return u.total_xp;
    const key = `level_${levelFilter}`;
    return u.levels?.[key]?.best_score || 0;
  };

  const filtered = users
    .filter((u) => filter === 'all' || u.profile_type === filter)
    .sort((a, b) => getScore(b) - getScore(a));

  const userRank = filtered.findIndex((u) => u.uid === user?.uid) + 1;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      {/* Nav */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #E8E8ED',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: '#0071E3', fontWeight: 500 }}>← Dashboard</span>
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#1D1D1F' }}>Leaderboard</h1>
        <div style={{ width: 80 }} />
      </nav>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 24px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: 'All Users' },
            { value: 'school', label: 'School' },
            { value: 'college', label: 'College' },
            { value: 'job_seeker', label: 'Job Seekers' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as typeof filter)}
              style={{
                padding: '6px 14px', borderRadius: 100,
                background: filter === f.value ? '#000' : '#fff',
                color: filter === f.value ? '#fff' : '#6E6E73',
                border: `1px solid ${filter === f.value ? '#000' : '#E8E8ED'}`,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', flexWrap: 'wrap' }}>
          {[
            { value: 'overall', label: 'Overall XP' },
            { value: '1', label: 'Level 1' },
            { value: '2', label: 'Level 2' },
            { value: '3', label: 'Level 3' },
            { value: '4', label: 'Level 4' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setLevelFilter(f.value as typeof levelFilter)}
              style={{
                padding: '6px 14px', borderRadius: 100,
                background: levelFilter === f.value ? '#0071E3' : '#fff',
                color: levelFilter === f.value ? '#fff' : '#6E6E73',
                border: `1px solid ${levelFilter === f.value ? '#0071E3' : '#E8E8ED'}`,
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6E6E73' }}>Loading leaderboard...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6E6E73' }}>No users found</div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32, alignItems: 'flex-end' }}>
              {[1, 0, 2].map((podiumIdx) => {
                const u = filtered[podiumIdx];
                if (!u) return null;
                const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
                const heights = { 1: 160, 2: 130, 3: 110 };
                const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
                return (
                  <motion.div
                    key={u.uid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: podiumIdx * 0.1 }}
                    style={{
                      background: '#fff', borderRadius: 16, padding: 20,
                      border: rank === 1 ? '2px solid #FFD700' : '1px solid #E8E8ED',
                      width: rank === 1 ? 140 : 120,
                      minHeight: heights[rank as keyof typeof heights],
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{medals[rank as keyof typeof medals]}</div>
                    <div style={{
                      width: 44, height: 44, borderRadius: 22, background: '#E8E8ED',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 600, color: '#6E6E73', marginBottom: 8,
                      overflow: 'hidden',
                    }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        u.anonymous_leaderboard ? '?' : u.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 4 }}>
                      {u.anonymous_leaderboard ? 'Anonymous' : u.name?.split(' ')[0]}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0071E3' }}>
                      {getScore(u)} {levelFilter === 'overall' ? 'XP' : '/10'}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Full List */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E8ED', overflow: 'hidden' }}>
              {filtered.slice(3).map((u, i) => {
                const rank = i + 4;
                const isMe = u.uid === user?.uid;
                const tier = calculateLeaderboardTier(u.total_xp);
                const tierColor = getLeaderboardTierColor(tier);
                return (
                  <div
                    key={u.uid}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid #F5F5F7',
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: isMe ? '#0071E308' : 'transparent',
                    }}
                  >
                    <div style={{ width: 28, fontSize: 14, fontWeight: 600, color: '#86868B', textAlign: 'center' }}>
                      {rank}
                    </div>
                    <div style={{
                      width: 36, height: 36, borderRadius: 18, background: '#E8E8ED',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 600, color: '#6E6E73',
                      overflow: 'hidden', flexShrink: 0,
                    }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        u.anonymous_leaderboard ? '?' : u.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: isMe ? 600 : 500, color: '#1D1D1F' }}>
                        {u.anonymous_leaderboard ? 'Anonymous' : u.name}
                        {isMe && <span style={{ color: '#0071E3', marginLeft: 6, fontSize: 12 }}>You</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#86868B' }}>{u.badges?.length || 0} badges</div>
                    </div>
                    <div style={{
                      width: 8, height: 8, borderRadius: 4, background: tierColor,
                    }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F' }}>
                      {getScore(u)} {levelFilter === 'overall' ? 'XP' : '/10'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* User's own rank (if not in top 100) */}
            {userRank === 0 && profile && (
              <div style={{
                marginTop: 12, padding: '14px 20px',
                background: '#0071E308', borderRadius: 12,
                display: 'flex', alignItems: 'center', gap: 14,
                border: '1px solid #0071E320',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#86868B' }}>—</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
                  {profile.name} <span style={{ color: '#0071E3', fontSize: 12 }}>You</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F' }}>{profile.total_xp} XP</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
