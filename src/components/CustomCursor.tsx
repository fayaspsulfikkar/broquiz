'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';

const CODE_STRING = "const magic = new Proxy(universe, { get: (target, prop) => transcend(prop) }); function materialize() { return quantum.compute(); } ";

type Particle = {
  x: number;
  y: number;
  char: string;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
};

export default function CustomCursor() {
  const [isClient, setIsClient] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastPosRef = useRef({ x: -100, y: -100 });
  const charIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setIsClient(true);

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Spawn a new character every 12 pixels
      if (dist > 12) {
        const char = CODE_STRING[charIndexRef.current];
        charIndexRef.current = (charIndexRef.current + 1) % CODE_STRING.length;

        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY + 20, // offset slightly below the cursor
          char,
          life: 1.0,
          maxLife: 1.0,
          vx: (Math.random() - 0.5) * 0.5,
          vy: Math.random() * 0.5 + 0.5, // drift downwards slightly
        });

        lastPosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    // Canvas animation loop
    const renderCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Match canvas size to window
          if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Update and draw particles
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.life -= 0.015; // fade out speed
            p.x += p.vx;
            p.y += p.vy;

            if (p.life <= 0) {
              particlesRef.current.splice(i, 1);
              continue;
            }

            // Gradient fade: Cyan to Red based on life
            // life=1 -> Cyan (0, 199, 255)
            // life=0 -> Red (255, 59, 48)
            const r = Math.floor(255 - (255 - 0) * p.life);
            const g = Math.floor(59 + (199 - 59) * p.life);
            const b = Math.floor(48 + (255 - 48) * p.life);

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.life})`;
            ctx.fillText(p.char, p.x, p.y);
          }
        }
      }
      rafRef.current = requestAnimationFrame(renderCanvas);
    };

    rafRef.current = requestAnimationFrame(renderCanvas);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cursorX, cursorY]);

  if (!isClient) return null;

  return (
    <>
      {/* Canvas for code trail */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9997,
        }}
      />

      {/* Wooden Stick Cursor */}
      <motion.div
        style={{
          position: 'fixed',
          left: cursorX,
          top: cursorY,
          pointerEvents: 'none',
          zIndex: 9999,
          // Shift so the tip of the stick is exactly at the cursor coordinate
          marginLeft: -2,
          marginTop: -2,
        }}
        animate={{
          scale: isHovering ? 1.2 : 1,
          rotate: isHovering ? 15 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.4))' }}
        >
          {/* Main Stick Shape */}
          <path 
            d="M2.5 2.5 L6 1 L30 25 L31 29 L29 31 L25 30 L1 6 Z" 
            fill="#8B4513" 
            stroke="#4A2500" 
            strokeWidth="1.5" 
            strokeLinejoin="round" 
          />
          {/* Wood Grain Detail 1 */}
          <path 
            d="M6 6 L26 26" 
            stroke="#663300" 
            strokeWidth="1" 
            strokeLinecap="round" 
            opacity="0.8"
          />
          {/* Wood Grain Detail 2 */}
          <path 
            d="M9 4 L29 24" 
            stroke="#663300" 
            strokeWidth="1" 
            strokeLinecap="round" 
            opacity="0.6"
          />
          {/* Wood Grain Detail 3 */}
          <path 
            d="M4 9 L24 29" 
            stroke="#663300" 
            strokeWidth="1" 
            strokeLinecap="round" 
            opacity="0.6"
          />
          {/* Wand Magic Tip Glow (optional, small dot at the top left) */}
          <circle cx="3" cy="3" r="2" fill="#00C7FF" opacity="0.8" />
        </svg>
      </motion.div>
    </>
  );
}
