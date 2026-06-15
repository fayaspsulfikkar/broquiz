'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QUESTION_TYPE_LABELS } from '@/lib/constants';
import type { Question } from '@/types';

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      alert('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    setIsSaving(true);
    try {
      const questionData = {
        ...editingQuestion,
        status: 'approved',
        source: 'admin',
        times_shown: editingQuestion.times_shown || 0,
        correct_count: editingQuestion.correct_count || 0,
        hash: editingQuestion.hash || Math.random().toString(36).substring(7),
      };

      if (editingQuestion.id) {
        // Update
        await updateDoc(doc(db, 'questions', editingQuestion.id), questionData);
      } else {
        // Create
        const newDocRef = doc(collection(db, 'questions'));
        questionData.id = newDocRef.id;
        await setDoc(newDocRef, questionData);
      }

      await fetchQuestions();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete question');
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) throw new Error('JSON must be an array of questions');

        setIsSaving(true);
        // Firestore batches can hold up to 500 operations
        // If they upload > 500, we should split it.
        const chunks = [];
        for (let i = 0; i < json.length; i += 400) {
          chunks.push(json.slice(i, i + 400));
        }

        for (const chunk of chunks) {
          const batch = writeBatch(db);
          for (const q of chunk) {
            const docRef = doc(collection(db, 'questions'));
            batch.set(docRef, {
              ...q,
              id: docRef.id,
              status: 'approved',
              source: 'admin',
              times_shown: 0,
              correct_count: 0,
              hash: Math.random().toString(36).substring(7),
            });
          }
          await batch.commit();
        }

        alert(`Successfully uploaded ${json.length} questions!`);
        fetchQuestions();
      } catch (err: any) {
        alert('Bulk upload failed: ' + err.message);
      } finally {
        setIsSaving(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (!confirm('WARNING: This will delete ALL questions in the database. Are you absolutely sure?')) return;
    
    setIsSaving(true);
    try {
      const snapshot = await getDocs(collection(db, 'questions'));
      const docs = snapshot.docs;
      
      const chunks = [];
      for (let i = 0; i < docs.length; i += 400) {
        chunks.push(docs.slice(i, i + 400));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        for (const d of chunk) {
          batch.delete(d.ref);
        }
        await batch.commit();
      }

      alert('All questions deleted.');
      setQuestions([]);
    } catch (err) {
      console.error(err);
      alert('Failed to clear questions');
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingQuestion({
      level: 1,
      type: 'mcq',
      topic_tag: 'variables' as any,
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: '',
    });
    setIsModalOpen(true);
  };

  const filtered = questions
    .filter((q) => filterLevel === 'all' || q.level === Number(filterLevel))
    .filter((q) => filterType === 'all' || q.type === filterType);

  return (
    <div style={{ padding: '32px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1D1D1F' }}>Question Bank</h1>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
            {isSaving ? 'Uploading...' : '📁 Bulk Upload JSON'}
          </button>
          <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleBulkUpload} />
          
          <button className="btn-secondary" onClick={handleClearAll} style={{ color: '#FF3B30', borderColor: '#FF3B30' }} disabled={isSaving}>
            🗑️ Clear All
          </button>
          <button className="btn-primary" onClick={openAddModal} disabled={isSaving}>
            + Add Question
          </button>
        </div>
      </div>

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
          {filtered.length} questions
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#6E6E73' }}>Loading question bank...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6E6E73' }}>
          No questions found. Add some questions!
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: '#F5F5F7', fontSize: 11, fontWeight: 600, color: '#6E6E73' }}>
                      Level {q.level}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: '#F5F5F7', fontSize: 11, fontWeight: 600, color: '#6E6E73' }}>
                      {QUESTION_TYPE_LABELS[q.type as keyof typeof QUESTION_TYPE_LABELS] || q.type}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: '#F5F5F7', fontSize: 11, fontWeight: 600, color: '#6E6E73' }}>
                      {q.topic_tag}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#86868B', alignItems: 'center' }}>
                    <span>Shown: {q.times_shown}</span>
                    <span>Pass: {passRate}%</span>
                    <button onClick={() => { setEditingQuestion(q); setIsModalOpen(true); }} style={{ background: 'none', border: 'none', color: '#0071E3', cursor: 'pointer', fontWeight: 500 }}>Edit</button>
                    <button onClick={() => handleDelete(q.id)} style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
                  </div>
                </div>
                <div style={{ fontSize: 15, color: '#1D1D1F', lineHeight: 1.5, fontWeight: 500, marginBottom: 8 }}>
                  {q.question}
                </div>
                {q.code_snippet && (
                  <pre style={{ background: '#F5F5F7', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
                    {q.code_snippet}
                  </pre>
                )}
                <div style={{ fontSize: 13, color: '#34C759', fontWeight: 500 }}>
                  Ans: {Array.isArray(q.correct_answer) ? q.correct_answer.join(', ') : q.correct_answer}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      
        {isModalOpen && editingQuestion && (
          <div style={{
            position: 'fixed', inset: 0, background: 'var(--color-bg-secondary)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}>
            <div
              style={{
                background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600,
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8E8ED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 20, fontWeight: 600 }}>{editingQuestion.id ? 'Edit Question' : 'Add Question'}</h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              
              <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
                <form id="question-form" onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Level</label>
                      <select className="input" value={editingQuestion.level} onChange={(e) => setEditingQuestion({...editingQuestion, level: Number(e.target.value)})} required>
                        <option value={1}>Level 1</option>
                        <option value={2}>Level 2</option>
                        <option value={3}>Level 3</option>
                        <option value={4}>Level 4</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Type</label>
                      <select className="input" value={editingQuestion.type} onChange={(e) => setEditingQuestion({...editingQuestion, type: e.target.value as any})} required>
                        <option value="mcq">MCQ</option>
                        <option value="multiple_select">Multiple Select</option>
                        <option value="fill_blank">Fill in Blank</option>
                        <option value="code_output">Code Output</option>
                        <option value="debugging">Debugging</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Topic Tag</label>
                    <input className="input" value={editingQuestion.topic_tag || ''} onChange={(e) => setEditingQuestion({...editingQuestion, topic_tag: e.target.value as any})} placeholder="e.g. arrays, variables, loops" required />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Question Text</label>
                    <textarea className="input" value={editingQuestion.question || ''} onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})} style={{ minHeight: 80 }} required />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Code Snippet (Optional)</label>
                    <textarea className="input" value={editingQuestion.code_snippet || ''} onChange={(e) => setEditingQuestion({...editingQuestion, code_snippet: e.target.value})} style={{ minHeight: 80, fontFamily: 'monospace' }} placeholder="def hello():\n  pass" />
                  </div>

                  {['mcq', 'multiple_select', 'code_output', 'debugging'].includes(editingQuestion.type || '') && (
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Options (Comma or JSON array string)</label>
                      <textarea 
                        className="input" 
                        value={Array.isArray(editingQuestion.options) ? JSON.stringify(editingQuestion.options) : (editingQuestion.options || '')} 
                        onChange={(e) => {
                          try {
                            setEditingQuestion({...editingQuestion, options: JSON.parse(e.target.value)});
                          } catch {
                            setEditingQuestion({...editingQuestion, options: e.target.value.split(',').map(s => s.trim()) as any});
                          }
                        }} 
                        style={{ minHeight: 60 }} 
                        placeholder='["Option 1", "Option 2"] or Option 1, Option 2' 
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Correct Answer</label>
                    <input 
                      className="input" 
                      value={Array.isArray(editingQuestion.correct_answer) ? JSON.stringify(editingQuestion.correct_answer) : (editingQuestion.correct_answer || '')} 
                      onChange={(e) => {
                        try {
                          setEditingQuestion({...editingQuestion, correct_answer: JSON.parse(e.target.value)});
                        } catch {
                          setEditingQuestion({...editingQuestion, correct_answer: e.target.value});
                        }
                      }} 
                      placeholder="Exact text of the correct option(s)" 
                      required 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Explanation</label>
                    <textarea className="input" value={editingQuestion.explanation || ''} onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})} style={{ minHeight: 60 }} required />
                  </div>
                </form>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #E8E8ED', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" form="question-form" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Question'}
                </button>
              </div>
            </div>
          </div>
        )}
      
    </div>
  );
}
