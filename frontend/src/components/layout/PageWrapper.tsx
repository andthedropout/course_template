import React from 'react';
import { motion } from 'framer-motion';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean; // Enable/disable animation
}

/**
 * Universal page wrapper with consistent entrance animation
 * Use this for ALL pages to maintain consistent animation behavior
 */
const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  className = '',
  animate = true,
}) => {
  const Wrapper = animate ? motion.div : 'div';

  return (
    <Wrapper
      className={className}
      {...(animate && {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.2, ease: 'easeOut' },
      })}
    >
      {children}
    </Wrapper>
  );
};

export default PageWrapper;
