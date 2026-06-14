'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStart = () => {
    if (user && profile) {
      if (!profile.name || profile.name.trim() === '') {
        router.push('/login');
      } else {
        router.push('/quiz');
      }
    } else {
      router.push('/login');
    }
  };

  if (!mounted) return null;

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: '#fff', borderRadius: 20, padding: 'clamp(32px, 5vw, 64px)',
          maxWidth: 600, width: '100%', margin: 24, textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)', border: '1px solid #E8E8ED',
        }}
      >
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 24,
        }}>B</div>
        
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#1D1D1F', marginBottom: 16,
        }}>
          Welcome to BroQuiz
        </h1>
        
        <p style={{
          fontSize: 17, color: '#6E6E73', lineHeight: 1.6, marginBottom: 32,
        }}>
          Test your programming fundamentals. <strong>Taking repeated quiz rounds will improve your chances of getting selected.</strong> The more questions you master, the higher you climb on the leaderboard.
        </p>

        <button 
          className="btn-primary" 
          onClick={handleStart}
          style={{ height: 56, padding: '0 48px', fontSize: 18, borderRadius: 14, width: '100%' }}
        >
          {user ? 'Start Quiz →' : 'Login to Start →'}
        </button>

        {user && (
          <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button 
              onClick={() => router.push('/leaderboard')}
              style={{ background: 'none', border: 'none', color: '#0071E3', fontWeight: 500, cursor: 'pointer' }}
            >
              View Leaderboard
            </button>
            <span style={{ color: '#E8E8ED' }}>|</span>
            <button 
              onClick={() => router.push('/profile')}
              style={{ background: 'none', border: 'none', color: '#0071E3', fontWeight: 500, cursor: 'pointer' }}
            >
              Profile
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
