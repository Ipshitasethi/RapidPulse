import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Search, Award, Trophy, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAuth, signOut } from 'firebase/auth';

const NAV_ITEMS = [
  { path: '/volunteer/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/volunteer/tasks', icon: ClipboardList, label: 'My Tasks' },
  { path: '/volunteer/tasks?tab=find', icon: Search, label: 'Find Tasks' },
  { path: '/volunteer/badges', icon: Award, label: 'Badges & Certs' },
  { path: '/volunteer/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/volunteer/profile', icon: User, label: 'My Profile' },
];

export default function VolunteerLayout() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#0A0A0F] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] bg-[#0A0A0F] border-r border-white/10 h-full p-4 relative z-20">
        <div className="mb-8 px-2 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">RapidPulse</span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#00D4AA]/10 text-[#00D4AA] px-2 py-0.5 rounded-full">
              Volunteer
            </span>
          </div>
          <div className="mt-4">
            <h2 className="font-bold text-white text-sm truncate">{userData?.name || 'Volunteer'}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-[#A0A0B8]">
                Level {userData?.level || 1} · {userData?.city || 'India'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path + label}
              to={path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-[#00D4AA]/15 text-[#00D4AA] border-l-[3px] border-[#00D4AA] shadow-[inset_0_0_20px_rgba(0,212,170,0.05)]'
                  : 'text-[#A0A0B8] hover:bg-white/5 hover:text-white border-l-[3px] border-transparent'
                }
              `}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-4 border-t border-white/10 mt-4 flex flex-col gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors w-full text-left"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto w-full relative z-10 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around p-3 z-50 rounded-t-2xl px-6">
        {NAV_ITEMS.slice(0, 5).map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path + label}
            to={path}
            className={({ isActive }) => `
              p-3 rounded-full transition-all
              ${isActive ? 'bg-[#00D4AA]/20 text-[#00D4AA]' : 'text-[#A0A0B8] hover:text-white'}
            `}
          >
            <Icon size={22} />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
