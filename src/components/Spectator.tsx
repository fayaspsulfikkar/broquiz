"use client";

import React, { useEffect, useState, useRef } from 'react';

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
    // Prevent running away if it's currently lecturing the user (e.g. from a right click)
    if (state === 'suspicious' || state === 'angry') return;

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
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100, // Floats above everything
        pointerEvents: 'none', // Don't block clicks on answers
        transform: `translate(${target.x}px, ${target.y}px) scaleX(${facingLeft ? -1 : 1})`,
      }}
    >
      {/* Container squashes and breathes */}
      <div 
        style={{ position: 'relative', width: 80, height: 80, pointerEvents: 'auto', cursor: 'grab' }}
        onMouseEnter={handlePoke}
        onClick={handlePoke}
      >
        {/* Speech Bubble */}
        
          {speech && (
            <div
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
            </div>
          )}
        

        {/* High-Tech Drone SVG (2D) */}
        <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
          {/* Antenna */}
          <path d="M 50 20 L 50 5" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
          <circle 
            cx="50" cy="5" r="4" fill={isMad ? '#FF3B30' : '#00C7FF'}
          />
          
          {/* Main Chassis */}
          <path d="M 20 50 C 20 25 80 25 80 50 C 80 70 70 80 50 80 C 30 80 20 70 20 50 Z" fill={bodyColor} />
          
          {/* Stabilizer Fins */}
          <path d="M 20 40 L 5 45 L 20 60 Z" fill={bodyColor} />
          <path d="M 80 40 L 95 45 L 80 60 Z" fill={bodyColor} />

          {/* Digital Visor */}
          <rect x="25" y="35" width="50" height="25" rx="12" fill="#1D1D1F" />
          
          {/* Visor Expressions */}
          {!blink ? (
            state === 'angry' ? (
              // Angry Eyes
              <>
                <path d="M 35 42 L 45 47" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" />
                <path d="M 65 42 L 55 47" stroke="#FF3B30" strokeWidth="3" strokeLinecap="round" />
                <circle cx="40" cy="52" r="3" fill="#FF3B30"/>
                <circle cx="60" cy="52" r="3" fill="#FF3B30"/>
              </>
            ) : state === 'suspicious' ? (
              // Suspicious Squint
              <>
                <line x1="30" y1="48" x2="45" y2="48" stroke="#FF3B30" strokeWidth="4" strokeLinecap="round" />
                <line x1="55" y1="48" x2="70" y2="48" stroke="#FF3B30" strokeWidth="4" strokeLinecap="round" />
              </>
            ) : (
              // Neutral / Happy Eyes (Cyan)
              <>
                <circle cx="38" cy="48" r="5" fill="#00C7FF"/>
                <circle cx="62" cy="48" r="5" fill="#00C7FF"/>
              </>
            )
          ) : (
            // Blink (Horizontal line)
            <>
              <line x1="30" y1="48" x2="46" y2="48" stroke="#00C7FF" strokeWidth="3" strokeLinecap="round" />
              <line x1="54" y1="48" x2="70" y2="48" stroke="#00C7FF" strokeWidth="3" strokeLinecap="round" />
            </>
          )}

          {/* Thruster Nozzle */}
          <path d="M 40 80 L 60 80 L 55 90 L 45 90 Z" fill="#1D1D1F" />

          {/* Thruster Flame (Static) */}
          <path 
            d="M 45 90 C 45 100 50 120 50 120 C 50 120 55 100 55 90 Z" 
            fill={isMad ? '#FF3B30' : '#00C7FF'}
          />
        </svg>
      </div>
    </div>
  );
}
