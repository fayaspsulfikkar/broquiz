'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useQuizStore } from '@/store/quiz-store';
import { LEVELS, BADGES, QUESTION_TYPE_LABELS } from '@/lib/constants';
import { getScoreHexColor, getEligibilityStatus } from '@/lib/scoring';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResultsPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const { results, reset } = useQuizStore();
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

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
        // Show badge popup after score animation
        if (results.new_badges.length > 0) {
          setTimeout(() => setShowBadge(true), 300);
        }
      }
    }, 16);
    return () => clearInterval(timer);
  }, [results]);

  if (!results) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 16, color: '#6E6E73' }}>No results to display</p>
        <button className="btn-primary" onClick={() => router.push('/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  const level = LEVELS.find((l) => l.id === results.level);
  const scoreColor = getScoreHexColor(results.score);
  const eligibility = getEligibilityStatus(results.score);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = animatedScore / 10;
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
          onClick={() => { reset(); router.push('/dashboard'); }}
          style={{ background: 'none', border: 'none', color: '#0071E3', cursor: 'pointer', fontSize: 14, fontWeight: 500, marginBottom: 24 }}
        >
          ← Back to Dashboard
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
            Level {results.level} — {level?.name}
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
                {animatedScore}
              </div>
              <div style={{ fontSize: 16, color: '#86868B' }}>out of 10</div>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{ marginBottom: 24 }}>
            {eligibility === 'eligible' ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 100,
                background: '#34C75915', color: '#34C759',
                fontSize: 16, fontWeight: 600,
              }}>
                ✓ {results.passed ? 'Level Passed!' : 'Scholarship Eligible'}
              </div>
            ) : eligibility === 'retry' ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 100,
                background: '#FF9F0A15', color: '#FF9F0A',
                fontSize: 16, fontWeight: 600,
              }}>
                Almost there! Keep trying.
              </div>
            ) : (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 100,
                background: '#FF3B3015', color: '#FF3B30',
                fontSize: 16, fontWeight: 600,
              }}>
                Consider enrolling for guided learning
              </div>
            )}
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
              <div style={{ fontSize: 11, color: '#86868B', marginBottom: 4 }}>Time</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F' }}>{formatDuration(results.duration_seconds)}</div>
            </div>
            <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#86868B', marginBottom: 4 }}>XP Earned</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F' }}>+{results.new_xp}</div>
            </div>
            {results.level === 4 && (
              <div style={{ background: '#F5F5F7', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11, color: '#86868B', marginBottom: 4 }}>Net Score</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F' }}>{results.net_score}</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {results.passed && (
              <button className="btn-primary" onClick={() => {
                const nextLevel = results.level + 1;
                reset();
                if (nextLevel <= 4) router.push(`/level/${nextLevel}`);
                else router.push('/dashboard');
              }}>
                {results.level < 4 ? `Go to Level ${results.level + 1} →` : 'Back to Dashboard 🎉'}
              </button>
            )}
            <button className="btn-secondary" onClick={() => {
              reset();
              router.push(`/quiz?level=${results.level}`);
            }}>
              Retry Level
            </button>
            <button className="btn-secondary" onClick={() => {
              // LinkedIn share
              const text = `Passed Level ${results.level} on BroQuiz with ${results.score}/10! Testing my coding logic fundamentals. #BroQuiz #Scholarship #Programming`;
              window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`, '_blank');
            }}>
              Share on LinkedIn
            </button>
          </div>
        </motion.div>

        {/* Improvement Suggestions */}
        {results.improvement_suggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              background: '#fff', borderRadius: 20, padding: 28,
              border: '1px solid #E8E8ED', marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              💡 Improvement Suggestions
            </h3>
            <p style={{ fontSize: 15, color: '#6E6E73', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {results.improvement_suggestions}
            </p>
          </motion.div>
        )}

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
            {results.results.map((r, i) => (
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
                    {r.is_correct ? '✓' : '✗'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1D1D1F', lineHeight: 1.4 }}>
                      Q{i + 1}. {r.question_text.substring(0, 80)}{r.question_text.length > 80 ? '...' : ''}
                    </div>
                    <div style={{ fontSize: 12, color: '#86868B', marginTop: 2 }}>
                      {QUESTION_TYPE_LABELS[r.question_type]} · {r.topic_tag}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: r.points_awarded > 0 ? '#34C759' : '#FF3B30',
                  }}>
                    +{r.points_awarded}
                  </div>
                </button>

                {/* Expanded details */}
                <AnimatePresence>
                  {expandedQ === r.question_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        padding: '16px 18px', margin: '4px 0',
                        background: '#F5F5F7', borderRadius: 12,
                        fontSize: 14, color: '#1D1D1F', lineHeight: 1.6,
                      }}>
                        {r.code_snippet && (
                          <pre className="code-block" style={{ marginBottom: 12, fontSize: 12 }}>
                            {r.code_snippet}
                          </pre>
                        )}
                        <div style={{ marginBottom: 8 }}>
                          <strong>Your Answer:</strong>{' '}
                          <span style={{ color: r.is_correct ? '#34C759' : '#FF3B30' }}>
                            {Array.isArray(r.user_answer) ? r.user_answer.join(', ') : r.user_answer || '(no answer)'}
                          </span>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <strong>Correct Answer:</strong>{' '}
                          <span style={{ color: '#34C759' }}>
                            {Array.isArray(r.correct_answer) ? r.correct_answer.join(', ') : r.correct_answer}
                          </span>
                        </div>
                        <div style={{ padding: '12px 14px', background: '#fff', borderRadius: 8, color: '#6E6E73' }}>
                          💡 {r.explanation}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Badge Popup */}
      <AnimatePresence>
        {showBadge && results.new_badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100, padding: 24,
            }}
            onClick={() => setShowBadge(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 24, padding: 48,
                maxWidth: 380, width: '100%', textAlign: 'center',
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: 2, duration: 0.4 }}
                style={{ fontSize: 64, marginBottom: 16 }}
              >
                🏆
              </motion.div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F', marginBottom: 8 }}>
                Badge Earned!
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {results.new_badges.map((badgeId) => {
                  const badge = BADGES.find((b) => b.id === badgeId);
                  if (!badge) return null;
                  return (
                    <div key={badgeId} style={{
                      padding: '12px 18px', borderRadius: 12,
                      background: '#F5F5F7', display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <span style={{ fontSize: 28 }}>{badge.icon}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F' }}>{badge.name}</div>
                        <div style={{ fontSize: 13, color: '#6E6E73' }}>{badge.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="btn-primary" onClick={() => setShowBadge(false)}>
                Awesome! 🎉
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
