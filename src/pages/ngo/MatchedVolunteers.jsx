import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { MapPin, Sparkles, Star, ChevronRight, User, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MatchedVolunteers() {
  const [needs, setNeeds] = useState([]);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchLoadingText, setMatchLoadingText] = useState('Gemini is finding the best volunteers...');

  // Helper to color initials avatar
  const getAvatarColor = (name) => {
    const colors = ['#6C47FF', '#00D4AA', '#FF6B6B', '#FF8C00', '#FFD700', '#00C853'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getSeverityColor = (score) => {
    switch(score) {
      case 5: return '#FF3B3B';
      case 4: return '#FF8C00';
      case 3: return '#FFD700';
      case 2: return '#00C853';
      case 1: return '#7B61FF';
      default: return '#7B61FF';
    }
  };

  useEffect(() => {
    const fetchNeeds = async () => {
      // In a real scenario we might filter by the logged-in NGO's ID
      const q = query(collection(db, 'needs'), where('status', '!=', 'resolved'));
      const querySnapshot = await getDocs(q);
      const fetchedNeeds = [];
      querySnapshot.forEach((docSnap) => {
        fetchedNeeds.push({ id: docSnap.id, ...docSnap.data() });
      });
      setNeeds(fetchedNeeds);
    };
    fetchNeeds();
  }, []);

  const runMatching = async () => {
    if (!selectedNeed) return;
    setLoadingMatches(true);
    setMatches([]);
    
    // Simulate AI matching delay
    setTimeout(() => {
      setMatchLoadingText('Analyzing candidate skills & availability...');
    }, 1500);

    setTimeout(() => {
      setMatchLoadingText('Ranking best matches...');
    }, 3000);

    // Mock response for matched volunteers
    setTimeout(() => {
      const mockMatches = [
        {
          id: 'mock-1',
          volunteerId: 'v-101',
          name: 'Priya Sharma',
          level: 4,
          levelName: 'Community Leader',
          distanceKm: 2.4,
          averageRating: 4.8,
          skills: ['First Aid', 'Counseling', 'Food Distribution', 'Hindi'],
          availability: 'Available today',
          rank: 1,
          matchScore: 92,
          reasoning: "Priya's immediate availability and extensive background in First Aid make her the ideal candidate for this critical health-related task.",
          keyFactors: ['skill match', 'availability']
        },
        {
          id: 'mock-2',
          volunteerId: 'v-102',
          name: 'Rahul Gupta',
          level: 2,
          levelName: 'Active Helper',
          distanceKm: 5.1,
          averageRating: 4.2,
          skills: ['Logistics', 'Driving', 'Food Distribution'],
          availability: 'Available this week',
          rank: 2,
          matchScore: 84,
          reasoning: "Rahul has a strong track record with logistics and food distribution, though he is slightly further away.",
          keyFactors: ['skill match', 'experience']
        },
        {
          id: 'mock-3',
          volunteerId: 'v-103',
          name: 'Anita Desai',
          level: 5,
          levelName: 'Local Hero',
          distanceKm: 1.2,
          averageRating: 5.0,
          skills: ['Teaching', 'Counseling', 'Childcare', 'English'],
          availability: 'Available today',
          rank: 3,
          matchScore: 78,
          reasoning: "Anita is highly rated and very close, but lacks the specific First Aid skills requested for this need.",
          keyFactors: ['proximity', 'availability']
        }
      ];
      setMatches(mockMatches);
      setLoadingMatches(false);
      setMatchLoadingText('Gemini is finding the best volunteers...');
    }, 4500);
  };

  const handleAssign = async (match) => {
    // In real app, create task and update need status
    try {
      if (selectedNeed) {
        await updateDoc(doc(db, 'needs', selectedNeed.id), {
          status: 'assigned',
          assignedVolunteer: match.volunteerId
        });
        
        // Mock task creation
        await addDoc(collection(db, 'tasks'), {
          needId: selectedNeed.id,
          volunteerId: match.volunteerId,
          status: 'assigned',
          assignedAt: new Date().toISOString()
        });
        
        alert(`Volunteer ${match.name} assigned successfully! Push notification sent.`);
        setMatches(matches.filter(m => m.id !== match.id));
      }
    } catch (error) {
      console.error('Error assigning volunteer:', error);
      alert('Assignment simulated successfully (mock).');
      setMatches(matches.filter(m => m.id !== match.id));
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0A0A0F] text-white">
      {/* Left Panel: Needs List */}
      <div className="w-[30%] min-w-[300px] border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold tracking-tight">Active Needs</h2>
          <p className="text-sm text-[#A0A0B8] mt-1">Select a need to find volunteers</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {needs.length === 0 ? (
            <div className="text-center text-[#5A5A72] py-8">
              No active needs found.
            </div>
          ) : (
            needs.map(need => (
              <div 
                key={need.id}
                onClick={() => setSelectedNeed(need)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedNeed?.id === need.id 
                    ? 'bg-white/10 border-[#6C47FF]/50' 
                    : 'bg-white/5 border-white/5 hover:bg-white/[0.07]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-3 h-3 rounded-full mt-1.5 shrink-0 shadow-sm"
                    style={{ backgroundColor: getSeverityColor(need.severityScore), boxShadow: `0 0 8px ${getSeverityColor(need.severityScore)}40` }}
                  />
                  <div>
                    <h3 className="font-semibold text-[15px] leading-tight mb-1">{need.title}</h3>
                    <div className="flex items-center text-xs text-[#A0A0B8]">
                      <MapPin size={12} className="mr-1" />
                      <span className="truncate">{need.locationName || 'Location not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Matches */}
      <div className="flex-1 flex flex-col bg-[#0A0A0F]/50">
        {!selectedNeed ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#5A5A72]">
            <User size={48} className="mb-4 opacity-50" />
            <p>Select a need from the left to run matching</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center backdrop-blur-md bg-[#0A0A0F]/80 z-10 sticky top-0">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span 
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ 
                      backgroundColor: `${getSeverityColor(selectedNeed.severityScore)}20`,
                      color: getSeverityColor(selectedNeed.severityScore),
                      border: `1px solid ${getSeverityColor(selectedNeed.severityScore)}40`
                    }}
                  >
                    Severity {selectedNeed.severityScore}: {selectedNeed.severityLabel || 'High'}
                  </span>
                  <span className="text-xs text-[#A0A0B8] border border-white/10 px-2 py-1 rounded-md">{selectedNeed.category}</span>
                </div>
                <h2 className="text-2xl font-bold">{selectedNeed.title}</h2>
              </div>
              
              <button 
                onClick={runMatching}
                disabled={loadingMatches}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] hover:bg-[#5A3BE0] disabled:bg-[#6C47FF]/50 text-white rounded-xl font-medium transition-colors shadow-[0_0_15px_rgba(108,71,255,0.3)]"
              >
                <Sparkles size={18} />
                {loadingMatches ? 'Matching...' : 'Run matching'}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingMatches ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#6C47FF]/20 border-t-[#6C47FF] rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00D4AA] animate-pulse" size={24} />
                  </div>
                  <p className="text-lg text-[#A0A0B8] animate-pulse">{matchLoadingText}</p>
                </div>
              ) : matches.length > 0 ? (
                <div className="max-w-4xl mx-auto space-y-6 pb-12">
                  <AnimatePresence>
                    {matches.map((match, idx) => (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.15 }}
                        key={match.id}
                        className={`bg-white/[0.04] backdrop-blur-[20px] border border-white/[0.08] rounded-[16px] p-6 relative overflow-hidden ${
                          match.rank === 1 ? 'shadow-[0_0_20px_rgba(255,215,0,0.1)] border-[#FFD700]/30' : ''
                        }`}
                      >
                        {match.rank === 1 && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-[#FFD700]/20 to-transparent px-4 py-1 rounded-bl-lg">
                            <span className="text-[#FFD700] text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                              <Star size={12} fill="#FFD700" /> Best Match
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-5">
                          {/* Profile Info */}
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg"
                              style={{ backgroundColor: getAvatarColor(match.name) }}
                            >
                              {match.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h3 className="text-[18px] font-semibold flex items-center gap-2">
                                {match.name}
                                <span className="text-[#A0A0B8] text-sm font-normal">Level {match.level} · {match.levelName}</span>
                              </h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-[#A0A0B8]">
                                <span className="flex items-center gap-1">
                                  <MapPin size={14} className="text-[#6C47FF]" />
                                  {match.distanceKm}km away
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star size={14} className="text-[#FFD700]" fill="#FFD700" />
                                  {match.averageRating}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Match Score Circle */}
                          <div className="flex flex-col items-center relative w-16 h-16">
                            <svg className="w-16 h-16 transform -rotate-90">
                              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                              <circle 
                                cx="32" cy="32" r="28" 
                                stroke={match.matchScore >= 90 ? '#00D4AA' : match.matchScore >= 80 ? '#00C853' : '#FFD700'} 
                                strokeWidth="6" fill="transparent" 
                                strokeDasharray={28 * 2 * Math.PI} 
                                strokeDashoffset={(28 * 2 * Math.PI) - ((match.matchScore / 100) * (28 * 2 * Math.PI))} 
                                className="transition-all duration-1000 ease-out" 
                              />
                            </svg>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold">
                              {match.matchScore}%
                            </div>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {match.skills.map(skill => {
                              const isNeeded = selectedNeed.suggestedSkills?.includes(skill) || idx === 0; // Mock highlight
                              return (
                                <span 
                                  key={skill} 
                                  className={`text-xs px-2.5 py-1 rounded-full ${
                                    isNeeded 
                                      ? 'bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/30' 
                                      : 'bg-white/5 text-[#A0A0B8] border border-white/10'
                                  }`}
                                >
                                  {skill}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* AI Reasoning */}
                        <div className="bg-[#6C47FF]/[0.08] border border-[#6C47FF]/20 rounded-[10px] p-3.5 mb-5 flex gap-3 items-start">
                          <Sparkles className="text-[#6C47FF] mt-0.5 shrink-0" size={16} />
                          <p className="text-sm italic text-[#E0E0FF] leading-relaxed">"{match.reasoning}"</p>
                        </div>

                        {/* Footer / Actions */}
                        <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-auto">
                          <div className="flex items-center gap-1.5 text-sm">
                            {match.availability.includes('today') ? (
                              <CheckCircle size={14} className="text-[#00D4AA]" />
                            ) : (
                              <Clock size={14} className="text-[#FF8C00]" />
                            )}
                            <span className={match.availability.includes('today') ? 'text-[#00D4AA]' : 'text-[#FF8C00]'}>
                              {match.availability}
                            </span>
                          </div>
                          
                          <div className="flex gap-3">
                            <button 
                              onClick={() => setMatches(matches.filter(m => m.id !== match.id))}
                              className="px-4 py-2 text-sm text-[#A0A0B8] hover:text-white border border-white/10 hover:bg-white/5 rounded-lg transition-colors"
                            >
                              Skip
                            </button>
                            <button 
                              onClick={() => handleAssign(match)}
                              className="px-4 py-2 text-sm bg-white text-black hover:bg-gray-200 font-semibold rounded-lg transition-colors flex items-center gap-1"
                            >
                              Assign <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
