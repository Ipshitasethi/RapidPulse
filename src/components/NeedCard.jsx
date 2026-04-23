import React from 'react';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CategoryTag from './CategoryTag';
import SeverityBadge from './SeverityBadge';

export default function NeedCard({ need, onViewMatches }) {
  const { 
    id, 
    title, 
    description, 
    category, 
    severityScore, 
    location, 
    submittedAt, 
    status = 'pending' 
  } = need;

  const timeAgo = submittedAt?.toDate 
    ? formatDistanceToNow(submittedAt.toDate(), { addSuffix: true }) 
    : 'Just now';

  const statusConfig = {
    'pending': { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', label: 'Pending match' },
    'matched': { color: 'text-teal-400 bg-teal-400/10 border-teal-400/20', label: 'Volunteers matched' },
    'assigned': { color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', label: 'Assigned' },
    'resolved': { color: 'text-green-400 bg-green-400/10 border-green-400/20', label: 'Resolved' }
  };
  
  const currentStatus = statusConfig[status] || statusConfig['pending'];

  return (
    <div className="glass p-5 rounded-xl border border-white/5 hover:border-white/15 transition-all group flex flex-col sm:flex-row gap-4 mb-4">
      {/* Left */}
      <div className="flex flex-row sm:flex-col gap-2 shrink-0 sm:w-40">
        <CategoryTag category={category} />
        <SeverityBadge score={severityScore} />
      </div>

      {/* Center */}
      <div className="flex-1">
        <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
        <p className="text-secondary text-sm mb-3 line-clamp-2">{description}</p>
        
        <div className="flex items-center gap-4 text-xs font-medium text-white/50">
          {location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={14} />
              <span className="truncate max-w-[150px]">{location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 shrink-0 sm:w-36">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${currentStatus.color}`}>
          {currentStatus.label}
        </span>
        
        {status === 'matched' && onViewMatches && (
          <button 
            onClick={() => onViewMatches(id)}
            className="flex items-center gap-1 text-sm font-medium text-brand-primary hover:text-brand-light transition-colors"
          >
            View matches <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
