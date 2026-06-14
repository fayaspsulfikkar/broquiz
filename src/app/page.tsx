'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

const MAX_QUESTIONS = 260;

interface LeaderboardUser {
  uid: string;
  name: string;
  total_correct_answers: number;
  total_rounds_played: number;
  total_time_seconds: number;
  streak_count: number;
  anonymous_leaderboard: boolean;
}

export default function LandingPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && profile) {
      fetchTopLeaderboard();
    }
  }, [user, profile]);

  const fetchTopLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const q = query(collection(db, 'users'), orderBy('total_correct_answers', 'desc'), limit(15));
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
      setTopUsers(data.slice(0, 5));
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleStart = () => {
    if (user && profile) {
      if (!profile.name || profile.name.trim() === '') {
        router.push('/login');
      } else {
        router.push('/quiz');
      }
    } else {
      router.push('/login');
    }
  };

  const getAccuracy = (u: LeaderboardUser) => {
    const totalQuestions = u.total_rounds_played * 10;
    if (totalQuestions === 0) return 0;
    return Math.round((u.total_correct_answers / totalQuestions) * 100);
  };

  if (!mounted || authLoading) return null;

  // Unauthenticated Intro View
  if (!user || !profile) {
    return (
      <div style={{ background: '#F5F5F7', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: '#fff', borderRadius: 20, padding: 'clamp(32px, 5vw, 64px)',
            maxWidth: 600, width: '100%', margin: 24, textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid #E8E8ED',
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 24,
          }}>B</div>
          
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#1D1D1F', marginBottom: 16,
          }}>
            Welcome to BroQuiz
          </h1>
          
          <p style={{
            fontSize: 17, color: '#6E6E73', lineHeight: 1.6, marginBottom: 32,
          }}>
            Test your programming fundamentals. <strong>Taking repeated quiz rounds will improve your chances of getting selected.</strong> The more questions you master, the higher you climb on the leaderboard.
          </p>

          <button 
            className="btn-primary" 
            onClick={handleStart}
            style={{ height: 56, padding: '0 48px', fontSize: 18, borderRadius: 14, width: '100%' }}
          >
            Login to Start →
          </button>
        </motion.div>
      </div>
    );
  }

  // Authenticated Dashboard View
  const progressPercent = Math.min(100, Math.round(((profile.total_correct_answers || 0) / MAX_QUESTIONS) * 100));

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100vh' }}>
      {/* Header */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E8ED', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#1D1D1F' }}>BroQuiz Dashboard</h1>
        <div style={{ display: 'flex', gap: 16 }}>
          {profile.is_admin && (
            <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#FF3B30', fontWeight: 500, cursor: 'pointer' }}>
              Admin Panel
            </button>
          )}
          <button onClick={() => router.push('/profile')} style={{ background: 'none', border: 'none', color: '#0071E3', fontWeight: 500, cursor: 'pointer' }}>
            Profile
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F', marginBottom: 8 }}>
            Welcome back, {profile.name?.split(' ')[0] || 'Bro'}! 👋
          </h2>
          <p style={{ color: '#6E6E73', fontSize: 16 }}>Ready to master some code today?</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
          {/* Progress Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{
            background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #E8E8ED',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#86868B', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Progress</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: '#1D1D1F', lineHeight: 1 }}>{profile.total_rounds_played || 0}</span>
              <span style={{ fontSize: 16, color: '#6E6E73', paddingBottom: 4 }}>/ 26 Rounds</span>
            </div>
            <div style={{ height: 8, background: '#F5F5F7', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', background: '#0071E3', width: `${Math.min(100, ((profile.total_rounds_played || 0) / 26) * 100)}%`, borderRadius: 4, transition: 'width 1s ease-out' }} />
            </div>
            <div style={{ fontSize: 13, color: '#86868B', textAlign: 'right' }}>{profile.total_correct_answers || 0} Questions Mastered</div>
          </motion.div>

          {/* Streak Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{
            background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #E8E8ED',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔥</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F' }}>{profile.streak_count || 0} Day Streak</div>
            <div style={{ fontSize: 14, color: '#6E6E73', marginTop: 4 }}>Keep coming back to climb the ranks!</div>
          </motion.div>
        </div>

        {/* Completion Badge */}
        {(profile.total_rounds_played || 0) >= 26 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{
            background: 'linear-gradient(135deg, #34C759 0%, #28A745 100%)', borderRadius: 20, padding: 24, marginBottom: 32,
            color: '#fff', textAlign: 'center', boxShadow: '0 8px 24px rgba(52, 199, 89, 0.25)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Curriculum Completed!</h3>
            <p style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.5 }}>
              You have successfully learned the fundamentals of programming. There is a <strong>very high chance of you getting selected</strong>. Keep practicing to maintain your streak!
            </p>
          </motion.div>
        )}

        {/* Start Quiz Action */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: 40 }}>
          <button 
            className="btn-primary" 
            onClick={handleStart}
            style={{ width: '100%', height: 64, fontSize: 18, borderRadius: 16, boxShadow: '0 8px 20px rgba(0, 113, 227, 0.24)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ fontWeight: 600 }}>
              {(profile.total_rounds_played || 0) >= 26 ? 'Play Again from Round 1 →' : `Start Round ${(profile.total_rounds_played || 0) + 1} →`}
            </div>
            {(profile.total_rounds_played || 0) >= 26 && (
              <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.9, marginTop: 4 }}>Keep earning points</div>
            )}
          </button>
        </motion.div>

        {/* Top 5 Leaderboard Preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{
          background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #E8E8ED',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F' }}>Top Players</h3>
            <button 
              onClick={() => router.push('/leaderboard')}
              style={{ background: 'none', border: 'none', color: '#0071E3', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              View Full Leaderboard →
            </button>
          </div>

          {loadingLeaderboard ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#6E6E73' }}>Loading top players...</div>
          ) : topUsers.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#6E6E73' }}>No players yet!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topUsers.map((u, idx) => (
                <div key={u.uid} style={{ 
                  display: 'flex', alignItems: 'center', padding: '12px 16px', 
                  background: u.uid === user.uid ? '#0071E308' : '#F5F5F7', 
                  borderRadius: 12, border: u.uid === user.uid ? '1px solid #0071E330' : '1px solid transparent'
                }}>
                  <div style={{ width: 32, fontSize: 16, fontWeight: 700, color: idx < 3 ? '#0071E3' : '#86868B' }}>#{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {u.anonymous_leaderboard ? 'Anonymous Learner' : u.name}
                      {u.uid === user.uid && <span style={{ fontSize: 10, background: '#0071E3', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>YOU</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1D1D1F' }}>{u.total_correct_answers}</div>
                      <div style={{ fontSize: 11, color: '#86868B' }}>Mastered</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#34C759' }}>{getAccuracy(u)}%</div>
                      <div style={{ fontSize: 11, color: '#86868B' }}>Accuracy</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
