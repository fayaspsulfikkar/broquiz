'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';

interface AdminUser {
  uid: string;
  name: string;
  email: string;
  total_correct_answers: number;
  total_rounds_played: number;
  streak_count: number;
}

interface Stats {
  totalUsers: number;
  totalAttempts: number;
  totalQuestionsMastered: number;
  scholarshipEligible: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let totalUsers = 0, scholarshipEligible = 0, totalQuestionsMastered = 0;

      const usersData: AdminUser[] = [];

      usersSnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        totalUsers++;
        if (d.scholarship_eligible) scholarshipEligible++;
        totalQuestionsMastered += (d.total_correct_answers || 0);
        usersData.push({ uid: docSnap.id, ...d } as AdminUser);
      });

      setUsers(usersData);

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

  const resetUser = async (uid: string) => {
    if (!confirm('Are you sure you want to reset this user? All their attempts and score will be deleted.')) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        total_correct_answers: 0,
        total_rounds_played: 0,
        total_time_seconds: 0,
        streak_count: 0,
        longest_streak: 0,
        seen_question_ids: [],
        fraud_detected: false,
      });
      const q = query(collection(db, 'attempts'), where('user_id', '==', uid));
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map(d => deleteDoc(doc(db, 'attempts', d.id))));
      alert('User reset successfully.');
      fetchStats();
    } catch (e) {
      console.error(e);
      alert('Failed to reset user.');
    }
  };

  const resetAllUsers = async () => {
    if (!confirm('WARNING: Are you absolutely sure you want to reset ALL users? This deletes the entire leaderboard and all attempts.')) return;
    if (!confirm('Are you REALLY sure? This cannot be undone.')) return;
    try {
      // 1. Reset all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      await Promise.all(usersSnapshot.docs.map(userDoc => 
        updateDoc(doc(db, 'users', userDoc.id), {
          total_correct_answers: 0,
          total_rounds_played: 0,
          total_time_seconds: 0,
          streak_count: 0,
          longest_streak: 0,
          seen_question_ids: [],
          fraud_detected: false,
        })
      ));
      // 2. Delete all attempts
      const attemptsSnapshot = await getDocs(collection(db, 'attempts'));
      await Promise.all(attemptsSnapshot.docs.map(attemptDoc => 
        deleteDoc(doc(db, 'attempts', attemptDoc.id))
      ));
      
      alert('Global wipe complete.');
      fetchStats();
    } catch (e) {
      console.error(e);
      alert('Failed to reset all users.');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6E6E73' }}>Loading admin stats...</div>;
  }

  if (!stats) return null;

  return (
    <div style={{ padding: '32px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'inherit', letterSpacing: '-0.03em' }}>Admin Dashboard</h1>
        {(profile?.email === 'fayaspulivetty@gmail.com' || profile?.email === 'fayas.gimelvavteth@gmail.com') && (
          <button 
            onClick={resetAllUsers}
            style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: '1px solid rgba(255, 59, 48, 0.2)', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            🚨 Reset ALL Users
          </button>
        )}
      </div>

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
              background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #E8E8ED',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F' }}>{card.value}</div>
            <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 4 }}>{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Users Table */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #E8E8ED' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1D1D1F', marginBottom: 20 }}>User Management</h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E8ED', background: '#FAFAFA' }}>
                <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#86868B', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#86868B', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#86868B', textTransform: 'uppercase' }}>Rounds</th>
                <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#86868B', textTransform: 'uppercase' }}>Mastered</th>
                <th style={{ padding: '16px', fontSize: 12, fontWeight: 700, color: '#86868B', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} style={{ borderBottom: '1px solid #E8E8ED' }}>
                  <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>{u.name}</td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#6E6E73' }}>{u.email}</td>
                  <td style={{ padding: '16px', fontSize: 14, fontWeight: 500, color: '#34C759' }}>{u.total_rounds_played || 0}</td>
                  <td style={{ padding: '16px', fontSize: 14, fontWeight: 500, color: '#34C759' }}>{u.total_correct_answers || 0}</td>
                  <td style={{ padding: '16px' }}>
                    <button 
                      onClick={() => resetUser(u.uid)}
                      style={{ background: 'transparent', color: '#FF3B30', border: '1px solid rgba(255, 59, 48, 0.4)', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Reset Data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#86868B' }}>No users found.</div>}
        </div>
      </div>
    </div>
  );
}
