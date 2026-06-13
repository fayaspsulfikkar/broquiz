// ============================================
// BroQuiz — Gamification Engine
// ============================================

import type { UserProfile, BadgeId, RankTier, LeaderboardTier } from '@/types';
import { BADGES, RANK_THRESHOLDS, LEADERBOARD_TIERS, XP_PER_LEVEL, PASS_SCORE } from './constants';

/**
 * Calculate rank tier based on XP
 */
export function calculateRankTier(totalXP: number): RankTier {
  let tier: RankTier = 'newbie';
  for (const rank of RANK_THRESHOLDS) {
    if (totalXP >= rank.minXP) {
      tier = rank.tier;
    }
  }
  return tier;
}

/**
 * Get rank title from tier
 */
export function getRankTitle(tier: RankTier): string {
  const rank = RANK_THRESHOLDS.find((r) => r.tier === tier);
  return rank?.title || 'Newbie';
}

/**
 * Calculate leaderboard tier based on XP
 */
export function calculateLeaderboardTier(totalXP: number): LeaderboardTier {
  let tier: LeaderboardTier = 'bronze';
  for (const t of LEADERBOARD_TIERS) {
    if (totalXP >= t.minXP) {
      tier = t.tier;
    }
  }
  return tier;
}

/**
 * Get leaderboard tier color
 */
export function getLeaderboardTierColor(tier: LeaderboardTier): string {
  const t = LEADERBOARD_TIERS.find((lt) => lt.tier === tier);
  return t?.color || '#CD7F32';
}

/**
 * Evaluate which badges the user has earned after an attempt
 */
export function evaluateNewBadges(
  profile: UserProfile,
  level: number,
  score: number,
  rawScore: number,
  durationSeconds: number,
  topicResults: { topic_tag: string; is_correct: boolean }[]
): BadgeId[] {
  const existingBadges = new Set(profile.badges);
  const newBadges: BadgeId[] = [];

  const addBadge = (id: BadgeId) => {
    if (!existingBadges.has(id)) {
      newBadges.push(id);
    }
  };

  // First Step: Complete Level 1 (any score)
  if (level === 1) {
    addBadge('first_step');
  }

  // Perfect Score: 10/10 on any level
  if (rawScore === 10) {
    addBadge('perfect_score');
  }

  // Speed Coder: Complete under 10 minutes
  if (durationSeconds < 600) {
    addBadge('speed_coder');
  }

  // Comeback Kid: Pass a level after 3+ failed attempts
  const levelKey = `level_${level}` as keyof typeof profile.levels;
  const levelProgress = profile.levels[levelKey];
  if (score >= PASS_SCORE && levelProgress.attempts >= 3 && !levelProgress.passed) {
    addBadge('comeback_kid');
  }

  // Scholarship Ready: Pass all 4 levels with ≥7/10
  const allPassed =
    (level === 1 && score >= PASS_SCORE ? true : profile.levels.level_1.passed) &&
    (level === 2 && score >= PASS_SCORE ? true : profile.levels.level_2.passed) &&
    (level === 3 && score >= PASS_SCORE ? true : profile.levels.level_3.passed) &&
    (level === 4 && score >= PASS_SCORE ? true : profile.levels.level_4.passed);
  if (allPassed) {
    addBadge('scholarship_ready');
  }

  // Streak badges
  const currentStreak = profile.streak_count;
  if (currentStreak >= 3) addBadge('streak_3');
  if (currentStreak >= 7) addBadge('streak_master');
  if (currentStreak >= 30) addBadge('streak_30');

  // Array Expert: All array questions correct in session
  const arrayQuestions = topicResults.filter((r) => r.topic_tag === 'arrays');
  if (arrayQuestions.length > 0 && arrayQuestions.every((r) => r.is_correct)) {
    addBadge('array_expert');
  }

  // Logic Wizard: Pass Level 3 with ≥9/10
  if (level === 3 && score >= 9) {
    addBadge('logic_wizard');
  }

  return newBadges;
}

/**
 * Update streak logic
 */
export function calculateStreak(
  lastActivityDate: string,
  currentStreak: number,
  longestStreak: number,
  streakFreezeUsed: boolean
): {
  newStreak: number;
  newLongestStreak: number;
  streakFreezeUsed: boolean;
} {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

  if (lastActivityDate === today) {
    // Already active today — no change
    return { newStreak: currentStreak, newLongestStreak: longestStreak, streakFreezeUsed };
  }

  if (lastActivityDate === yesterday) {
    // Continued streak
    const newStreak = currentStreak + 1;
    return {
      newStreak,
      newLongestStreak: Math.max(longestStreak, newStreak),
      streakFreezeUsed,
    };
  }

  if (lastActivityDate === twoDaysAgo && !streakFreezeUsed) {
    // Use streak freeze
    const newStreak = currentStreak + 1;
    return {
      newStreak,
      newLongestStreak: Math.max(longestStreak, newStreak),
      streakFreezeUsed: true,
    };
  }

  // Streak broken
  return {
    newStreak: 1,
    newLongestStreak: longestStreak,
    streakFreezeUsed: false,
  };
}

/**
 * Get XP for passing a level
 */
export function getXPForLevel(level: number): number {
  return XP_PER_LEVEL[level] || 0;
}

/**
 * Get badge definition by ID
 */
export function getBadgeById(id: BadgeId) {
  return BADGES.find((b) => b.id === id);
}
