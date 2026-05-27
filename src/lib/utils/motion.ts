import type { Variants } from 'framer-motion'

export const stagger: Variants = {
  animate: { transition: { staggerChildren: 0.06 } }
}

export const staggerFast: Variants = {
  animate: { transition: { staggerChildren: 0.04 } }
}

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit:    { opacity: 0, scale: 0.9 },
}

export const slideLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
}
