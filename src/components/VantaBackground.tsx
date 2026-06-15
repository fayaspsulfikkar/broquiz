"use client";

import React, { useEffect, useRef, useState } from 'react';

export default function VantaBackground() {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const myRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let effect: any = null;

    const loadVanta = async () => {
      try {
        // Dynamically import Three.js to avoid SSR issues
        const THREE = await import('three');
        
        // Vanta requires THREE to be available on window
        (window as any).THREE = THREE;
        
        // Dynamically import the Vanta Fog effect safely
        const vantaModule = await import('vanta/dist/vanta.fog.min.js');
        const FOG = vantaModule.default || vantaModule;

        if (!effect && myRef.current) {
          effect = FOG({
            el: myRef.current,
            THREE: THREE,
            mouseControls: true, // User requested mouse reaction
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            highlightColor: 0xff0033, // Bright striking red
            midtoneColor: 0xaa0022,   // Deep vibrant red
            lowlightColor: 0x330005,  // Dark crimson glow
            baseColor: 0x110002,      // Very dark red void instead of pure black
            blurFactor: 0.50,         // Smoother blending
            speed: 2.00,              // Slightly faster movement
            zoom: 1.50                // Zoom in to make clouds bigger and more obvious
          });
          setVantaEffect(effect);
        }
      } catch (error) {
        console.error("Failed to load Vanta background", error);
      }
    };

    loadVanta();

    return () => {
      if (effect) effect.destroy();
    };
  }, []); // Run only once on mount to prevent instant destruction loop

  return (
    <div 
      ref={myRef} 
      style={{
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: -1, // Sits perfectly behind all the glass UI
        backgroundColor: '#000000' // Fallback color
      }} 
    />
  );
}
