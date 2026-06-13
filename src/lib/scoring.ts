// ============================================
// BroQuiz — Scoring Engine
// ============================================

import type { Question, QuestionResult } from '@/types';
import { PASS_SCORE, ENROLL_THRESHOLD, NEGATIVE_MARKING_VALUE } from './constants';

/**
 * Grade a single answer
 */
export function gradeAnswer(
  question: Question,
  userAnswer: string | string[]
): { isCorrect: boolean; pointsAwarded: number } {
  const { type, correct_answer } = question;

  switch (type) {
    case 'mcq':
    case 'code_output':
    case 'debugging': {
      // Single correct answer — exact match
      const correct = typeof correct_answer === 'string' ? correct_answer : correct_answer[0];
      const answer = typeof userAnswer === 'string' ? userAnswer : userAnswer[0];
      const isCorrect = normalize(answer) === normalize(correct);
      return { isCorrect, pointsAwarded: isCorrect ? 1 : 0 };
    }

    case 'fill_blank': {
      // Case-insensitive, trimmed comparison
      const correct = typeof correct_answer === 'string' ? correct_answer : correct_answer[0];
      const answer = typeof userAnswer === 'string' ? userAnswer : userAnswer[0];
      const isCorrect = normalize(answer) === normalize(correct);
      return { isCorrect, pointsAwarded: isCorrect ? 1 : 0 };
    }

    case 'multiple_select': {
      // Partial marking: (correct_selected / total_correct)
      const correctAnswers = Array.isArray(correct_answer) ? correct_answer : [correct_answer];
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];

      const normalizedCorrect = correctAnswers.map(normalize);
      const normalizedUser = userAnswers.map(normalize);

      // Count correct selections (no penalty for wrong selections in partial marking)
      const correctSelected = normalizedUser.filter((a) => normalizedCorrect.includes(a)).length;
      const wrongSelected = normalizedUser.filter((a) => !normalizedCorrect.includes(a)).length;
      const totalCorrect = normalizedCorrect.length;

      // If user selected any wrong answers, reduce score
      const points = Math.max(0, (correctSelected - wrongSelected * 0.5) / totalCorrect);
      const isCorrect = correctSelected === totalCorrect && wrongSelected === 0;

      return { isCorrect, pointsAwarded: Math.round(points * 100) / 100 };
    }

    default:
      return { isCorrect: false, pointsAwarded: 0 };
  }
}

/**
 * Calculate quiz results for all answers
 */
export function calculateResults(
  questions: Question[],
  userAnswers: Map<string, string | string[]>,
  level: number,
  durationSeconds: number
): {
  score: number;
  rawScore: number;
  wrongCount: number;
  netScore: number;
  results: QuestionResult[];
  accuracy: number;
  passed: boolean;
} {
  let rawScore = 0;
  let wrongCount = 0;
  const results: QuestionResult[] = [];

  for (const question of questions) {
    const userAnswer = userAnswers.get(question.id) || (question.type === 'multiple_select' ? [] : '');
    const { isCorrect, pointsAwarded } = gradeAnswer(question, userAnswer);

    rawScore += pointsAwarded;
    if (!isCorrect) wrongCount++;

    results.push({
      question_id: question.id,
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

  // Apply negative marking for Level 4 only
  const negativeDeduction = level === 4 ? NEGATIVE_MARKING_VALUE * wrongCount : 0;
  const netScore = Math.max(0, Math.round((rawScore - negativeDeduction) * 100) / 100);
  const score = level === 4 ? netScore : rawScore;
  const accuracy = questions.length > 0 ? Math.round((rawScore / questions.length) * 100) : 0;
  const passed = score >= PASS_SCORE;

  return { score, rawScore, wrongCount, netScore, results, accuracy, passed };
}

/**
 * Determine scholarship eligibility
 */
export function getEligibilityStatus(score: number): 'eligible' | 'retry' | 'enroll' {
  if (score >= PASS_SCORE) return 'eligible';
  if (score < ENROLL_THRESHOLD) return 'enroll';
  return 'retry';
}

/**
 * Get score color class
 */
export function getScoreColor(score: number): string {
  if (score >= PASS_SCORE) return 'score-pass';
  if (score >= ENROLL_THRESHOLD) return 'score-mid';
  return 'score-fail';
}

/**
 * Get score hex color
 */
export function getScoreHexColor(score: number): string {
  if (score >= PASS_SCORE) return '#34C759';
  if (score >= ENROLL_THRESHOLD) return '#FF9F0A';
  return '#FF3B30';
}

// --- Helpers ---

function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}
