'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [isClient, setIsClient] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Use motion values for better performance (avoids React re-renders on every mouse move)
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth springing for the outer ring
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    setIsClient(true);

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if hovering over a clickable element
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

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  if (!isClient) return null;

  return (
    <>
      {/* Small dot (immediate tracking) */}
      <motion.div
        style={{
          position: 'fixed',
          left: cursorX,
          top: cursorY,
          width: 8,
          height: 8,
          marginLeft: -4,
          marginTop: -4,
          backgroundColor: 'var(--color-text-primary)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        animate={{
          scale: isHovering ? 0 : 1, // Shrink dot when hovering over clickable items
          opacity: isHovering ? 0 : 1,
        }}
        transition={{ duration: 0.2 }}
      />

      {/* Outer trailing ring */}
      <motion.div
        style={{
          position: 'fixed',
          left: cursorXSpring,
          top: cursorYSpring,
          width: 32,
          height: 32,
          marginLeft: -16,
          marginTop: -16,
          border: '2px solid var(--color-text-primary)',
          backgroundColor: isHovering ? 'rgba(29, 29, 31, 0.1)' : 'transparent',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9998,
        }}
        animate={{
          scale: isHovering ? 1.5 : 1, // Expand ring when hovering over clickable items
        }}
        transition={{ duration: 0.2 }}
      />
    </>
  );
}
