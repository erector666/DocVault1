import React, { useEffect, useRef } from 'react';

interface NebulaBackgroundProps {
  className?: string;
}

const NebulaBackground: React.FC<NebulaBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w: number, h: number;
    
    function resize() {
      if (canvas) {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }
    }

    function random(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function drawNebula() {
      if (!ctx || !canvas) return;
      
      // background gradient
      const gradient = ctx.createRadialGradient(
        w / 2, h / 2, 100, 
        w / 2, h / 2, Math.max(w, h)
      );
      gradient.addColorStop(0, "#1c3f82");
      gradient.addColorStop(0.4, "#0b2d5c");
      gradient.addColorStop(1, "#021027");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // cloudy nebula texture
      for (let i = 0; i < 200; i++) {
        const x = random(0, w);
        const y = random(0, h);
        const r = random(50, 300);
        const alpha = random(0.02, 0.08);
        const cloud = ctx.createRadialGradient(x, y, 0, x, y, r);
        cloud.addColorStop(0, `rgba(0,150,255,${alpha})`);
        cloud.addColorStop(1, "transparent");
        ctx.fillStyle = cloud;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // stars
      for (let i = 0; i < 150; i++) {
        const x = random(0, w);
        const y = random(0, h);
        const r = random(0.3, 1.2);
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    resize();
    drawNebula();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{ 
        background: 'black',
        zIndex: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh'
      }}
    />
  );
};

export default NebulaBackground;
