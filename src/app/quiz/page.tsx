'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useQuizStore } from '@/store/quiz-store';
import { QUESTION_TYPE_LABELS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClientQuestion } from '@/types';
import Spectator from '@/components/Spectator';

function QuizContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const {
    questions, currentIndex, answers, flaggedQuestions, totalAvailable,
    timeStarted, isLoading, isSubmitting, isRetry, targetRoundIndex,
    startQuiz, setAnswer, toggleFlag, nextQuestion,
    goToQuestion, setLoading, setSubmitting, setResults, setError, error,
    getCurrentQuestion, getProgress, isAllAnswered, getAnswerForQuestion,
  } = useQuizStore();

  const [showConfirm, setShowConfirm] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [fraudWarnings, setFraudWarnings] = useState(0);
  const [showFraudModal, setShowFraudModal] = useState(false);

  // Tab switching detection
  useEffect(() => {
    if (isLoading || questions.length === 0 || showConfirm) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        const newWarnings = fraudWarnings + 1;
        setFraudWarnings(newWarnings);
        
        if (newWarnings > 3) {
          try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            if (user) {
              await updateDoc(doc(db, 'users', user.uid), {
                fraud_detected: true
              });
            }
            alert('FRAUD DETECTED: You have switched tabs too many times. Your account has been flagged and the current question is marked incorrect.');
            
            const currentQ = questions[currentIndex];
            if (currentQ) {
              setAnswer(currentQ.id, "FRAUD_PENALTY_INCORRECT_TAB_SWITCH");
              if (currentIndex < questions.length - 1) {
                 nextQuestion();
              }
            }
          } catch (e) {
             console.error(e);
          }
        } else {
          setShowFraudModal(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLoading, questions.length, showConfirm, fraudWarnings, user, currentIndex, nextQuestion, setAnswer]);

  // Track active time only when the tab is focused
  useEffect(() => {
    if (isLoading || questions.length === 0 || showConfirm) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        setActiveSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isLoading, questions.length, showConfirm]);

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
        body: JSON.stringify({ userId: user?.uid, profile, targetRoundIndex: isRetry ? targetRoundIndex : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load questions');
      startQuiz(data.questions, data.totalAvailable);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      const answerArray = Array.from(answers.entries()).map(([questionId, a]) => ({
        questionId,
        userAnswer: a.answer,
      }));
      const duration = activeSeconds;

      const res = await fetch('/api/questions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          answers: answerArray,
          durationSeconds: duration,
          userProfile: profile, // Pass profile for streak eval
          isRetry,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      // PERFORM DATABASE WRITES ON THE CLIENT (AUTHENTICATED)
      const { clientUpdateData, results: finalResults } = data;
      if (clientUpdateData) {
        const { doc, updateDoc, addDoc, collection, arrayUnion, increment } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        const userRef = doc(db, 'users', user.uid);
        
        if (!isRetry) {
          // Normal progression updates
          await updateDoc(userRef, {
            seen_question_ids: arrayUnion(...clientUpdateData.questionIds),
            total_time_seconds: increment(duration),
            total_rounds_played: increment(1),
            total_correct_answers: increment(clientUpdateData.score),
            last_active: new Date().toISOString(),
            last_activity_date: new Date().toISOString().split('T')[0],
            streak_count: clientUpdateData.newStreak,
            longest_streak: clientUpdateData.newLongestStreak,
            streak_freeze_used_this_week: clientUpdateData.streakFreezeUsed,
          });
        } else {
          // Retry updates: Only update time and activity
          await updateDoc(userRef, {
            total_time_seconds: increment(duration),
            last_active: new Date().toISOString(),
          });
        }

        await addDoc(collection(db, 'attempts'), {
          user_id: user.uid,
          timestamp: new Date().toISOString(),
          is_retry: isRetry,
          round_index: isRetry && targetRoundIndex !== undefined ? targetRoundIndex : profile.total_rounds_played || 0,
          duration_seconds: duration,
          score: clientUpdateData.score,
          raw_score: clientUpdateData.rawScore,
          wrong_count: clientUpdateData.wrongCount,
          answers: finalResults.map((r: any) => ({
            question_id: r.question_id,
            user_answer: r.user_answer,
            is_correct: r.is_correct,
            points_awarded: r.points_awarded,
          })),
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
          <button className="btn-secondary" onClick={() => router.push('/')}>Home</button>
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
  const allAnswered = isAllAnswered();
  
  // Calculate Global Progress for Top Bar
  const totalSeen = profile?.seen_question_ids?.length || 0;
  const globalProgress = totalAvailable > 0 ? (totalSeen / totalAvailable) * 100 : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <Spectator />
      {/* Top Bar */}
      <div className="glass" style={{
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50, border: 'none', borderRadius: 0
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 100 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'inherit' }}>
            Round {(profile?.total_rounds_played || 0) + 1}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Global Progress
          </div>
        </div>

        {/* Global Progress */}
        <div style={{ flex: 1, maxWidth: 400, margin: '0 24px' }}>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              style={{ height: '100%', background: '#fff', borderRadius: 3, boxShadow: '0 0 10px rgba(255,255,255,0.8)' }}
              animate={{ width: `${Math.min(100, globalProgress)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, minWidth: 100 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'inherit' }}>
            {totalSeen} / {totalAvailable}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Mastered</div>
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
                border: i === currentIndex ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                background: answered ? 'rgba(255,255,255,0.9)' : flagged ? '#FF9F0A' : 'rgba(0,0,0,0.2)',
                color: answered ? '#000' : 'rgba(255,255,255,0.9)',
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
      <div 
        style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 100px', userSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => { e.preventDefault(); alert("Copying is disabled during the quiz."); }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="glass"
            style={{
              borderRadius: 20, padding: 'clamp(24px, 4vw, 36px)'
            }}
          >
            {/* Type badge */}
            <div style={{
              display: 'inline-block', padding: '4px 10px', borderRadius: 6,
              background: 'rgba(255,255,255,0.15)', fontSize: 11, fontWeight: 600,
              color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.04em',
              marginBottom: 20,
            }}>
              {QUESTION_TYPE_LABELS[currentQuestion.type]}
            </div>

            {/* Question text */}
            <div style={{ fontSize: 17, fontWeight: 500, color: 'inherit', lineHeight: 1.7, marginBottom: 24 }}>
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
              className="glass"
              style={{
                borderRadius: 20, padding: 36,
                maxWidth: 420, width: '100%', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: 'inherit', marginBottom: 8 }}>Submit Your Answers?</h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
                You&apos;ve answered {answers.size}/{questions.length} questions.
                {flaggedQuestions.size > 0 && ` ${flaggedQuestions.size} flagged for review.`}
              </p>
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

      {/* Fraud Warning Modal */}
      <AnimatePresence>
        {showFraudModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24, zIndex: 100, backdropFilter: 'blur(4px)'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass"
              style={{
                borderRadius: 24, padding: 32,
                maxWidth: 400, width: '100%', textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'inherit', marginBottom: 12 }}>
                Tab Switching Detected
              </h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: 24 }}>
                Please stay on this tab during the quiz! You have switched tabs {fraudWarnings} time(s). 
                <strong> If you switch tabs more than 3 times, your current question will be marked wrong and a "Fraud Detected" badge will permanently appear on your public leaderboard profile.</strong>
              </p>
              <button
                className="btn-primary"
                onClick={() => setShowFraudModal(false)}
                style={{ width: '100%', padding: '14px 0', fontSize: 16 }}
              >
                I Understand
              </button>
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
                className="glass"
                style={{
                  textAlign: 'left',
                  padding: '14px 18px', borderRadius: 12,
                  border: `1px solid ${selected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  background: selected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                  color: 'inherit',
                  fontSize: 15, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${selected ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />}
                </div>
                {option}
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
                  className="glass"
                  style={{
                    textAlign: 'left',
                    padding: '14px 18px', borderRadius: 12,
                    border: `1px solid ${selected ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    background: selected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                    color: 'inherit',
                    fontSize: 15, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 4,
                    border: `2px solid ${selected ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: selected ? '#fff' : 'transparent',
                  }}>
                    {selected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
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
            className="input glass"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              height: 52,
              textAlign: 'center',
              letterSpacing: '0.05em',
            }}
            autoFocus
          />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8 }}>
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
