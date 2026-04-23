import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Users, Map, FileText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAuth, signOut } from 'firebase/auth';

const NAV_ITEMS = [
  { path: '/ngo/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/ngo/submit', icon: PlusCircle, label: 'Submit Need' },
  { path: '/ngo/volunteers', icon: Users, label: 'Matched Volunteers' },
  { path: '/ngo/analytics', icon: Map, label: 'Heatmap & Analytics' },
  { path: '/ngo/report', icon: FileText, label: 'Impact Report' },
  { path: '/ngo/settings', icon: Settings, label: 'Settings' }
];

export default function NGOLayout() {
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
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/70 px-2 py-0.5 rounded-full">NGO</span>
          </div>
          
          <div className="mt-4 break-words">
            <h2 className="font-bold text-white text-sm truncate">{userData?.name || 'NGO Organization'}</h2>
            <div className="flex flex-wrap gap-1 mt-1.5 line-clamp-1 overflow-hidden h-5">
              {userData?.categories?.slice(0, 2).map((cat, i) => (
                <span key={i} className="text-[10px] bg-brand-primary/20 text-brand-light px-1.5 py-0.5 rounded border border-brand-primary/30 whitespace-nowrap">
                  {cat}
                </span>
              ))}
              {(userData?.categories?.length || 0) > 2 && (
                <span className="text-[10px] bg-white/5 text-white/50 px-1.5 py-0.5 rounded whitespace-nowrap">
                  +{(userData.categories.length - 2)}
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-brand-primary/15 text-brand-primary border-l-[3px] border-brand-primary shadow-[inset_0_0_20px_rgba(108,71,255,0.05)]' 
                  : 'text-secondary hover:bg-white/5 hover:text-white border-l-[3px] border-transparent'
                }
              `}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="pt-4 border-t border-white/10 mt-4 flex flex-col gap-2">
          {/* Note: In a full app, the language toggle state would be synced with i18n */}
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-brand-coral hover:bg-brand-coral/10 hover:text-red-400 transition-colors w-full text-left">
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto w-full relative z-10 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around p-3 z-50 rounded-t-2xl px-6">
        {NAV_ITEMS.slice(0, 5).map(({ path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `
              p-3 rounded-full transition-all
              ${isActive ? 'bg-brand-primary/20 text-brand-primary' : 'text-secondary hover:text-white'}
            `}
          >
            <Icon size={24} />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
