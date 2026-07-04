import React, { useState, useRef, MouseEvent } from "react";

interface Tilt3DProps {
  children: React.ReactNode;
  className?: string;
  maxRotation?: number; // maximum rotation angle in degrees
  scale?: number; // scale factor on hover
}

export default function Tilt3D({
  children,
  className = "",
  maxRotation = 12,
  scale = 1.02,
}: Tilt3DProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [lightX, setLightX] = useState(50);
  const [lightY, setLightY] = useState(50);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Cursor position relative to card boundaries
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert positions to percentage ratios (from -0.5 to 0.5)
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    // Calculate rotation angles
    // Moving cursor to the right rotates around Y positive axis, up rotates around X negative axis
    const rotX = -yPct * maxRotation;
    const rotY = xPct * maxRotation;

    setRotateX(rotX);
    setRotateY(rotY);

    // Track dynamic glow spotlight reflection position
    setLightX((mouseX / width) * 100);
    setLightY((mouseY / height) * 100);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
      className={`relative transition-all duration-300 ease-out ${className}`}
    >
      <div
        className="w-full h-full transition-transform duration-200 ease-out rounded-inherit"
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`
            : "rotateX(0deg) rotateY(0deg) scale(1)",
          transformStyle: "preserve-3d",
        }}
      >
        {children}

        {/* 3D Glass dynamic flare overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-300 z-10"
          style={{
            background: isHovered
              ? `radial-gradient(circle 220px at ${lightX}% ${lightY}%, rgba(255,255,255,0.12) 0%, transparent 80%)`
              : "none",
            opacity: isHovered ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}
