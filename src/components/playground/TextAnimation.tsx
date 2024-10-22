"use client";

import { useState, useEffect, useRef } from 'react';
import { useMotionValue, animate } from 'framer-motion';

function useAnimatedText(text, isAnimating) {
  const animatedCursor = useMotionValue(0);
  const [cursor, setCursor] = useState(0);
  const controlsRef = useRef(null);

  useEffect(() => {
    if (!isAnimating) {
      controlsRef.current?.stop();
      return;
    }

    controlsRef.current = animate(animatedCursor, text.length, {
      duration: 3,
      ease: "linear",
      onUpdate: (latest) => setCursor(Math.floor(latest)),
    });

    return () => controlsRef.current?.stop();
  }, [animatedCursor, text.length, isAnimating]);

  const resetAnimation = () => {
    controlsRef.current?.stop();
    animatedCursor.set(0);
    setCursor(0);
  };

  return [text.slice(0, cursor), resetAnimation];
}

export default function TextAnimationDemo({ text }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedText, resetAnimation] = useAnimatedText(text, isAnimating);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-2xl min-h-[200px] rounded-lg bg-white p-6 shadow">
        <div className="h-full min-h-[168px]">
          <p className="text-xl text-gray-800 whitespace-pre-wrap">
            {isAnimating ? animatedText : text}
          </p>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button 
          onClick={() => setIsAnimating(true)}
          disabled={isAnimating}
          className="w-28 rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50 hover:bg-blue-600"
        >
          {isAnimating ? 'Animating...' : 'Start'}
        </button>
        <button 
          onClick={() => {
            setIsAnimating(false);
            resetAnimation();
          }}
          disabled={!isAnimating}
          className="w-28 rounded bg-red-500 px-4 py-2 text-white disabled:opacity-50 hover:bg-red-600"
        >
          Stop
        </button>
      </div>
    </div>
  );
}