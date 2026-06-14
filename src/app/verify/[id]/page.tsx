'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Certificate } from '@/types';
import { motion } from 'framer-motion';

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F7' }}>
        <div style={{ background: '#fff', padding: 48, borderRadius: 24, textAlign: 'center', border: '1px solid #E8E8ED', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1D1D1F', marginBottom: 8 }}>Invalid Certificate</h1>
          <p style={{ fontSize: 15, color: '#6E6E73', marginBottom: 24 }}>This certificate ID could not be found or has been revoked.</p>
          <button className="btn-primary" onClick={() => router.push('/')}>Go to CodIQ</button>
        </div>
      </div>
    );
  }

  const dateStr = new Date(cert.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', padding: '40px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: '#fff', borderRadius: 24, padding: 48, width: '100%', maxWidth: 600,
          border: '1px solid #E8E8ED', textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: '#34C75915',
          color: '#34C759', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, marginBottom: 24,
        }}>
          ✓
        </div>
        
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F', marginBottom: 8 }}>Verified Certificate</h1>
        <p style={{ fontSize: 15, color: '#6E6E73', marginBottom: 32 }}>This certificate is valid and issued by CodIQ.</p>

        <div style={{ background: '#F5F5F7', borderRadius: 16, padding: 24, textAlign: 'left', marginBottom: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: '#86868B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recipient</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1D1D1F' }}>{cert.user_name}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#86868B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Achievement</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1D1D1F' }}>{cert.level_name}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#86868B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1D1D1F' }}>{cert.score} / 10</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#86868B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Date</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1D1D1F' }}>{dateStr}</div>
            </div>
          </div>
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #E8E8ED' }}>
            <div style={{ fontSize: 12, color: '#86868B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification ID</div>
            <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#1D1D1F' }}>{cert.verification_id}</div>
          </div>
        </div>

        <button className="btn-secondary" onClick={() => router.push('/')}>Explore CodIQ</button>
      </motion.div>
    </div>
  );
}
