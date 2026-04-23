import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="glass p-5 rounded-xl border border-white/5 animate-pulse flex flex-col sm:flex-row gap-4 mb-4">
      {/* Left */}
      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-[150px] shrink-0">
        <div className="h-6 w-24 bg-white/10 rounded-full" />
        <div className="h-6 w-20 bg-white/10 rounded-full" />
      </div>

      {/* Center */}
      <div className="flex-1 space-y-3">
        <div className="h-5 w-3/4 bg-white/10 rounded" />
        <div className="h-4 w-full bg-white/10 rounded" />
        <div className="h-4 w-5/6 bg-white/10 rounded" />
        <div className="flex gap-4 pt-2">
          <div className="h-4 w-24 bg-white/10 rounded" />
          <div className="h-4 w-20 bg-white/10 rounded" />
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 shrink-0 sm:w-32">
        <div className="h-7 w-24 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}
