// ============================================
// BroQuiz — Application Constants
// ============================================

import type { LevelDefinition, BadgeDefinition, RankTier, LeaderboardTier } from '@/types';

// --- Level Definitions ---

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    name: 'Foundation',
    difficulty: 'Beginner',
    description: 'Test your understanding of basic programming concepts — variables, arithmetic, and simple logic.',
    question_distribution: [
      { type: 'mcq', count: 8 },
      { type: 'fill_blank', count: 2 },
    ],
    negative_marking: false,
    negative_marking_value: 0,
    topics: ['Variables & Memory', 'Arithmetic Operations', 'Input/Output', 'IPO Model', 'Basic Data Types'],
    xp_reward: 100,
  },
  {
    id: 2,
    name: 'Logic Builder',
    difficulty: 'Intermediate',
    description: 'Prove your grasp of control flow, conditional logic, and introductory array concepts.',
    question_distribution: [
      { type: 'mcq', count: 5 },
      { type: 'multiple_select', count: 3 },
      { type: 'fill_blank', count: 2 },
    ],
    negative_marking: false,
    negative_marking_value: 0,
    topics: ['If/Else Statements', 'Switch/Case', 'Loops (for, while, do-while)', 'Arrays Basics', 'DRY Principle'],
    xp_reward: 200,
  },
  {
    id: 3,
    name: 'Code Thinker',
    difficulty: 'Advanced',
    description: 'Analyze code behavior, predict outputs, and identify bugs in real programming scenarios.',
    question_distribution: [
      { type: 'mcq', count: 3 },
      { type: 'multiple_select', count: 2 },
      { type: 'code_output', count: 3 },
      { type: 'debugging', count: 2 },
    ],
    negative_marking: false,
    negative_marking_value: 0,
    topics: ['Nested Loops', 'Break & Continue', 'Array Traversal', 'Linear Search', 'Summation Algorithms'],
    xp_reward: 300,
  },
  {
    id: 4,
    name: 'Master Challenge',
    difficulty: 'Expert',
    description: 'The ultimate test — all question types combined with negative marking. Only the best pass.',
    question_distribution: [
      { type: 'mcq', count: 2 },
      { type: 'multiple_select', count: 2 },
      { type: 'fill_blank', count: 2 },
      { type: 'code_output', count: 2 },
      { type: 'debugging', count: 2 },
    ],
    negative_marking: true,
    negative_marking_value: 0.25,
    topics: ['ATM Machine Project', 'Variable Swapping', 'Pattern Generation', 'All Previous Topics', 'Integrated Problem Solving'],
    xp_reward: 500,
  },
];

// --- Badge Definitions ---

export const BADGES: BadgeDefinition[] = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete Level 1 (any score)',
    icon: '🎯',
    color: '#0071E3',
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Score 10/10 on any level',
    icon: '💎',
    color: '#AF52DE',
  },
  {
    id: 'speed_coder',
    name: 'Speed Coder',
    description: 'Complete a level under 10 minutes',
    icon: '⚡',
    color: '#FF9F0A',
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Pass a level after 3+ failed attempts',
    icon: '🔥',
    color: '#FF3B30',
  },
  {
    id: 'scholarship_ready',
    name: 'Scholarship Ready',
    description: 'Pass all 4 levels with ≥7/10',
    icon: '🏆',
    color: '#34C759',
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    color: '#FF6B35',
  },
  {
    id: 'streak_3',
    name: 'Three Day Fire',
    description: 'Maintain a 3-day streak',
    icon: '✨',
    color: '#FFD60A',
  },
  {
    id: 'streak_30',
    name: 'Monthly Legend',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    color: '#FFD700',
  },
  {
    id: 'array_expert',
    name: 'Array Expert',
    description: 'Correctly answer all array-related questions in a session',
    icon: '📊',
    color: '#5856D6',
  },
  {
    id: 'logic_wizard',
    name: 'Logic Wizard',
    description: 'Pass Level 3 with ≥9/10',
    icon: '🧙',
    color: '#007AFF',
  },
];

// --- XP & Rank System ---

export const XP_PER_LEVEL: Record<number, number> = {
  1: 100,
  2: 200,
  3: 300,
  4: 500,
};

export const RANK_THRESHOLDS: { tier: RankTier; title: string; minXP: number }[] = [
  { tier: 'newbie', title: 'Newbie', minXP: 0 },
  { tier: 'logic_learner', title: 'Logic Learner', minXP: 100 },
  { tier: 'code_thinker', title: 'Code Thinker', minXP: 300 },
  { tier: 'algorithm_ace', title: 'Algorithm Ace', minXP: 600 },
  { tier: 'scholarship_scholar', title: 'Scholarship Scholar', minXP: 1100 },
];

export const LEADERBOARD_TIERS: { tier: LeaderboardTier; title: string; minXP: number; color: string }[] = [
  { tier: 'bronze', title: 'Bronze', minXP: 0, color: '#CD7F32' },
  { tier: 'silver', title: 'Silver', minXP: 300, color: '#C0C0C0' },
  { tier: 'gold', title: 'Gold', minXP: 700, color: '#FFD700' },
  { tier: 'platinum', title: 'Platinum', minXP: 1100, color: '#E5E4E2' },
];

// --- Scoring ---

export const PASS_SCORE = 7;
export const ENROLL_THRESHOLD = 3;
export const QUESTIONS_PER_LEVEL = 10;
export const NEGATIVE_MARKING_VALUE = 0.25;

// --- Topic Tags ---

export const TOPIC_TAGS = [
  'variables',
  'arithmetic',
  'control_flow',
  'loops',
  'arrays',
  'atm_project',
  'algorithms',
] as const;

// --- Question Type Labels ---

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: 'Multiple Choice',
  multiple_select: 'Multiple Select',
  fill_blank: 'Fill in the Blank',
  code_output: 'Code Output',
  debugging: 'Debugging',
};

// --- Default User Profile ---

export const DEFAULT_USER_PROFILE = {
  streak_count: 0,
  longest_streak: 0,
  last_activity_date: '',
  streak_freeze_used_this_week: false,
  total_xp: 0,
  rank_tier: 'newbie' as RankTier,
  seen_question_ids: [],
  total_time_seconds: 0,
  total_rounds_played: 0,
  total_correct_answers: 0,
  badges: [],
  scholarship_eligible: false,
  anonymous_leaderboard: false,
  is_admin: false,
};
