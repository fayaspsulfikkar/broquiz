'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useUserStore } from '@/store/user-store';

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

  const formatTime = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const played = profile.total_rounds_played || 0;
  const correct = profile.total_correct_answers || 0;
  const time = profile.total_time_seconds || 0;
  const streak = profile.streak_count || 0;

  const accuracy = played > 0 
    ? Math.round((correct / (played * 10)) * 100) 
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <nav  style={{ borderBottom: 'none', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 0 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 500 }}>← Home</button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'inherit' }}>Profile</h1>
        <div style={{ width: 80 }} />
      </nav>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>
        {/* Profile Header */}
        <div  style={{
          borderRadius: 20, padding: 32, textAlign: 'center', marginBottom: 24,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 40, background: 'var(--color-border-light)', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'inherit', overflow: 'hidden',
          }}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profile.name?.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'inherit', marginBottom: 4 }}>{profile.name}</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>{profile.email}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ padding: '4px 12px', borderRadius: 100, background: 'var(--color-bg-tertiary)', fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Accuracy: {accuracy}%
            </span>
            {profile.scholarship_eligible && <span style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(74,222,128,0.2)', fontSize: 12, fontWeight: 600, color: '#4ADE80' }}>✓ Scholarship Eligible</span>}
          </div>
        </div>

        {/* Stats */}
        <div  style={{
          borderRadius: 20, padding: 28,
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'inherit', marginBottom: 20, textAlign: 'center' }}>Your Journey</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'inherit', marginBottom: 4 }}>{played}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Rounds Played</div>
            </div>
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'inherit', marginBottom: 4 }}>{correct}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Questions Mastered</div>
            </div>
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'inherit', marginBottom: 4 }}>{formatTime(time)}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Time Spent</div>
            </div>
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'inherit', marginBottom: 4 }}>🔥 {streak}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Current Streak</div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
