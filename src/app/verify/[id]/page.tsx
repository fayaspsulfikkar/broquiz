'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Certificate } from '@/types';

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCert = async () => {
      const id = params?.id as string;
      if (!id) return;
      try {
        const docRef = doc(db, 'certificates', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCert({ verification_id: docSnap.id, ...docSnap.data() } as Certificate);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [params]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading verification...</div>;
  }

  if (error || !cert) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div  style={{ padding: 48, borderRadius: 24, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'inherit', marginBottom: 8 }}>Invalid Certificate</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>This certificate ID could not be found or has been revoked.</p>
          <button className="btn-primary" onClick={() => router.push('/')}>Go to CodIQ</button>
        </div>
      </div>
    );
  }

  const dateStr = new Date(cert.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        
        style={{
          borderRadius: 24, padding: 48, width: '100%', maxWidth: 600,
          textAlign: 'center',
        }}
      >
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: 'rgba(74, 222, 128, 0.15)',
          color: '#4ADE80', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, marginBottom: 24,
        }}>
          ✓
        </div>
        
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'inherit', marginBottom: 8 }}>Verified Certificate</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 32 }}>This certificate is valid and issued by CodIQ.</p>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, textAlign: 'left', marginBottom: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recipient</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'inherit' }}>{cert.user_name}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Achievement</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'inherit' }}>{cert.level_name}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'inherit' }}>{cert.score} / 10</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Date</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'inherit' }}>{dateStr}</div>
            </div>
          </div>
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification ID</div>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'inherit' }}>{cert.verification_id}</div>
          </div>
        </div>

        <button className="btn-secondary" onClick={() => router.push('/')}>Explore CodIQ</button>
      </div>
    </div>
  );
}
