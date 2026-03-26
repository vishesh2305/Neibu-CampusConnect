"use client";

import { useState } from "react";

export default function LikeAnimation({ children, onLike }: { children: React.ReactNode; onLike: () => void }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = () => {
    onLike();

    // Create burst particles
    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: -(Math.random() * 40 + 10),
    }));
    setParticles(newParticles);

    setTimeout(() => setParticles([]), 700);
  };

  return (
    <div className="relative inline-flex" onClick={handleClick}>
      {children}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute pointer-events-none text-rose-500 animate-like-burst"
          style={{
            left: "50%",
            top: "50%",
            // @ts-expect-error -- CSS custom properties for animation
            "--tx": `${p.x}px`,
            "--ty": `${p.y}px`,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}
