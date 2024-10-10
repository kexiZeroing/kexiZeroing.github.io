"use client";

import { motion, useInView } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";

export default function Home() {
  return (
    <div className="m-20 space-y-16">
      {Array.from(Array(50).keys()).map((i) => (
        <FadeIn delay={0.25} duration={1} key={i}>
          <p className="text-2xl">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Numquam
            nemo iure, pariatur consequuntur, ad nam eveniet praesentium
            voluptas nesciunt quas corrupti dolorem, blanditiis eaque! Illum ab
            dolores accusamus repellat? Tempora.
          </p>
        </FadeIn>
      ))}
    </div>
  );
}

// https://www.youtube.com/watch?v=GIIuG5_kyow
export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
}) {
  let ref = useRef(null);
  let isInView = useInView(ref);
  let [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInView && !isVisible) {
      setIsVisible(true);
    }
  }, [isInView, isVisible]);

  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: {
          opacity: 0,
          y: 15,
        },
        visible: {
          opacity: 1,
          y: 0,
        },
      }}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      transition={{ delay, type: "spring", duration }}
    >
      {children}
    </motion.div>
  );
}