"use client";

import React, { useEffect, useRef } from 'react';

export default function CheckeredBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 }); // Start off-screen

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Grid configuration
    const CELL_SIZE = 40; // Base size of the boxes
    const MAX_DISTANCE = 200; // Radius of mouse interaction
    const MAX_SCALE = 1.5; // How much they pop out towards the cursor
    const LERP_SPEED = 0.12; // Lower = smoother/slower, Higher = snappier

    // Resize handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      // Move interaction far away when mouse leaves window
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    // Track the current scale of every active box for smooth physics lerping
    const scales = new Map<string, number>();

    const draw = () => {
      // Clear background with very dark abyss color
      ctx.fillStyle = '#0a0505';
      ctx.fillRect(0, 0, width, height);

      const cols = Math.ceil(width / CELL_SIZE);
      const rows = Math.ceil(height / CELL_SIZE);
      
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * CELL_SIZE;
          const y = r * CELL_SIZE;
          
          // Center of the current cell
          const cx = x + CELL_SIZE / 2;
          const cy = y + CELL_SIZE / 2;

          // Distance to mouse cursor
          const dx = mouseX - cx;
          const dy = mouseY - cy;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Calculate target scale based on mouse distance
          let targetScale = 1;
          if (distance < MAX_DISTANCE) {
            // The closer the cursor, the bigger the scale
            const force = 1 - (distance / MAX_DISTANCE);
            // Use an ease-out curve for a natural-feeling pop
            const easeForce = 1 - Math.pow(1 - force, 3);
            targetScale = 1 + easeForce * (MAX_SCALE - 1);
          }

          // Fetch current scale or default to 1
          const key = `${c},${r}`;
          const currentScale = scales.get(key) || 1;
          
          // If the box is dormant (scale 1 and target 1), skip math to save CPU
          if (currentScale === 1 && targetScale === 1) {
            scales.delete(key);
          } else {
            // Linearly interpolate (lerp) towards the target scale for smooth bobbling
            const nextScale = currentScale + (targetScale - currentScale) * LERP_SPEED;
            // Clean up map if it settled back to exactly 1
            if (Math.abs(nextScale - 1) < 0.001) {
               scales.delete(key);
            } else {
               scales.set(key, nextScale);
            }
          }

          const actualScale = scales.get(key) || 1;

          // Calculate final draw size and position
          const size = CELL_SIZE * actualScale;
          const drawX = cx - size / 2;
          const drawY = cy - size / 2;

          // True checkerboard alternation
          const isAlternate = (c + r) % 2 === 0;
          
          ctx.beginPath();
          // Adding a 10% gap inside the cell so they look like distinct boxes, not a solid wall
          ctx.rect(drawX + size * 0.05, drawY + size * 0.05, size * 0.9, size * 0.9);
          
          // Subtle dark red/gray theme
          if (actualScale > 1.02) {
            // Box is popping out: shift it towards a brighter maroon/red
            const intensity = (actualScale - 1) / (MAX_SCALE - 1); // 0.0 to 1.0
            ctx.fillStyle = `rgba(${25 + intensity * 50}, ${8 + intensity * 15}, ${12 + intensity * 20}, ${0.4 + intensity * 0.5})`;
            ctx.strokeStyle = `rgba(180, 20, 30, ${0.1 + intensity * 0.4})`;
            ctx.lineWidth = 1 + intensity;
            ctx.fill();
            ctx.stroke();
          } else {
            // Box is dormant/resting
            ctx.fillStyle = isAlternate ? '#100606' : '#0c0404'; // subtle alternating dark gray/red
            ctx.strokeStyle = '#180a0a'; // subtle grid lines
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        backgroundColor: '#0a0505',
        pointerEvents: 'none', // Critical: do not block UI clicks
      }}
    />
  );
}
