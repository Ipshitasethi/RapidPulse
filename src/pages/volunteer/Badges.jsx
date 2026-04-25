import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { BADGES, TIER_STYLES } from '../../data/badges';
import Certificate from '../../components/Certificate';
import { ChevronDown, ChevronUp, Lock, Award, HelpCircle, X, Sparkles } from 'lucide-react';

// Particle burst for badge unlock animation
function Particles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * 360;
        const x = Math.cos((angle * Math.PI) / 180) * 80;
        const y = Math.sin((angle * Math.PI) / 180) * 80;
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.03 }}
            className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
            style={{
              marginLeft: '-6px',
              marginTop: '-6px',
              backgroundColor: ['#FFD700', '#FF8C00', '#6C47FF', '#00D4AA', '#FF6B6B'][i % 5],
            }}
          />
        );
      })}
    </div>
  );
}

// XP sources collapsible card
function XPSourcesCard() {
  const [open, setOpen] = useState(false);
  const sources = [
    { label: 'Complete a task', xp: '+30 XP' },
    { label: 'Complete severity-5 task', xp: '+80 XP' },
    { label: 'First task ever', xp: '+20 XP' },
    { label: 'Weekly streak maintained', xp: '+15 XP' },
    { label: 'NGO gives 5-star rating', xp: '+25 XP' },
    { label: 'Badge earned', xp: 'Varies' },
  ];
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="text-[#6C47FF]" />
          <span className="font-semibold">How to earn XP</span>
        </div>
        {open ? <ChevronUp size={18} className="text-[#A0A0B8]" /> : <ChevronDown size={18} className="text-[#A0A0B8]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sources.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 px-4 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                  <span className="text-sm text-[#A0A0B8]">{s.label}</span>
                  <span className="text-sm font-bold text-[#00D4AA]">{s.xp}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual badge card
function BadgeCard({ badge, earned, volunteerData, lang, onClick }) {
  const tier = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
  const progress = badge.getProgress(volunteerData);
  const target = badge.target;
  const pct = target > 0 ? Math.round((progress / target) * 100) : 0;

  return (
    <motion.div
      whileHover={earned ? { scale: 1.03 } : {}}
      onClick={() => earned && onClick(badge)}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${
        earned
          ? 'bg-white/[0.06] border-white/[0.12] hover:border-opacity-80'
          : 'bg-white/[0.02] border-white/[0.04]'
      }`}
      style={earned ? { borderColor: badge.color + '60' } : {}}
    >
      {/* Lock overlay for locked badges */}
      {!earned && (
        <>
          <div className="absolute inset-0 rounded-2xl" style={{ filter: 'grayscale(1)', opacity: 0.4 }} />
          <div className="absolute top-2 right-2 bg-white/10 rounded-full p-1">
            <Lock size={12} className="text-[#5A5A72]" />
          </div>
        </>
      )}

      {/* Icon circle */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl relative z-10"
        style={{ backgroundColor: earned ? badge.color : '#1A1A2E' }}
      >
        {badge.icon}
      </div>

      {/* Name */}
      <p className="text-[13px] font-semibold text-center leading-tight relative z-10">
        {lang === 'hi' ? badge.nameHi : badge.name}
      </p>

      {/* Tier pill */}
      <span
        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full relative z-10"
        style={{ backgroundColor: tier.bg, color: tier.text, border: `1px solid ${tier.border}` }}
      >
        {tier.label}
      </span>

      {/* Criteria */}
      <p className="text-[11px] text-[#5A5A72] text-center leading-snug relative z-10">
        {lang === 'hi' ? badge.criteriaHi : badge.criteria}
      </p>

      {/* XP reward */}
      <p className="text-[11px] font-bold text-[#00D4AA] relative z-10">+{badge.xpReward} XP</p>

      {/* Progress for locked */}
      {!earned && target > 1 && (
        <div className="w-full relative z-10">
          <div className="flex justify-between text-[10px] text-[#5A5A72] mb-1">
            <span>{progress}/{target}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6C47FF, #00D4AA)' }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Badge unlock modal
function BadgeUnlockModal({ badge, onClose }) {
  const tier = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 1.3, 1.0], opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-[#12121A] border border-white/10 rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl overflow-visible"
      >
        <Particles />
        <button onClick={onClose} className="absolute top-4 right-4 text-[#5A5A72] hover:text-white">
          <X size={20} />
        </button>

        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-5 shadow-lg"
          style={{ backgroundColor: badge.color, boxShadow: `0 0 40px ${badge.color}80` }}
        >
          {badge.icon}
        </div>

        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3 inline-block"
          style={{ backgroundColor: tier.bg, color: tier.text, border: `1px solid ${tier.border}` }}>
          {tier.label} Badge
        </span>

        <h2 className="text-2xl font-bold mt-2 mb-1">{badge.name}</h2>
        <p className="text-[#A0A0B8] text-sm mb-6">{badge.criteria}</p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-black text-[#00D4AA]"
        >
          +{badge.xpReward} XP gained!
        </motion.div>

        <button
          onClick={onClose}
          className="mt-6 px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors w-full"
        >
          View all badges
        </button>
      </motion.div>
    </motion.div>
  );
}

// Certificate modal wrapper
function CertificateModal({ certData, certId, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#12121A] border border-white/10 rounded-3xl p-6 max-w-3xl w-full my-8"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Certificate Preview</h3>
          <button onClick={onClose} className="text-[#5A5A72] hover:text-white"><X size={20} /></button>
        </div>
        <Certificate certData={certData} certId={certId} onClose={onClose} />
      </motion.div>
    </motion.div>
  );
}

export default function Badges() {
  const { currentUser, userData } = useAuth();
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const [certModal, setCertModal] = useState(null);
  const [generatingCert, setGeneratingCert] = useState(null);

  // Mock volunteerData if not in Firestore yet
  const volunteerData = {
    totalTasks: userData?.totalTasks || 0,
    totalHours: userData?.totalHours || 0,
    streakWeeks: userData?.streakWeeks || 0,
    criticalTasksCount: userData?.criticalTasksCount || 0,
    consecutiveFiveStars: userData?.consecutiveFiveStars || 0,
    tasksByCategory: userData?.tasksByCategory || {},
    earnedBadges: userData?.earnedBadges || [],
    xp: userData?.xp || 0,
    name: userData?.name || currentUser?.displayName || 'Volunteer',
    averageRating: userData?.averageRating || 4.8,
    city: userData?.city || 'Mumbai',
  };

  const earnedBadges = BADGES.filter(b => b.check(volunteerData));
  const earnedIds = new Set(earnedBadges.map(b => b.id));

  // Certificate milestones
  const milestones = [
    { id: 'tasks_5', label: '5 Tasks Milestone', eligible: volunteerData.totalTasks >= 5 },
    { id: 'hours_10', label: '10 Hours Milestone', eligible: volunteerData.totalHours >= 10 },
    { id: 'gold_badge', label: 'Gold Badge Achievement', eligible: earnedBadges.some(b => b.tier === 'gold') },
    { id: `monthly_${new Date().toLocaleString('en-IN', { month: 'long' })}`, label: `Monthly Contribution — ${new Date().toLocaleString('en-IN', { month: 'long' })}`, eligible: volunteerData.totalTasks > 0 },
  ];

  const handleGenerateCert = async (milestone) => {
    setGeneratingCert(milestone.id);
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const rand = Math.random().toString(36).substr(2, 6).toUpperCase();
    const certId = `RP-${year}-${month}-${rand}`;

    const certData = {
      volunteerName: volunteerData.name,
      taskCount: volunteerData.totalTasks,
      hoursServed: volunteerData.totalHours,
      topCategories: Object.keys(volunteerData.tasksByCategory).slice(0, 2).length > 0
        ? Object.keys(volunteerData.tasksByCategory).slice(0, 2)
        : ['Health', 'Education'],
      locationArea: volunteerData.city,
      earnedBadges: Array.from(earnedIds),
      partnerNgoName: 'RapidPulse Partner NGO',
      averageRating: volunteerData.averageRating,
      issuedAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'certificates'), {
        ...certData,
        certId,
        volunteerId: currentUser?.uid,
        milestone: milestone.id,
        issuedAt: new Date(),
      });
    } catch (err) {
      console.error('Error saving cert to Firestore:', err);
    }

    setGeneratingCert(null);
    setCertModal({ certData, certId });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-8 space-y-8">
      {/* Badge unlock modal */}
      <AnimatePresence>
        {unlockedBadge && (
          <BadgeUnlockModal badge={unlockedBadge} onClose={() => setUnlockedBadge(null)} />
        )}
      </AnimatePresence>

      {/* Certificate modal */}
      <AnimatePresence>
        {certModal && (
          <CertificateModal
            certData={certModal.certData}
            certId={certModal.certId}
            onClose={() => setCertModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Badges & Certificates</h1>
        <p className="text-[#A0A0B8] text-sm mt-1">Track your achievements and download verified certificates.</p>
      </div>

      {/* Section 1: XP Sources */}
      <XPSourcesCard />

      {/* Section 2: Badge Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award size={20} className="text-[#FFD700]" /> Your badges
          </h2>
          <span className="text-sm text-[#A0A0B8]">
            <span className="text-white font-bold">{earnedBadges.length}</span> / {BADGES.length} earned
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {BADGES.map(badge => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={earnedIds.has(badge.id)}
              volunteerData={volunteerData}
              lang={lang}
              onClick={setUnlockedBadge}
            />
          ))}
        </div>
      </div>

      {/* Section 3: Certificates */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-bold">Your certificates</h2>
          <div className="group relative">
            <HelpCircle size={18} className="text-[#5A5A72] cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#1A1A2E] border border-white/10 rounded-xl p-3 text-xs text-[#A0A0B8] opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              Certificates are downloadable PDFs that verify your volunteer contributions. Share them with employers or on LinkedIn.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {milestones.map(milestone => (
            <div
              key={milestone.id}
              className={`bg-white/[0.04] border rounded-2xl p-5 flex items-center justify-between gap-4 transition-colors ${
                milestone.eligible
                  ? 'border-[#6C47FF]/30 hover:border-[#6C47FF]/60'
                  : 'border-white/[0.06] opacity-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                  milestone.eligible ? 'bg-[#6C47FF]/10' : 'bg-white/5'
                }`}>
                  🏅
                </div>
                <div>
                  <p className="font-semibold text-sm">{milestone.label}</p>
                  <p className="text-xs text-[#5A5A72] mt-0.5">
                    {milestone.eligible ? 'You qualify for this certificate' : 'Not yet eligible'}
                  </p>
                </div>
              </div>
              {milestone.eligible && (
                <button
                  onClick={() => handleGenerateCert(milestone)}
                  disabled={generatingCert === milestone.id}
                  className="shrink-0 px-4 py-2 bg-[#6C47FF] hover:bg-[#5A3BE0] text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {generatingCert === milestone.id ? 'Generating...' : 'Generate certificate'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
