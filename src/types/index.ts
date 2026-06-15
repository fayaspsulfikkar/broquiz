// ============================================
// BroQuiz — TypeScript Type Definitions
// ============================================

// --- Enums ---

export type QuestionType = 'mcq' | 'multiple_select' | 'fill_blank' | 'code_output' | 'debugging';

export type ProfileType = 'school' | 'college' | 'job_seeker';

export type UserGoal = 'scholarship' | 'learn' | 'career';

export type TopicTag = 'variables' | 'arithmetic' | 'control_flow' | 'loops' | 'arrays' | 'atm_project' | 'algorithms';

export type BadgeId =
  | 'first_step'
  | 'perfect_score'
  | 'speed_coder'
  | 'comeback_kid'
  | 'scholarship_ready'
  | 'streak_master'
  | 'array_expert'
  | 'logic_wizard'
  | 'streak_3'
  | 'streak_30';

export type RankTier = 'newbie' | 'logic_learner' | 'code_thinker' | 'algorithm_ace' | 'scholarship_scholar';

export type LeaderboardTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type QuestionStatus = 'approved' | 'flagged' | 'retired';

export type LeaderboardResetCycle = 'weekly' | 'monthly' | 'never';

// --- User ---

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  profile_type?: ProfileType;
  avatar_url: string;
  goal?: UserGoal;
  age_or_year?: string;
  created_at: string;
  last_active: string;
  streak_count: number;
  longest_streak: number;
  last_activity_date: string;
  streak_freeze_used_this_week: boolean;
  total_xp: number;
  rank_tier: RankTier;
  seen_question_ids: string[];
  total_time_seconds: number;
  total_rounds_played: number;
  total_correct_answers: number;
  badges: BadgeId[];
  scholarship_eligible: boolean;
  anonymous_leaderboard: boolean;
  is_admin: boolean;
  fraud_detected?: boolean;
}

// --- Question ---

export interface Question {
  id: string;
  hash: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  topic_tag: TopicTag;
  difficulty: number;
  level: number;
  code_snippet?: string;
  times_shown: number;
  correct_count: number;
  created_at: string;
  status: QuestionStatus;
}

// Question as sent to the client (no correct_answer or explanation)
export interface ClientQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  code_snippet?: string;
  topic_tag: TopicTag;
}

// --- Attempt ---

export interface AttemptAnswer {
  question_id: string;
  user_answer: string | string[];
  is_correct: boolean;
  points_awarded: number;
}

export interface Attempt {
  id: string;
  user_id: string;
  level: number;
  round_index: number;
  is_retry: boolean;
  timestamp: string;
  duration_seconds: number;
  score: number;
  raw_score: number;
  wrong_count: number;
  net_score: number;
  answers: AttemptAnswer[];
  improvement_suggestions?: string;
}

// --- Results (returned from submit API) ---

export interface QuestionResult {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  user_answer: string | string[];
  correct_answer: string | string[];
  is_correct: boolean;
  points_awarded: number;
  explanation: string;
  topic_tag: TopicTag;
  code_snippet?: string;
  options?: string[];
}

export interface QuizResults {
  score: number;
  raw_score: number;
  wrong_count: number;
  net_score: number;
  total_questions: number;
  duration_seconds: number;
  accuracy_percentage: number;
  passed: boolean;
  scholarship_eligible: boolean;
  level: number;
  results: QuestionResult[];
  improvement_suggestions: string;
  new_badges: BadgeId[];
  new_xp: number;
  total_xp: number;
  rank_tier: RankTier;
}

// --- Badge ---

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  icon: string; // emoji or SVG path
  color: string;
}

// --- Leaderboard ---

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string;
  total_score: number;
  level_scores: { [key: string]: number };
  rank: number;
  profile_type: ProfileType;
  badge_count: number;
  tier: LeaderboardTier;
  anonymous: boolean;
}

// --- Admin Settings ---

export interface AdminSettings {
  timer_enabled: boolean;
  timer_minutes: number;
  leaderboard_visible: boolean;
  leaderboard_reset_cycle: LeaderboardResetCycle;
  scholarship_minimum_score: number;
}

// --- Certificate ---

export interface Certificate {
  verification_id: string;
  user_id: string;
  user_name: string;
  level: number;
  level_name: string;
  score: number;
  date: string;
  valid: boolean;
}

// --- Level Definition ---

export interface LevelDefinition {
  id: number;
  name: string;
  difficulty: string;
  description: string;
  question_distribution: { type: QuestionType; count: number }[];
  negative_marking: boolean;
  negative_marking_value: number;
  topics: string[];
  xp_reward: number;
}

// --- Quiz Session State ---

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  flagged: boolean;
}
