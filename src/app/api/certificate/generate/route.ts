// ============================================
// BroQuiz — Certificate Generation API
// POST /api/certificate/generate
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LEVELS } from '@/lib/constants';

function generateVerificationId(userId: string, level: number) {
  const shortUid = userId.substring(0, 6).toUpperCase();
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `CQ-${shortUid}-L${level}-${randomChars}${timestamp}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, level } = body;

    if (!userId || !level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user exists and passed the level
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const levelKey = `level_${level}`;
    const levelProgress = userData.levels?.[levelKey];

    if (!levelProgress || !levelProgress.passed) {
      return NextResponse.json({ error: 'User has not passed this level' }, { status: 403 });
    }

    // Check if certificate already exists
    const certQuery = query(
      collection(db, 'certificates'),
      where('user_id', '==', userId),
      where('level', '==', level)
    );
    const certSnapshot = await getDocs(certQuery);
    
    let verificationId = '';

    if (!certSnapshot.empty) {
      // Return existing certificate ID
      verificationId = certSnapshot.docs[0].id;
    } else {
      // Create new certificate
      verificationId = generateVerificationId(userId, level);
      const levelDef = LEVELS.find((l) => l.id === level);
      
      const certData = {
        verification_id: verificationId,
        user_id: userId,
        user_name: userData.name || 'Anonymous Learner',
        level: level,
        level_name: levelDef?.name || `Level ${level}`,
        score: levelProgress.best_score,
        date: new Date().toISOString(),
        valid: true,
      };

      await setDoc(doc(db, 'certificates', verificationId), certData);
    }

    return NextResponse.json({ verification_id: verificationId });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
