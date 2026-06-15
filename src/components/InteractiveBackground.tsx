'use client';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function InteractiveBackground() {
  const [isClient, setIsClient] = useState(false);

  // Mouse normalized from -1 to 1
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Bouncy, snappy spring configuration
  const springConfig = { damping: 15, stiffness: 120, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Deep Parallax Translation (sweeps across the screen)
  const translateX = useTransform(smoothX, [-1, 1], [-100, 100]);
  const translateY = useTransform(smoothY, [-1, 1], [-100, 100]);

  // 3D Tilt Rotation (gives it a "room" feeling)
  const rotateX = useTransform(smoothY, [-1, 1], [8, -8]);
  const rotateY = useTransform(smoothX, [-1, 1], [-8, 8]);
  
  // Slight Zoom scale based on how far the mouse is from center (breathes in/out)
  const scaleTransform = useTransform(
    [smoothX, smoothY], 
    ([x, y]: [number, number]) => {
      const distance = Math.sqrt(x * x + y * y); // 0 to ~1.414
      return 1 + (distance * 0.05); // Scales up slightly as you move to edges
    }
  );

  useEffect(() => {
    setIsClient(true);
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized mouse position (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isClient) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, perspective: 1200, pointerEvents: 'none' }}>
      <motion.div
        style={{
          position: 'absolute',
          // Give massive bleed borders so the edges never show during extreme tilt/parallax
          top: -300,
          left: -300,
          right: -300,
          bottom: -300,
          x: translateX,
          y: translateY,
          rotateX,
          rotateY,
          scale: scaleTransform,
          transformStyle: 'preserve-3d',
          background: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAABnSURBVHja7M5RDYAwDEXRDgmvEocnlrQS2SwUFST9uEfBGWs9c97nbGtDcquqiKhOImLs/UpuzVzWEi1atGjRokWLFi1atGjRokWLFi1atGjRokWLFi1af7Ukz8xWp8z8AAAA//8DAJ4LoEAAlL1nAAAAAElFTkSuQmCC') repeat 0 0",
          animation: 'bg-scrolling-reverse 0.92s infinite linear',
          opacity: 0.5, // soften the grid to make it classy
        }}
      />
    </div>
  );
}
