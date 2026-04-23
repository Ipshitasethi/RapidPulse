import React from 'react';

export default function VolunteerDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8 gradient-text">Volunteer Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6">
          <h3 className="text-secondary mb-2">My Tasks</h3>
          <div className="text-3xl font-bold">5</div>
        </div>
        <div className="glass p-6">
          <h3 className="text-secondary mb-2">Total XP</h3>
          <div className="text-3xl font-bold text-brand-primary">2,450</div>
        </div>
        <div className="glass p-6">
          <h3 className="text-secondary mb-2">Current Streak</h3>
          <div className="text-3xl font-bold text-brand-coral">4 Weeks</div>
        </div>
      </div>
    </div>
  );
}
