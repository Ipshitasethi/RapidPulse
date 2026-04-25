import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { BADGES } from '../../data/badges';

function getAvatarColor(name = '') {
  const colors = ['#6C47FF', '#00D4AA', '#FF6B6B', '#FF8C00', '#FFD700', '#00C853'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getMostPrestigiousBadge(earnedBadges = []) {
  const order = ['special', 'gold', 'silver', 'category', 'bronze'];
  for (const tier of order) {
    const badge = BADGES.find(b => earnedBadges.includes(b.id) && b.tier === tier);
    if (badge) return badge;
  }
  return null;
}

const MEDAL = {
  1: { icon: '👑', glow: 'rgba(255,215,0,0.3)', border: '#FFD700', bg: 'rgba(255,215,0,0.08)' },
  2: { icon: '🥈', glow: 'rgba(192,192,192,0.3)', border: '#C0C0C0', bg: 'rgba(192,192,192,0.05)' },
  3: { icon: '🥉', glow: 'rgba(205,127,50,0.3)', border: '#CD7F32', bg: 'rgba(205,127,50,0.05)' },
};

const MOCK_LEADERS = [
  { id: 'l1', name: 'Priya Sharma',   level: 5, xp: 2450, totalTasks: 42, totalHours: 126, city: 'Mumbai', pincode: '400017', earnedBadges: ['impact_maker', 'healthcare_hero', 'first_step'] },
  { id: 'l2', name: 'Rahul Gupta',    level: 4, xp: 1820, totalTasks: 31, totalHours: 93,  city: 'Mumbai', pincode: '400017', earnedBadges: ['on_a_roll', 'first_step'] },
  { id: 'l3', name: 'Anita Desai',    level: 4, xp: 1600, totalTasks: 28, totalHours: 84,  city: 'Mumbai', pincode: '400017', earnedBadges: ['crisis_responder', 'first_step'] },
  { id: 'l4', name: 'Sameer Khan',    level: 3, xp: 1200, totalTasks: 22, totalHours: 66,  city: 'Mumbai', pincode: '400017', earnedBadges: ['on_a_roll', 'first_step'] },
  { id: 'l5', name: 'Divya Nair',     level: 3, xp: 980,  totalTasks: 18, totalHours: 54,  city: 'Mumbai', pincode: '400017', earnedBadges: ['first_step'] },
  { id: 'l6', name: 'Vikram Singh',   level: 2, xp: 720,  totalTasks: 13, totalHours: 39,  city: 'Mumbai', pincode: '400017', earnedBadges: ['first_step'] },
  { id: 'l7', name: 'Pooja Mehta',    level: 2, xp: 540,  totalTasks: 9,  totalHours: 27,  city: 'Mumbai', pincode: '400017', earnedBadges: ['first_step'] },
  { id: 'l8', name: 'Arjun Reddy',    level: 1, xp: 300,  totalTasks: 5,  totalHours: 15,  city: 'Mumbai', pincode: '400017', earnedBadges: [] },
];

export default function Leaderboard() {
  const { currentUser, userData } = useAuth();
  const [tab, setTab] = useState('monthly');
  const [scope, setScope] = useState('area');
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  const userPincode = userData?.pincode || '400017';
  const userCity = userData?.city || 'Mumbai';

  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'volunteers'),
          where(scope === 'area' ? 'pincode' : 'city', '==', scope === 'area' ? userPincode : userCity),
          orderBy('xp', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        const data = [];
        snap.forEach(d => data.push({ id: d.id, ...d.data() }));
        if (data.length > 0) {
          setLeaders(data);
        } else {
          setLeaders(MOCK_LEADERS);
        }
      } catch {
        setLeaders(MOCK_LEADERS);
      }
      setLoading(false);
    };
    fetchLeaders();
  }, [tab, scope, userPincode, userCity]);

  const currentUserRank = leaders.findIndex(l => l.id === currentUser?.uid) + 1;
  const currentUserData = leaders.find(l => l.id === currentUser?.uid);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-[#A0A0B8] text-sm mt-1">See how you rank against fellow volunteers in your area.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {/* Time tabs */}
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
          {[{ id: 'monthly', label: 'This Month' }, { id: 'alltime', label: 'All Time' }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-[#6C47FF] text-white shadow-[0_0_12px_rgba(108,71,255,0.3)]' : 'text-[#A0A0B8] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scope filter */}
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
          {[
            { id: 'area', label: `Your area (${userPincode})` },
            { id: 'city', label: `Your city (${userCity})` },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setScope(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                scope === s.id ? 'bg-[#00D4AA]/20 text-[#00D4AA]' : 'text-[#A0A0B8] hover:text-white'
              }`}
            >
              <MapPin size={13} /> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard list */}
      {loading ? (
        <div className="text-center py-20 text-[#5A5A72]">
          <div className="w-10 h-10 border-4 border-[#6C47FF]/20 border-t-[#6C47FF] rounded-full animate-spin mx-auto mb-4" />
          <p>Loading leaderboard...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((volunteer, idx) => {
            const rank = idx + 1;
            const medal = MEDAL[rank];
            const isCurrentUser = volunteer.id === currentUser?.uid;
            const topBadge = getMostPrestigiousBadge(volunteer.earnedBadges);
            const initials = volunteer.name?.split(' ').map(n => n[0]).join('') || '?';

            return (
              <motion.div
                key={volunteer.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  isCurrentUser
                    ? 'bg-[#6C47FF]/10 border-[#6C47FF]/30'
                    : medal
                    ? 'border-opacity-40'
                    : 'bg-white/[0.04] border-white/[0.08]'
                }`}
                style={medal ? {
                  backgroundColor: medal.bg,
                  borderColor: medal.border,
                  boxShadow: `0 0 20px ${medal.glow}`,
                } : {}}
              >
                {/* Rank */}
                <div className="w-10 text-center shrink-0">
                  {medal ? (
                    <span className="text-2xl">{medal.icon}</span>
                  ) : (
                    <span className="text-[#5A5A72] font-bold text-lg">#{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: getAvatarColor(volunteer.name) }}
                >
                  {initials}
                </div>

                {/* Name + level */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] truncate">{volunteer.name}</span>
                    {isCurrentUser && (
                      <span className="text-[10px] bg-[#6C47FF]/20 text-[#6C47FF] px-2 py-0.5 rounded-full font-bold border border-[#6C47FF]/30 shrink-0">You</span>
                    )}
                  </div>
                  <span className="text-xs text-[#5A5A72]">Level {volunteer.level}</span>
                </div>

                {/* Top badge */}
                {topBadge && (
                  <div className="shrink-0 text-xl" title={topBadge.name}>{topBadge.icon}</div>
                )}

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 shrink-0 text-right">
                  <div>
                    <div className="font-bold text-[15px]">{volunteer.xp?.toLocaleString()}</div>
                    <div className="text-[11px] text-[#5A5A72]">XP</div>
                  </div>
                  <div>
                    <div className="font-bold text-[15px]">{volunteer.totalTasks}</div>
                    <div className="text-[11px] text-[#5A5A72]">Tasks</div>
                  </div>
                  <div>
                    <div className="font-bold text-[15px]">{volunteer.totalHours}h</div>
                    <div className="text-[11px] text-[#5A5A72]">Hours</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pinned: Current user rank */}
      {!loading && currentUser && !currentUserData && (
        <div className="sticky bottom-4 bg-[#6C47FF]/10 border border-[#6C47FF]/30 rounded-2xl p-4 text-center backdrop-blur-xl">
          <p className="text-sm text-[#A0A0B8]">
            You are not yet ranked in this area.{' '}
            <span className="text-white font-semibold">Complete tasks to appear on the leaderboard!</span>
          </p>
        </div>
      )}

      {!loading && currentUserRank > 0 && (
        <div className="sticky bottom-4 bg-[#6C47FF]/10 border border-[#6C47FF]/30 rounded-2xl p-4 text-center backdrop-blur-xl">
          <p className="text-sm">
            You are ranked{' '}
            <span className="text-[#6C47FF] font-bold text-lg">#{currentUserRank}</span>{' '}
            in your {scope === 'area' ? 'area' : 'city'} this {tab === 'monthly' ? 'month' : 'time'}.
          </p>
        </div>
      )}
    </div>
  );
}
