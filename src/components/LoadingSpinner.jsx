import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 40, className = '' }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox="0 0 50 50">
        <circle
          className="text-white/10 stroke-current"
          strokeWidth="4"
          cx="25"
          cy="25"
          r="20"
          fill="transparent"
        ></circle>
        <motion.circle
          className="text-brand-primary stroke-current"
          strokeWidth="4"
          strokeLinecap="round"
          cx="25"
          cy="25"
          r="20"
          fill="transparent"
          initial={{ strokeDasharray: '1, 200', strokeDashoffset: '0' }}
          animate={{
            strokeDasharray: ['1, 200', '89, 200', '89, 200'],
            strokeDashoffset: ['0', '-35', '-124'],
          }}
          transition={{
            duration: 1.5,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        ></motion.circle>
      </svg>
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
