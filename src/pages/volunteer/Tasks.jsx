import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle, Star, Clock, SlidersHorizontal, Search } from 'lucide-react';

const CATEGORIES = ['Health', 'Education', 'Food Relief', 'Disaster Relief', 'Animal Welfare', 'Environment'];
const SEVERITY_LABELS = { 5: 'Critical', 4: 'High', 3: 'Moderate', 2: 'Low', 1: 'Minimal' };

function getSeverityColor(score) {
  const map = { 5: '#FF3B3B', 4: '#FF8C00', 3: '#FFD700', 2: '#00C853', 1: '#7B61FF' };
  return map[score] || '#7B61FF';
}

export default function Tasks() {
  const { currentUser, userData } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'find' ? 'find' : 'my';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [myTasks, setMyTasks] = useState([]);
  const [findNeeds, setFindNeeds] = useState([]);
  const [acceptedIds, setAcceptedIds] = useState(new Set());
  const [loadingNeeds, setLoadingNeeds] = useState(false);
  const [loadingMyTasks, setLoadingMyTasks] = useState(true);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxDistance, setMaxDistance] = useState(15);
  const [selectedSeverities, setSelectedSeverities] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchMyTasks = async () => {
      setLoadingMyTasks(true);
      const q = query(collection(db, 'tasks'), where('volunteerId', '==', currentUser.uid));
      const snap = await getDocs(q);
      const rawTasks = [];
      snap.forEach(d => rawTasks.push({ id: d.id, ...d.data() }));

      // Enrich each task with real need data (title, category, location, severity)
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
                  locationName: need.locationName || need.location,
                  severityScore: need.severityScore,
                  ngoName: need.ngoName,
                };
              }
            } catch (e) {
              console.warn('Could not fetch need for task', task.id, e);
            }
          }
          return task;
        })
      );
      setMyTasks(enriched);
      setLoadingMyTasks(false);
    };
    fetchMyTasks();
  }, [currentUser]);

  useEffect(() => {
    if (activeTab !== 'find') return;
    setLoadingNeeds(true);
    const fetchNeeds = async () => {
      const q = query(collection(db, 'needs'), where('status', 'in', ['pending', 'matched']));
      const snap = await getDocs(q);
      const needs = [];
      snap.forEach(d => needs.push({ id: d.id, ...d.data() }));
      if (needs.length === 0) {
        setFindNeeds([
          { id: 'f1', title: 'Emergency Medical Camp', category: 'Health', locationName: 'Dharavi, Mumbai', severityScore: 5, distanceKm: 1.2, ngoName: 'Asha Foundation', suggestedSkills: ['First Aid', 'Medical', 'Counseling'], description: 'Urgently need volunteers for a medical camp serving 500+ families.' },
          { id: 'f2', title: 'Flood Relief Packing', category: 'Disaster Relief', locationName: 'Govandi, Mumbai', severityScore: 4, distanceKm: 3.4, ngoName: 'DisasterAid India', suggestedSkills: ['Driving', 'Logistics', 'Hindi'], description: 'Pack and distribute flood relief kits to displaced families.' },
          { id: 'f3', title: 'Digital Literacy Workshop', category: 'Education', locationName: 'Kurla, Mumbai', severityScore: 2, distanceKm: 5.8, ngoName: 'EduReach NGO', suggestedSkills: ['Teaching', 'English', 'Computers'], description: 'Teach basic computer skills to underprivileged youth over 3 sessions.' },
          { id: 'f4', title: 'Stray Animal Care Drive', category: 'Animal Welfare', locationName: 'Chembur, Mumbai', severityScore: 2, distanceKm: 7.1, ngoName: 'PawsIndia', suggestedSkills: ['Animal Care', 'Driving'], description: 'Help vaccinate and feed stray animals in the area.' },
          { id: 'f5', title: 'Food Distribution Drive', category: 'Food Relief', locationName: 'Mankhurd, Mumbai', severityScore: 3, distanceKm: 9.5, ngoName: 'Annadata Trust', suggestedSkills: ['Food Distribution', 'Hindi', 'Driving'], description: 'Distribute cooked food to 300+ homeless individuals every Saturday.' },
          { id: 'f6', title: 'Tree Plantation Campaign', category: 'Environment', locationName: 'Powai, Mumbai', severityScore: 1, distanceKm: 12.3, ngoName: 'Green Mumbai', suggestedSkills: ['Physical Work', 'Driving'], description: 'Plant 500 saplings across community parks.' },
        ]);
      } else {
        setFindNeeds(needs);
      }
      setLoadingNeeds(false);
    };
    fetchNeeds();
  }, [activeTab]);

  const handleAccept = async (need) => {
    setAcceptedIds(prev => new Set([...prev, need.id]));
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
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleSeverity = (s) => {
    setSelectedSeverities(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const filteredNeeds = findNeeds.filter(n => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(n.category)) return false;
    if (n.distanceKm && n.distanceKm > maxDistance) return false;
    if (selectedSeverities.length > 0 && !selectedSeverities.includes(n.severityScore)) return false;
    return true;
  });

  const statusColor = (status) => {
    const map = { assigned: '#6C47FF', completed: '#00C853', declined: '#FF6B6B' };
    return map[status] || '#A0A0B8';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-[#A0A0B8] text-sm mt-1">Manage your assignments or discover new opportunities.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 w-fit">
          {[{ id: 'my', label: 'My Tasks' }, { id: 'find', label: 'Find Tasks' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#6C47FF] text-white shadow-[0_0_12px_rgba(108,71,255,0.3)]'
                  : 'text-[#A0A0B8] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'my' && (
            <motion.div key="my" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {loadingMyTasks ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 animate-pulse">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="h-5 w-16 bg-white/10 rounded-full" />
                          <div className="h-5 w-20 bg-white/10 rounded-full" />
                        </div>
                        <div className="h-5 w-3/4 bg-white/10 rounded" />
                        <div className="flex gap-3">
                          <div className="h-4 w-28 bg-white/10 rounded" />
                          <div className="h-4 w-32 bg-white/10 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : myTasks.length === 0 ? (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-16 text-center text-[#5A5A72]">
                  <CheckCircle size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No tasks yet. Accept tasks from the Find Tasks tab.</p>
                </div>
              ) : (
                myTasks.map(task => (
                  <div key={task.id} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center hover:bg-white/[0.06] transition-colors">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${statusColor(task.status)}15`, color: statusColor(task.status), border: `1px solid ${statusColor(task.status)}30` }}>
                          {task.status?.charAt(0).toUpperCase() + task.status?.slice(1)}
                        </span>
                        {task.category && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-[#A0A0B8] border border-white/[0.08]">{task.category}</span>
                        )}
                        {task.severityScore && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: `${getSeverityColor(task.severityScore)}15`, color: getSeverityColor(task.severityScore) }}>
                            Sev {task.severityScore}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-[16px]">{task.title || 'Unnamed Task'}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-[#A0A0B8]">
                        {task.locationName && (
                          <span className="flex items-center gap-1"><MapPin size={13} />{task.locationName}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={13} /> Assigned: {task.assignedAt ? new Date(task.assignedAt.seconds * 1000).toLocaleDateString('en-IN') : 'Recently'}
                        </span>
                      </div>
                      {task.ngoName && (
                        <p className="text-xs text-[#5A5A72]">by {task.ngoName}</p>
                      )}
                    </div>
                    {task.status === 'completed' && task.ngoRating && (
                      <div className="flex items-center gap-1 text-[#FFD700]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < task.ngoRating ? '#FFD700' : 'transparent'} />
                        ))}
                        <span className="text-sm text-[#A0A0B8] ml-1">{task.ngoRating}/5</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'find' && (
            <motion.div key="find" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Filters */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#A0A0B8]">
                  <SlidersHorizontal size={16} /> Filters
                </div>
                {/* Categories */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#5A5A72] mb-2">Category</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          selectedCategories.includes(cat)
                            ? 'bg-[#6C47FF] border-[#6C47FF] text-white'
                            : 'border-white/10 text-[#A0A0B8] hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Severity */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#5A5A72] mb-2">Severity</p>
                  <div className="flex gap-2">
                    {[5, 4, 3, 2, 1].map(s => (
                      <button
                        key={s}
                        onClick={() => toggleSeverity(s)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${
                          selectedSeverities.includes(s)
                            ? 'text-white border-transparent'
                            : 'border-white/10 text-[#A0A0B8] hover:text-white'
                        }`}
                        style={selectedSeverities.includes(s) ? { backgroundColor: getSeverityColor(s), boxShadow: `0 0 10px ${getSeverityColor(s)}50` } : {}}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Distance slider */}
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#5A5A72] mb-2">Max Distance: <span className="text-white font-semibold">{maxDistance}km</span></p>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={maxDistance}
                    onChange={e => setMaxDistance(Number(e.target.value))}
                    className="w-full accent-[#6C47FF]"
                  />
                  <div className="flex justify-between text-xs text-[#5A5A72] mt-0.5"><span>1km</span><span>25km</span></div>
                </div>
              </div>

              {/* Results */}
              {loadingNeeds ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 animate-pulse space-y-3">
                      <div className="flex justify-between">
                        <div className="h-5 w-24 bg-white/10 rounded-full" />
                        <div className="h-4 w-14 bg-white/10 rounded" />
                      </div>
                      <div className="h-3 w-16 bg-white/10 rounded" />
                      <div className="h-5 w-3/4 bg-white/10 rounded" />
                      <div className="h-3 w-full bg-white/10 rounded" />
                      <div className="flex gap-2">
                        <div className="h-5 w-14 bg-white/10 rounded-full" />
                        <div className="h-5 w-14 bg-white/10 rounded-full" />
                      </div>
                      <div className="h-10 w-full bg-white/10 rounded-xl mt-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredNeeds.map((need, idx) => {
                    const isAccepted = acceptedIds.has(need.id);
                    const mySkills = userData?.skills || [];
                    return (
                      <motion.div
                        key={need.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.07 }}
                        className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3 hover:border-white/20 transition-colors"
                      >
                        {/* Top badges */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{
                            backgroundColor: `${getSeverityColor(need.severityScore)}15`,
                            color: getSeverityColor(need.severityScore),
                            border: `1px solid ${getSeverityColor(need.severityScore)}40`,
                          }}>
                            {SEVERITY_LABELS[need.severityScore] || 'Severity'} {need.severityScore}
                          </span>
                          <span className="text-xs text-[#A0A0B8] flex items-center gap-1">
                            <MapPin size={12} />{need.distanceKm ? `${need.distanceKm}km` : 'Nearby'}
                          </span>
                        </div>
                        {/* Title */}
                        <div>
                          <span className="text-xs text-[#A0A0B8] mb-1 block">{need.category}</span>
                          <h3 className="font-semibold text-[15px] leading-snug">{need.title}</h3>
                          {need.description && (
                            <p className="text-xs text-[#5A5A72] mt-1 line-clamp-2">{need.description}</p>
                          )}
                        </div>
                        {/* Location */}
                        <div className="flex items-center gap-1 text-xs text-[#A0A0B8]">
                          <MapPin size={12} />{need.locationName}
                        </div>
                        {/* Skills */}
                        {need.suggestedSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {need.suggestedSkills.map(skill => {
                              const matches = mySkills.includes(skill);
                              return (
                                <span key={skill} className={`text-[11px] px-2 py-0.5 rounded-full border ${
                                  matches
                                    ? 'bg-[#00D4AA]/10 text-[#00D4AA] border-[#00D4AA]/30'
                                    : 'bg-white/5 text-[#A0A0B8] border-white/10'
                                }`}>
                                  {skill}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {/* NGO */}
                        <p className="text-xs text-[#5A5A72]">by {need.ngoName || 'Community NGO'}</p>
                        {/* Action */}
                        <button
                          onClick={() => !isAccepted && handleAccept(need)}
                          className={`mt-auto py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            isAccepted
                              ? 'bg-[#00C853]/15 text-[#00C853] border border-[#00C853]/30 cursor-default'
                              : 'bg-white text-black hover:bg-gray-200'
                          }`}
                        >
                          {isAccepted ? (
                            <><CheckCircle size={16} /> Assigned ✓</>
                          ) : (
                            'Accept Task'
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                  {filteredNeeds.length === 0 && !loadingNeeds && (
                    <div className="col-span-3 py-16 text-center text-[#5A5A72]">
                      <Search size={40} className="mx-auto mb-3 opacity-30" />
                      No tasks match your current filters. Try adjusting the criteria.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
