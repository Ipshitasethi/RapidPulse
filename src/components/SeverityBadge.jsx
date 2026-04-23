import React from 'react';

const severityColors = {
  5: '#FF3B3B', // Red
  4: '#FF8C00', // Orange
  3: '#FFD700', // Yellow
  2: '#00C853', // Green
  1: '#7B61FF'  // Purple
};

const severityLabels = {
  5: 'Critical',
  4: 'High',
  3: 'Moderate',
  2: 'Low',
  1: 'Info'
};

export default function SeverityBadge({ score }) {
  const safeScore = Math.max(1, Math.min(5, Math.floor(score || 1)));
  const color = severityColors[safeScore];
  const label = severityLabels[safeScore];

  return (
    <div 
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold text-xs border"
      style={{
        backgroundColor: `${color}25`, // 15% opacity hex roughly
        borderColor: `${color}60`,
        color: color
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{safeScore} - {label}</span>
    </div>
  );
}
