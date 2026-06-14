'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '@/store/quiz-store';
import type { Attempt, Question } from '@/types';

const MAX_QUESTIONS = 260;

interface LeaderboardUser {
  uid: string;
  name: string;
  total_correct_answers: number;
  total_rounds_played: number;
  total_time_seconds: number;
  streak_count: number;
  anonymous_leaderboard: boolean;
  fraud_detected?: boolean;
}

export default function LandingPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);
  const [attemptQuestions, setAttemptQuestions] = useState<Record<string, Question>>({});
  const [loadingQuestions, setLoadingQuestions] = useState<Record<string, boolean>>({});

  const { setRetryMode } = useQuizStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && profile) {
      fetchTopLeaderboard();
      fetchAttempts();
    }
  }, [user, profile]);

  const fetchTopLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const q = query(collection(db, 'users'), orderBy('total_correct_answers', 'desc'), limit(15));
      const snapshot = await getDocs(q);
      const data: LeaderboardUser[] = [];
      snapshot.forEach((doc) => {
        const d = doc.data();
        if (d.total_rounds_played > 0) {
          data.push({ uid: doc.id, ...d } as LeaderboardUser);
        }
      });
      // Sort further by time (tie breaker)
      data.sort((a, b) => {
        if (b.total_correct_answers !== a.total_correct_answers) {
          return b.total_correct_answers - a.total_correct_answers;
        }
        return a.total_time_seconds - b.total_time_seconds;
      });
      setTopUsers(data.slice(0, 5));
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchAttempts = async () => {
    if (!user) return;
    setLoadingAttempts(true);
    try {
      const q = query(
        collection(db, 'attempts'),
        where('user_id', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const data: Attempt[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Attempt);
      });
      setAttempts(data);
    } catch (e) {
      console.error('Error fetching attempts:', e);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const handleExpandAttempt = async (attempt: Attempt) => {
    if (expandedAttemptId === attempt.id) {
      setExpandedAttemptId(null);
      return;
    }
    setExpandedAttemptId(attempt.id);

    // Fetch questions if not already loaded
    if (!loadingQuestions[attempt.id]) {
      setLoadingQuestions(prev => ({ ...prev, [attempt.id]: true }));
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const qData: Record<string, Question> = {};
        for (const answer of attempt.answers) {
          if (!attemptQuestions[answer.question_id]) {
            const qDoc = await getDoc(doc(db, 'questions', answer.question_id));
            if (qDoc.exists()) {
              qData[answer.question_id] = { id: qDoc.id, ...qDoc.data() } as Question;
            }
          }
        }
        setAttemptQuestions(prev => ({ ...prev, ...qData }));
      } catch (e) {
        console.error('Error fetching attempt questions:', e);
      } finally {
        setLoadingQuestions(prev => ({ ...prev, [attempt.id]: false }));
      }
    }
  };

  const handleRetryRound = (roundIndex: number) => {
    if (user && profile) {
      setRetryMode(true, roundIndex);
      router.push('/quiz');
    }
  };

  const handleStart = () => {
    if (user && profile) {
      if (!profile.name || profile.name.trim() === '') {
        router.push('/login');
      } else {
        setRetryMode(false, undefined);
        router.push('/quiz');
      }
    } else {
      router.push('/login');
    }
  };

  const getAccuracy = (u: LeaderboardUser) => {
    const totalQuestions = u.total_rounds_played * 10;
    if (totalQuestions === 0) return 0;
    return Math.round((u.total_correct_answers / totalQuestions) * 100);
  };

  if (!mounted || authLoading) return null;

  // Unauthenticated Intro View
  if (!user || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass"
          style={{
            borderRadius: 20, padding: 'clamp(32px, 5vw, 64px)',
            maxWidth: 600, width: '100%', margin: 24, textAlign: 'center',
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'inherit', fontSize: 32, fontWeight: 700, marginBottom: 24,
            border: '1px solid rgba(255,255,255,0.4)',
          }}>B</div>
          
          <h1 style={{
            fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 16, color: 'inherit'
          }}>
            Welcome to BroQuiz
          </h1>
          
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 32,
          }}>
            Test your programming fundamentals. <strong>Taking repeated quiz rounds will improve your chances of getting selected.</strong> The more questions you master, the higher you climb on the leaderboard.
          </p>

          <button 
            className="btn-primary" 
            onClick={handleStart}
            style={{ height: 56, padding: '0 48px', fontSize: 18, borderRadius: 14, width: '100%' }}
          >
            Login to Start →
          </button>
        </motion.div>
      </div>
    );
  }

  // Authenticated Dashboard View
  const progressPercent = Math.min(100, Math.round(((profile.total_correct_answers || 0) / MAX_QUESTIONS) * 100));

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <nav className="glass" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', borderRadius: 0 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'inherit' }}>BroQuiz Dashboard</h1>
        <div style={{ display: 'flex', gap: 16 }}>
          {profile.is_admin && (
            <button 
              onClick={() => router.push('/admin')}
              style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Admin Panel
            </button>
          )}
          <button onClick={() => router.push('/profile')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontWeight: 500, cursor: 'pointer' }}>
            Profile
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome Section */}
        <motion.div className="glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32, padding: 24, borderRadius: 20 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'inherit', marginBottom: 8 }}>
            Welcome back, {profile.name?.split(' ')[0] || 'Bro'}! 👋
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>Ready to master some code today?</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
          {/* Progress Card */}
          <motion.div className="glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{
            borderRadius: 20, padding: 24,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Progress</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: 'inherit', lineHeight: 1 }}>{profile.total_rounds_played || 0}</span>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', paddingBottom: 4 }}>/ 26 Rounds</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', background: '#fff', width: `${Math.min(100, ((profile.total_rounds_played || 0) / 26) * 100)}%`, borderRadius: 4, transition: 'width 1s ease-out', boxShadow: '0 0 10px rgba(255,255,255,0.8)' }} />
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>{profile.total_correct_answers || 0} Questions Mastered</div>
          </motion.div>

          {/* Streak Card */}
          <motion.div className="glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{
            borderRadius: 20, padding: 24,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔥</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'inherit' }}>{profile.streak_count || 0} Day Streak</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Keep coming back to climb the ranks!</div>
          </motion.div>
        </div>

        {/* Completion Badge */}
        {(profile.total_rounds_played || 0) >= 26 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{
            background: 'linear-gradient(135deg, #34C759 0%, #28A745 100%)', borderRadius: 20, padding: 24, marginBottom: 32,
            color: '#fff', textAlign: 'center', boxShadow: '0 8px 24px rgba(52, 199, 89, 0.25)'
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Curriculum Completed!</h3>
            <p style={{ fontSize: 15, opacity: 0.9, lineHeight: 1.5 }}>
              You have successfully learned the fundamentals of programming. There is a <strong>very high chance of you getting selected</strong>. Keep practicing to maintain your streak!
            </p>
          </motion.div>
        )}

        {/* Start Quiz Action */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: 40 }}>
          <button 
            className="btn-primary" 
            onClick={handleStart}
            style={{ width: '100%', height: 64, fontSize: 18, borderRadius: 16, boxShadow: '0 8px 20px rgba(0, 113, 227, 0.24)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ fontWeight: 600 }}>
              {(profile.total_rounds_played || 0) >= 26 ? 'Play Again from Round 1 →' : `Start Round ${(profile.total_rounds_played || 0) + 1} →`}
            </div>
            {(profile.total_rounds_played || 0) >= 26 && (
              <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.9, marginTop: 4 }}>Keep earning points</div>
            )}
          </button>
        </motion.div>

        {/* Top 5 Leaderboard Preview */}
        <motion.div className="glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{
          borderRadius: 20, padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'inherit' }}>Top Players</h3>
            <button 
              onClick={() => router.push('/leaderboard')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              View Full Leaderboard →
            </button>
          </div>

          {loadingLeaderboard ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#6E6E73' }}>Loading top players...</div>
          ) : topUsers.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#6E6E73' }}>No players yet!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topUsers.map((u, idx) => (
                <div key={u.uid} style={{ 
                  display: 'flex', alignItems: 'center', padding: '12px 16px', 
                  background: u.uid === user.uid ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', 
                  borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ width: 32, fontSize: 16, fontWeight: 700, color: idx < 3 ? '#4ADE80' : 'rgba(255,255,255,0.6)' }}>#{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'inherit', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {u.anonymous_leaderboard ? 'Anonymous Learner' : u.name}
                      {u.uid === user.uid && <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.2)', color: 'inherit', padding: '2px 6px', borderRadius: 4 }}>YOU</span>}
                      {u.fraud_detected && <span style={{ fontSize: 10, background: '#FF3B30', color: '#fff', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.02em', textTransform: 'uppercase' }}>FRAUD DETECTED</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'inherit' }}>{u.total_correct_answers}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Mastered</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#4ADE80' }}>{getAccuracy(u)}%</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Accuracy</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Round History */}
        <motion.div className="glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{
          borderRadius: 20, padding: 24, marginTop: 32
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'inherit', marginBottom: 20 }}>Round History</h3>

          {loadingAttempts ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#6E6E73' }}>Loading history...</div>
          ) : attempts.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#6E6E73' }}>No rounds played yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {attempts.map((attempt) => {
                const isExpanded = expandedAttemptId === attempt.id;
                const roundNum = attempt.round_index !== undefined ? attempt.round_index + 1 : 'Unknown';
                const date = new Date(attempt.timestamp).toLocaleDateString();
                
                return (
                  <div key={attempt.id} style={{ 
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16, overflow: 'hidden'
                  }}>
                    {/* Header Row */}
                    <div 
                      onClick={() => handleExpandAttempt(attempt)}
                      style={{ 
                        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: isExpanded ? 'rgba(255,255,255,0.15)' : 'transparent', cursor: 'pointer', transition: 'background 0.2s'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: 'inherit' }}>Round {roundNum}</span>
                          {attempt.is_retry && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: 6 }}>RETRY</span>}
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{date} • {attempt.duration_seconds}s</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#4ADE80' }}>{attempt.score} / {attempt.answers.length}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Score</div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRetryRound(attempt.round_index || 0); }}
                          style={{ 
                            background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, 
                            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' 
                          }}
                        >
                          Retry Round
                        </button>
                      </div>
                    </div>

                    {/* Expanded Questions */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ borderTop: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)' }}
                        >
                          <div style={{ padding: 20 }}>
                            {loadingQuestions[attempt.id] ? (
                              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Loading questions...</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {attempt.answers.map((ans, i) => {
                                  const q = attemptQuestions[ans.question_id];
                                  if (!q) return <div key={i}>Loading...</div>;
                                  return (
                                    <div key={i} style={{ paddingBottom: 24, borderBottom: i < attempt.answers.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                                      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                        <div style={{ 
                                          width: 24, height: 24, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          background: ans.is_correct ? 'rgba(74,222,128,0.2)' : 'rgba(255,59,48,0.2)',
                                          color: ans.is_correct ? '#4ADE80' : '#FF3B30',
                                          fontSize: 14, fontWeight: 700, flexShrink: 0
                                        }}>
                                          {ans.is_correct ? '✓' : '×'}
                                        </div>
                                        <div style={{ fontSize: 15, color: 'inherit', fontWeight: 500, lineHeight: 1.5 }}>
                                          {q.question}
                                        </div>
                                      </div>
                                      
                                      <div style={{ paddingLeft: 36, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                                          <strong>Your Answer:</strong> <span style={{ color: ans.is_correct ? '#4ADE80' : '#FF3B30' }}>{Array.isArray(ans.user_answer) ? ans.user_answer.join(', ') : ans.user_answer}</span>
                                        </div>
                                        {!ans.is_correct && (
                                          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                                            <strong>Correct Answer:</strong> {Array.isArray(q.correct_answer) ? q.correct_answer.join(', ') : q.correct_answer}
                                          </div>
                                        )}
                                        {q.explanation && (
                                          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, padding: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                                            💡 {q.explanation}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
