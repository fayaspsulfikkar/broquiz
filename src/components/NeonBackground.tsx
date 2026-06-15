"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TUBE_COLORS = [
  '#ff2a00', // Intense Red
  '#ff5500', // Bright Orange
  '#ff9900', // Yellow Orange
  '#cc1100', // Deep Red
  '#ffbb33', // Soft Yellow
];

interface TubeProps {
  id: number;
  top: number; // percentage
  width: number; // vw
  color: string;
  duration: number; // seconds
  delay: number;
  initialX: number; // vw
  direction: 1 | -1;
  thickness: number; // px
}

export default function NeonBackground() {
  const [tubes, setTubes] = useState<TubeProps[]>([]);

  useEffect(() => {
    // Generate static tubes on the client to avoid hydration mismatch
    const generatedTubes: TubeProps[] = Array.from({ length: 9 }).map((_, i) => {
      return {
        id: i,
        top: Math.random() * 80 + 10, // 10% to 90% top
        width: Math.random() * 30 + 20, // 20vw to 50vw wide
        color: TUBE_COLORS[Math.floor(Math.random() * TUBE_COLORS.length)],
        duration: Math.random() * 25 + 25, // 25s to 50s very slow drift
        delay: Math.random() * 5,
        initialX: Math.random() * 80 - 10, // start somewhere on screen
        direction: Math.random() > 0.5 ? 1 : -1,
        thickness: Math.random() * 2 + 2, // 2px to 4px thick white-hot core
      };
    });
    setTubes(generatedTubes);
  }, []);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        backgroundColor: '#0c0604', // Very dark warm brown/black abyss matching Akari
        overflow: 'hidden',
        pointerEvents: 'none', // Don't block UI interactions
      }}
    >
      {/* Background Volumetric Ambient Glow removed for sharpness */}

      {tubes.map((tube) => {
        // Calculate the drift path. It slowly moves back and forth.
        const movementDistance = 50; // moves 50vw back and forth
        const xStart = `${tube.initialX}vw`;
        const xEnd = `${tube.initialX + (movementDistance * tube.direction)}vw`;
        
        return (
          <motion.div
            key={tube.id}
            initial={{ x: xStart, opacity: 0 }}
            animate={{ 
              x: [xStart, xEnd, xStart],
              opacity: [0.4, 0.8, 0.5, 0.9, 0.6], // Soft flickering neon effect
            }}
            transition={{
              x: {
                duration: tube.duration,
                repeat: Infinity,
                ease: "linear",
              },
              opacity: {
                duration: tube.duration / 6, // Flicker faster than it moves
                repeat: Infinity,
                ease: "easeInOut",
              }
            }}
            style={{
              position: 'absolute',
              top: `${tube.top}%`,
              width: `${tube.width}vw`,
              height: `${tube.thickness}px`,
              backgroundColor: '#fff', // White hot core
              borderRadius: '10px',
              // Multi-layered box shadow to create the massive soft volumetric glow
              boxShadow: `
                0 0 10px 2px ${tube.color},
                0 0 30px 10px ${tube.color},
                0 0 80px 40px ${tube.color},
                0 0 150px 80px ${tube.color}
              `,
            }}
          />
        );
      })}
    </div>
  );
}
