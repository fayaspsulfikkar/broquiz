'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

interface Stats {
  totalUsers: number;
  schoolUsers: number;
  collegeUsers: number;
  jobSeekerUsers: number;
  totalAttempts: number;
  scholarshipEligible: number;
  avgScores: Record<string, number>;
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
      let totalUsers = 0, schoolUsers = 0, collegeUsers = 0, jobSeekerUsers = 0, scholarshipEligible = 0;
      const levelScores: Record<string, number[]> = { '1': [], '2': [], '3': [], '4': [] };

      usersSnapshot.forEach((doc) => {
        const d = doc.data();
        if (!d.onboarding_complete) return;
        totalUsers++;
        if (d.profile_type === 'school') schoolUsers++;
        if (d.profile_type === 'college') collegeUsers++;
        if (d.profile_type === 'job_seeker') jobSeekerUsers++;
        if (d.scholarship_eligible) scholarshipEligible++;

        for (let i = 1; i <= 4; i++) {
          const lk = `level_${i}`;
          if (d.levels?.[lk]?.best_score > 0) {
            levelScores[String(i)].push(d.levels[lk].best_score);
          }
        }
      });

      // Fetch attempts
      const attemptsSnapshot = await getDocs(collection(db, 'attempts'));
      const totalAttempts = attemptsSnapshot.size;

      // Calc avg scores
      const avgScores: Record<string, number> = {};
      for (const [level, scores] of Object.entries(levelScores)) {
        avgScores[level] = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
      }

      setStats({ totalUsers, schoolUsers, collegeUsers, jobSeekerUsers, totalAttempts, scholarshipEligible, avgScores });
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
          { label: 'School Students', value: stats.schoolUsers, icon: '🎒', color: '#34C759' },
          { label: 'College Students', value: stats.collegeUsers, icon: '🎓', color: '#FF9F0A' },
          { label: 'Job Seekers', value: stats.jobSeekerUsers, icon: '💼', color: '#AF52DE' },
          { label: 'Total Attempts', value: stats.totalAttempts, icon: '📝', color: '#5856D6' },
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

      {/* Avg Scores */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #E8E8ED', marginBottom: 36 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#1D1D1F', marginBottom: 20 }}>Average Score per Level</h3>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', height: 180, padding: '0 20px' }}>
          {[1, 2, 3, 4].map((level) => {
            const score = stats.avgScores[String(level)] || 0;
            const maxH = 140;
            const barH = (score / 10) * maxH;
            const colors = ['#34C759', '#FF9F0A', '#0071E3', '#AF52DE'];
            return (
              <div key={level} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', marginBottom: 6 }}>{score}</div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barH }}
                  transition={{ duration: 0.8, delay: level * 0.1 }}
                  style={{
                    background: colors[level - 1], borderRadius: '8px 8px 0 0',
                    margin: '0 auto', width: '60%', minWidth: 40,
                  }}
                />
                <div style={{ fontSize: 12, color: '#86868B', marginTop: 8 }}>Level {level}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
