import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { calculateLevel } from '../../utils/gamification';
import MultiSelectPills from '../../components/MultiSelectPills';
import { Camera, Edit2, Save, Star, MapPin, Clock, Award, Upload, FileText, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';

const VOLUNTEER_SKILLS = [
  "First Aid", "Teaching", "Cooking", "Carpentry", "Driving",
  "Counselling", "Legal Aid", "Translation", "Graphic Design",
  "Photography", "Medical", "Programming", "Construction", "Tailoring"
];

const LANGUAGES = [
  "Hindi", "English", "Punjabi", "Urdu", "Tamil", "Telugu", "Bengali", "Marathi"
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['Morning', 'Afternoon', 'Evening'];

function getAvatarColor(name = '') {
  const colors = ['#6C47FF', '#00D4AA', '#FF6B6B', '#FF8C00', '#FFD700', '#00C853'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function VolunteerProfile() {
  const { currentUser, userData } = useAuth();
  const { addToast } = useToast();
  const avatarInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [travelRadius, setTravelRadius] = useState(10);
  const [photoUrl, setPhotoUrl] = useState('');

  // Resume
  const [resumeName, setResumeName] = useState('');
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || currentUser?.displayName || '');
      setCity(userData.city || '');
      setPincode(userData.pincode || '');
      setBio(userData.bio || '');
      setSkills(userData.skills || []);
      setLanguages(userData.languages || []);
      setAvailability(userData.availability || []);
      setTravelRadius(userData.travelRadiusKm || 10);
      setPhotoUrl(userData.photoUrl || '');
      setResumeName(userData.resumeName || '');
    }
  }, [userData, currentUser]);

  const xp = userData?.xp || 0;
  const levelInfo = calculateLevel(xp);
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase() || '?';

  const toggleAvailability = (day, time) => {
    const key = `${day}-${time}`;
    setAvailability(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Use a mock URL for demo (Firebase Storage requires proper config)
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      addToast('Avatar updated! Save to apply.', 'info');
    } catch (err) {
      addToast('Failed to upload avatar', 'error');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      return addToast('Please upload a PDF file', 'error');
    }
    setResumeName(file.name);
    setIsExtracting(true);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
      let fullText = '';
      const maxPages = Math.min(3, pdf.numPages);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(s => s.str).join(' ');
      }

      if (!fullText.trim()) throw new Error('Could not extract text from PDF');

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key not configured');

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Extract volunteer/professional skills from this resume. Return ONLY a JSON array of skill strings, max 15. Focus on: medical, teaching, cooking, construction, legal, driving, counselling, design, photography, programming. Resume: ${fullText.substring(0, 5000)}` }] }],
            generationConfig: { temperature: 0.2 },
          }),
        }
      );

      if (!res.ok) throw new Error('AI extraction failed');
      const data = await res.json();
      let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const extracted = JSON.parse(raw);
      if (Array.isArray(extracted) && extracted.length > 0) {
        const newSkills = extracted.filter(s => !skills.includes(s));
        setSuggestedSkills(newSkills);
        addToast(`Found ${newSkills.length} new skills from resume`, 'success');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Resume parsing failed', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'volunteers', currentUser.uid), {
        name,
        city,
        pincode,
        bio,
        skills,
        languages,
        availability,
        travelRadiusKm: travelRadius,
        photoUrl,
        resumeName,
      });
      addToast('Profile saved successfully!', 'success');
      setEditing(false);
    } catch (err) {
      console.error(err);
      addToast('Failed to save: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-[#A0A0B8] text-sm mt-1">Manage your volunteer identity.</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] hover:bg-[#5A3BE0] text-white font-semibold text-sm rounded-xl transition-colors"
            >
              <Edit2 size={15} /> Edit profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-[#A0A0B8] hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#00D4AA] hover:bg-[#00e5b8] text-black font-semibold text-sm rounded-xl transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* LEFT COLUMN — Avatar + Summary */}
          <div className="space-y-6">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 flex flex-col items-center gap-4">
              {/* Avatar */}
              <div className="relative group">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden border-2 border-white/10"
                  style={{ backgroundColor: photoUrl ? 'transparent' : getAvatarColor(name) }}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                {editing && (
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera size={24} className="text-white" />
                  </button>
                )}
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>

              {/* Name */}
              {editing ? (
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="text-center text-xl font-semibold bg-transparent border-b border-white/20 focus:border-[#00D4AA] outline-none w-full"
                />
              ) : (
                <h2 className="text-xl font-semibold">{name}</h2>
              )}

              {/* Level badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ background: 'linear-gradient(135deg, #6C47FF, #00D4AA)', color: 'white' }}>
                  Level {levelInfo.level}
                </span>
                <span className="text-sm text-[#A0A0B8]">{xp} XP</span>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-3 w-full pt-4 border-t border-white/[0.06]">
                {[
                  { label: 'Tasks', value: userData?.totalTasks || 0 },
                  { label: 'Hours', value: `${userData?.totalHours || 0}h` },
                  { label: 'Rating', value: `${userData?.averageRating || 0}★` },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-lg font-bold">{s.value}</div>
                    <div className="text-[11px] text-[#5A5A72]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick info card */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm text-[#A0A0B8]">
                <MapPin size={14} /> {city || 'City not set'}{pincode ? ` · ${pincode}` : ''}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#A0A0B8]">
                <Clock size={14} /> Travel radius: {travelRadius}km
              </div>
              <div className="flex items-center gap-2 text-sm text-[#A0A0B8]">
                <Award size={14} /> {(userData?.earnedBadges || []).length} badges earned
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Full Profile Fields */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-5">
              <h3 className="text-lg font-bold flex items-center gap-2">Basic Info</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#5A5A72] uppercase tracking-wider mb-1.5 block">City</label>
                  {editing ? (
                    <input value={city} onChange={e => setCity(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#00D4AA] text-sm" />
                  ) : (
                    <p className="text-sm font-medium">{city || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-[#5A5A72] uppercase tracking-wider mb-1.5 block">Pin Code</label>
                  {editing ? (
                    <input value={pincode} onChange={e => setPincode(e.target.value)} pattern="\d{6}" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#00D4AA] text-sm" />
                  ) : (
                    <p className="text-sm font-medium">{pincode || '—'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#5A5A72] uppercase tracking-wider mb-1.5 block flex justify-between">
                  <span>Bio</span>
                  {editing && <span className="text-[#A0A0B8]">{bio.length}/200</span>}
                </label>
                {editing ? (
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    maxLength={200}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-[#00D4AA] text-sm resize-none h-20"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="text-sm text-[#A0A0B8] leading-relaxed">{bio || 'No bio set.'}</p>
                )}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold">Skills</h3>
              {editing ? (
                <MultiSelectPills options={VOLUNTEER_SKILLS} selected={skills} onChange={setSkills} colorTheme="accent" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? skills.map(s => (
                    <span key={s} className="text-xs px-3 py-1.5 rounded-full bg-[#00D4AA]/10 text-[#00D4AA] border border-[#00D4AA]/30 font-medium">{s}</span>
                  )) : (
                    <p className="text-sm text-[#5A5A72]">No skills added yet.</p>
                  )}
                </div>
              )}
            </div>

            {/* Languages */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold">Languages</h3>
              {editing ? (
                <MultiSelectPills options={LANGUAGES} selected={languages} onChange={setLanguages} colorTheme="accent" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {languages.length > 0 ? languages.map(l => (
                    <span key={l} className="text-xs px-3 py-1.5 rounded-full bg-[#6C47FF]/10 text-[#6C47FF] border border-[#6C47FF]/30 font-medium">{l}</span>
                  )) : (
                    <p className="text-sm text-[#5A5A72]">No languages selected.</p>
                  )}
                </div>
              )}
            </div>

            {/* Availability Grid */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold">Weekly Availability</h3>
              <div className="overflow-x-auto pb-2">
                <div className="grid grid-cols-[auto_1fr] gap-3 text-sm min-w-[420px]">
                  <div className="grid grid-rows-3 gap-2 mt-8 text-[#A0A0B8] font-medium">
                    {TIMES.map(t => <div key={t} className="h-10 flex items-center text-xs">{t}</div>)}
                  </div>
                  <div className="flex gap-2">
                    {DAYS.map(day => (
                      <div key={day} className="flex flex-col gap-2">
                        <div className="text-center text-[#5A5A72] mb-1 text-xs">{day}</div>
                        {TIMES.map(time => {
                          const key = `${day}-${time}`;
                          const active = availability.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              disabled={!editing}
                              onClick={() => editing && toggleAvailability(day, time)}
                              className={`w-11 h-10 rounded-lg border flex items-center justify-center transition-all text-xs ${
                                active
                                  ? 'bg-[#00D4AA]/20 border-[#00D4AA] text-[#00D4AA] shadow-[0_0_8px_rgba(0,212,170,0.15)]'
                                  : 'bg-white/[0.03] border-white/[0.08] text-transparent'
                              } ${editing ? 'cursor-pointer hover:bg-white/[0.06]' : 'cursor-default'}`}
                            >
                              {active && '✓'}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Radius */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold">Max Travel Radius</h3>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[#A0A0B8]">Distance you're willing to travel</span>
                <span className="text-white font-bold text-lg">{travelRadius} km</span>
              </div>
              {editing ? (
                <input
                  type="range" min="1" max="50" value={travelRadius}
                  onChange={e => setTravelRadius(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00D4AA]"
                />
              ) : (
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(travelRadius / 50) * 100}%`, background: 'linear-gradient(90deg, #6C47FF, #00D4AA)' }} />
                </div>
              )}
              {editing && (
                <div className="flex justify-between text-xs text-[#5A5A72]"><span>1km</span><span>50km</span></div>
              )}
            </div>

            {/* Resume Upload */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><FileText size={18} /> Resume</h3>
              {resumeName ? (
                <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-[#6C47FF]" />
                    <span className="text-sm font-medium">{resumeName}</span>
                  </div>
                  {editing && (
                    <label className="text-xs px-3 py-1.5 bg-[#6C47FF]/10 text-[#6C47FF] rounded-lg cursor-pointer hover:bg-[#6C47FF]/20 transition-colors font-semibold">
                      Re-upload
                      <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
                    </label>
                  )}
                </div>
              ) : editing ? (
                <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[#00D4AA]/40 hover:bg-white/[0.02] transition-colors">
                  <Upload size={28} className="text-[#5A5A72]" />
                  <span className="text-sm text-[#A0A0B8]">Drop PDF resume here or click to browse</span>
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
                </label>
              ) : (
                <p className="text-sm text-[#5A5A72]">No resume uploaded.</p>
              )}

              {isExtracting && (
                <div className="flex items-center gap-3 text-[#00D4AA] text-sm p-3 bg-[#00D4AA]/5 rounded-xl">
                  <Loader2 size={16} className="animate-spin" /> Extracting skills with AI...
                </div>
              )}

              {suggestedSkills.length > 0 && (
                <div className="p-4 bg-[#00D4AA]/5 border border-[#00D4AA]/20 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-[#00D4AA]">Suggested skills from resume</span>
                    <button
                      onClick={() => { setSkills(prev => Array.from(new Set([...prev, ...suggestedSkills]))); setSuggestedSkills([]); }}
                      className="text-xs px-3 py-1 bg-[#00D4AA]/10 text-[#00D4AA] rounded-full font-bold hover:bg-[#00D4AA]/20"
                    >
                      Add All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills.map(s => (
                      <button
                        key={s}
                        onClick={() => { setSkills(prev => [...prev, s]); setSuggestedSkills(prev => prev.filter(x => x !== s)); }}
                        className="text-xs px-3 py-1 rounded-full border border-[#00D4AA]/30 text-white hover:bg-[#00D4AA]/10 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Save button (mobile-friendly full width) */}
            {editing && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 bg-[#00D4AA] hover:bg-[#00e5b8] text-black font-bold rounded-xl text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {saving ? 'Saving...' : 'Save all changes'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
