import React, { useEffect, useState } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  color: string;
  delay: number;
}

export function GhibliSparkles() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  
  // Create a new sparkle with Ghibli-like properties
  const createSparkle = (): Sparkle => {
    // Colors inspired by Ghibli magical effects - light blue, white, pale yellow
    const colors = [
      'rgba(173, 216, 230, 0.8)',  // light blue
      'rgba(255, 255, 255, 0.8)',  // white
      'rgba(255, 255, 224, 0.8)',  // pale yellow
      'rgba(135, 206, 250, 0.8)',  // sky blue
    ];
    
    return {
      id: Math.random(),
      x: Math.random() * 100, // random position x (%)
      y: Math.random() * 100, // random position y (%)
      size: Math.random() * 8 + 2, // size between 2-10px
      opacity: Math.random() * 0.4 + 0.2, // opacity between 0.2-0.6
      duration: Math.random() * 8 + 6, // longer animation duration 6-14s
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 5, // random delay for staggered animations
    };
  };
  
  // Initialize some sparkles
  useEffect(() => {
    // Create initial sparkles - more of them for better effect
    const initialSparkles = Array.from({ length: 30 }, () => createSparkle());
    setSparkles(initialSparkles);
    
    // Add new sparkles periodically, but less frequently
    const interval = setInterval(() => {
      setSparkles(prevSparkles => {
        // Remove some old sparkles to keep performance good
        const filtered = prevSparkles.slice(-40); // Keep more sparkles
        return [...filtered, createSparkle()];
      });
    }, 2000); // slower creation rate
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute rounded-full"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            opacity: sparkle.opacity,
            background: sparkle.color,
            boxShadow: `0 0 ${sparkle.size * 3}px ${sparkle.size}px ${sparkle.color}`,
            animation: `sparkleFloat ${sparkle.duration}s ease-in-out infinite ${sparkle.delay}s, 
                       sparkleGlow ${sparkle.duration / 2}s ease-in-out infinite alternate ${sparkle.delay}s`,
            transform: 'translateZ(0)', // Force GPU acceleration for smoother animations
          }}
        />
      ))}
    </div>
  );
}