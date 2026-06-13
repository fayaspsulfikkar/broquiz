'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '🧠',
    title: 'Logic-First Questions',
    description: 'Test understanding, not memorization. Every question is designed to probe your grasp of programming fundamentals.',
  },
  {
    icon: '🎯',
    title: '4-Level Challenge',
    description: 'Progress from Foundation to Master Challenge. Each level unlocks only after you prove your skills.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered',
    description: 'Gemini AI generates unique questions every attempt — no two quizzes are the same.',
  },
  {
    icon: '🏆',
    title: 'Earn Scholarships',
    description: 'Score ≥7/10 on all levels to qualify. Stand out from thousands of applicants.',
  },
  {
    icon: '📊',
    title: 'Track Progress',
    description: 'Streaks, badges, XP, and leaderboards keep you motivated on your journey.',
  },
  {
    icon: '📜',
    title: 'Verified Certificates',
    description: 'Download shareable certificates and digital badges for every level you pass.',
  },
];

const TESTIMONIALS = [
  { name: 'Arjun S.', type: 'College Student', text: 'BroQuiz helped me realize I actually understand coding logic. The scholarship changed my career path.', score: '9/10' },
  { name: 'Priya M.', type: 'School Student', text: 'The questions are challenging but fair. I love that it tests thinking, not just syntax.', score: '8/10' },
  { name: 'Rahul K.', type: 'Job Seeker', text: 'Finally, a platform that separates real coders from copy-pasters. The AI questions are brilliant.', score: '10/10' },
];

const STATS = [
  { value: '10K+', label: 'Quiz Attempts' },
  { value: '2K+', label: 'Active Users' },
  { value: '500+', label: 'Scholarships' },
  { value: '95%', label: 'Satisfaction' },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetStarted = () => {
    if (user && profile?.onboarding_complete) {
      router.push('/dashboard');
    } else if (user) {
      router.push('/onboarding');
    } else {
      router.push('/login');
    }
  };

  if (!mounted) return null;

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(210,210,215,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, fontWeight: 700,
          }}>B</div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: '#1D1D1F' }}>BroQuiz</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? (
            <button className="btn-primary" onClick={() => router.push('/dashboard')}>Dashboard</button>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => router.push('/login')}>Sign In</button>
              <button className="btn-primary" onClick={() => router.push('/login')}>Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        paddingTop: 160, paddingBottom: 100,
        textAlign: 'center', maxWidth: 900, margin: '0 auto', padding: '160px 24px 100px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 100,
            background: '#F5F5F7', fontSize: 13, fontWeight: 500, color: '#6E6E73',
            marginBottom: 24,
          }}>
            <span>🎓</span> Scholarship Selection Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            color: '#1D1D1F',
            marginBottom: 24,
          }}>
            Prove Your Code Logic.
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #0071E3 0%, #5856D6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Earn Your Scholarship.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(17px, 2vw, 21px)',
            color: '#6E6E73',
            lineHeight: 1.5,
            maxWidth: 600,
            margin: '0 auto 40px',
          }}>
            4 levels. 5 question types. AI-powered questions that never repeat.
            Show the world you truly understand programming fundamentals.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleGetStarted}
              style={{ height: 52, padding: '0 32px', fontSize: 17, borderRadius: 12 }}>
              Start Your Challenge →
            </button>
            <button className="btn-secondary" onClick={() => router.push('/login')}
              style={{ height: 52, padding: '0 32px', fontSize: 17, borderRadius: 12 }}>
              Admin Login
            </button>
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 5vw, 64px)',
            marginTop: 80, flexWrap: 'wrap',
          }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em' }}>{stat.value}</div>
              <div style={{ fontSize: 14, color: '#86868B', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section style={{ background: '#F5F5F7', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6E6E73', textAlign: 'center', marginBottom: 12 }}>
              How It Works
            </h2>
            <h3 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#1D1D1F', textAlign: 'center', letterSpacing: '-0.03em', marginBottom: 64 }}>
              Four levels. One goal.
            </h3>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { level: 1, name: 'Foundation', diff: 'Beginner', color: '#34C759', desc: 'Variables, arithmetic, basic logic' },
              { level: 2, name: 'Logic Builder', diff: 'Intermediate', color: '#FF9F0A', desc: 'Control flow, loops, arrays' },
              { level: 3, name: 'Code Thinker', diff: 'Advanced', color: '#0071E3', desc: 'Output prediction, debugging' },
              { level: 4, name: 'Master Challenge', diff: 'Expert', color: '#AF52DE', desc: 'All types + negative marking' },
            ].map((l, i) => (
              <motion.div
                key={l.level}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  background: '#fff', borderRadius: 16, padding: 28,
                  border: '1px solid #E8E8ED',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${l.color}15`, color: l.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 700, margin: '0 auto 16px',
                }}>{l.level}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F', marginBottom: 4 }}>{l.name}</div>
                <div style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 100,
                  fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                  color: l.color, background: `${l.color}15`, marginBottom: 12,
                }}>{l.diff}</div>
                <div style={{ fontSize: 14, color: '#6E6E73', lineHeight: 1.5 }}>{l.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6E6E73', textAlign: 'center', marginBottom: 12 }}>
            Why BroQuiz
          </h2>
          <h3 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#1D1D1F', textAlign: 'center', letterSpacing: '-0.03em', marginBottom: 64 }}>
            Built different. By design.
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                style={{
                  padding: 28, borderRadius: 16,
                  border: '1px solid #E8E8ED',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{feature.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1D1D1F', marginBottom: 8 }}>{feature.title}</div>
                <div style={{ fontSize: 15, color: '#6E6E73', lineHeight: 1.6 }}>{feature.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: '#F5F5F7', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6E6E73', textAlign: 'center', marginBottom: 12 }}>
            Success Stories
          </h2>
          <h3 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#1D1D1F', textAlign: 'center', letterSpacing: '-0.03em', marginBottom: 64 }}>
            Hear from our scholars.
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  background: '#fff', borderRadius: 16, padding: 28,
                  border: '1px solid #E8E8ED',
                }}
              >
                <div style={{ fontSize: 15, color: '#1D1D1F', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
                  &ldquo;{t.text}&rdquo;
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1D1D1F' }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: '#86868B' }}>{t.type}</div>
                  </div>
                  <div style={{
                    padding: '4px 12px', borderRadius: 8,
                    background: '#34C75915', color: '#34C759',
                    fontSize: 14, fontWeight: 600,
                  }}>{t.score}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 16 }}>
            Ready to prove yourself?
          </h2>
          <p style={{ fontSize: 17, color: '#6E6E73', marginBottom: 32 }}>
            Join thousands of students and developers who have taken the challenge.
          </p>
          <button className="btn-primary" onClick={handleGetStarted}
            style={{ height: 52, padding: '0 40px', fontSize: 17, borderRadius: 12 }}>
            Start Now — It&apos;s Free
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #E8E8ED', padding: '32px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 13, color: '#86868B', flexWrap: 'wrap', gap: 16,
      }}>
        <div>© {new Date().getFullYear()} BroQuiz. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>
      </footer>
    </div>
  );
}
