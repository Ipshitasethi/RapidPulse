import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, CheckCircle, Flame, ChevronRight, Star, Zap } from 'lucide-react';

const XP_LEVELS = [
  { level: 1, name: 'Newcomer', xpRequired: 0 },
  { level: 2, name: 'Helper', xpRequired: 100 },
  { level: 3, name: 'Contributor', xpRequired: 300 },
  { level: 4, name: 'Community Champion', xpRequired: 600 },
  { level: 5, name: 'Impact Maker', xpRequired: 1000 },
  { level: 6, name: 'Area Legend', xpRequired: 2000 },
];

function getCurrentLevel(xp) {
  let current = XP_LEVELS[0];
  let next = XP_LEVELS[1];
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      current = XP_LEVELS[i];
      next = XP_LEVELS[i + 1] || XP_LEVELS[i];
      break;
    }
  }
  return { current, next };
}

function XPFloat({ show, onDone }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -40 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          onAnimationComplete={onDone}
          className="absolute top-0 right-4 text-[#00D4AA] font-bold text-lg pointer-events-none z-50 select-none"
        >
          +30 XP ✦
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function VolunteerDashboard() {
  const { currentUser, userData } = useAuth();
  const [activeTasks, setActiveTasks] = useState([]);
  const [nearbyNeeds, setNearbyNeeds] = useState([]);
  const [xpFloats, setXpFloats] = useState({});
  const [localXP, setLocalXP] = useState(userData?.xp || 0);

  const xp = localXP;
  const { current: currentLevel, next: nextLevel } = getCurrentLevel(xp);
  const xpProgress = nextLevel.xpRequired > currentLevel.xpRequired
    ? ((xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100
    : 100;
  const streakWeeks = userData?.streakWeeks || 0;

  useEffect(() => {
    setLocalXP(userData?.xp || 0);
  }, [userData]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchTasks = async () => {
      const q = query(
        collection(db, 'tasks'),
        where('volunteerId', '==', currentUser.uid),
        where('status', '==', 'assigned')
      );
      const snap = await getDocs(q);
      const rawTasks = [];
      snap.forEach(d => rawTasks.push({ id: d.id, ...d.data() }));

      // Enrich each task with its need details (title, category, location, severity)
      const enriched = await Promise.all(
        rawTasks.map(async (task) => {
          if (task.needId) {
            try {
              const needSnap = await getDoc(doc(db, 'needs', task.needId));
              if (needSnap.exists()) {
                const need = needSnap.data();
                return {
                  ...task,
                  title: need.title,
                  category: need.category,
                  locationName: need.locationName,
                  severityScore: need.severityScore,
                  ngoId: need.ngoId,
                };
              }
            } catch (e) {
              console.warn('Could not fetch need for task', task.id, e);
            }
          }
          return task;
        })
      );
      setActiveTasks(enriched);
    };

    const fetchNeeds = async () => {
      const q = query(collection(db, 'needs'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      const needs = [];
      snap.forEach(d => needs.push({ id: d.id, ...d.data() }));
      // Show mock nearby needs if empty
      if (needs.length === 0) {
        setNearbyNeeds([
          { id: 'mock-1', title: 'Food Distribution Drive', category: 'Food Relief', locationName: 'Dharavi, Mumbai', severityScore: 3, distanceKm: 1.8, ngoName: 'Asha Foundation', suggestedSkills: ['Food Distribution', 'Driving'] },
          { id: 'mock-2', title: 'Health Check-up Camp', category: 'Health', locationName: 'Govandi, Mumbai', severityScore: 4, distanceKm: 3.2, ngoName: 'MedCare NGO', suggestedSkills: ['First Aid', 'Medical'] },
          { id: 'mock-3', title: 'Digital Literacy Class', category: 'Education', locationName: 'Kurla, Mumbai', severityScore: 2, distanceKm: 5.0, ngoName: 'EduReach', suggestedSkills: ['Teaching', 'English'] },
        ]);
      } else {
        setNearbyNeeds(needs.slice(0, 5));
      }
    };

    fetchTasks();
    fetchNeeds();
  }, [currentUser]);

  const getSeverityColor = (score) => {
    const map = { 5: '#FF3B3B', 4: '#FF8C00', 3: '#FFD700', 2: '#00C853', 1: '#7B61FF' };
    return map[score] || '#7B61FF';
  };

  const handleMarkComplete = async (task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), { status: 'completed', completedAt: serverTimestamp(), hoursLogged: 2 });
      if (currentUser) {
        const volRef = doc(db, 'volunteers', currentUser.uid);
        await updateDoc(volRef, { xp: xp + 30, totalTasks: (userData?.totalTasks || 0) + 1 });
      }
      setLocalXP(prev => prev + 30);
      setXpFloats(prev => ({ ...prev, [task.id]: true }));
      setActiveTasks(prev => prev.filter(t => t.id !== task.id));
    } catch (err) {
      // Mock for demo
      setLocalXP(prev => prev + 30);
      setXpFloats(prev => ({ ...prev, [task.id]: true }));
      setTimeout(() => setActiveTasks(prev => prev.filter(t => t.id !== task.id)), 1500);
    }
  };

  const handleAcceptTask = async (need) => {
    try {
      if (currentUser) {
        await addDoc(collection(db, 'tasks'), {
          needId: need.id,
          volunteerId: currentUser.uid,
          status: 'assigned',
          assignedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'needs', need.id), { status: 'assigned' });
      }
      setNearbyNeeds(prev => prev.filter(n => n.id !== need.id));
    } catch (err) {
      setNearbyNeeds(prev => prev.filter(n => n.id !== need.id));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-8 space-y-6">
      {/* XP Progress Card */}
      <div className="relative rounded-2xl overflow-hidden p-[1px]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6C47FF] to-[#00D4AA] opacity-60" />
        <div className="relative bg-[#0D0D14] rounded-2xl p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Level Badge */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black shadow-[0_0_24px_rgba(108,71,255,0.4)]"
                style={{ background: 'linear-gradient(135deg, #6C47FF, #00D4AA)' }}>
                {currentLevel.level}
              </div>
              <span className="text-xs text-[#A0A0B8] font-medium">Level {currentLevel.level}</span>
            </div>

            {/* XP Bar */}
            <div className="flex-1 w-full">
              <div className="flex justify-between items-baseline mb-1">
                <h2 className="text-xl font-bold">{currentLevel.name}</h2>
                <span className="text-sm text-[#A0A0B8]">{xp} / {nextLevel.xpRequired} XP</span>
              </div>
              <div className="relative h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #6C47FF, #00D4AA)' }}
                />
              </div>
              <p className="text-xs text-[#5A5A72] mt-1.5">
                {nextLevel.xpRequired - xp} XP to {nextLevel.name}
              </p>

              {/* Stats row */}
              <div className="flex gap-6 mt-4">
                <div>
                  <div className="text-2xl font-bold">{userData?.totalTasks || 0}</div>
                  <div className="text-xs text-[#A0A0B8]">Total Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{userData?.totalHours || 0}h</div>
                  <div className="text-xs text-[#A0A0B8]">Hours Served</div>
                </div>
              </div>
            </div>

            {/* Streak */}
            <div className={`shrink-0 flex flex-col items-center gap-1 px-6 py-4 rounded-xl border ${
              streakWeeks > 0 
                ? 'border-[#FF8C00]/30 bg-[#FF8C00]/10 shadow-[0_0_20px_rgba(255,140,0,0.15)]' 
                : 'border-white/10 bg-white/5'
            }`}>
              <span className="text-3xl">{streakWeeks > 0 ? '🔥' : '🌱'}</span>
              <div className="text-2xl font-bold">{streakWeeks}</div>
              <div className="text-xs text-[#A0A0B8]">Week Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Warning Banner */}
      {streakWeeks > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden"
          style={{ background: 'linear-gradient(90deg, rgba(255,140,0,0.15), rgba(255,107,107,0.1))' }}
        >
          <div className="flex items-center gap-3 px-5 py-3.5 border border-[#FF8C00]/30 rounded-xl">
            <Flame size={20} className="text-[#FF8C00] shrink-0" />
            <p className="text-sm font-medium">
              🔥 You're on a <span className="text-[#FF8C00] font-bold">{streakWeeks}-week streak!</span> Complete a task this week to keep it going.
            </p>
          </div>
        </motion.div>
      )}

      {/* Active Tasks */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold">Assigned to you</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#6C47FF]/20 text-[#6C47FF] border border-[#6C47FF]/30 font-medium">
            {activeTasks.length}
          </span>
        </div>

        {activeTasks.length === 0 ? (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-10 text-center text-[#5A5A72]">
            <CheckCircle size={40} className="mx-auto mb-3 opacity-40" />
            <p>No active assignments. Accept nearby tasks to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTasks.map(task => (
              <div key={task.id} className="relative bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-4 hover:bg-white/[0.06] transition-colors">
                <XPFloat show={xpFloats[task.id]} onDone={() => setXpFloats(p => ({ ...p, [task.id]: false }))} />
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: getSeverityColor(task.severityScore || 3), boxShadow: `0 0 8px ${getSeverityColor(task.severityScore || 3)}60` }} />
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-[#A0A0B8] border border-white/10 mb-2 inline-block">{task.category || 'General'}</span>
                    <h3 className="font-semibold text-[16px]">{task.title || task.needId}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-[#A0A0B8]">
                      <span className="flex items-center gap-1"><MapPin size={13} />{task.locationName || 'Location TBD'}</span>
                      <span className="flex items-center gap-1"><Clock size={13} />{task.assignedAt ? 'Due in 3 days' : 'Active'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleMarkComplete(task)}
                  className="flex items-center gap-2 self-center md:self-auto px-4 py-2.5 bg-[#00D4AA]/10 hover:bg-[#00D4AA]/20 text-[#00D4AA] border border-[#00D4AA]/30 rounded-xl font-medium text-sm transition-colors shrink-0"
                >
                  <CheckCircle size={16} />
                  Mark Complete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nearby Recommended Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recommended for you</h2>
          <span className="text-xs text-[#A0A0B8] flex items-center gap-1"><MapPin size={12} /> Near you</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {nearbyNeeds.map((need, idx) => (
            <motion.div
              key={need.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs px-2.5 py-1 rounded-full" style={{
                  backgroundColor: `${getSeverityColor(need.severityScore)}15`,
                  color: getSeverityColor(need.severityScore),
                  border: `1px solid ${getSeverityColor(need.severityScore)}40`
                }}>
                  Severity {need.severityScore}
                </span>
                <span className="text-xs text-[#A0A0B8] flex items-center gap-1">
                  <MapPin size={12} />{need.distanceKm ? `${need.distanceKm}km` : 'Nearby'}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#A0A0B8] mb-1 block">{need.category}</span>
                <h3 className="font-semibold leading-tight">{need.title}</h3>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#A0A0B8]">
                <MapPin size={12} /> {need.locationName}
              </div>
              {need.suggestedSkills?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {need.suggestedSkills.slice(0, 3).map(s => (
                    <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-[#A0A0B8] border border-white/10">{s}</span>
                  ))}
                </div>
              )}
              <p className="text-xs text-[#5A5A72]">{need.ngoName}</p>
              <button
                onClick={() => handleAcceptTask(need)}
                className="mt-auto flex items-center justify-center gap-2 py-2.5 bg-white text-black font-semibold rounded-xl text-sm hover:bg-gray-200 transition-colors"
              >
                Accept Task <ChevronRight size={15} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
