'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

interface Stats {
  totalUsers: number;
  totalAttempts: number;
  totalQuestionsMastered: number;
  scholarshipEligible: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let totalUsers = 0, scholarshipEligible = 0, totalQuestionsMastered = 0;

      usersSnapshot.forEach((doc) => {
        const d = doc.data();
        totalUsers++;
        if (d.scholarship_eligible) scholarshipEligible++;
        totalQuestionsMastered += (d.total_correct_answers || 0);
      });

      // Fetch attempts
      const attemptsSnapshot = await getDocs(collection(db, 'attempts'));
      const totalAttempts = attemptsSnapshot.size;

      setStats({ totalUsers, totalAttempts, totalQuestionsMastered, scholarshipEligible });
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6E6E73' }}>Loading admin stats...</div>;
  }

  if (!stats) return null;

  return (
    <div style={{ padding: '32px 32px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 32 }}>Admin Dashboard</h1>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#0071E3' },
          { label: 'Total Attempts', value: stats.totalAttempts, icon: '📝', color: '#5856D6' },
          { label: 'Questions Mastered', value: stats.totalQuestionsMastered, icon: '🧠', color: '#FF9F0A' },
          { label: 'Scholarship Eligible', value: stats.scholarshipEligible, icon: '🏆', color: '#34C759' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: '#fff', borderRadius: 16, padding: 24,
              border: '1px solid #E8E8ED',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F' }}>{card.value}</div>
            <div style={{ fontSize: 13, color: '#86868B', marginTop: 4 }}>{card.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
