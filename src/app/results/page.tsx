'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useQuizStore } from '@/store/quiz-store';
import { QUESTION_TYPE_LABELS } from '@/lib/constants';
import { getScoreHexColor } from '@/lib/scoring';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResultsPage() {
  const router = useRouter();
  const { refreshProfile, profile } = useAuth();
  const { results, reset } = useQuizStore();
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    refreshProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate score count-up
  useEffect(() => {
    if (!results) return;
    const target = results.score;
    const duration = 1500;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimatedScore(Number((progress * target).toFixed(2)));
      if (progress >= 1) {
        clearInterval(timer);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [results]);

  if (!results) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 16, color: '#6E6E73' }}>No results to display</p>
        <button className="btn-primary" onClick={() => router.push('/')}>Go to Home</button>
      </div>
    );
  }

  const scoreColor = getScoreHexColor(results.score);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = results.total_questions > 0 ? results.score / results.total_questions : 0;
  const strokeDashoffset = circumference * (1 - scorePercent);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', padding: '40px 24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Back */}
        <button
          onClick={() => { reset(); router.push('/'); }}
          style={{ background: 'none', border: 'none', color: '#0071E3', cursor: 'pointer', fontSize: 14, fontWeight: 500, marginBottom: 24 }}
        >
          ← Back to Home
        </button>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fff', borderRadius: 24, padding: 'clamp(32px, 5vw, 48px)',
            border: '1px solid #E8E8ED', textAlign: 'center', marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#86868B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
            Round Completed
          </div>

          {/* Score Circle */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="#E8E8ED" strokeWidth="8" />
              <motion.circle
                cx="100" cy="100" r={radius} fill="none"
                stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 44, fontWeight: 700, color: scoreColor, letterSpacing: '-0.03em' }}>
                {Math.floor(animatedScore)}
              </div>
              <div style={{ fontSize: 16, color: '#86868B' }}>out of {results.total_questions}</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 16, marginBottom: 24,
          }}>
            <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#86868B', marginBottom: 4 }}>Accuracy</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F' }}>{results.accuracy_percentage}%</div>
            </div>
            <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#86868B', marginBottom: 4 }}>Time Taken</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F' }}>{formatDuration(results.duration_seconds)}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => {
              reset();
              router.push('/quiz');
            }}>
              Take Another Round →
            </button>
            <button className="btn-secondary" onClick={() => {
              reset();
              router.push('/leaderboard');
            }}>
              View Leaderboard
            </button>
            <button className="btn-secondary" onClick={() => {
              // LinkedIn share
              const origin = typeof window !== 'undefined' ? window.location.origin : '';
              const text = `Just mastered ${results.score} logic questions on BroQuiz! Taking repetitive rounds to improve my chances of selection. #BroQuiz #Programming`;
              window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(origin)}&text=${encodeURIComponent(text)}`, '_blank');
            }}>
              Share on LinkedIn
            </button>
          </div>
        </motion.div>

        {/* Answer Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: '#fff', borderRadius: 20, padding: 28,
            border: '1px solid #E8E8ED', marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 20 }}>
            Answer Review
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.results.map((r: any, i: number) => (
              <div key={r.question_id}>
                <button
                  onClick={() => setExpandedQ(expandedQ === r.question_id ? null : r.question_id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '14px 18px', borderRadius: 12,
                    border: '1px solid #E8E8ED',
                    background: r.is_correct ? '#34C75908' : '#FF3B3008',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    background: r.is_correct ? '#34C759' : '#FF3B30',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 600, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 500, color: '#1D1D1F' }}>
                    <div style={{ fontSize: 11, color: '#6E6E73', textTransform: 'uppercase', marginBottom: 2 }}>
                      {QUESTION_TYPE_LABELS[r.question_type as keyof typeof QUESTION_TYPE_LABELS]}
                    </div>
                    {r.question_text.slice(0, 60)}...
                  </div>
                  <div style={{ fontSize: 20, color: '#86868B', transform: expandedQ === r.question_id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                    ↓
                  </div>
                </button>

                <AnimatePresence>
                  {expandedQ === r.question_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '16px 18px', borderLeft: '2px solid #E8E8ED', marginLeft: 14, marginTop: 8 }}>
                        <div style={{ fontSize: 15, color: '#1D1D1F', marginBottom: 12 }}>
                          {r.question_text}
                        </div>
                        {r.code_snippet && (
                          <pre className="code-block" style={{ marginBottom: 12, padding: 12 }}>
                            {r.code_snippet}
                          </pre>
                        )}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                          <div style={{ color: r.is_correct ? '#34C759' : '#FF3B30' }}>
                            <strong>Your Answer:</strong> {Array.isArray(r.user_answer) ? r.user_answer.join(', ') : r.user_answer}
                          </div>
                          {!r.is_correct && (
                            <div style={{ color: '#34C759' }}>
                              <strong>Correct Answer:</strong> {Array.isArray(r.correct_answer) ? r.correct_answer.join(', ') : r.correct_answer}
                            </div>
                          )}
                        </div>

                        {r.explanation && (
                          <div style={{ marginTop: 12, padding: 12, background: '#F5F5F7', borderRadius: 8, fontSize: 14, color: '#6E6E73', lineHeight: 1.5 }}>
                            <strong>Explanation:</strong> {r.explanation}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
