'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useUserStore } from '@/store/user-store';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProfileType, UserGoal } from '@/types';

const PROFILE_TYPES: { type: ProfileType; icon: string; title: string; description: string }[] = [
  { type: 'school', icon: '🎒', title: 'School Student', description: 'Currently in school, learning programming basics' },
  { type: 'college', icon: '🎓', title: 'College Student', description: 'Pursuing higher education in CS or related field' },
  { type: 'job_seeker', icon: '💼', title: 'Job Seeker', description: 'Preparing for coding interviews and career growth' },
];

const GOALS: { goal: UserGoal; icon: string; title: string; description: string }[] = [
  { goal: 'scholarship', icon: '🏆', title: 'Earn Scholarship', description: 'I want to qualify for the coding scholarship program' },
  { goal: 'learn', icon: '📚', title: 'Build Skills', description: 'I want to strengthen my programming fundamentals' },
  { goal: 'career', icon: '🚀', title: 'Career Prep', description: 'I\'m preparing for technical interviews and job readiness' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { completeOnboarding } = useUserStore();
  const [step, setStep] = useState(1);
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [name, setName] = useState(user?.displayName || '');
  const [ageOrYear, setAgeOrYear] = useState('');
  const [goal, setGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated or already onboarded
  if (!user) {
    router.push('/login');
    return null;
  }
  if (profile?.onboarding_complete) {
    router.push('/dashboard');
    return null;
  }

  const handleComplete = async () => {
    if (!profileType || !name || !goal || !user) return;
    setLoading(true);
    try {
      await completeOnboarding(user.uid, profileType, name, goal, ageOrYear);
      await refreshProfile();
      router.push('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return profileType !== null;
    if (step === 2) return name.trim().length > 0;
    if (step === 3) return goal !== null;
    return false;
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F5F7',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 24px',
    }}>
      {/* Progress Bar */}
      <div style={{
        width: '100%', maxWidth: 500, marginBottom: 48,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#6E6E73' }}>Step {step} of 3</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#6E6E73' }}>{Math.round((step / 3) * 100)}%</span>
        </div>
        <div style={{ width: '100%', height: 4, background: '#E8E8ED', borderRadius: 2 }}>
          <motion.div
            style={{ height: '100%', background: '#000', borderRadius: 2 }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div style={{ width: '100%', maxWidth: 560 }}>
        <AnimatePresence mode="wait">
          {/* Step 1: Profile Type */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 8 }}>
                Who are you?
              </h1>
              <p style={{ fontSize: 16, color: '#6E6E73', marginBottom: 36 }}>
                Select your profile type so we can personalize your experience.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PROFILE_TYPES.map((pt) => (
                  <div
                    key={pt.type}
                    onClick={() => setProfileType(pt.type)}
                    style={{
                      padding: 24, borderRadius: 16,
                      background: '#fff',
                      border: `2px solid ${profileType === pt.type ? '#000' : '#E8E8ED'}`,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 16,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: 36 }}>{pt.icon}</div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F' }}>{pt.title}</div>
                      <div style={{ fontSize: 14, color: '#6E6E73', marginTop: 2 }}>{pt.description}</div>
                    </div>
                    {profileType === pt.type && (
                      <div style={{
                        marginLeft: 'auto', width: 24, height: 24, borderRadius: 12,
                        background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Name */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 8 }}>
                Tell us about you
              </h1>
              <p style={{ fontSize: 16, color: '#6E6E73', marginBottom: 36 }}>
                This information appears on your certificates and leaderboard.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: '#1D1D1F', display: 'block', marginBottom: 8 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="input"
                    style={{ fontSize: 16 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 14, fontWeight: 500, color: '#1D1D1F', display: 'block', marginBottom: 8 }}>
                    {profileType === 'school' ? 'Grade / Class' : profileType === 'college' ? 'Year of Study' : 'Years of Experience'}
                    <span style={{ color: '#86868B', fontWeight: 400 }}> (optional)</span>
                  </label>
                  <input
                    type="text"
                    value={ageOrYear}
                    onChange={(e) => setAgeOrYear(e.target.value)}
                    placeholder={profileType === 'school' ? 'e.g., 10th Grade' : profileType === 'college' ? 'e.g., 2nd Year' : 'e.g., 2 years'}
                    className="input"
                    style={{ fontSize: 16 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Goal */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 8 }}>
                What&apos;s your goal?
              </h1>
              <p style={{ fontSize: 16, color: '#6E6E73', marginBottom: 36 }}>
                This helps us tailor your dashboard and recommendations.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {GOALS.map((g) => (
                  <div
                    key={g.goal}
                    onClick={() => setGoal(g.goal)}
                    style={{
                      padding: 24, borderRadius: 16,
                      background: '#fff',
                      border: `2px solid ${goal === g.goal ? '#000' : '#E8E8ED'}`,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 16,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: 36 }}>{g.icon}</div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F' }}>{g.title}</div>
                      <div style={{ fontSize: 14, color: '#6E6E73', marginTop: 2 }}>{g.description}</div>
                    </div>
                    {goal === g.goal && (
                      <div style={{
                        marginLeft: 'auto', width: 24, height: 24, borderRadius: 12,
                        background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 40, gap: 12,
        }}>
          {step > 1 ? (
            <button className="btn-secondary" onClick={() => setStep(step - 1)}>
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              className="btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Continue →
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleComplete}
              disabled={!canProceed() || loading}
              style={{ minWidth: 160 }}
            >
              {loading ? 'Setting up...' : 'Start Your Journey 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
