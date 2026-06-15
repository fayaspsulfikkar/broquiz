'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useVelocity, useSpring, useTransform } from 'framer-motion';

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

  // Physics Drag logic
  const velocityX = useVelocity(cursorX);
  const smoothVelocity = useSpring(velocityX, { damping: 15, stiffness: 200 });
  // Map horizontal velocity (-2000 to 2000) to a rotation angle (45 to -45)
  const physicsRotation = useTransform(smoothVelocity, [-2000, 2000], [45, -45]);

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

      {/* Magic Wand Cursor */}
      <motion.div
        style={{
          position: 'fixed',
          left: cursorX,
          top: cursorY,
          pointerEvents: 'none',
          zIndex: 9999,
          // Shift so the crystal tip is exactly at the cursor coordinate (4, 4)
          marginLeft: -4,
          marginTop: -4,
          rotate: physicsRotation, // Apply physics drag
          transformOrigin: '4px 4px', // Pivot EXACTLY around the mouse pointer
        }}
      >
        <motion.div
          animate={{
            scale: isHovering ? 1.2 : 1,
            rotate: isHovering ? 15 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ transformOrigin: '4px 4px' }}
        >
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 32 32" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            style={{ filter: 'drop-shadow(0px 0px 8px rgba(0, 199, 255, 0.8))' }}
          >
            {/* Dark slim staff */}
            <path d="M4 4 L28 28" stroke="#1D1D1F" strokeWidth="4" strokeLinecap="round" />
            
            {/* Silver inner core */}
            <path d="M5 5 L27 27" stroke="#E8E8ED" strokeWidth="1" strokeLinecap="round" />
            
            {/* Gold Handle Details */}
            <path d="M18 18 L22 22 M20 16 L24 20 M22 14 L26 18 M24 12 L28 16" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
            
            {/* The Magic Crystal Tip centered precisely at (4,4) */}
            <path d="M0 4 L4 0 L8 4 L4 8 Z" fill="#00C7FF" />
            <path d="M2 4 L4 2 L6 4 L4 6 Z" fill="#FFFFFF" />
          </svg>
        </motion.div>
      </motion.div>
    </>
  );
}
