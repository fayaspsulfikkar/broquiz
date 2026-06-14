'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useQuizStore } from '@/store/quiz-store';
import { QUESTION_TYPE_LABELS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClientQuestion } from '@/types';

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const level = Number(searchParams.get('level')) || 1;
  const {
    questions, currentIndex, answers, flaggedQuestions,
    timeStarted, isLoading, isSubmitting,
    startQuiz, setAnswer, toggleFlag, nextQuestion,
    goToQuestion, setLoading, setSubmitting, setResults, setError, error,
    getCurrentQuestion, getProgress, isAllAnswered, getAnswerForQuestion,
  } = useQuizStore();

  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch questions on mount
  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (questions.length === 0 && !isLoading) {
      loadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, userId: user?.uid, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load questions');
      startQuiz(level, data.questions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) return; // Note: Need profile from useAuth
    setSubmitting(true);
    try {
      const answerArray = Array.from(answers.entries()).map(([questionId, a]) => ({
        questionId,
        userAnswer: a.answer,
      }));
      const duration = timeStarted ? Math.round((Date.now() - timeStarted) / 1000) : 0;

      const res = await fetch('/api/questions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          level,
          answers: answerArray,
          durationSeconds: duration,
          userProfile: profile, // Pass profile for badge/streak eval
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      // PERFORM DATABASE WRITES ON THE CLIENT (AUTHENTICATED)
      const { clientUpdateData, results: finalResults } = data;
      if (clientUpdateData) {
        const { doc, updateDoc, addDoc, collection, arrayUnion } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        const userRef = doc(db, 'users', user.uid);
        const levelKey = `levels.level_${level}`;
        
        const levelUpdate: Record<string, unknown> = {
          [`${levelKey}.attempts`]: (profile.levels[`level_${level}` as keyof typeof profile.levels]?.attempts || 0) + 1,
          [`${levelKey}.all_scores`]: arrayUnion(clientUpdateData.score),
          [`${levelKey}.last_attempt_date`]: new Date().toISOString(),
        };

        const currentBest = profile.levels[`level_${level}` as keyof typeof profile.levels]?.best_score || 0;
        if (clientUpdateData.score > currentBest) {
          levelUpdate[`${levelKey}.best_score`] = clientUpdateData.score;
        }
        if (clientUpdateData.passed) {
          levelUpdate[`${levelKey}.passed`] = true;
        }

        const allPassed =
          (level === 1 ? clientUpdateData.passed : profile.levels.level_1.passed) &&
          (level === 2 ? clientUpdateData.passed : profile.levels.level_2.passed) &&
          (level === 3 ? clientUpdateData.passed : profile.levels.level_3.passed) &&
          (level === 4 ? clientUpdateData.passed : profile.levels.level_4.passed);

        await updateDoc(userRef, {
          ...levelUpdate,
          seen_question_ids: arrayUnion(...clientUpdateData.questionIds),
          total_xp: clientUpdateData.totalXP,
          rank_tier: clientUpdateData.rankTier,
          badges: clientUpdateData.newBadges.length > 0 ? arrayUnion(...clientUpdateData.newBadges) : profile.badges,
          last_active: new Date().toISOString(),
          last_activity_date: new Date().toISOString().split('T')[0],
          streak_count: clientUpdateData.newStreak,
          longest_streak: clientUpdateData.newLongestStreak,
          streak_freeze_used_this_week: clientUpdateData.streakFreezeUsed,
          scholarship_eligible: allPassed,
        });

        await addDoc(collection(db, 'attempts'), {
          user_id: user.uid,
          level,
          timestamp: new Date().toISOString(),
          duration_seconds: duration,
          score: clientUpdateData.score,
          raw_score: clientUpdateData.rawScore,
          wrong_count: clientUpdateData.wrongCount,
          net_score: clientUpdateData.netScore,
          answers: finalResults.map((r: any) => ({
            question_id: r.question_id,
            user_answer: r.user_answer,
            is_correct: r.is_correct,
            points_awarded: r.points_awarded,
          })),
          improvement_suggestions: clientUpdateData.improvementSuggestions,
        });

        // Update question correct count asynchronously
        finalResults.forEach(async (r: any) => {
          try {
            const qRef = doc(db, 'questions', r.question_id);
            // We use increment, but we need to import it if we want to be exact. 
            // Better to skip for now to avoid permission issues if users can't write to questions collection.
          } catch (e) {}
        });
      }

      setResults(data);
      router.push('/results');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: 32, height: 32, border: '3px solid #E8E8ED', borderTopColor: '#000', borderRadius: '50%' }}
        />
        <p style={{ fontSize: 15, color: '#6E6E73' }}>Generating your unique questions...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <p style={{ fontSize: 16, color: '#FF3B30', fontWeight: 500 }}>{error}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={() => router.push('/dashboard')}>Dashboard</button>
          <button className="btn-primary" onClick={loadQuestions}>Retry</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) return null;

  const currentAnswer = getAnswerForQuestion(currentQuestion.id);
  const isFlagged = flaggedQuestions.has(currentQuestion.id);
  const progress = getProgress();
  const allAnswered = isAllAnswered();

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>
      {/* Top Bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8E8ED',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
          Level {level}
        </div>

        {/* Progress */}
        <div style={{ flex: 1, maxWidth: 400, margin: '0 24px' }}>
          <div style={{ width: '100%', height: 4, background: '#E8E8ED', borderRadius: 2 }}>
            <motion.div
              style={{ height: '100%', background: '#000', borderRadius: 2 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div style={{ fontSize: 14, color: '#6E6E73' }}>
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {/* Question Navigation (dots) */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6, padding: '16px 24px',
        flexWrap: 'wrap',
      }}>
        {questions.map((q, i) => {
          const answered = answers.has(q.id);
          const flagged = flaggedQuestions.has(q.id);
          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(i)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: i === currentIndex ? '2px solid #000' : '1px solid #E8E8ED',
                background: answered ? '#000' : flagged ? '#FF9F0A' : '#fff',
                color: answered ? '#fff' : '#1D1D1F',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              {flagged ? '🚩' : i + 1}
            </button>
          );
        })}
      </div>

      {/* Question Card */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 100px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            style={{
              background: '#fff', borderRadius: 20, padding: 'clamp(24px, 4vw, 36px)',
              border: '1px solid #E8E8ED',
            }}
          >
            {/* Type badge */}
            <div style={{
              display: 'inline-block', padding: '4px 10px', borderRadius: 6,
              background: '#F5F5F7', fontSize: 11, fontWeight: 600,
              color: '#6E6E73', textTransform: 'uppercase', letterSpacing: '0.04em',
              marginBottom: 20,
            }}>
              {QUESTION_TYPE_LABELS[currentQuestion.type]}
            </div>

            {/* Question text */}
            <div style={{ fontSize: 17, fontWeight: 500, color: '#1D1D1F', lineHeight: 1.7, marginBottom: 24 }}>
              {currentQuestion.question}
            </div>

            {/* Code snippet */}
            {currentQuestion.code_snippet && (
              <pre className="code-block" style={{ marginBottom: 24, whiteSpace: 'pre-wrap' }}>
                {currentQuestion.code_snippet}
              </pre>
            )}

            {/* Answer Area */}
            <QuestionAnswerArea
              question={currentQuestion}
              currentAnswer={currentAnswer?.answer}
              onAnswer={(answer) => setAnswer(currentQuestion.id, answer)}
            />
          </motion.div>
        </AnimatePresence>

        {/* Action Bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 20, gap: 12, flexWrap: 'wrap',
        }}>
          <button
            className="btn-secondary"
            onClick={() => toggleFlag(currentQuestion.id)}
            style={{
              background: isFlagged ? '#FF9F0A15' : undefined,
              borderColor: isFlagged ? '#FF9F0A' : undefined,
              color: isFlagged ? '#FF9F0A' : undefined,
            }}
          >
            {isFlagged ? '🚩 Flagged' : '🏳️ Flag for Review'}
          </button>

          <div style={{ display: 'flex', gap: 12 }}>
            {currentIndex > 0 && (
              <button className="btn-secondary" onClick={() => goToQuestion(currentIndex - 1)}>
                ← Previous
              </button>
            )}

            {currentIndex < questions.length - 1 ? (
              <button
                className="btn-primary"
                onClick={nextQuestion}
                disabled={!currentAnswer}
              >
                Next →
              </button>
            ) : (
              <button
                className="btn-accent"
                onClick={() => setShowConfirm(true)}
                disabled={!allAnswered || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100, padding: 24,
            }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 20, padding: 36,
                maxWidth: 420, width: '100%', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F', marginBottom: 8 }}>Submit Your Answers?</h3>
              <p style={{ fontSize: 15, color: '#6E6E73', marginBottom: 8 }}>
                You&apos;ve answered {answers.size}/{questions.length} questions.
                {flaggedQuestions.size > 0 && ` ${flaggedQuestions.size} flagged for review.`}
              </p>
              {level === 4 && (
                <p style={{ fontSize: 13, color: '#FF9F0A', fontWeight: 500, marginBottom: 24 }}>
                  ⚠️ Remember: Wrong answers have -0.25 penalty
                </p>
              )}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Review Answers</button>
                <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Dynamic Question Answer Area
function QuestionAnswerArea({
  question,
  currentAnswer,
  onAnswer,
}: {
  question: ClientQuestion;
  currentAnswer?: string | string[];
  onAnswer: (answer: string | string[]) => void;
}) {
  switch (question.type) {
    case 'mcq':
    case 'code_output':
    case 'debugging':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {question.options?.map((option, i) => {
            const selected = currentAnswer === option;
            return (
              <button
                key={i}
                onClick={() => onAnswer(option)}
                style={{
                  textAlign: 'left',
                  padding: '14px 18px', borderRadius: 12,
                  border: `2px solid ${selected ? '#000' : '#E8E8ED'}`,
                  background: selected ? '#000' : '#fff',
                  color: selected ? '#fff' : '#1D1D1F',
                  fontSize: 15, cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  transition: 'all 0.15s ease',
                  lineHeight: 1.5,
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: 12,
                  border: `2px solid ${selected ? '#fff' : '#D2D2D7'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: 1,
                  background: selected ? '#fff' : 'transparent',
                }}>
                  {selected && <div style={{ width: 10, height: 10, borderRadius: 5, background: '#000' }} />}
                </span>
                <span style={{ whiteSpace: 'pre-wrap' }}>{option}</span>
              </button>
            );
          })}
        </div>
      );

    case 'multiple_select':
      const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : currentAnswer ? [currentAnswer] : [];
      return (
        <div>
          <p style={{ fontSize: 13, color: '#0071E3', marginBottom: 12, fontWeight: 500 }}>
            Select all that apply
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {question.options?.map((option, i) => {
              const selected = selectedOptions.includes(option);
              return (
                <button
                  key={i}
                  onClick={() => {
                    const newSelection = selected
                      ? selectedOptions.filter((o) => o !== option)
                      : [...selectedOptions, option];
                    onAnswer(newSelection);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '14px 18px', borderRadius: 12,
                    border: `2px solid ${selected ? '#000' : '#E8E8ED'}`,
                    background: selected ? '#000' : '#fff',
                    color: selected ? '#fff' : '#1D1D1F',
                    fontSize: 15, cursor: 'pointer',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    transition: 'all 0.15s ease',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: 4,
                    border: `2px solid ${selected ? '#fff' : '#D2D2D7'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                    background: selected ? '#fff' : 'transparent',
                  }}>
                    {selected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span style={{ whiteSpace: 'pre-wrap' }}>{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      );

    case 'fill_blank':
      return (
        <div>
          <input
            type="text"
            value={(currentAnswer as string) || ''}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="input"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              height: 52,
              textAlign: 'center',
              letterSpacing: '0.05em',
            }}
            autoFocus
          />
          <p style={{ fontSize: 12, color: '#86868B', textAlign: 'center', marginTop: 8 }}>
            Case-insensitive. Type the exact answer.
          </p>
        </div>
      );

    default:
      return <p style={{ color: '#6E6E73' }}>Unknown question type</p>;
  }
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 15, color: '#6E6E73' }}>Loading quiz...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
