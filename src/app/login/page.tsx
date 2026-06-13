'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail, error, clearError, user, profile } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  // Redirect if already logged in
  if (user) {
    if (profile?.onboarding_complete) {
      router.push('/dashboard');
    } else {
      router.push('/onboarding');
    }
    return null;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setShowVerification(true);
      } else {
        await signInWithEmail(email, password);
      }
    } catch {
      // Error is handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    clearError();
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithGitHub();
      }
    } catch {
      // Error is handled by context
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (pwd.length === 0) return { level: 0, label: '', color: 'transparent' };
    if (pwd.length < 6) return { level: 1, label: 'Weak', color: '#FF3B30' };
    if (pwd.length < 8) return { level: 2, label: 'Fair', color: '#FF9F0A' };
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) return { level: 4, label: 'Strong', color: '#34C759' };
    return { level: 3, label: 'Good', color: '#0071E3' };
  };

  const passwordStrength = getPasswordStrength(password);

  if (showVerification) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F5F5F7', padding: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: '#fff', borderRadius: 20, padding: 48,
            maxWidth: 420, width: '100%', textAlign: 'center',
            border: '1px solid #E8E8ED',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F', marginBottom: 8 }}>Check Your Email</h2>
          <p style={{ fontSize: 15, color: '#6E6E73', marginBottom: 32, lineHeight: 1.6 }}>
            We&apos;ve sent a verification link to <strong>{email}</strong>.
            Click the link to verify your account and continue.
          </p>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => {
            setShowVerification(false);
            setIsSignUp(false);
          }}>
            Back to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F5F5F7', padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: '#fff', borderRadius: 20, padding: 'clamp(32px, 5vw, 48px)',
          maxWidth: 420, width: '100%',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          border: '1px solid #E8E8ED',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 16,
          }}>B</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{ fontSize: 15, color: '#6E6E73', marginTop: 6 }}>
            {isSignUp ? 'Start your coding challenge journey' : 'Sign in to continue your journey'}
          </p>
        </div>

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => handleOAuth('google')}
            disabled={loading}
            style={{
              width: '100%', height: 48, borderRadius: 10,
              border: '1px solid #D2D2D7', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: 15, fontWeight: 500, color: '#1D1D1F', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth('github')}
            disabled={loading}
            style={{
              width: '100%', height: 48, borderRadius: 10,
              border: '1px solid #D2D2D7', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: 15, fontWeight: 500, color: '#1D1D1F', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F5F7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1D1D1F"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
        }}>
          <div style={{ flex: 1, height: 1, background: '#E8E8ED' }} />
          <span style={{ fontSize: 13, color: '#86868B' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#E8E8ED' }} />
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#6E6E73', display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="input"
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#6E6E73', display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="input"
            />
          </div>

          {/* Password Strength */}
          {isSignUp && password.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4].map((level) => (
                  <div key={level} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: passwordStrength.level >= level ? passwordStrength.color : '#E8E8ED',
                    transition: 'background 0.2s ease',
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 12, color: passwordStrength.color }}>{passwordStrength.label}</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: '#FF3B3010', color: '#FF3B30',
              fontSize: 13, marginBottom: 16,
            }}>
              {error.replace('Firebase: ', '')}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: 8, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#6E6E73' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => { setIsSignUp(!isSignUp); clearError(); }}
            style={{
              background: 'none', border: 'none', color: '#0071E3',
              fontWeight: 500, cursor: 'pointer', marginLeft: 6, fontSize: 14,
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        {/* Back to home */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none', border: 'none', color: '#86868B',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            ← Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
