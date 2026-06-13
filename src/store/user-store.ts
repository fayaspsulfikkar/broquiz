// ============================================
// BroQuiz — User Store (Zustand)
// ============================================

import { create } from 'zustand';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile, ProfileType, UserGoal } from '@/types';

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;

  // Actions
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (
    uid: string,
    profileType: ProfileType,
    name: string,
    goal: UserGoal,
    ageOrYear?: string
  ) => Promise<void>;
  fetchProfile: (uid: string) => Promise<UserProfile | null>;
  toggleAnonymousLeaderboard: (uid: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoading: false,

  setProfile: (profile) => set({ profile }),

  updateProfile: async (uid, data) => {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, { ...data });
      const current = get().profile;
      if (current) {
        set({ profile: { ...current, ...data } });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  },

  completeOnboarding: async (uid, profileType, name, goal, ageOrYear) => {
    try {
      const docRef = doc(db, 'users', uid);
      const updates = {
        profile_type: profileType,
        name,
        goal,
        age_or_year: ageOrYear || '',
        onboarding_complete: true,
      };
      await updateDoc(docRef, updates);
      const current = get().profile;
      if (current) {
        set({ profile: { ...current, ...updates } as UserProfile });
      }
    } catch (err) {
      console.error('Error completing onboarding:', err);
    }
  },

  fetchProfile: async (uid) => {
    set({ isLoading: true });
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const profile = { uid, ...docSnap.data() } as UserProfile;
        set({ profile, isLoading: false });
        return profile;
      }
      set({ isLoading: false });
      return null;
    } catch (err) {
      console.error('Error fetching profile:', err);
      set({ isLoading: false });
      return null;
    }
  },

  toggleAnonymousLeaderboard: async (uid) => {
    const current = get().profile;
    if (!current) return;
    const newVal = !current.anonymous_leaderboard;
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { anonymous_leaderboard: newVal });
    set({ profile: { ...current, anonymous_leaderboard: newVal } });
  },
}));
