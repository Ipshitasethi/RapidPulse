import React from 'react';

const categoryColorMap = {
  "Food & Nutrition": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Healthcare": "bg-red-500/20 text-red-400 border-red-500/30",
  "Education": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Shelter & Housing": "bg-[#6C47FF]/20 text-[#8B6EFF] border-[#6C47FF]/30",
  "Women's Safety": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Child Welfare": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Elderly Care": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Disaster Relief": "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  "Water & Sanitation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Livelihood": "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function CategoryTag({ category }) {
  const defaultColors = "bg-white/10 text-white/80 border-white/20";
  const colors = categoryColorMap[category] || defaultColors;

  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${colors}`}>
      {category}
    </span>
  );
}
