// ============================================
// BroQuiz — Answer Submission & Grading API
// POST /api/questions/submit
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
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
    const { userId, level, answers, durationSeconds, userProfile } = body;

    if (!userId || !level || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch questions with correct answers
    const questionMap = new Map<string, Question>();

    for (const { questionId } of answers) {
      try {
        const qDoc = await getDoc(doc(db, 'questions', questionId));
        if (qDoc.exists()) {
          questionMap.set(questionId, { id: qDoc.id, ...qDoc.data() } as Question);
          continue;
        }
      } catch (e) {
        // Expected to fail if unauthenticated on server, ignore
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
    }

    // Calculate net score
    const negativeDeduction = level === 4 ? NEGATIVE_MARKING_VALUE * wrongCount : 0;
    const netScore = Math.max(0, Math.round((rawScore - negativeDeduction) * 100) / 100);
    const score = level === 4 ? netScore : rawScore;
    const totalQuestions = answers.length;
    const accuracy = totalQuestions > 0 ? Math.round((rawScore / totalQuestions) * 100) : 0;
    const passed = score >= PASS_SCORE;

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

    // Calculate Streak
    let newStreak = userProfile?.streak_count || 0;
    let newLongestStreak = userProfile?.longest_streak || 0;
    let streakFreezeUsed = userProfile?.streak_freeze_used_this_week || 0;
    if (userProfile) {
      const streakCalc = calculateStreak(
        userProfile.last_activity_date,
        userProfile.streak_count,
        userProfile.longest_streak,
        userProfile.streak_freeze_used_this_week
      );
      newStreak = streakCalc.newStreak;
      newLongestStreak = streakCalc.newLongestStreak;
      streakFreezeUsed = streakCalc.streakFreezeUsed;
    }

    // Generate improvement suggestions
    let improvementSuggestions = '';
    if (wrongTopics.length > 0) {
      try {
        improvementSuggestions = await generateImprovementSuggestions([...new Set(wrongTopics)], level);
      } catch {
        improvementSuggestions = `Focus on improving your understanding of: ${[...new Set(wrongTopics)].join(', ')}. Keep practicing!`;
      }
    }

    // Build response
    const response = {
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
      // Pass back data needed by client to write to Firestore
      clientUpdateData: {
        score,
        passed,
        questionIds: answers.map((a: { questionId: string }) => a.questionId),
        newBadges,
        totalXP,
        rankTier,
        rawScore,
        wrongCount,
        netScore,
        improvementSuggestions,
        newStreak,
        newLongestStreak,
        streakFreezeUsed,
      }
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
