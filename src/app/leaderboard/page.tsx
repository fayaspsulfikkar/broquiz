'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

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
  const { user, profile } = useAuth();
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
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      {/* Nav */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #E8E8ED',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: '#0071E3', fontWeight: 500 }}>← Home</span>
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#1D1D1F' }}>Global Leaderboard</h1>
        <div style={{ width: 80 }} />
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px' }}>
        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#6E6E73' }}>Loading leaderboard...</div>
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
                  <motion.div
                    key={u.uid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: podiumIdx * 0.1 }}
                    style={{
                      background: '#fff', borderRadius: 16, padding: 20,
                      border: rank === 1 ? '2px solid #FFD700' : '1px solid #E8E8ED',
                      width: rank === 1 ? 160 : 140,
                      minHeight: heights[rank as keyof typeof heights],
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{medals[rank as keyof typeof medals]}</div>
                    <div style={{
                      width: 48, height: 48, borderRadius: 24, background: '#E8E8ED',
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
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F', marginBottom: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      {u.anonymous_leaderboard ? 'Anonymous' : u.name?.split(' ')[0]}
                      {u.fraud_detected && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#FF3B30', padding: '2px 6px', borderRadius: 6, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                          Fraud Detected
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0071E3' }}>
                      Round {u.total_rounds_played || 0}
                    </div>
                    <div style={{ fontSize: 11, color: '#86868B', marginTop: 4 }}>
                      {u.total_correct_answers} Mastered • {u.streak_count}🔥
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Full List Table */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E8ED', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E8E8ED', background: '#FBFBFD' }}>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rank</th>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</th>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Round</th>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Questions Mastered</th>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Wrong Answers</th>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Accuracy</th>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Time / Q</th>
                    <th style={{ padding: '16px 24px', fontSize: 11, fontWeight: 700, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Streak</th>
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
                          borderBottom: '1px solid #F5F5F7',
                          background: isMe ? '#F0F7FF' : '#fff',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = isMe ? '#E0F0FF' : '#FBFBFD'}
                        onMouseLeave={(e) => e.currentTarget.style.background = isMe ? '#F0F7FF' : '#fff'}
                      >
                        <td style={{ padding: '16px 24px', fontSize: 15, fontWeight: 700, color: '#86868B' }}>
                          {rank}
                        </td>
                        <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 16, background: '#E8E8ED',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 600, color: '#6E6E73',
                            overflow: 'hidden', flexShrink: 0,
                          }}>
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              u.anonymous_leaderboard ? '?' : u.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: isMe ? 700 : 500, color: '#1D1D1F' }}>
                            {u.anonymous_leaderboard ? 'Anonymous' : u.name}
                            {isMe && <span style={{ color: '#0071E3', marginLeft: 8, fontSize: 11, fontWeight: 700, background: '#E0F0FF', padding: '2px 6px', borderRadius: 10 }}>YOU</span>}
                            {u.fraud_detected && <span style={{ color: '#fff', marginLeft: 8, fontSize: 10, fontWeight: 700, background: '#FF3B30', padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase' }}>FRAUD DETECTED</span>}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#0071E3' }}>
                          Round {u.total_rounds_played || 0}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
                          {u.total_correct_answers}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 500, color: '#FF3B30' }}>
                          {Math.max(0, (u.total_rounds_played * 10) - u.total_correct_answers)}
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: 14, color: '#6E6E73', fontWeight: 500 }}>
                          {getAccuracy(u)}%
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: 14, color: '#6E6E73', fontWeight: 500 }}>
                          {getAvgTime(u)}s
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#FF9F0A' }}>
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
