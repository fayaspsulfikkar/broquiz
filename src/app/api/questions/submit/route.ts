// ============================================
// BroQuiz — Answer Submission & Grading API
// POST /api/questions/submit
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { gradeAnswer } from '@/lib/scoring';
import { calculateStreak } from '@/lib/gamification';
import type { Question, QuestionResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, answers, durationSeconds, userProfile } = body;

    if (!userId || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch questions with correct answers
    const questionMap = new Map<string, Question>();

    for (const { questionId } of answers) {
      try {
        const qDoc = await getDoc(doc(db, 'questions', questionId));
        if (qDoc.exists()) {
          questionMap.set(questionId, { id: qDoc.id, ...qDoc.data() } as Question);
        }
      } catch (e) {
        // Ignore
      }
    }

    // Grade each answer
    let rawScore = 0;
    let wrongCount = 0;
    const results: QuestionResult[] = [];

    for (const { questionId, userAnswer } of answers) {
      const question = questionMap.get(questionId);
      if (!question) {
        wrongCount++;
        continue;
      }

      const { isCorrect, pointsAwarded } = gradeAnswer(question, userAnswer);
      rawScore += pointsAwarded;
      if (!isCorrect) {
        wrongCount++;
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

    const totalQuestions = answers.length;
    const accuracy = totalQuestions > 0 ? Math.round((rawScore / totalQuestions) * 100) : 0;

    // Calculate Streak
    let newStreak = userProfile?.streak_count || 0;
    let newLongestStreak = userProfile?.longest_streak || 0;
    let streakFreezeUsed = userProfile?.streak_freeze_used_this_week || false;
    
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

    // Build response
    const response = {
      score: rawScore,
      wrong_count: wrongCount,
      total_questions: totalQuestions,
      duration_seconds: durationSeconds || 0,
      accuracy_percentage: accuracy,
      results,
      // Pass back data needed by client to write to Firestore
      clientUpdateData: {
        score: rawScore,
        questionIds: answers.map((a: { questionId: string }) => a.questionId),
        rawScore,
        wrongCount,
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
