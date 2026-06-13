'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

interface AnalyticsData {
  dailyAttempts: Record<string, number>;
  levelCompletion: Record<string, { attempts: number; passes: number }>;
  topicDifficulty: Record<string, { correct: number; total: number }>;
  retentionData: { day1: number; day7: number; day30: number; total: number };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch attempts
      const attemptsSnapshot = await getDocs(collection(db, 'attempts'));
      const dailyAttempts: Record<string, number> = {};
      const levelCompletion: Record<string, { attempts: number; passes: number }> = {
        '1': { attempts: 0, passes: 0 }, '2': { attempts: 0, passes: 0 },
        '3': { attempts: 0, passes: 0 }, '4': { attempts: 0, passes: 0 },
      };
      const topicDifficulty: Record<string, { correct: number; total: number }> = {};

      attemptsSnapshot.forEach((d) => {
        const attempt = d.data();
        const date = attempt.timestamp?.split('T')[0] || 'unknown';
        dailyAttempts[date] = (dailyAttempts[date] || 0) + 1;

        const levelKey = String(attempt.level);
        if (levelCompletion[levelKey]) {
          levelCompletion[levelKey].attempts++;
          if (attempt.score >= 7) levelCompletion[levelKey].passes++;
        }

        // Topic analysis
        if (attempt.answers) {
          for (const a of attempt.answers) {
            const topic = a.topic_tag || 'unknown';
            if (!topicDifficulty[topic]) topicDifficulty[topic] = { correct: 0, total: 0 };
            topicDifficulty[topic].total++;
            if (a.is_correct) topicDifficulty[topic].correct++;
          }
        }
      });

      // Retention (simplified)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let total = 0, day1 = 0, day7 = 0, day30 = 0;
      const now = Date.now();
      usersSnapshot.forEach((d) => {
        const u = d.data();
        if (!u.onboarding_complete) return;
        total++;
        const created = new Date(u.created_at).getTime();
        const lastActive = new Date(u.last_active || u.created_at).getTime();
        const daysSinceCreate = (lastActive - created) / (1000 * 60 * 60 * 24);
        if (daysSinceCreate >= 1) day1++;
        if (daysSinceCreate >= 7) day7++;
        if (daysSinceCreate >= 30) day30++;
      });

      setData({
        dailyAttempts, levelCompletion, topicDifficulty,
        retentionData: { day1, day7, day30, total },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: '#6E6E73' }}>Loading analytics...</div>;
  if (!data) return null;

  return (
    <div style={{ padding: '32px 32px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F', marginBottom: 32 }}>Analytics</h1>

      {/* Level Completion Rates */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #E8E8ED', marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 20 }}>Level Pass Rates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[1, 2, 3, 4].map((level) => {
            const d = data.levelCompletion[String(level)];
            const rate = d.attempts > 0 ? Math.round((d.passes / d.attempts) * 100) : 0;
            return (
              <div key={level} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 8px' }}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#E8E8ED" strokeWidth="6" />
                    <motion.circle
                      cx="40" cy="40" r="32" fill="none"
                      stroke={rate >= 70 ? '#34C759' : rate >= 40 ? '#FF9F0A' : '#FF3B30'}
                      strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 32}
                      initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - rate / 100) }}
                      transition={{ duration: 1, delay: level * 0.1 }}
                      transform="rotate(-90 40 40)"
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#1D1D1F' }}>
                    {rate}%
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1F' }}>Level {level}</div>
                <div style={{ fontSize: 12, color: '#86868B' }}>{d.passes}/{d.attempts}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Topic Difficulty */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #E8E8ED', marginBottom: 24 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 20 }}>Topic Difficulty Analysis</h3>
        {Object.entries(data.topicDifficulty).length === 0 ? (
          <p style={{ color: '#86868B', fontSize: 14 }}>No data yet. Analytics populate as users take quizzes.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(data.topicDifficulty)
              .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
              .map(([topic, d]) => {
                const rate = Math.round((d.correct / d.total) * 100);
                return (
                  <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 100, fontSize: 13, fontWeight: 500, color: '#1D1D1F' }}>{topic}</div>
                    <div style={{ flex: 1, height: 8, background: '#E8E8ED', borderRadius: 4 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rate}%` }}
                        transition={{ duration: 0.8 }}
                        style={{
                          height: '100%', borderRadius: 4,
                          background: rate >= 70 ? '#34C759' : rate >= 40 ? '#FF9F0A' : '#FF3B30',
                        }}
                      />
                    </div>
                    <div style={{ width: 50, fontSize: 13, fontWeight: 600, color: '#1D1D1F', textAlign: 'right' }}>{rate}%</div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Retention */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #E8E8ED' }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 20 }}>User Retention</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'Day 1', value: data.retentionData.day1, total: data.retentionData.total },
            { label: 'Day 7', value: data.retentionData.day7, total: data.retentionData.total },
            { label: 'Day 30', value: data.retentionData.day30, total: data.retentionData.total },
          ].map((r) => {
            const rate = r.total > 0 ? Math.round((r.value / r.total) * 100) : 0;
            return (
              <div key={r.label} style={{ textAlign: 'center', background: '#F5F5F7', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F' }}>{rate}%</div>
                <div style={{ fontSize: 13, color: '#86868B' }}>{r.label} Retention</div>
                <div style={{ fontSize: 12, color: '#86868B' }}>{r.value}/{r.total} users</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
