"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type SpectatorState = 'idle' | 'moving' | 'suspicious' | 'angry';

export default function Spectator() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const [state, setState] = useState<SpectatorState>('idle');
  const [facingLeft, setFacingLeft] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const [blink, setBlink] = useState(false);

  // Use a ref to track mouse globally without triggering re-renders
  const mousePos = useRef({ x: 0, y: 0 });

  // Initialize random starting position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initX = Math.random() * (window.innerWidth - 100);
      const initY = Math.random() * (window.innerHeight - 100);
      setPosition({ x: initX, y: initY });
      setTarget({ x: initX, y: initY });
    }
  }, []);

  // Blinking logic
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150); // Fast blink
    }, Math.random() * 3000 + 2000); // Blink every 2-5s
    return () => clearInterval(blinkInterval);
  }, []);

  // Organic Roaming logic
  useEffect(() => {
    if (state === 'suspicious' || state === 'angry') return; // Pause roaming when reacting

    const roamInterval = setInterval(() => {
      // Pick a nearby target instead of crossing the screen, simulating swimming
      const deltaX = (Math.random() - 0.5) * 300;
      const deltaY = (Math.random() - 0.5) * 200;
      
      let newX = position.x + deltaX;
      let newY = position.y + deltaY;

      // Clamp to screen bounds
      newX = Math.max(50, Math.min(newX, window.innerWidth - 100));
      newY = Math.max(50, Math.min(newY, window.innerHeight - 150));
      
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
      }, 1500);

    }, 2000); // Update path frequently

    return () => clearInterval(roamInterval);
  }, [position.x, position.y, state]);

  // Anti-Cheat Reactions & Mouse Tracking
  useEffect(() => {
    const trackMouse = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    const swoopToCursor = (msg: string, isAngry = false) => {
      // Offset slightly so it hovers next to the cursor instead of exactly under it
      const attackX = mousePos.current.x - 30;
      const attackY = mousePos.current.y - 80;
      
      setFacingLeft(attackX < position.x);
      setTarget({ x: attackX, y: attackY });
      setState(isAngry ? 'angry' : 'suspicious');
      setSpeech(msg);

      setTimeout(() => {
        setSpeech(null);
        setState('idle');
      }, isAngry ? 5000 : 3500);
    };

    const handleCopy = () => swoopToCursor("Hey! No copying allowed!");
    const handleSelectStart = (e: Event) => {
      // Only react sometimes to selection to avoid spam, or react on drag
      if (Math.random() > 0.5) swoopToCursor("What are you highlighting?");
    };
    const handleContextMenu = () => swoopToCursor("Are you trying to inspect?");
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Return to center of screen roughly when coming back
        setTarget({ x: window.innerWidth / 2 - 50, y: window.innerHeight / 2 - 50 });
        swoopToCursor("Where did you go?! Stay focused!", true);
      }
    };

    const handleBlur = () => {
      swoopToCursor("Don't click away!", true);
    };

    window.addEventListener('mousemove', trackMouse);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('mousemove', trackMouse);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [position.x]);

  const isMad = state === 'angry' || state === 'suspicious';
  const bodyColor = isMad ? 'rgba(255, 59, 48, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const eyeColor = isMad ? '#fff' : '#1D1D1F';
  const pupilColor = isMad ? '#000' : '#fff';

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100, // Floats above everything
        pointerEvents: 'none', // Don't block clicks on answers
        filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.4))'
      }}
      animate={{
        x: target.x,
        y: target.y,
        scaleX: facingLeft ? -1 : 1, // Flip character
      }}
      transition={{
        // Smooth but quick spring for cursor swooping, gentler spring for roaming
        x: { type: "spring", stiffness: isMad ? 60 : 25, damping: isMad ? 12 : 20, mass: 1 },
        y: { type: "spring", stiffness: isMad ? 60 : 25, damping: isMad ? 12 : 20, mass: 1 },
      }}
      onUpdate={(latest) => {
        // Track current position for orientation calculations
        const currentX = latest.x;
        const currentY = latest.y;
        if (typeof currentX === 'number' && typeof currentY === 'number') {
          setPosition({ x: currentX, y: currentY });
        }
      }}
    >
      {/* Container squashes and breathes */}
      <motion.div 
        style={{ position: 'relative', width: 70, height: 80, transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)' }}
        animate={
          state === 'moving' ? { scaleY: [1, 0.95, 1], scaleX: [1, 1.05, 1] } : 
          state === 'angry' ? { scaleY: [1, 0.9, 1.1, 1], x: [-3, 3, -3, 3, 0] } : 
          { scaleY: [1, 0.98, 1] } // gentle breathing when idle
        }
        transition={{
          repeat: Infinity,
          duration: state === 'moving' ? 1.5 : state === 'angry' ? 0.3 : 3,
          ease: "easeInOut"
        }}
      >
        {/* Speech Bubble */}
        <AnimatePresence>
          {speech && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'absolute',
                top: -55,
                left: -20,
                width: 140,
                background: isMad ? '#FF3B30' : '#fff',
                color: isMad ? '#fff' : '#000',
                padding: '8px 12px',
                borderRadius: 12,
                fontSize: 12,
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

        {/* Jelly Blob SVG */}
        <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          {/* Main Body (Domed Blob) */}
          <path d="M50 10 C20 10 10 30 10 60 C10 85 20 90 50 90 C80 90 90 85 90 60 C90 30 80 10 50 10 Z" fill={bodyColor}/>
          
          {/* Wiggling Tentacles */}
          <motion.path 
            d="M 25 88 Q 20 110 30 115" stroke={bodyColor} strokeWidth="12" strokeLinecap="round" fill="none"
            animate={{ d: ["M 25 88 Q 20 110 30 115", "M 25 88 Q 30 110 20 115", "M 25 88 Q 20 110 30 115"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
          <motion.path 
            d="M 50 88 Q 45 115 55 120" stroke={bodyColor} strokeWidth="14" strokeLinecap="round" fill="none"
            animate={{ d: ["M 50 88 Q 45 115 55 120", "M 50 88 Q 55 115 45 120", "M 50 88 Q 45 115 55 120"] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.2 }}
          />
          <motion.path 
            d="M 75 88 Q 80 110 70 115" stroke={bodyColor} strokeWidth="12" strokeLinecap="round" fill="none"
            animate={{ d: ["M 75 88 Q 80 110 70 115", "M 75 88 Q 70 110 80 115", "M 75 88 Q 80 110 70 115"] }}
            transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut", delay: 0.4 }}
          />
          
          {/* Face */}
          {!blink ? (
            state === 'angry' ? (
              // Angry Eyes
              <>
                <path d="M 25 45 L 45 50" stroke={eyeColor} strokeWidth="5" strokeLinecap="round" />
                <path d="M 75 45 L 55 50" stroke={eyeColor} strokeWidth="5" strokeLinecap="round" />
                <circle cx="35" cy="55" r="5" fill={eyeColor}/>
                <circle cx="65" cy="55" r="5" fill={eyeColor}/>
              </>
            ) : state === 'suspicious' ? (
              // Suspicious Squint
              <>
                <line x1="25" y1="48" x2="45" y2="48" stroke={eyeColor} strokeWidth="5" strokeLinecap="round" />
                <line x1="55" y1="48" x2="75" y2="48" stroke={eyeColor} strokeWidth="5" strokeLinecap="round" />
                <circle cx="35" cy="52" r="4" fill={eyeColor}/>
                <circle cx="65" cy="52" r="4" fill={eyeColor}/>
              </>
            ) : (
              // Big Cute Eyes
              <>
                <circle cx="35" cy="50" r="8" fill={eyeColor}/>
                <circle cx="37" cy="48" r="3" fill={pupilColor}/>
                <circle cx="65" cy="50" r="8" fill={eyeColor}/>
                <circle cx="67" cy="48" r="3" fill={pupilColor}/>
              </>
            )
          ) : (
            // Blink (closed eyes)
            <>
              <path d="M 25 50 Q 35 45 45 50" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" fill="none"/>
              <path d="M 55 50 Q 65 45 75 50" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" fill="none"/>
            </>
          )}

          {/* Mouth */}
          {state === 'idle' && <path d="M 45 65 Q 50 72 55 65" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" fill="none"/>}
          {state === 'moving' && <circle cx="50" cy="68" r="4" fill={eyeColor}/>}
          {(state === 'angry' || state === 'suspicious') && <path d="M 45 72 Q 50 65 55 72" stroke={eyeColor} strokeWidth="4" strokeLinecap="round" fill="none"/>}
        </svg>
      </motion.div>
    </motion.div>
  );
}
