// ============================================
// BroQuiz — Answer Submission & Grading API
// POST /api/questions/submit
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, addDoc, collection, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { gradeAnswer, getEligibilityStatus } from '@/lib/scoring';
import { evaluateNewBadges, calculateStreak, getXPForLevel, calculateRankTier } from '@/lib/gamification';
import { generateImprovementSuggestions } from '@/lib/gemini';
import { ALL_SEED_QUESTIONS } from '@/lib/seed-questions';
import { PASS_SCORE, NEGATIVE_MARKING_VALUE } from '@/lib/constants';
import type { Question, QuestionResult, QuizResults, UserProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, level, answers, durationSeconds } = body;

    if (!userId || !level || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch questions with correct answers (server-side only)
    const questionMap = new Map<string, Question>();

    for (const { questionId } of answers) {
      // Try Firestore first
      try {
        const qDoc = await getDoc(doc(db, 'questions', questionId));
        if (qDoc.exists()) {
          questionMap.set(questionId, { id: qDoc.id, ...qDoc.data() } as Question);
          continue;
        }
      } catch (e) {
        console.error('Error fetching question:', e);
      }

      // Fall back to seed questions
      const seeds = ALL_SEED_QUESTIONS[level] || [];
      const seed = seeds.find((q) => q.id === questionId);
      if (seed) {
        questionMap.set(questionId, seed);
      }
    }

    // Grade each answer
    let rawScore = 0;
    let wrongCount = 0;
    const results: QuestionResult[] = [];
    const wrongTopics: string[] = [];

    for (const { questionId, userAnswer } of answers) {
      const question = questionMap.get(questionId);
      if (!question) {
        results.push({
          question_id: questionId,
          question_text: 'Question not found',
          question_type: 'mcq',
          user_answer: userAnswer,
          correct_answer: '',
          is_correct: false,
          points_awarded: 0,
          explanation: 'Question data unavailable',
          topic_tag: 'variables',
        });
        wrongCount++;
        continue;
      }

      const { isCorrect, pointsAwarded } = gradeAnswer(question, userAnswer);
      rawScore += pointsAwarded;
      if (!isCorrect) {
        wrongCount++;
        wrongTopics.push(question.topic_tag);
      }

      results.push({
        question_id: questionId,
        question_text: question.question,
        question_type: question.type,
        user_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
        explanation: question.explanation,
        topic_tag: question.topic_tag,
        code_snippet: question.code_snippet,
        options: question.options,
      });

      // Update question stats
      try {
        const qRef = doc(db, 'questions', questionId);
        const qDoc = await getDoc(qRef);
        if (qDoc.exists()) {
          await updateDoc(qRef, {
            times_shown: (qDoc.data().times_shown || 0) + 1,
            correct_count: (qDoc.data().correct_count || 0) + (isCorrect ? 1 : 0),
          });
        }
      } catch (e) {
        // Non-critical error
        console.error('Error updating question stats:', e);
      }
    }

    // Calculate net score
    const negativeDeduction = level === 4 ? NEGATIVE_MARKING_VALUE * wrongCount : 0;
    const netScore = Math.max(0, Math.round((rawScore - negativeDeduction) * 100) / 100);
    const score = level === 4 ? netScore : rawScore;
    const totalQuestions = answers.length;
    const accuracy = totalQuestions > 0 ? Math.round((rawScore / totalQuestions) * 100) : 0;
    const passed = score >= PASS_SCORE;

    // Get user profile for badge evaluation
    let userProfile: UserProfile | null = null;
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        userProfile = { uid: userId, ...userDoc.data() } as UserProfile;
      }
    } catch (e) {
      console.error('Error fetching user:', e);
    }

    // Evaluate badges
    const topicResults = results.map((r) => ({
      topic_tag: r.topic_tag,
      is_correct: r.is_correct,
    }));
    const newBadges = userProfile
      ? evaluateNewBadges(userProfile, level, score, rawScore, durationSeconds || 0, topicResults)
      : [];

    // Calculate XP
    const newXP = passed ? getXPForLevel(level) : 0;
    const totalXP = (userProfile?.total_xp || 0) + newXP;
    const rankTier = calculateRankTier(totalXP);

    // Generate improvement suggestions
    let improvementSuggestions = '';
    if (wrongTopics.length > 0) {
      try {
        improvementSuggestions = await generateImprovementSuggestions([...new Set(wrongTopics)], level);
      } catch {
        improvementSuggestions = `Focus on improving your understanding of: ${[...new Set(wrongTopics)].join(', ')}. Keep practicing!`;
      }
    }

    // Update user document
    if (userProfile) {
      try {
        const userRef = doc(db, 'users', userId);
        const levelKey = `levels.level_${level}`;
        const questionIds = answers.map((a: { questionId: string }) => a.questionId);

        // Streak calculation
        const { newStreak, newLongestStreak, streakFreezeUsed } = calculateStreak(
          userProfile.last_activity_date,
          userProfile.streak_count,
          userProfile.longest_streak,
          userProfile.streak_freeze_used_this_week
        );

        const levelUpdate: Record<string, unknown> = {
          [`${levelKey}.attempts`]: (userProfile.levels[`level_${level}` as keyof typeof userProfile.levels]?.attempts || 0) + 1,
          [`${levelKey}.all_scores`]: arrayUnion(score),
          [`${levelKey}.last_attempt_date`]: new Date().toISOString(),
        };

        // Update best score and passed status if this is the best
        const currentBest = userProfile.levels[`level_${level}` as keyof typeof userProfile.levels]?.best_score || 0;
        if (score > currentBest) {
          levelUpdate[`${levelKey}.best_score`] = score;
        }
        if (passed) {
          levelUpdate[`${levelKey}.passed`] = true;
        }

        // Check scholarship eligibility
        const allPassed =
          (level === 1 ? passed : userProfile.levels.level_1.passed) &&
          (level === 2 ? passed : userProfile.levels.level_2.passed) &&
          (level === 3 ? passed : userProfile.levels.level_3.passed) &&
          (level === 4 ? passed : userProfile.levels.level_4.passed);

        await updateDoc(userRef, {
          ...levelUpdate,
          seen_question_ids: arrayUnion(...questionIds),
          total_xp: totalXP,
          rank_tier: rankTier,
          badges: arrayUnion(...newBadges),
          last_active: new Date().toISOString(),
          last_activity_date: new Date().toISOString().split('T')[0],
          streak_count: newStreak,
          longest_streak: newLongestStreak,
          streak_freeze_used_this_week: streakFreezeUsed,
          scholarship_eligible: allPassed,
        });
      } catch (e) {
        console.error('Error updating user:', e);
      }
    }

    // Save attempt
    try {
      await addDoc(collection(db, 'attempts'), {
        user_id: userId,
        level,
        timestamp: new Date().toISOString(),
        duration_seconds: durationSeconds || 0,
        score,
        raw_score: rawScore,
        wrong_count: wrongCount,
        net_score: netScore,
        answers: results.map((r) => ({
          question_id: r.question_id,
          user_answer: r.user_answer,
          is_correct: r.is_correct,
          points_awarded: r.points_awarded,
        })),
        improvement_suggestions: improvementSuggestions,
      });
    } catch (e) {
      console.error('Error saving attempt:', e);
    }

    // Build response
    const response: QuizResults = {
      score,
      raw_score: rawScore,
      wrong_count: wrongCount,
      net_score: netScore,
      total_questions: totalQuestions,
      duration_seconds: durationSeconds || 0,
      accuracy_percentage: accuracy,
      passed,
      scholarship_eligible: getEligibilityStatus(score) === 'eligible',
      level,
      results,
      improvement_suggestions: improvementSuggestions,
      new_badges: newBadges,
      new_xp: newXP,
      total_xp: totalXP,
      rank_tier: rankTier,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}
