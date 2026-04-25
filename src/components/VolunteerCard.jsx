import React from 'react';
import { MapPin, Star, Award } from 'lucide-react';

/**
 * Card displaying a volunteer's summary for NGO matching views.
 * Props:
 *   volunteer: { name, city, skills, xp, totalTasks, averageRating, photoUrl, earnedBadges }
 *   onSelect: optional click handler
 */
export default function VolunteerCard({ volunteer, onSelect }) {
  const initials = volunteer.name
    ? volunteer.name.split(' ').map(w => w[0]).join('').toUpperCase()
    : '?';

  const colors = ['#6C47FF', '#00D4AA', '#FF6B6B', '#FF8C00'];
  let hash = 0;
  for (let i = 0; i < (volunteer.name || '').length; i++) hash = (volunteer.name || '').charCodeAt(i) + ((hash << 5) - hash);
  const bgColor = colors[Math.abs(hash) % colors.length];

  return (
    <div
      onClick={onSelect}
      className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:border-white/20 hover:bg-white/[0.06] transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 mb-4">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
          style={{ backgroundColor: volunteer.photoUrl ? 'transparent' : bgColor }}
        >
          {volunteer.photoUrl ? (
            <img src={volunteer.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-white truncate group-hover:text-[#00D4AA] transition-colors">
            {volunteer.name}
          </h4>
          <div className="flex items-center gap-1 text-xs text-[#A0A0B8]">
            <MapPin size={11} /> {volunteer.city || 'India'}
          </div>
        </div>

        {/* XP */}
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#6C47FF]/10 text-[#6C47FF] border border-[#6C47FF]/30 shrink-0">
          {volunteer.xp || 0} XP
        </span>
      </div>

      {/* Skills */}
      {volunteer.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {volunteer.skills.slice(0, 4).map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/30">
              {s}
            </span>
          ))}
          {volunteer.skills.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#5A5A72]">
              +{volunteer.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-[#A0A0B8] pt-3 border-t border-white/[0.06]">
        <span className="flex items-center gap-1">
          <Award size={12} /> {volunteer.totalTasks || 0} tasks
        </span>
        {volunteer.averageRating > 0 && (
          <span className="flex items-center gap-1">
            <Star size={12} fill="#FFD700" className="text-[#FFD700]" /> {volunteer.averageRating}
          </span>
        )}
        <span>{(volunteer.earnedBadges || []).length} badges</span>
      </div>
    </div>
  );
}
