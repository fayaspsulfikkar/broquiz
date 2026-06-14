'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useUserStore } from '@/store/user-store';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { toggleAnonymousLeaderboard } = useUserStore();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !profile) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#6E6E73' }}>Loading...</p></div>;
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const accuracy = profile.total_rounds_played > 0 
    ? Math.round((profile.total_correct_answers / (profile.total_rounds_played * 10)) * 100) 
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #E8E8ED', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0071E3', fontSize: 14, fontWeight: 500 }}>← Home</button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#1D1D1F' }}>Profile</h1>
        <div style={{ width: 80 }} />
      </nav>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{
          background: '#fff', borderRadius: 20, padding: 32, border: '1px solid #E8E8ED', textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 40, background: '#E8E8ED', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#6E6E73', overflow: 'hidden',
          }}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profile.name?.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F', marginBottom: 4 }}>{profile.name}</h2>
          <p style={{ fontSize: 14, color: '#6E6E73', marginBottom: 8 }}>{profile.email}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: 100, background: '#F5F5F7', fontSize: 12, fontWeight: 500, color: '#6E6E73' }}>
              Accuracy: {accuracy}%
            </span>
            {profile.scholarship_eligible && <span style={{ padding: '4px 12px', borderRadius: 100, background: '#34C75915', fontSize: 12, fontWeight: 600, color: '#34C759' }}>✓ Scholarship Eligible</span>}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{
          background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #E8E8ED', marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 16 }}>Your Journey</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F' }}>{profile.total_rounds_played}</div>
              <div style={{ fontSize: 12, color: '#86868B' }}>Rounds Played</div>
            </div>
            <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F' }}>{profile.total_correct_answers}</div>
              <div style={{ fontSize: 12, color: '#86868B' }}>Questions Mastered</div>
            </div>
            <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F' }}>{formatTime(profile.total_time_seconds)}</div>
              <div style={{ fontSize: 12, color: '#86868B' }}>Time Spent</div>
            </div>
            <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F' }}>🔥 {profile.streak_count}</div>
              <div style={{ fontSize: 12, color: '#86868B' }}>Current Streak</div>
            </div>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{
          background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #E8E8ED',
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 16 }}>Settings</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#1D1D1F' }}>Anonymous on Leaderboard</div>
              <div style={{ fontSize: 13, color: '#86868B' }}>Hide your name from the public leaderboard</div>
            </div>
            <button
              onClick={() => user && toggleAnonymousLeaderboard(user.uid)}
              style={{
                width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: profile.anonymous_leaderboard ? '#34C759' : '#E8E8ED',
                position: 'relative', transition: 'background 0.2s ease',
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 12, background: '#fff',
                position: 'absolute', top: 2,
                left: profile.anonymous_leaderboard ? 22 : 2,
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
