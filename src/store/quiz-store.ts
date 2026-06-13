// ============================================
// BroQuiz — Quiz Store (Zustand)
// ============================================

import { create } from 'zustand';
import type { ClientQuestion, QuizAnswer, QuizResults } from '@/types';

interface QuizState {
  // Quiz session
  questions: ClientQuestion[];
  currentIndex: number;
  answers: Map<string, QuizAnswer>;
  flaggedQuestions: Set<string>;
  timeStarted: number | null;
  isLoading: boolean;
  isSubmitting: boolean;
  results: QuizResults | null;
  level: number;
  error: string | null;

  // Actions
  startQuiz: (level: number, questions: ClientQuestion[]) => void;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  toggleFlag: (questionId: string) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  setResults: (results: QuizResults) => void;
  setSubmitting: (submitting: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Computed
  getCurrentQuestion: () => ClientQuestion | null;
  getProgress: () => number;
  isAllAnswered: () => boolean;
  getAnswerForQuestion: (questionId: string) => QuizAnswer | undefined;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  questions: [],
  currentIndex: 0,
  answers: new Map(),
  flaggedQuestions: new Set(),
  timeStarted: null,
  isLoading: false,
  isSubmitting: false,
  results: null,
  level: 1,
  error: null,

  startQuiz: (level, questions) =>
    set({
      level,
      questions,
      currentIndex: 0,
      answers: new Map(),
      flaggedQuestions: new Set(),
      timeStarted: Date.now(),
      isLoading: false,
      isSubmitting: false,
      results: null,
      error: null,
    }),

  setAnswer: (questionId, answer) =>
    set((state) => {
      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, {
        questionId,
        answer,
        flagged: state.flaggedQuestions.has(questionId),
      });
      return { answers: newAnswers };
    }),

  toggleFlag: (questionId) =>
    set((state) => {
      const newFlagged = new Set(state.flaggedQuestions);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return { flaggedQuestions: newFlagged };
    }),

  nextQuestion: () =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
    })),

  prevQuestion: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
    })),

  goToQuestion: (index) =>
    set({ currentIndex: index }),

  setResults: (results) =>
    set({ results }),

  setSubmitting: (submitting) =>
    set({ isSubmitting: submitting }),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  setError: (error) =>
    set({ error }),

  reset: () =>
    set({
      questions: [],
      currentIndex: 0,
      answers: new Map(),
      flaggedQuestions: new Set(),
      timeStarted: null,
      isLoading: false,
      isSubmitting: false,
      results: null,
      level: 1,
      error: null,
    }),

  getCurrentQuestion: () => {
    const { questions, currentIndex } = get();
    return questions[currentIndex] || null;
  },

  getProgress: () => {
    const { answers, questions } = get();
    return questions.length > 0 ? (answers.size / questions.length) * 100 : 0;
  },

  isAllAnswered: () => {
    const { answers, questions } = get();
    return answers.size === questions.length;
  },

  getAnswerForQuestion: (questionId) => {
    return get().answers.get(questionId);
  },
}));
