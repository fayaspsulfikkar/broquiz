'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useQuizStore } from '@/store/quiz-store';
import { QUESTION_TYPE_LABELS } from '@/lib/constants';
import { getScoreHexColor } from '@/lib/scoring';

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
    <div style={{ minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Back */}
        <button
          onClick={() => { reset(); router.push('/'); }}
          style={{ background: 'none', border: 'none', color: '#0071E3', cursor: 'pointer', fontSize: 14, fontWeight: 500, marginBottom: 24 }}
        >
          ← Back to Home
        </button>

        {/* Score Card */}
        <div
          
          style={{
            borderRadius: 24, padding: 'clamp(32px, 5vw, 48px)',
            textAlign: 'center', marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
            Round Completed
          </div>

          {/* Score Circle */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="var(--color-border-light)" strokeWidth="8" />
              <circle
                cx="100" cy="100" r={radius} fill="none"
                stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
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
              <div style={{ fontSize: 16, color: 'var(--color-text-tertiary)' }}>out of {results.total_questions}</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 16, marginBottom: 24,
          }}>
            <div  style={{ borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Accuracy</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'inherit' }}>{results.accuracy_percentage}%</div>
            </div>
            <div  style={{ background: 'rgba(74, 222, 128, 0.15)', borderRadius: 12, padding: 14, borderColor: 'rgba(74, 222, 128, 0.3)' }}>
              <div style={{ fontSize: 11, color: '#4ADE80', marginBottom: 4 }}>Correct</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#4ADE80' }}>{results.score}</div>
            </div>
            <div  style={{ background: 'rgba(248, 113, 113, 0.15)', borderRadius: 12, padding: 14, borderColor: 'rgba(248, 113, 113, 0.3)' }}>
              <div style={{ fontSize: 11, color: '#F87171', marginBottom: 4 }}>Wrong</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#F87171' }}>{results.wrong_count}</div>
            </div>
            <div  style={{ borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>Time Taken</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'inherit' }}>{formatDuration(results.duration_seconds)}</div>
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
            {profile?.role === 'admin' && (
              <button className="btn-secondary" onClick={() => {
                reset();
                router.push('/leaderboard');
              }}>
                View Leaderboard
              </button>
            )}
            <button className="btn-secondary" onClick={() => {
              // LinkedIn share
              const origin = typeof window !== 'undefined' ? window.location.origin : '';
              const text = `Just mastered ${results.score} logic questions on BroQuiz! Taking repetitive rounds to improve my chances of selection. #BroQuiz #Programming`;
              window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(origin)}&text=${encodeURIComponent(text)}`, '_blank');
            }}>
              Share on LinkedIn
            </button>
          </div>
        </div>

        {/* Answer Review */}
        <div
          
          style={{
            borderRadius: 20, padding: 28,
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'inherit', marginBottom: 20 }}>
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
                    border: r.is_correct ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid rgba(248, 113, 113, 0.2)',
                    background: r.is_correct ? 'rgba(74, 222, 128, 0.05)' : 'rgba(248, 113, 113, 0.05)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    background: r.is_correct ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                    color: r.is_correct ? '#4ADE80' : '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 600, flexShrink: 0,
                    border: r.is_correct ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(248, 113, 113, 0.3)',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'inherit' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                      {QUESTION_TYPE_LABELS[r.question_type as keyof typeof QUESTION_TYPE_LABELS]}
                    </div>
                    {r.question_text.slice(0, 60)}...
                  </div>
                  <div style={{ fontSize: 20, color: 'var(--color-text-tertiary)', transform: expandedQ === r.question_id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                    ↓
                  </div>
                </button>

                
                  {expandedQ === r.question_id && (
                    <div
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '16px 18px', borderLeft: '2px solid var(--color-border-light)', marginLeft: 14, marginTop: 8 }}>
                        <div style={{ fontSize: 15, color: 'inherit', marginBottom: 12 }}>
                          {r.question_text}
                        </div>
                        {r.code_snippet && (
                          <pre className="code-block" style={{ marginBottom: 12, padding: 12 }}>
                            {r.code_snippet}
                          </pre>
                        )}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                          <div style={{ color: r.is_correct ? '#4ADE80' : '#F87171' }}>
                            <strong>Your Answer:</strong> {Array.isArray(r.user_answer) ? r.user_answer.join(', ') : r.user_answer}
                          </div>
                          {!r.is_correct && (
                            <div style={{ color: '#4ADE80' }}>
                              <strong>Correct Answer:</strong> {Array.isArray(r.correct_answer) ? r.correct_answer.join(', ') : r.correct_answer}
                            </div>
                          )}
                        </div>

                        {r.explanation && (
                          <div style={{ marginTop: 12, padding: 12, background: 'var(--color-bg-secondary)', borderRadius: 8, fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                            <strong>Explanation:</strong> {r.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
