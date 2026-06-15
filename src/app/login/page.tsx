'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail, setupRecaptcha, sendPhoneCode, verifyPhoneCode, error, clearError, user, profile } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  
  // Phone Auth State
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const [showNameInput, setShowNameInput] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (showPhoneInput && !confirmationResult) {
      setTimeout(() => {
        setupRecaptcha('phone-sign-in-button');
      }, 100);
    }
  }, [showPhoneInput, confirmationResult, setupRecaptcha]);

  // Redirect or Ask Name if logged in
  useEffect(() => {
    if (user && profile) {
      if (!profile.name || profile.name.trim() === '') {
        setShowNameInput(true);
      } else {
        router.push('/');
      }
    }
  }, [user, profile, router]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await updateDoc(doc(db, 'users', user.uid), { name: name.trim() });
      router.push('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      const result = await sendPhoneCode(phoneNumber);
      setConfirmationResult(result);
    } catch {
      // Error handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      await verifyPhoneCode(confirmationResult, otpCode);
    } catch {
      // Error handled by context
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
        padding: 24,
      }}>
        <div
          
          style={{
            borderRadius: 20, padding: 48,
            maxWidth: 420, width: '100%', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'inherit', marginBottom: 8 }}>Check Your Email</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 32, lineHeight: 1.6 }}>
            We&apos;ve sent a verification link to <strong>{email}</strong>.
            Click the link to verify your account and continue.
          </p>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => {
            setShowVerification(false);
            setIsSignUp(false);
          }}>
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (showNameInput) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div
          
          style={{
            borderRadius: 20, padding: 'clamp(32px, 5vw, 48px)',
            maxWidth: 420, width: '100%',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'inherit', letterSpacing: '-0.03em' }}>
              What&apos;s your name?
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
              Let us know what to call you on the leaderboard.
            </p>
          </div>
          <form onSubmit={handleNameSubmit}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fayas"
              required
              className="input"
              style={{ marginBottom: 16 }}
            />
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary"
              style={{ width: '100%', opacity: (loading || !name.trim()) ? 0.6 : 1 }}
            >
              {loading ? 'Saving...' : 'Start Quiz →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div
        
        style={{
          borderRadius: 20, padding: 'clamp(32px, 5vw, 48px)',
          maxWidth: 420, width: '100%',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'inherit', fontSize: 24, fontWeight: 700, marginBottom: 16, border: '1px solid rgba(255,255,255,0.4)'
          }}>B</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'inherit', letterSpacing: '-0.03em' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>
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
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: 15, fontWeight: 500, color: 'inherit', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth('github')}
            disabled={loading}
            style={{
              width: '100%', height: 48, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: 15, fontWeight: 500, color: 'inherit', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            Continue with GitHub
          </button>
          
          <button
            onClick={() => { setShowPhoneInput(true); clearError(); }}
            disabled={loading}
            style={{
              width: '100%', height: 48, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: 15, fontWeight: 500, color: 'inherit', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Continue with Phone
          </button>
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {showPhoneInput ? (
          confirmationResult ? (
            <form onSubmit={handleVerifyPhoneCode}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#6E6E73', display: 'block', marginBottom: 6 }}>Verification Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  required
                  className="input"
                  style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: 18 }}
                  maxLength={6}
                />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FF3B3010', color: '#FF3B30', fontSize: 13, marginBottom: 16 }}>
                  {error.replace('Firebase: ', '')}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: 8, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendPhoneCode}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#6E6E73', display: 'block', marginBottom: 6 }}>Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  className="input"
                />
                <p style={{ fontSize: 12, color: '#86868B', marginTop: 8 }}>
                  Make sure to include the country code (e.g. +91).
                </p>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#FF3B3010', color: '#FF3B30', fontSize: 13, marginBottom: 16 }}>
                  {error.replace('Firebase: ', '')}
                </div>
              )}

              <button id="phone-sign-in-button" type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: 8, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Sending SMS...' : 'Send Code'}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleEmailAuth}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 6 }}>Email</label>
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
              <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 6 }}>Password</label>
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
        )}

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
          {showPhoneInput ? (
            <>
              Prefer email?
              <button
                onClick={() => { setShowPhoneInput(false); setConfirmationResult(null); clearError(); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-brand-accent)', fontWeight: 500, cursor: 'pointer', marginLeft: 6, fontSize: 14 }}
              >
                Sign in with Email
              </button>
            </>
          ) : (
            <>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => { setIsSignUp(!isSignUp); clearError(); }}
                style={{
                  background: 'none', border: 'none', color: 'var(--color-brand-accent)',
                  fontWeight: 500, cursor: 'pointer', marginLeft: 6, fontSize: 14,
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </>
          )}
        </div>

        {/* Back to home */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
