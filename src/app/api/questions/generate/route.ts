// ============================================
// BroQuiz — Question Generation API
// POST /api/questions/generate
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QUESTIONS_PER_LEVEL } from '@/lib/constants';
import type { Question, ClientQuestion } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, profile } = body;

    if (!userId || !profile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's seen question IDs from profile
    const seenIds: string[] = profile.seen_question_ids || [];

    let questions: Question[] = [];

    // Try to get cached questions from Firestore
    try {
      const qQuery = query(
        collection(db, 'questions'),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(qQuery);
      const cachedQuestions: Question[] = [];
      snapshot.forEach((doc) => {
        const q = { id: doc.id, ...doc.data() } as Question;
        if (!seenIds.includes(q.id) && !seenIds.includes(q.hash)) {
          cachedQuestions.push(q);
        }
      });

      // Shuffle and pick 10 unused questions
      const selected = shuffleArray(cachedQuestions).slice(0, QUESTIONS_PER_LEVEL);
      
      // Sort by difficulty (easy to hard)
      questions = selected.sort((a, b) => (a.difficulty || 1) - (b.difficulty || 1));
    } catch (e) {
      console.error('Error fetching cached questions:', e);
    }

    // If still not enough (e.g. database empty), return whatever we have
    // The user has probably seen all questions if it falls short.
    // In endless mode, maybe we should reset? For now, just return what's left.

    // Strip answers before sending to client
    const clientQuestions: ClientQuestion[] = questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      code_snippet: q.code_snippet,
      topic_tag: q.topic_tag,
    }));

    // Pass the hardcoded total for progress tracking
    return NextResponse.json({ 
      questions: clientQuestions,
      totalAvailable: 260 
    });
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
