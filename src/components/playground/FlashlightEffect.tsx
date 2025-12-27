"use client";

import { useState } from "react";

const FlashlightEffect = () => {
  const [gradient, setGradient] = useState(null);

  const handleMouseMove = (e) => {
    const { pageX: x, pageY: y } = e;
    // transition from transparent to black within the first 15% of the circle’s radius.
    setGradient(`radial-gradient(circle at ${x}px ${y}px, transparent, #000 15%)`);
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url('https://kexizeroing.github.io/og-image.jpg')`,
      }}
    >
      <div
        className="absolute inset-0 bg-black"
        style={{
          ...{
            backdropFilter: "sepia(50%) brightness(130%)",
          },
          ...(gradient && { background: gradient }),
        }}
      >
      </div>
    </section>
  );
};

export default FlashlightEffect;
