// ============================================
// BroQuiz — Question Generation API
// POST /api/questions/generate
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateQuestions } from '@/lib/gemini';
import { ALL_SEED_QUESTIONS } from '@/lib/seed-questions';
import { LEVELS, QUESTIONS_PER_LEVEL } from '@/lib/constants';
import type { Question, ClientQuestion } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, userId } = body;

    if (!level || !userId) {
      return NextResponse.json({ error: 'Missing level or userId' }, { status: 400 });
    }

    const levelDef = LEVELS.find((l) => l.id === level);
    if (!levelDef) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    // Check level gate — user must have passed previous levels
    if (level > 1) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const prevLevelKey = `level_${level - 1}`;
        const prevLevel = userData.levels?.[prevLevelKey];
        if (!prevLevel?.passed) {
          return NextResponse.json(
            { error: `Must pass Level ${level - 1} first` },
            { status: 403 }
          );
        }
      }
    }

    // Get user's seen question IDs
    let seenIds: string[] = [];
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        seenIds = userDoc.data().seen_question_ids || [];
      }
    } catch (e) {
      console.error('Error fetching seen IDs:', e);
    }

    let questions: Question[] = [];

    // Try to get cached questions from Firestore first
    try {
      const qQuery = query(
        collection(db, 'questions'),
        where('level', '==', level),
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

      if (cachedQuestions.length >= QUESTIONS_PER_LEVEL) {
        // Shuffle and pick 10, respecting distribution
        questions = selectByDistribution(cachedQuestions, levelDef.question_distribution);
      }
    } catch (e) {
      console.error('Error fetching cached questions:', e);
    }

    // If not enough cached, try AI generation
    if (questions.length < QUESTIONS_PER_LEVEL) {
      try {
        const aiQuestions = await generateQuestions(level, seenIds, QUESTIONS_PER_LEVEL);
        questions = aiQuestions;

        // Cache AI-generated questions in Firestore
        try {
          const batch = writeBatch(db);
          for (const q of aiQuestions) {
            const docRef = doc(db, 'questions', q.id);
            batch.set(docRef, { ...q });
          }
          await batch.commit();
        } catch (e) {
          console.error('Error caching questions:', e);
        }
      } catch (e) {
        console.error('AI generation failed, using seed questions:', e);
      }
    }

    // Fallback to seed questions
    if (questions.length < QUESTIONS_PER_LEVEL) {
      const seeds = ALL_SEED_QUESTIONS[level] || [];
      const unseenSeeds = seeds.filter(
        (q) => !seenIds.includes(q.id) && !seenIds.includes(q.hash)
      );
      // If all seeds seen, just use them anyway (better than nothing)
      questions = unseenSeeds.length >= QUESTIONS_PER_LEVEL ? unseenSeeds : seeds;
    }

    // Ensure exactly 10 questions
    questions = questions.slice(0, QUESTIONS_PER_LEVEL);

    // Strip answers before sending to client
    const clientQuestions: ClientQuestion[] = questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      code_snippet: q.code_snippet,
      topic_tag: q.topic_tag,
    }));

    return NextResponse.json({ questions: clientQuestions });
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}

// Select questions respecting the type distribution
function selectByDistribution(
  pool: Question[],
  distribution: { type: string; count: number }[]
): Question[] {
  const selected: Question[] = [];

  for (const { type, count } of distribution) {
    const ofType = pool.filter((q) => q.type === type);
    const shuffled = shuffleArray(ofType);
    selected.push(...shuffled.slice(0, count));
  }

  return selected;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
