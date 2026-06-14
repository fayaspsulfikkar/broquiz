'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useQuizStore } from '@/store/quiz-store';
import { LEVELS, BADGES, RANK_THRESHOLDS } from '@/lib/constants';
import { getRankTitle } from '@/lib/gamification';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile, logout } = useAuth();
  const { results } = useQuizStore();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (profile && !profile.onboarding_complete) router.push('/onboarding');
    
    // Auto-grant admin access for this specific email
    if (profile?.email === 'fayas.gimelvavteth@gmail.com' && !profile.is_admin) {
      import('firebase/firestore').then(({ doc, updateDoc }) => {
        import('@/lib/firebase').then(({ db }) => {
          updateDoc(doc(db, 'users', profile.uid), { is_admin: true })
            .then(() => refreshProfile())
            .catch(console.error);
        });
      });
    }
  }, [user, loading, profile, router, refreshProfile]);

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 15, color: '#6E6E73' }}>Loading...</div>
      </div>
    );
  }

  const getNextLevel = (): number => {
    for (let i = 1; i <= 4; i++) {
      const key = `level_${i}` as keyof typeof profile.levels;
      if (!profile.levels[key].passed) return i;
    }
    return 4;
  };

  const isLevelUnlocked = (level: number): boolean => {
    if (level === 1) return true;
    const prevKey = `level_${level - 1}` as keyof typeof profile.levels;
    return profile.levels[prevKey].passed;
  };

  const nextLevel = getNextLevel();

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      {/* Top Bar */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #E8E8ED',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#000',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700,
          }}>B</div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.02em' }}>BroQuiz</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {profile.is_admin && (
            <button onClick={() => router.push('/admin')} className="btn-ghost" style={{ padding: '0 12px', height: 36, fontSize: 13, fontWeight: 600, color: '#0071E3', background: '#0071E315', borderRadius: 100 }}>
              Admin Panel
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#1D1D1F' }}>
            🔥 <span style={{ fontWeight: 600 }}>{profile.streak_count}</span>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 100, background: '#F5F5F7',
            fontSize: 12, fontWeight: 600, color: '#6E6E73',
          }}>
            {profile.total_xp} XP
          </div>
          <button onClick={() => router.push('/leaderboard')} className="btn-ghost" style={{ padding: '0 8px', height: 36 }}>
            🏆
          </button>
          <button onClick={() => router.push('/profile')} className="btn-ghost" style={{ padding: '0 8px', height: 36 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 16, background: '#E8E8ED',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 600, color: '#6E6E73',
              overflow: 'hidden',
            }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
          </button>
          <button onClick={logout} className="btn-ghost" style={{ padding: '0 8px', height: 36, fontSize: 13, color: '#86868B' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 36 }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em' }}>
            Welcome back, {profile.name?.split(' ')[0] || 'Coder'} 👋
          </h1>
          <p style={{ fontSize: 15, color: '#6E6E73', marginTop: 4 }}>
            {getRankTitle(profile.rank_tier)} · {profile.profile_type === 'school' ? 'School Student' : profile.profile_type === 'college' ? 'College Student' : 'Job Seeker'}
          </p>
        </motion.div>

        {/* Level Cards */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F' }}>Your Levels</h2>
            {profile.scholarship_eligible && (
              <div style={{
                padding: '6px 14px', borderRadius: 100,
                background: '#34C75915', color: '#34C759',
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                ✓ Scholarship Eligible
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {LEVELS.map((level, i) => {
              const key = `level_${level.id}` as keyof typeof profile.levels;
              const progress = profile.levels[key];
              const unlocked = isLevelUnlocked(level.id);
              const diffColors: Record<string, string> = { Beginner: '#34C759', Intermediate: '#FF9F0A', Advanced: '#0071E3', Expert: '#AF52DE' };
              const color = diffColors[level.difficulty] || '#6E6E73';

              return (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => unlocked && router.push(`/level/${level.id}`)}
                  style={{
                    background: '#fff', borderRadius: 16, padding: 24,
                    border: '1px solid #E8E8ED',
                    cursor: unlocked ? 'pointer' : 'default',
                    opacity: unlocked ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  whileHover={unlocked ? { y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' } : {}}
                >
                  {/* Status badge */}
                  <div style={{ position: 'absolute', top: 16, right: 16 }}>
                    {progress.passed ? (
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    ) : !unlocked ? (
                      <div style={{ fontSize: 20 }}>🔒</div>
                    ) : null}
                  </div>

                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${color}15`, color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, marginBottom: 14,
                  }}>{level.id}</div>

                  <div style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 4 }}>{level.name}</div>
                  <div style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 100,
                    fontSize: 11, fontWeight: 600, color, background: `${color}15`, marginBottom: 12,
                  }}>{level.difficulty}</div>

                  {progress.attempts > 0 && (
                    <div style={{ fontSize: 13, color: '#6E6E73' }}>
                      Best: <strong style={{ color: '#1D1D1F' }}>{progress.best_score}/10</strong> · {progress.attempts} attempt{progress.attempts !== 1 ? 's' : ''}
                    </div>
                  )}
                  {progress.attempts === 0 && unlocked && (
                    <div style={{ fontSize: 13, color: '#0071E3', fontWeight: 500 }}>Start →</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Continue CTA */}
        {!profile.scholarship_eligible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              background: '#fff', borderRadius: 16, padding: 24,
              border: '1px solid #E8E8ED', marginBottom: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 4 }}>Continue Your Journey</div>
              <div style={{ fontSize: 14, color: '#6E6E73' }}>
                {nextLevel <= 4
                  ? `Level ${nextLevel}: ${LEVELS[nextLevel - 1].name} awaits. Score ≥7/10 to pass.`
                  : 'All levels completed!'}
              </div>
            </div>
            <button className="btn-primary" onClick={() => router.push(`/level/${nextLevel}`)}>
              Go to Level {nextLevel} →
            </button>
          </motion.div>
        )}

        {/* Bottom Row: Badges + Rank */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {/* Badges */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24,
            border: '1px solid #E8E8ED',
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 16 }}>Achievements</h3>
            {profile.badges.length === 0 ? (
              <p style={{ fontSize: 14, color: '#86868B' }}>Complete quizzes to earn badges!</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {profile.badges.map((badgeId) => {
                  const badge = BADGES.find((b) => b.id === badgeId);
                  if (!badge) return null;
                  return (
                    <div key={badgeId} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', borderRadius: 10,
                      background: '#F5F5F7', fontSize: 13, fontWeight: 500, color: '#1D1D1F',
                    }}>
                      <span>{badge.icon}</span> {badge.name}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rank & Streak */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24,
            border: '1px solid #E8E8ED',
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 16 }}>Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#86868B', marginBottom: 4 }}>Rank</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F' }}>{getRankTitle(profile.rank_tier)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#86868B', marginBottom: 4 }}>Total XP</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F' }}>{profile.total_xp}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#86868B', marginBottom: 4 }}>Current Streak</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F' }}>🔥 {profile.streak_count} days</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#86868B', marginBottom: 4 }}>Longest Streak</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F' }}>{profile.longest_streak} days</div>
              </div>
            </div>

            {/* XP Progress to next rank */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, color: '#86868B', marginBottom: 6 }}>Next Rank Progress</div>
              {(() => {
                const currentRankIdx = RANK_THRESHOLDS.findIndex((r) => r.tier === profile.rank_tier);
                const nextRank = RANK_THRESHOLDS[currentRankIdx + 1];
                if (!nextRank) return <div style={{ fontSize: 13, color: '#34C759', fontWeight: 500 }}>Max rank achieved! 🏆</div>;
                const currentThreshold = RANK_THRESHOLDS[currentRankIdx].minXP;
                const progress = ((profile.total_xp - currentThreshold) / (nextRank.minXP - currentThreshold)) * 100;
                return (
                  <>
                    <div style={{ width: '100%', height: 6, background: '#E8E8ED', borderRadius: 3 }}>
                      <div style={{
                        width: `${Math.min(100, progress)}%`, height: '100%',
                        background: '#0071E3', borderRadius: 3, transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 12, color: '#86868B', marginTop: 4 }}>
                      {profile.total_xp}/{nextRank.minXP} XP → {nextRank.title}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
