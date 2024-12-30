import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// cn() - Every Tailwind Coder Needs It (clsx + twMerge)
// https://www.youtube.com/watch?v=re2JFITR7TI