import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable badge display card with locked/unlocked states and hover glow.
 * Props:
 *   badge: { id, icon, name, criteria, xpReward, tier, color }
 *   earned: boolean
 *   onClick: optional click handler
 */
export default function BadgeCard({ badge, earned = false, onClick }) {
  return (
    <motion.div
      whileHover={earned ? { scale: 1.04 } : {}}
      onClick={onClick}
      className={`badge-card relative rounded-2xl p-5 border text-center cursor-pointer select-none transition-all ${
        earned
          ? 'bg-white/[0.06] border-white/[0.12]'
          : 'bg-white/[0.02] border-white/[0.06] opacity-40 grayscale'
      }`}
      style={
        earned
          ? { boxShadow: `0 0 20px ${badge.color}20`, borderColor: `${badge.color}40` }
          : {}
      }
    >
      {/* Tier ribbon */}
      {earned && badge.tier && (
        <span
          className="absolute top-2 right-2 text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${badge.color}20`,
            color: badge.color,
            border: `1px solid ${badge.color}40`,
          }}
        >
          {badge.tier}
        </span>
      )}

      {/* Icon */}
      <div className="text-4xl mb-3 select-none">{badge.icon}</div>

      {/* Name */}
      <h4 className="font-bold text-sm text-white mb-1">{badge.name}</h4>

      {/* Criteria */}
      <p className="text-[11px] text-[#A0A0B8] leading-relaxed">{badge.criteria}</p>

      {/* XP reward */}
      {badge.xpReward && (
        <p className="text-[10px] font-bold mt-2" style={{ color: badge.color || '#00D4AA' }}>
          +{badge.xpReward} XP
        </p>
      )}

      {/* Lock overlay */}
      {!earned && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center">
          <span className="text-2xl opacity-60">🔒</span>
        </div>
      )}
    </motion.div>
  );
}
