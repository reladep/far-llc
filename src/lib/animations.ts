/**
 * Motion design constants for FAR
 * Based on Apple-style motion design spec
 */

// Easing curves
export const easings = {
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'spring-bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Duration tokens (ms)
export const durations = {
  micro: 100,
  quick: 150,
  standard: 250,
  medium: 450,
  slow: 600,
} as const;

// CSS class constants for animations
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  fadeUp: 'animate-fade-up',
  scaleIn: 'animate-scale-in',
  slideInRight: 'animate-slide-in-right',
  slideInLeft: 'animate-slide-in-left',
  hoverLift: 'hover-lift',
  hoverGrow: 'hover-grow',
  staggerChildren: 'stagger-children',
} as const;

// Stagger delay defaults
export const staggerDelays = {
  tight: 50,
  normal: 80,
  relaxed: 100,
} as const;
