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
        
        // Dynamically import the Vanta Fog effect
        // Using require instead of dynamic import is sometimes safer for Vanta
        const FOG = require('vanta/dist/vanta.fog.min.js');

        if (!vantaEffect && myRef.current) {
          effect = FOG({
            el: myRef.current,
            THREE: THREE,
            mouseControls: true, // User requested mouse reaction
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            highlightColor: 0x8a0020, // Bright dark red
            midtoneColor: 0x5a0010,   // Medium dark red
            lowlightColor: 0x050002,  // Almost black
            baseColor: 0x000000,      // Pitch black
            blurFactor: 0.60,
            speed: 1.50,
            zoom: 1.00
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
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

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
