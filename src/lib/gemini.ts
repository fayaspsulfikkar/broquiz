// ============================================
// BroQuiz — Gemini AI Client
// Server-side only — never import in client code
// ============================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { FULL_PDF_CONTENT } from './pdf-content';
import { LEVELS, QUESTION_TYPE_LABELS } from './constants';
import type { Question, QuestionType, TopicTag } from '@/types';

const API_KEY = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI && API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

/**
 * Generate quiz questions using Gemini AI
 */
export async function generateQuestions(
  level: number,
  seenQuestionIds: string[],
  count: number = 10
): Promise<Question[]> {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('Gemini API key not configured');
  }

  const levelDef = LEVELS.find((l) => l.id === level);
  if (!levelDef) {
    throw new Error(`Invalid level: ${level}`);
  }

  const distributionStr = levelDef.question_distribution
    .map((d) => `${d.count} ${QUESTION_TYPE_LABELS[d.type]} (type: "${d.type}")`)
    .join(', ');

  const prompt = `You are a technical quiz generator for a programming scholarship platform called BroQuiz.

Generate questions STRICTLY based on the following knowledge source content:

--- KNOWLEDGE SOURCE START ---
${FULL_PDF_CONTENT}
--- KNOWLEDGE SOURCE END ---

TASK: Generate exactly ${count} questions for Level ${level} (${levelDef.name} — ${levelDef.difficulty}).

QUESTION DISTRIBUTION: ${distributionStr}

QUESTION TYPE SPECIFICATIONS:
- "mcq": Multiple choice with exactly 4 options (A, B, C, D). One correct answer.
- "multiple_select": 4-6 options, 2 or more correct answers. User must select all correct ones.
- "fill_blank": A code snippet or sentence with a blank (shown as ___). Single text answer.
- "code_output": A short code block (5-15 lines, C-style). User predicts the output. Provide 4 options.
- "debugging": A code snippet with an intentional bug. User identifies the bug from 4 options.

RULES:
- Questions must test LOGIC and UNDERSTANDING, not syntax memorization
- All code examples must use C-style syntax
- Difficulty: ${levelDef.difficulty} level — ${level === 1 ? 'basic concept understanding' : level === 2 ? 'applying concepts to scenarios' : level === 3 ? 'analyzing code behavior and finding bugs' : 'integrating multiple concepts, tricky edge cases'}
- For code_output and debugging questions, include a "code_snippet" field
- For mcq, multiple_select, code_output, and debugging, include an "options" array
- For fill_blank, correct_answer should be a single string
- For multiple_select, correct_answer should be an array of strings
- NEVER generate questions matching these previously-seen IDs: [${seenQuestionIds.slice(-100).join(', ')}]
- Each question must be unique and test a different aspect

TOPICS TO COVER: ${levelDef.topics.join(', ')}

RESPOND WITH ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the JSON array.

Each question object must have these fields:
{
  "type": string (one of: "mcq", "multiple_select", "fill_blank", "code_output", "debugging"),
  "question": string (the question text),
  "options": string[] | null (4 options for mcq/code_output/debugging, 4-6 for multiple_select, null for fill_blank),
  "correct_answer": string | string[] (string for single answer, string[] for multiple_select),
  "explanation": string (detailed explanation of why the answer is correct),
  "topic_tag": string (one of: "variables", "arithmetic", "control_flow", "loops", "arrays", "atm_project", "algorithms"),
  "code_snippet": string | null (C code for code_output/debugging, null otherwise)
}`;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean response — remove markdown code blocks if present
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleanText);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Transform and validate
    const now = new Date().toISOString();
    const questions: Question[] = parsed.map((q: Record<string, unknown>, i: number) => {
      const hash = generateHash(`${level}_${q.type}_${q.question}_${Date.now()}_${i}`);
      return {
        id: hash,
        hash,
        type: q.type as QuestionType,
        question: q.question as string,
        options: (q.options as string[]) || undefined,
        correct_answer: q.correct_answer as string | string[],
        explanation: q.explanation as string,
        topic_tag: (q.topic_tag as TopicTag) || 'variables',
        difficulty: level,
        level,
        code_snippet: (q.code_snippet as string) || undefined,
        times_shown: 0,
        correct_count: 0,
        created_at: now,
        status: 'approved' as const,
      };
    });

    return questions;
  } catch (error) {
    console.error('Gemini question generation failed:', error);
    throw error;
  }
}

/**
 * Generate improvement suggestions using Gemini AI
 */
export async function generateImprovementSuggestions(
  wrongTopics: string[],
  level: number
): Promise<string> {
  const ai = getGenAI();
  if (!ai) {
    return getDefaultSuggestions(wrongTopics);
  }

  const prompt = `You are a friendly coding tutor for BroQuiz, a programming scholarship platform.

A student just completed Level ${level} and got the following topics wrong: ${wrongTopics.join(', ')}.

Write a SHORT, encouraging improvement suggestion (3-4 sentences max). Include:
1. What they struggled with (be specific to the topics)
2. One concrete tip for each weak topic
3. An encouraging closing line

Keep it concise and friendly. No markdown formatting.`;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return getDefaultSuggestions(wrongTopics);
  }
}

function getDefaultSuggestions(wrongTopics: string[]): string {
  const topicAdvice: Record<string, string> = {
    variables: 'Review how variables store data in memory — think of them as labeled boxes.',
    arithmetic: 'Practice integer division and the modulo operator. Remember: 10/3 = 3 in C!',
    control_flow: 'Focus on if/else logic and switch/case — especially the break keyword.',
    loops: 'Trace through loops step by step. Count iterations carefully.',
    arrays: 'Remember: arrays start at index 0! arr[0] is the first element.',
    atm_project: 'The ATM project combines loops, switch, and variables. Review how they integrate.',
    algorithms: 'Practice summation and linear search patterns. Always initialize sum to 0.',
  };

  const tips = wrongTopics.map((t) => topicAdvice[t] || `Review the concept of ${t}.`);
  return `You struggled with ${wrongTopics.join(', ')}. Here's what to focus on:\n${tips.join('\n')}\n\nKeep practicing — you're getting closer!`;
}

// Simple hash function for question IDs
function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `q_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}
