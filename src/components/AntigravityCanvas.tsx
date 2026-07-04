import React, { useEffect, useRef, useState } from "react";

interface AntigravityCanvasProps {
  gravityValue?: number; // negative is up, positive is down, 0 is float
  speedFactor?: number;  // 0.1 to 3
  magneticMode?: "attract" | "repel" | "orbit" | "off";
  themeColor?: "indigo" | "cyan" | "rose" | "emerald" | "amber";
}

export default function AntigravityCanvas({
  gravityValue = 0,
  speedFactor = 1,
  magneticMode = "repel",
  themeColor = "indigo",
}: AntigravityCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  // Map theme colors to CSS colors
  const colorMap = {
    indigo: { rgb: "99, 102, 241", glow: "rgba(168, 85, 247, 0.15)" },
    cyan: { rgb: "6, 182, 212", glow: "rgba(6, 182, 212, 0.15)" },
    rose: { rgb: "244, 63, 94", glow: "rgba(244, 63, 94, 0.15)" },
    emerald: { rgb: "16, 185, 129", glow: "rgba(16, 185, 129, 0.15)" },
    amber: { rgb: "245, 158, 11", glow: "rgba(245, 158, 11, 0.15)" },
  };

  const selectedTheme = colorMap[themeColor] || colorMap.indigo;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class definition
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseY: number;
      alpha: number;
      originalVx: number;
      originalVy: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = Math.random() * 1.8 + 0.6;
        // Base velocities
        this.originalVx = (Math.random() - 0.5) * 0.35;
        this.originalVy = (Math.random() - 0.5) * 0.35;
        this.vx = this.originalVx;
        this.vy = this.originalVy;
        this.baseY = this.y;
        this.alpha = Math.random() * 0.5 + 0.2;
      }

      update() {
        // Apply global speed factor
        const actualVx = this.vx * speedFactor;
        const actualVy = this.vy * speedFactor;

        this.x += actualVx;
        this.y += actualVy;

        // Apply global gravity force (affecting vertical speed drift)
        // gravityValue > 0 pulls down, gravityValue < 0 pulls up
        this.y += gravityValue * 0.15 * speedFactor;

        // Mouse attraction/repulsion/orbit forces
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - this.x;
          const dy = mouseRef.current.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 160;

          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance; // 0 (far) to 1 (close)

            if (magneticMode === "repel") {
              // Push away
              this.x -= (dx / distance) * force * 1.5 * speedFactor;
              this.y -= (dy / distance) * force * 1.5 * speedFactor;
            } else if (magneticMode === "attract") {
              // Pull closer
              this.x += (dx / distance) * force * 1.2 * speedFactor;
              this.y += (dy / distance) * force * 1.2 * speedFactor;
            } else if (magneticMode === "orbit") {
              // Orbit around mouse
              const angle = Math.atan2(dy, dx) + Math.PI / 2;
              this.x += Math.cos(angle) * force * 1.8 * speedFactor;
              this.y += Math.sin(angle) * force * 1.8 * speedFactor;
            }
          }
        }

        // Return to normal speeds gradually
        this.vx += (this.originalVx - this.vx) * 0.05;
        this.vy += (this.originalVy - this.vy) * 0.05;

        // Wrap around boundaries
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = `rgba(${selectedTheme.rgb}, ${this.alpha})`;
        c.fill();
      }
    }

    // Initialize particles (adaptive to screen size)
    const particleCount = Math.min(100, Math.floor((width * height) / 12000));
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Handle viewport resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Track mouse events
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Dynamic grid & constellation rendering loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw elegant background starry grid
      ctx.strokeStyle = `rgba(${selectedTheme.rgb}, 0.03)`;
      ctx.lineWidth = 1;
      const gridSize = 60;
      
      // Draw vertical lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Render particle constellation/network
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw(ctx);

        // Draw connections to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          const maxConnDist = 110;

          if (dist < maxConnDist) {
            const alpha = (1 - dist / maxConnDist) * 0.13;
            ctx.strokeStyle = `rgba(${selectedTheme.rgb}, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // 3. Render soft cosmic ambient light following mouse
      if (mouseRef.current.active) {
        const glowRad = 150;
        const grad = ctx.createRadialGradient(
          mouseRef.current.x,
          mouseRef.current.y,
          0,
          mouseRef.current.x,
          mouseRef.current.y,
          glowRad
        );
        grad.addColorStop(0, `rgba(${selectedTheme.rgb}, 0.05)`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouseRef.current.x, mouseRef.current.y, glowRad, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gravityValue, speedFactor, magneticMode, themeColor, selectedTheme.rgb]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
