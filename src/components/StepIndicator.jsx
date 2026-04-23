import React from 'react';
import { motion } from 'framer-motion';

export default function StepIndicator({ totalSteps, currentStep, colorTheme = 'primary' }) {
  const activeColor = colorTheme === 'primary' ? 'bg-brand-primary' : 'bg-brand-accent';

  return (
    <div className="flex items-center gap-3 justify-center mb-8">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum <= currentStep;
        
        return (
          <div key={idx} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              isActive ? `${activeColor} text-white` : 'bg-white/10 text-secondary'
            }`}>
              {stepNum}
            </div>
            {stepNum < totalSteps && (
              <div className={`h-1 w-12 rounded-full ${isActive ? activeColor : 'bg-white/10'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
