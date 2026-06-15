"use client";

import React, { useEffect, useRef } from 'react';

export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let fluidInstance: any = null;

    const initFluid = async () => {
      try {
        const webglFluid = (await import('webgl-fluid')).default;
        
        if (canvasRef.current) {
          fluidInstance = webglFluid(canvasRef.current, {
            IMMEDIATE: true, // Trigger immediately
            TRIGGER: 'hover', // on mouse move
            SIM_RESOLUTION: 128,
            DYE_RESOLUTION: 1024,
            CAPTURE_RESOLUTION: 512,
            DENSITY_DISSIPATION: 2.5, // Fast dissipation to look like smoke/fluid fading into dark
            VELOCITY_DISSIPATION: 0.5,
            PRESSURE: 0.8,
            PRESSURE_ITERATIONS: 20,
            CURL: 30, // High curl for lots of swirling
            SPLAT_RADIUS: 0.35, // Thick splats
            SPLAT_FORCE: 6000,
            SHADING: true,
            COLORFUL: true, // Allow multiple colors, but restrict the palette
            COLOR_UPDATE_SPEED: 10,
            PAUSED: false,
            BACK_COLOR: { r: 5, g: 0, b: 2 }, // #050002 Very dark abyss
            TRANSPARENT: false,
            BLOOM: true,
            BLOOM_ITERATIONS: 8,
            BLOOM_RESOLUTION: 256,
            BLOOM_INTENSITY: 0.9,
            BLOOM_THRESHOLD: 0.2,
            BLOOM_SOFT_KNEE: 0.7,
            SUNRAYS: true,
            SUNRAYS_RESOLUTION: 196,
            SUNRAYS_WEIGHT: 1.0,
            // Deep, glowing dark reds, blood red, and pitch black. 
            // The simulation will mix these colors as you move the mouse.
            COLOR_PALETTE: ['#ff0033', '#aa0022', '#550011', '#ff1144', '#330005']
          });
        }
      } catch (e) {
        console.error("Fluid simulation failed to load:", e);
      }
    };

    initFluid();

    // The library usually modifies the canvas globally. 
    // We clean up event listeners if a destroy method exists, though sometimes it doesn't.
    return () => {
      if (fluidInstance && typeof fluidInstance.destroy === 'function') {
        fluidInstance.destroy();
      }
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
        backgroundColor: '#050002', // Fallback deep dark red abyss
        pointerEvents: 'auto' // Must be auto to catch mouse events
      }}
    />
  );
}
