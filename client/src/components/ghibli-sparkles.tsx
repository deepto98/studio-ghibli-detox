import React, { useEffect, useState, useRef } from "react";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  color: string;
  delay: number;
  initialY: number; // Store initial Y position for scroll calculations
  scrollSensitivity: number; // Individual scroll sensitivity
  layerDepth: number; // Controls parallax effect (0-1)
}

export function GhibliSparkles() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const scrollBaseSpeed = useRef(0.5); // Base scroll sensitivity
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  // Create a new sparkle with Ghibli-like properties
  const createSparkle = (): Sparkle => {
    // Enhanced color palette inspired by Ghibli films - more vibrant colors
    const colors = [
      "rgba(155, 219, 255, 0.9)", // bright blue
      "rgba(255, 255, 255, 0.9)", // white
      "rgba(255, 245, 157, 0.9)", // bright yellow
      "rgba(111, 209, 255, 0.9)", // sky blue
      "rgba(255, 146, 188, 0.8)", // bright pink
      "rgba(130, 255, 130, 0.8)", // bright green
      "rgba(255, 123, 123, 0.8)", // coral
      "rgba(255, 203, 5, 0.8)", // golden
      "rgba(187, 134, 252, 0.8)", // purple
      "rgba(162, 232, 236, 0.8)", // aqua
      "rgba(245, 196, 94, 0.8)", // amber
    ];

    const randomY = Math.random() * 100;
    const layerDepth = Math.random() * 0.8 + 0.2; // Between 0.2-1.0 for parallax effect

    return {
      id: Math.random(),
      x: Math.random() * 100, // random position x (%)
      y: randomY, // random position y (%)
      initialY: randomY, // store initial Y position
      size: Math.random() * 10 + 2, // size between 2-12px (larger)
      opacity: Math.random() * 0.5 + 0.3, // opacity between 0.3-0.8 (more visible)
      duration: Math.random() * 10 + 6, // longer animation duration 6-16s
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 5, // random delay for staggered animations
      scrollSensitivity: Math.random() * 0.6 + 0.2, // Individual scroll sensitivity
      layerDepth: layerDepth, // Controls parallax effect
    };
  };

  // Track scroll position and window resize
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Initialize some sparkles
  useEffect(() => {
    // Create initial sparkles - more of them for better effect
    const initialSparkles = Array.from({ length: 60 }, () => createSparkle());
    setSparkles(initialSparkles);

    // Add new sparkles periodically, but less frequently
    const interval = setInterval(() => {
      setSparkles((prevSparkles) => {
        // Remove some old sparkles to keep performance good
        const filtered = prevSparkles.slice(-70); // Keep more sparkles
        return [...filtered, createSparkle(), createSparkle()]; // Add two at a time
      });
    }, 1800); // slightly faster creation rate

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {sparkles.map((sparkle) => {
        // Calculate parallax effect based on scroll position and layer depth
        const parallaxFactor =
          sparkle.scrollSensitivity * scrollBaseSpeed.current;
        const offsetY = scrollY * parallaxFactor * sparkle.layerDepth;

        // Calculate Y position with parallax effect and adjust relative to viewport height
        const scaledInitialY = sparkle.initialY * (windowHeight / 100);
        const adjustedPos = (scaledInitialY - offsetY) % windowHeight;
        const normalizedY =
          ((adjustedPos < 0 ? windowHeight + adjustedPos : adjustedPos) /
            windowHeight) *
          100;

        return (
          <div
            key={sparkle.id}
            className="absolute rounded-full"
            style={{
              left: `${sparkle.x}%`,
              top: `${normalizedY}%`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              opacity: sparkle.opacity,
              background: `radial-gradient(circle at center, white 0%, ${sparkle.color} 60%, transparent 100%)`,
              boxShadow: `0 0 ${sparkle.size * 2.5}px ${sparkle.size * 0.8}px ${
                sparkle.color
              }`,
              animation: `sparkleFloat ${
                sparkle.duration
              }s ease-in-out infinite ${sparkle.delay}s, 
                         sparkleGlow ${
                           sparkle.duration / 2
                         }s ease-in-out infinite alternate ${sparkle.delay}s`,
              transform: "translateZ(0)", // Force GPU acceleration for smoother animations
              // Simulate depth with scale based on layerDepth
              filter: `blur(${(1 - sparkle.layerDepth) * 1.5}px)`,
              zIndex: Math.floor(sparkle.layerDepth * 10),
            }}
          />
        );
      })}
    </div>
  );
}
