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
  const pokes = useRef(0);
  const pokeTimer = useRef<NodeJS.Timeout | null>(null);

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

  const handlePoke = () => {
    pokes.current += 1;
    
    // Run away to a random spot
    const newX = Math.max(50, Math.random() * (window.innerWidth - 150));
    const newY = Math.max(50, Math.random() * (window.innerHeight - 200));
    
    setFacingLeft(newX < position.x);
    setTarget({ x: newX, y: newY });

    if (pokes.current >= 4) {
      setState('angry');
      const angryMessages = ["Stop poking me!", "Do your quiz!", "Quit chasing me!", "I'm not a toy!"];
      setSpeech(angryMessages[Math.floor(Math.random() * angryMessages.length)]);
      setTimeout(() => {
        setSpeech(null);
        setState('idle');
      }, 3000);
    } else {
      setState('moving');
      if (pokes.current === 2) {
        setSpeech("Hey!");
        setTimeout(() => setSpeech(null), 1000);
      }
    }

    if (pokeTimer.current) clearTimeout(pokeTimer.current);
    pokeTimer.current = setTimeout(() => {
      pokes.current = 0;
    }, 5000); // reset if left alone
  };

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
        style={{ position: 'relative', width: 80, height: 80, transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)', pointerEvents: 'auto', cursor: 'grab' }}
        onMouseEnter={handlePoke}
        onClick={handlePoke}
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

        {/* Antenna & Thruster (SVG in background) */}
        <svg viewBox="0 0 80 100" style={{ position: 'absolute', top: -10, left: 0, width: '100%', height: 120, zIndex: 0 }}>
          {/* Antenna */}
          <path d="M 40 30 L 40 15" stroke={isMad ? 'rgba(255, 59, 48, 0.5)' : 'rgba(255,255,255,0.3)'} strokeWidth="3" strokeLinecap="round" />
          <motion.circle 
            cx="40" cy="15" r="4" fill={isMad ? '#FF3B30' : '#00C7FF'} 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />

          {/* Thruster Nozzle */}
          <path d="M 30 75 L 50 75 L 45 85 L 35 85 Z" fill="rgba(0,0,0,0.6)" />

          {/* Thruster Flame (Animated) */}
          <motion.path 
            d="M 35 85 C 35 100 40 115 40 115 C 40 115 45 100 45 85 Z" 
            fill={isMad ? '#FF3B30' : '#00C7FF'}
            animate={{ 
              scaleY: state === 'moving' ? [1, 1.5, 1] : [0.8, 1.1, 0.8],
              opacity: state === 'moving' ? [0.8, 1, 0.8] : [0.4, 0.8, 0.4]
            }}
            transition={{ repeat: Infinity, duration: state === 'moving' ? 0.08 : 0.3 }}
            style={{ transformOrigin: '50% 85px' }}
          />
        </svg>

        {/* Glassmorphism Chassis (Foreground) */}
        <div 
          className="glass"
          style={{
             position: 'absolute',
             top: 25, left: 0, width: 80, height: 50,
             borderRadius: '40px', // pill shape
             background: isMad ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 255, 255, 0.05)',
             border: isMad ? '1px solid rgba(255, 59, 48, 0.4)' : '1px solid rgba(255,255,255,0.2)',
             boxShadow: isMad ? '0 0 20px rgba(255, 59, 48, 0.3), inset 0 0 10px rgba(255,59,48,0.2)' : '0 10px 30px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.1)',
             zIndex: 1,
             display: 'flex', alignItems: 'center', justifyContent: 'center',
             backdropFilter: 'blur(12px)',
             WebkitBackdropFilter: 'blur(12px)'
          }}
        >
           {/* Inner Visor */}
           <div style={{
              width: 50, height: 22, borderRadius: 11,
              background: 'rgba(0,0,0,0.5)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.2)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
           }}>
              {/* Visor Expressions (SVG) */}
              <svg viewBox="0 0 50 22" style={{ width: '100%', height: '100%' }}>
                {!blink ? (
                  state === 'angry' ? (
                    <>
                      <path d="M 12 6 L 20 10" stroke="#FF3B30" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 38 6 L 30 10" stroke="#FF3B30" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="16" cy="14" r="3" fill="#FF3B30" filter="drop-shadow(0 0 4px #FF3B30)"/>
                      <circle cx="34" cy="14" r="3" fill="#FF3B30" filter="drop-shadow(0 0 4px #FF3B30)"/>
                    </>
                  ) : state === 'suspicious' ? (
                    <>
                      <line x1="12" y1="11" x2="22" y2="11" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" filter="drop-shadow(0 0 4px #FF3B30)"/>
                      <line x1="28" y1="11" x2="38" y2="11" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" filter="drop-shadow(0 0 4px #FF3B30)"/>
                    </>
                  ) : (
                    <>
                      <circle cx="16" cy="11" r="4" fill="#00C7FF" filter="drop-shadow(0 0 4px #00C7FF)"/>
                      <circle cx="34" cy="11" r="4" fill="#00C7FF" filter="drop-shadow(0 0 4px #00C7FF)"/>
                    </>
                  )
                ) : (
                  <>
                    <line x1="12" y1="11" x2="22" y2="11" stroke="#00C7FF" strokeWidth="2" strokeLinecap="round" />
                    <line x1="28" y1="11" x2="38" y2="11" stroke="#00C7FF" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </svg>
           </div>
           
           {/* Glass reflections */}
           <div style={{
              position: 'absolute', top: 2, left: '10%', width: '80%', height: '30%',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
              borderRadius: '20px 20px 0 0', pointerEvents: 'none'
           }} />
        </div>
      </motion.div>
    </motion.div>
  );
}
