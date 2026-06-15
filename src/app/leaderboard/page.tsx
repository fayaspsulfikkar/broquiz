'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LeaderboardUser {
  uid: string;
  name: string;
  avatar_url: string;
  total_correct_answers: number;
  total_rounds_played: number;
  total_time_seconds: number;
  streak_count: number;
  anonymous_leaderboard: boolean;
  fraud_detected?: boolean;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('total_correct_answers', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const data: LeaderboardUser[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        if (d.total_rounds_played > 0) {
          data.push({ uid: doc.id, ...d } as LeaderboardUser);
        }
      });
      // Sort further by time (tie breaker)
      data.sort((a, b) => {
        if (b.total_correct_answers !== a.total_correct_answers) {
          return b.total_correct_answers - a.total_correct_answers;
        }
        return a.total_time_seconds - b.total_time_seconds;
      });
      setUsers(data);
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const getAccuracy = (u: LeaderboardUser) => {
    const totalQuestions = u.total_rounds_played * 10;
    if (totalQuestions === 0) return 0;
    return Math.round((u.total_correct_answers / totalQuestions) * 100);
  };

  const getAvgTime = (u: LeaderboardUser) => {
    const totalQuestions = u.total_rounds_played * 10;
    if (totalQuestions === 0) return 0;
    return (u.total_time_seconds / totalQuestions).toFixed(1);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const userRank = users.findIndex((u) => u.uid === user?.uid) + 1;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Nav */}
      <nav  style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10, border: 'none', borderRadius: 0
      }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500 }}>← Home</span>
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'inherit' }}>Global Leaderboard</h1>
        <div style={{ width: 80 }} />
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
        {/* Loading */}
        {loading || authLoading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-secondary)' }}>Loading leaderboard...</div>
        ) : !profile?.is_admin ? (
          <div style={{ textAlign: 'center', padding: 80, maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Access Denied</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>The global leaderboard is currently restricted to administrators only.</p>
            <button onClick={() => router.push('/')} style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)', padding: '12px 24px', borderRadius: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
              Return Home
            </button>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6E6E73' }}>No users found</div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {[1, 0, 2].map((podiumIdx) => {
                const u = users[podiumIdx];
                if (!u) return null;
                const rank = podiumIdx + 1;
                const heights = { 1: 180, 2: 150, 3: 130 };
                const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
                return (
                  <div
                    key={u.uid}
                    
                    style={{
                      borderRadius: 16, padding: 20,
                      border: rank === 1 ? '2px solid #FFD700' : '1px solid var(--color-border-light)',
                      width: rank === 1 ? 160 : 140,
                      minHeight: heights[rank as keyof typeof heights],
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{medals[rank as keyof typeof medals]}</div>
                    <div style={{
                      width: 48, height: 48, borderRadius: 24, background: 'var(--color-border-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 600, color: 'inherit', marginBottom: 8,
                      overflow: 'hidden',
                    }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        u.anonymous_leaderboard ? '?' : u.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'inherit', marginBottom: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      {u.anonymous_leaderboard ? 'Anonymous' : u.name?.split(' ')[0]}
                      {u.fraud_detected && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'inherit', background: '#FF3B30', padding: '2px 6px', borderRadius: 6, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                          Fraud Detected
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#4ADE80' }}>
                      Round {u.total_rounds_played || 0}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                      {u.total_correct_answers} Mastered • {u.streak_count}🔥
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full List Table */}
            <div  style={{ borderRadius: 16, border: '1px solid var(--color-border-light)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-bg-secondary)' }}>
                    <th style={{ padding: '16px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rank</th>
                    <th style={{ padding: '16px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</th>
                    <th style={{ padding: '16px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Round</th>
                    <th style={{ padding: '16px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Questions Mastered</th>
                    <th style={{ padding: '16px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Wrong Answers</th>
                    <th style={{ padding: '16px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Accuracy</th>
                    <th style={{ padding: '16px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Time / Q</th>
                    <th style={{ padding: '16px 16px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    const rank = i + 1;
                    const isMe = u.uid === user?.uid;
                    return (
                      <tr
                        key={u.uid}
                        style={{
                          borderBottom: '1px solid var(--color-border-light)',
                          background: isMe ? 'rgba(255,255,255,0.15)' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isMe ? 'var(--color-border-light)' : 'var(--color-bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = isMe ? 'rgba(255,255,255,0.15)' : 'transparent'}
                      >
                        <td style={{ padding: '16px 16px', fontSize: 15, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                          {rank}
                        </td>
                        <td style={{ padding: '16px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 16, background: 'var(--color-border-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 600, color: 'inherit',
                            overflow: 'hidden', flexShrink: 0,
                          }}>
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              u.anonymous_leaderboard ? '?' : u.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: isMe ? 700 : 500, color: 'inherit' }}>
                            {u.anonymous_leaderboard ? 'Anonymous' : u.name}
                            {isMe && <span style={{ color: 'inherit', marginLeft: 8, fontSize: 11, fontWeight: 700, background: 'var(--color-border-light)', padding: '2px 6px', borderRadius: 10 }}>YOU</span>}
                            {u.fraud_detected && <span style={{ color: 'inherit', marginLeft: 8, fontSize: 10, fontWeight: 700, background: '#FF3B30', padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase' }}>FRAUD DETECTED</span>}
                          </div>
                        </td>
                        <td style={{ padding: '16px 16px', fontSize: 14, fontWeight: 600, color: '#4ADE80' }}>
                          Round {u.total_rounds_played || 0}
                        </td>
                        <td style={{ padding: '16px 16px', fontSize: 14, fontWeight: 600, color: 'inherit' }}>
                          {u.total_correct_answers}
                        </td>
                        <td style={{ padding: '16px 16px', fontSize: 14, fontWeight: 500, color: '#FF3B30' }}>
                          {Math.max(0, (u.total_rounds_played * 10) - u.total_correct_answers)}
                        </td>
                        <td style={{ padding: '16px 16px', fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                          {getAccuracy(u)}%
                        </td>
                        <td style={{ padding: '16px 16px', fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                          {getAvgTime(u)}s
                        </td>
                        <td style={{ padding: '16px 16px', fontSize: 14, fontWeight: 600, color: '#FF9F0A' }}>
                          {u.streak_count} 🔥
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
