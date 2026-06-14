"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type SpectatorState = 'idle' | 'moving' | 'suspicious' | 'angry';

export default function Spectator() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const [state, setState] = useState<SpectatorState>('idle');
  const [facingLeft, setFacingLeft] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);

  // Initialize random starting position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initX = Math.random() * (window.innerWidth - 100);
      const initY = Math.random() * (window.innerHeight - 100);
      setPosition({ x: initX, y: initY });
      setTarget({ x: initX, y: initY });
    }
  }, []);

  // Roaming logic
  useEffect(() => {
    if (state === 'suspicious' || state === 'angry') return; // Pause roaming when reacting

    const roamInterval = setInterval(() => {
      const newX = Math.random() * (window.innerWidth - 100) + 50;
      const newY = Math.random() * (window.innerHeight - 150) + 50;
      
      setFacingLeft(newX < position.x);
      setTarget({ x: newX, y: newY });
      setState('moving');

      setTimeout(() => {
        setState((currentState) => {
          if (currentState !== 'suspicious' && currentState !== 'angry') {
            return 'idle';
          }
          return currentState;
        });
      }, 3000); // Wait until movement finishes to go idle

    }, 5000); // Pick a new target every 5 seconds

    return () => clearInterval(roamInterval);
  }, [position.x, state]);

  // Anti-Cheat Reactions
  useEffect(() => {
    const triggerSuspicion = (msg: string) => {
      setState('suspicious');
      setSpeech(msg);
      setTimeout(() => {
        setSpeech(null);
        setState('idle');
      }, 4000);
    };

    const triggerAnger = (msg: string) => {
      setState('angry');
      setSpeech(msg);
      setTimeout(() => {
        setSpeech(null);
        setState('idle');
      }, 5000);
    };

    const handleCopy = () => triggerSuspicion("Hey! No copying allowed!");
    const handleContextMenu = (e: MouseEvent) => {
      // Don't block it here since global anti-cheat blocks it, just react
      triggerSuspicion("Are you trying to inspect?");
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left tab
      } else {
        // User returned
        triggerAnger("Where did you go?! Stay focused!");
      }
    };

    const handleBlur = () => {
      triggerAnger("Don't click away!");
    };

    window.addEventListener('copy', handleCopy);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // SVG configuration based on state
  const isMad = state === 'angry' || state === 'suspicious';
  const bodyColor = isMad ? 'rgba(255, 59, 48, 0.8)' : 'rgba(255, 255, 255, 0.7)';
  const eyeColor = isMad ? '#fff' : '#1D1D1F';
  const pupilColor = isMad ? '#000' : '#fff';

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50, // Floats above text
        pointerEvents: 'none', // Don't block clicks on answers
      }}
      animate={{
        x: target.x,
        y: target.y,
        scaleX: facingLeft ? -1 : 1, // Flip character
      }}
      transition={{
        x: { type: "spring", stiffness: 20, damping: 15 },
        y: { type: "spring", stiffness: 20, damping: 15 },
      }}
      onUpdate={(latest) => {
        // Track current position for orientation calculations
        const currentX = latest.x;
        if (typeof currentX === 'number') {
          setPosition(prev => ({ ...prev, x: currentX as number }));
        }
      }}
    >
      <div style={{ position: 'relative', width: 60, height: 60, transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)' }}>
        {/* Speech Bubble */}
        <AnimatePresence>
          {speech && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'absolute',
                top: -45,
                left: -20,
                width: 120,
                background: isMad ? '#FF3B30' : '#fff',
                color: isMad ? '#fff' : '#000',
                padding: '6px 10px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700,
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)' // un-flip text
              }}
            >
              <div style={{ transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)' }}>{speech}</div>
              <div style={{
                position: 'absolute',
                bottom: -4,
                left: '50%',
                marginLeft: -4,
                width: 8,
                height: 8,
                background: isMad ? '#FF3B30' : '#fff',
                transform: 'rotate(45deg)',
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Character SVG - A cute little floating blob */}
        <motion.div
          animate={
            state === 'moving' ? { y: [0, -10, 0] } : 
            state === 'angry' ? { x: [-2, 2, -2, 2, 0], y: [-2, 2, -2, 2, 0] } : 
            { y: [0, -4, 0] }
          }
          transition={{
            repeat: Infinity,
            duration: state === 'moving' ? 0.6 : state === 'angry' ? 0.2 : 2,
            ease: "easeInOut"
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10C25 10 10 30 10 55C10 80 25 90 25 90C25 90 35 85 50 85C65 85 75 90 75 90C75 90 90 80 90 55C90 30 75 10 50 10Z" fill={bodyColor}/>
            
            {/* Eyes */}
            {state === 'angry' ? (
              <>
                <path d="M 25 40 L 45 45" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" />
                <path d="M 75 40 L 55 45" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" />
                <circle cx="35" cy="50" r="4" fill={eyeColor}/>
                <circle cx="65" cy="50" r="4" fill={eyeColor}/>
              </>
            ) : state === 'suspicious' ? (
              <>
                <line x1="25" y1="42" x2="45" y2="42" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" />
                <line x1="55" y1="42" x2="75" y2="42" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" />
                <circle cx="35" cy="46" r="3" fill={eyeColor}/>
                <circle cx="65" cy="46" r="3" fill={eyeColor}/>
              </>
            ) : (
              <>
                <circle cx="35" cy="45" r="6" fill={eyeColor}/>
                <circle cx="37" cy="43" r="2" fill={pupilColor}/>
                <circle cx="65" cy="45" r="6" fill={eyeColor}/>
                <circle cx="67" cy="43" r="2" fill={pupilColor}/>
              </>
            )}

            {/* Mouth */}
            {state === 'idle' && <path d="M 45 60 Q 50 65 55 60" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" fill="none"/>}
            {state === 'moving' && <circle cx="50" cy="62" r="3" fill={eyeColor}/>}
            {(state === 'angry' || state === 'suspicious') && <path d="M 45 65 Q 50 60 55 65" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" fill="none"/>}
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}
