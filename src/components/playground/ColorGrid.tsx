import { useCallback, useEffect, useRef, useState } from "react";
import "@/tw-styles/globals.css";

// https://v0.dev/chat/kjdc3t3Y3UH
export default function Component() {
  const [coloredCells, setColoredCells] = useState<{ [key: number]: string }>({});
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);
  const [tilt, setTilt] = useState({ x: 45, y: 0 });
  const [rotation, setRotation] = useState(45);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timeoutsRef = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const gridSize = 50;
  const colors = ["#4ade80", "#60a5fa", "#fb923c"];
  const maxTiltAngle = 20;
  const maxRotationAngle = 45;

  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  const playNote = useCallback((frequency: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.7, context.currentTime);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.5);
    oscillator.stop(context.currentTime + 0.5);
  }, []);

  const handleCellClick = useCallback((index: number) => {
    const baseFrequency = 261.63; // C4
    const noteIndex = index % 12;
    const frequency = baseFrequency * Math.pow(2, noteIndex / 12);
    playNote(frequency);
  }, [playNote]);

  const handleCellEnter = useCallback((index: number) => {
    const color = getRandomColor();
    setColoredCells(prev => ({ ...prev, [index]: color }));

    if (timeoutsRef.current[index]) {
      clearTimeout(timeoutsRef.current[index]);
    }
  }, []);

  const handleCellLeave = useCallback((index: number) => {
    if (timeoutsRef.current[index]) {
      clearTimeout(timeoutsRef.current[index]);
    }

    timeoutsRef.current[index] = setTimeout(() => {
      setColoredCells(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
      });
    }, 400);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    setIsMouseDown(true);
    const rect = container.getBoundingClientRect();
    setOrigin({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMouseDown) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = 45 + ((y - origin.y) / centerY) * maxTiltAngle;
    const tiltY = ((origin.x - x) / centerX) * maxTiltAngle;
    setTilt({ x: tiltX, y: tiltY });

    const rotationFactor = (x - origin.x) / centerX;
    const newRotation = 45 + rotationFactor * maxRotationAngle;
    setRotation(newRotation);
  }, [isMouseDown, origin.x, origin.y]);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    setTilt({ x: 45, y: 0 });
    setRotation(45);
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseUp]);

  const transformStyle = {
    transform: `
      perspective(1000px)
      rotateX(${tilt.x}deg)
      rotateY(${tilt.y}deg)
      rotateZ(${rotation}deg)
    `,
    transition: isMouseDown ? "none" : "transform 0.3s ease-out",
  };

  const imagePositions = [
    { top: "10%", left: "10%" },
    { top: "10%", right: "10%" },
    { bottom: "10%", left: "10%" },
    { bottom: "10%", right: "10%" },
  ];

  const imageDescriptions = [
    "Home Page, /",
    "GitHub, https://github.com/kexizeroing",
    "LinkedIn, https://www.linkedin.com/in/dangkexi/",
    "Twitter, https://x.com/kdang2020",
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: "1 / 1", ...transformStyle }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          gap: "1px",
          backgroundColor: "#f0f0f0",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, index) => (
          <div
            key={index}
            style={{
              backgroundColor: coloredCells[index] || "white",
              transition: "background-color 1s",
              cursor: "pointer",
            }}
            onMouseEnter={() => handleCellEnter(index)}
            onMouseLeave={() => handleCellLeave(index)}
            onClick={() => handleCellClick(index)}
            role="button"
            aria-label={`Play note ${index + 1}`}
            tabIndex={0}
          />
        ))}
        {Array.from({ length: (gridSize / 2) * (gridSize / 2) }).map((_, index) => {
          const row = Math.floor(index / (gridSize / 2));
          const col = index % (gridSize / 2);
          return (
            <div
              key={`crosshair-${index}`}
              style={{
                position: "absolute",
                top: `calc(${(row * 2 + 1) * 100 / gridSize}% - 3px)`,
                left: `calc(${(col * 2 + 1) * 100 / gridSize}% - 3px)`,
                width: "6px",
                height: "6px",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: "0",
                  width: "6px",
                  height: "1px",
                  backgroundColor: "#bbb",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "2px",
                  width: "1px",
                  height: "6px",
                  backgroundColor: "#bbb",
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none`}
        style={{
          fontSize: "clamp(2rem, 10vw, 8rem)",
          fontWeight: 700,
          color: "black",
          textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {"DEMO".split("").map((letter, index) => (
          <span
            key={index}
            className="mx-1"
            style={{
              transform: index % 2 === 0 ? "translateY(-0.3em)" : "translateY(0.3em)",
              display: "inline-block",
            }}
          >
            {letter}
          </span>
        ))}
      </div>
      {imagePositions.map((position, index) => (
        <div
          key={index}
          className="absolute pointer-events-auto group"
          style={{
            ...position,
            width: "20%",
            height: "20%",
            transition: "all 0.3s ease",
            boxShadow: hoveredImage === index ? `0 0 20px 5px ${getRandomColor()}` : "none",
          }}
          onMouseEnter={() => setHoveredImage(index)}
          onMouseLeave={() => setHoveredImage(null)}
        >
          <img
            src={`/placeholder-social.jpg`}
            alt={`Decorative image ${index + 1}`}
            width={200}
            height={200}
            className="w-full h-full object-cover"
          />
          <a
            href={imageDescriptions[index].split(",")[1]}
            target="_blank"
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center text-2xl px-2 no-underline"
          >
            {imageDescriptions[index].split(",")[0]}
          </a>
        </div>
      ))}
    </div>
  );
}
