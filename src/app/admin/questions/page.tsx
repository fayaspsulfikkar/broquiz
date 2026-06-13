'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QUESTION_TYPE_LABELS } from '@/lib/constants';
import type { Question } from '@/types';

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'questions'));
      const data: Question[] = [];
      snapshot.forEach((d) => data.push({ id: d.id, ...d.data() } as Question));
      setQuestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = questions
    .filter((q) => filterLevel === 'all' || q.level === Number(filterLevel))
    .filter((q) => filterType === 'all' || q.type === filterType);

  return (
    <div style={{ padding: '32px 32px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F', marginBottom: 24 }}>Question Bank</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="input" style={{ width: 'auto' }}>
          <option value="all">All Levels</option>
          <option value="1">Level 1</option>
          <option value="2">Level 2</option>
          <option value="3">Level 3</option>
          <option value="4">Level 4</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input" style={{ width: 'auto' }}>
          <option value="all">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="multiple_select">Multiple Select</option>
          <option value="fill_blank">Fill in Blank</option>
          <option value="code_output">Code Output</option>
          <option value="debugging">Debugging</option>
        </select>
        <div style={{ flex: 1, textAlign: 'right', fontSize: 13, color: '#86868B', alignSelf: 'center' }}>
          {filtered.length} questions in bank
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#6E6E73' }}>Loading question bank...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6E6E73' }}>
          No questions found. Questions are generated when users take quizzes.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((q) => {
            const passRate = q.times_shown > 0 ? Math.round((q.correct_count / q.times_shown) * 100) : 0;
            return (
              <div key={q.id} style={{
                background: '#fff', borderRadius: 12, padding: 20,
                border: '1px solid #E8E8ED',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: '#F5F5F7', fontSize: 11, fontWeight: 600, color: '#6E6E73' }}>
                      Level {q.level}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: '#F5F5F7', fontSize: 11, fontWeight: 600, color: '#6E6E73' }}>
                      {QUESTION_TYPE_LABELS[q.type]}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: '#F5F5F7', fontSize: 11, fontWeight: 600, color: '#6E6E73' }}>
                      {q.topic_tag}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#86868B' }}>
                    <span>Shown: {q.times_shown}</span>
                    <span>Pass: {passRate}%</span>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: '#1D1D1F', lineHeight: 1.5 }}>
                  {q.question.substring(0, 200)}{q.question.length > 200 ? '...' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
