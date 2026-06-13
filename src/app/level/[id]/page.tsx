'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LEVELS, QUESTION_TYPE_LABELS } from '@/lib/constants';
import { motion } from 'framer-motion';

export default function LevelStartPage() {
  const router = useRouter();
  const params = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const levelId = Number(params.id);
  const level = LEVELS.find((l) => l.id === levelId);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (!level) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6E6E73' }}>Level not found</p>
      </div>
    );
  }

  // Gate check
  const isUnlocked = (() => {
    if (levelId === 1) return true;
    if (!profile) return false;
    const prevKey = `level_${levelId - 1}` as keyof typeof profile.levels;
    return profile.levels[prevKey]?.passed;
  })();

  if (!authLoading && !isUnlocked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1D1D1F' }}>Level Locked</h2>
        <p style={{ fontSize: 15, color: '#6E6E73' }}>Pass Level {levelId - 1} first to unlock this level.</p>
        <button className="btn-primary" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  const handleStartQuiz = async () => {
    setLoading(true);
    // Navigate to quiz page with level parameter
    router.push(`/quiz?level=${levelId}`);
  };

  const diffColors: Record<string, string> = { Beginner: '#34C759', Intermediate: '#FF9F0A', Advanced: '#0071E3', Expert: '#AF52DE' };
  const color = diffColors[level.difficulty] || '#6E6E73';

  const prevAttempts = profile?.levels[`level_${levelId}` as keyof typeof profile.levels];

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', padding: '40px 24px' }}>
      {/* Back */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: '#0071E3', cursor: 'pointer', fontSize: 14, fontWeight: 500, marginBottom: 24 }}
        >
          ← Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fff', borderRadius: 20, padding: 'clamp(32px, 5vw, 48px)',
            border: '1px solid #E8E8ED',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: `${color}15`, color: color,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, marginBottom: 16,
            }}>{level.id}</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em' }}>
              Level {level.id}: {level.name}
            </h1>
            <div style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 100, marginTop: 8,
              fontSize: 12, fontWeight: 600, color, background: `${color}15`,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>{level.difficulty}</div>
          </div>

          <p style={{ fontSize: 15, color: '#6E6E73', textAlign: 'center', lineHeight: 1.6, marginBottom: 32 }}>
            {level.description}
          </p>

          {/* Info Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 12, marginBottom: 32,
          }}>
            <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#86868B', marginBottom: 4 }}>Questions</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F' }}>10</div>
            </div>
            <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#86868B', marginBottom: 4 }}>Passing Score</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F' }}>7/10</div>
            </div>
          </div>

          {/* Question Types */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', marginBottom: 12 }}>Question Types</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {level.question_distribution.map((d) => (
                <div key={d.type} style={{
                  padding: '6px 12px', borderRadius: 8,
                  background: '#F5F5F7', fontSize: 13, color: '#1D1D1F',
                }}>
                  {d.count}× {QUESTION_TYPE_LABELS[d.type]}
                </div>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', marginBottom: 12 }}>Topics Covered</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {level.topics.map((t) => (
                <div key={t} style={{
                  padding: '6px 12px', borderRadius: 8,
                  border: '1px solid #E8E8ED', fontSize: 13, color: '#6E6E73',
                }}>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div style={{
            background: level.negative_marking ? '#FFF3E0' : '#F5F5F7',
            borderRadius: 12, padding: 16, marginBottom: 32,
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', marginBottom: 8 }}>Rules</h3>
            <ul style={{ fontSize: 14, color: '#6E6E73', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
              <li>10 questions, must score ≥ 7/10 to pass</li>
              <li>AI generates unique questions each attempt</li>
              <li>No repeated questions from your previous attempts</li>
              {level.negative_marking && (
                <li style={{ color: '#FF9F0A', fontWeight: 500 }}>
                  ⚠️ Negative marking: -0.25 per wrong answer
                </li>
              )}
              <li>You can flag questions and review before submitting</li>
            </ul>
          </div>

          {/* Previous Attempts */}
          {prevAttempts && prevAttempts.attempts > 0 && (
            <div style={{
              background: '#F5F5F7', borderRadius: 12, padding: 16, marginBottom: 32,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', marginBottom: 8 }}>Previous Attempts</div>
              <div style={{ fontSize: 14, color: '#6E6E73' }}>
                Best: <strong>{prevAttempts.best_score}/10</strong> · Attempts: <strong>{prevAttempts.attempts}</strong>
                {prevAttempts.passed && <span style={{ color: '#34C759', marginLeft: 8 }}>✓ Passed</span>}
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            className="btn-primary"
            onClick={handleStartQuiz}
            disabled={loading}
            style={{ width: '100%', height: 52, fontSize: 17, borderRadius: 14 }}
          >
            {loading ? 'Generating Questions...' : prevAttempts?.passed ? 'Retake Level' : 'Start Test →'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
