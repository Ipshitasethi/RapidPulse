import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Heart, ArrowRight, Loader2 } from 'lucide-react';
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as pdfjsLib from 'pdfjs-dist';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';

import FormInput from '../components/FormInput';
import MultiSelectPills from '../components/MultiSelectPills';
import FileDropzone from '../components/FileDropzone';
import StepIndicator from '../components/StepIndicator';

// Setup PDF worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

const NGO_CATEGORIES = [
  "Food & Nutrition", "Healthcare", "Education", "Shelter & Housing", 
  "Women's Safety", "Child Welfare", "Elderly Care", "Disaster Relief", 
  "Water & Sanitation", "Livelihood"
];

const VOLUNTEER_SKILLS = [
  "First Aid", "Teaching", "Cooking", "Carpentry", "Driving", 
  "Counselling", "Legal Aid", "Translation", "Graphic Design", 
  "Photography", "Medical", "Programming", "Construction", "Tailoring"
];

const LANGUAGES = [
  "Hindi", "English", "Punjabi", "Urdu", "Tamil", "Telugu", "Bengali", "Marathi"
];

export default function Signup() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const auth = getAuth();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(roleParam === 'ngo' || roleParam === 'volunteer' ? roleParam : null);
  const [loading, setLoading] = useState(false);

  // Common Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useGoogle, setUseGoogle] = useState(false);

  // NGO Form State
  const [orgName, setOrgName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [contactName, setContactName] = useState('');
  const [ngoCategories, setNgoCategories] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Volunteer Form State
  const [volName, setVolName] = useState('');
  const [volBio, setVolBio] = useState('');
  const [volAvatar, setVolAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [volSkills, setVolSkills] = useState([]);
  const [volLanguages, setVolLanguages] = useState([]);
  const [travelRadius, setTravelRadius] = useState(10);
  const [availability, setAvailability] = useState([]); // Array of 'Mon-Morning' etc
  
  const [resumeFile, setResumeFile] = useState(null);
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (roleParam === 'ngo' || roleParam === 'volunteer') {
      setRole(roleParam);
    }
  }, [roleParam]);

  const toggleAvailability = (day, time) => {
    const key = `${day}-${time}`;
    if (availability.includes(key)) {
      setAvailability(availability.filter(k => k !== key));
    } else {
      setAvailability([...availability, key]);
    }
  };

  const handleRoleContinue = () => {
    if (!role) return;
    setStep(2);
  };

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUseGoogle(true);
      // Automatically prefill name/email if possible
      if (role === 'volunteer' && !volName) setVolName(result.user.displayName || '');
      if (role === 'ngo' && !contactName) setContactName(result.user.displayName || '');
      setEmail(result.user.email);
      addToast('Authenticated with Google. Please complete the remaining fields.', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleFileDrop = (file, type) => {
    const preview = URL.createObjectURL(file);
    if (type === 'logo') {
      setLogoFile(file);
      setLogoPreview(preview);
    } else if (type === 'avatar') {
      setVolAvatar(file);
      setAvatarPreview(preview);
    } else if (type === 'resume') {
      setResumeFile(file);
      extractSkillsFromResume(file);
    }
  };

  const extractSkillsFromResume = async (file) => {
    if (file.type !== 'application/pdf') {
      return addToast('Please upload a PDF file for skill extraction', 'error');
    }

    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
      let fullText = '';
      
      const maxPages = Math.min(3, pdf.numPages);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(s => s.str).join(' ');
      }

      if (!fullText.trim()) throw new Error("Could not extract text from PDF");

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key not found in environment variables");

      const prompt = `
        Extract all relevant volunteer or professional skills from this resume text.
        Return ONLY a JSON array of skill tag strings, maximum 15 items.
        Focus on: medical, teaching, cooking, construction, legal, driving, languages, counselling, design, photography, programming, and anything else relevant to volunteering.
        Example output: ["First Aid", "Teaching", "Hindi", "Driving"]
        Return only the JSON array. No other text or markdown.
        Resume text: ${fullText.substring(0, 5000)}
      `;

      const reqBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      if (!res.ok) throw new Error('Failed to communicate with AI service');
      const data = await res.json();
      
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const extracted = JSON.parse(rawText);
      
      if (Array.isArray(extracted) && extracted.length > 0) {
        setSuggestedSkills(extracted);
        addToast(`Extracted ${extracted.length} skills from resume`, 'success');
      } else {
        addToast('No applicable skills found in resume', 'info');
      }

    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error executing AI extraction', 'error');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      let user = auth.currentUser;
      
      if (!useGoogle && (!user || user.email !== email)) {
        if (!email || !password) throw new Error("Email and password required");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
      }

      if (!user) {
        throw new Error("Authentication failed. Please try again.");
      }

      const uid = user.uid;

      // Create base user record
      await setDoc(doc(db, 'users', uid), {
        role: role,
        email: email || user.email,
        createdAt: serverTimestamp()
      });

      if (role === 'ngo') {
        const ngoData = {
          name: orgName,
          registrationNumber: regNumber,
          categories: ngoCategories,
          city,
          pincode,
          contactName,
          contactEmail: email || user.email,
          createdAt: serverTimestamp(),
          status: 'pending' // For actual NGO verification flow
        };
        await setDoc(doc(db, 'ngos', uid), ngoData);
        navigate('/ngo/dashboard');
      } else {
        // Mocking Geolocation (normally would use navigator.geolocation)
        const location = { lat: 28.6139, lng: 77.2090 }; // placeholder Delhi
        
        const volData = {
          name: volName,
          bio: volBio,
          city,
          pincode,
          skills: volSkills,
          languages: volLanguages,
          travelRadiusKm: travelRadius,
          availability,
          contactEmail: email || user.email,
          location,
          xp: 0,
          level: 1,
          streakWeeks: 0,
          totalTasks: 0,
          totalHours: 0,
          averageRating: 0,
          earnedBadges: [],
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'volunteers', uid), volData);
        navigate('/volunteer/dashboard');
      }
      
      addToast('Account created successfully!', 'success');

    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto relative z-10">
        
        <div className="text-center mb-12">
          <Link to="/" className="text-2xl font-bold gradient-text inline-block mb-4">RapidPulse</Link>
          <StepIndicator totalSteps={2} currentStep={step} colorTheme={role === 'volunteer' ? 'accent' : 'primary'} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-4">Join RapidPulse</h1>
              <p className="text-[#A0A0B8] text-lg mb-12">Who are you joining as?</p>

              <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <div 
                  onClick={() => setRole('ngo')}
                  className={`glass p-8 rounded-2xl cursor-pointer transition-all text-left group ${
                    role === 'ngo' 
                      ? 'border-[#6C47FF] border-2 bg-white/10 shadow-[0_0_30px_rgba(108,71,255,0.2)] scale-[1.02]' 
                      : 'border-white/10 border hover:border-white/30'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-[#6C47FF]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Building2 className="text-[#6C47FF]" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">I represent an NGO</h3>
                  <p className="text-secondary leading-relaxed">
                    Register your organization to submit community needs, manage volunteers, and generate impact reports.
                  </p>
                </div>

                <div 
                  onClick={() => setRole('volunteer')}
                  className={`glass p-8 rounded-2xl cursor-pointer transition-all text-left group ${
                    role === 'volunteer' 
                      ? 'border-[#00D4AA] border-2 bg-white/10 shadow-[0_0_30px_rgba(0,212,170,0.2)] scale-[1.02]' 
                      : 'border-white/10 border hover:border-white/30'
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-[#00D4AA]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Heart className="text-[#00D4AA]" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">I want to volunteer</h3>
                  <p className="text-secondary leading-relaxed">
                    Create your skill profile to get matched to nearby community tasks and earn badges for your impact.
                  </p>
                </div>
              </div>

              {role && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-12">
                  <button 
                    onClick={handleRoleContinue}
                    className={`px-8 py-3 rounded-full font-semibold flex items-center gap-2 mx-auto ${
                      role === 'ngo' ? 'btn-primary' : 'bg-brand-accent text-gray-900 hover:bg-[#00e5b8]'
                    }`}
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && role === 'ngo' && (
            <motion.div
              key="step2-ngo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl mx-auto glass p-6 sm:p-10 rounded-2xl"
            >
              <h2 className="text-3xl font-bold text-white mb-8">NGO Profile Setup</h2>
              
              <div className="mb-8 p-6 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center">
                <p className="text-secondary mb-4 text-sm">Quickly sign up using Google</p>
                <button type="button" onClick={handleGoogleAuth} className="bg-white text-gray-900 font-semibold py-2 px-6 rounded-lg flex items-center gap-3 w-full justify-center hover:bg-white/90 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-6">
                
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="flex-1 space-y-4">
                    <FormInput label="Organization Name" value={orgName} onChange={e=>setOrgName(e.target.value)} required />
                    <FormInput label="Registration Number (optional)" value={regNumber} onChange={e=>setRegNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary mb-2 block">NGO Logo</label>
                    <FileDropzone isSquare file={logoFile} previewUrl={logoPreview} onFileDrop={f => handleFileDrop(f, 'logo')} accept={{"image/*":[]}} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary mb-2 block">Focus Categories</label>
                  <MultiSelectPills options={NGO_CATEGORIES} selected={ngoCategories} onChange={setNgoCategories} colorTheme="primary" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="City" value={city} onChange={e=>setCity(e.target.value)} required />
                  <FormInput label="Pin Code" value={pincode} onChange={e=>setPincode(e.target.value)} required pattern="\d{6}" title="6 digit pin code" />
                </div>

                <FormInput label="Contact Person Name" value={contactName} onChange={e=>setContactName(e.target.value)} required />

                {!useGoogle && (
                  <div className="p-4 rounded-xl border border-white/10 bg-black/20 space-y-4">
                    <h3 className="text-sm font-medium text-white">Login Credentials</h3>
                    <FormInput label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
                    <FormInput label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-lg mt-8">
                  {loading ? 'Creating account...' : 'Create NGO account'}
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && role === 'volunteer' && (
            <motion.div
              key="step2-vol"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              
              {/* SUBSECTION A: Basic Info */}
              <div className="glass p-6 sm:p-10 rounded-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Basic Info</h2>
                
                <div className="mb-8 p-6 rounded-xl border border-white/10 bg-white/5 flex flex-col sm:flex-row items-center gap-4">
                  <button type="button" onClick={handleGoogleAuth} className="bg-white text-gray-900 font-semibold py-2 px-6 rounded-lg flex items-center gap-3 w-full justify-center hover:bg-white/90 mt-2 sm:mt-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                    Continue with Google
                  </button>
                </div>

                <div className="flex flex-col gap-6 sm:flex-row mb-6">
                  <div>
                    <label className="text-sm font-medium text-secondary mb-2 block">Avatar</label>
                    <FileDropzone isSquare file={volAvatar} previewUrl={avatarPreview} onFileDrop={f => handleFileDrop(f, 'avatar')} accept={{"image/*":[]}} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <FormInput label="Full Name" value={volName} onChange={e=>setVolName(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput label="City" value={city} onChange={e=>setCity(e.target.value)} required />
                      <FormInput label="Pin Code" value={pincode} onChange={e=>setPincode(e.target.value)} required pattern="\d{6}" />
                    </div>
                  </div>
                </div>

                {!useGoogle && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <FormInput label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
                    <FormInput label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-secondary mb-1 block flex justify-between">
                    <span>Short Bio</span>
                    <span>{volBio.length} / 200</span>
                  </label>
                  <textarea 
                    maxLength={200}
                    value={volBio}
                    onChange={e => setVolBio(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 resize-none h-24 transition-all"
                    placeholder="Tell us a bit about why you want to volunteer..."
                  />
                </div>
              </div>

              {/* SUBSECTION B: Skills */}
              <div className="glass p-6 sm:p-10 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00D4AA] to-transparent opacity-50 left-0" />
                <h2 className="text-2xl font-bold text-white mb-6">Skills & Availability</h2>

                {/* AI Resume Feature */}
                <div className="mb-8 p-5 bg-gradient-to-r from-[#00D4AA]/10 to-[#6C47FF]/10 border border-[#00D4AA]/20 rounded-xl">
                  <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[#00D4AA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    AI Magic Auto-Fill
                  </h3>
                  <p className="text-secondary text-sm mb-4">Upload your resume and we'll extract your skills automatically.</p>
                  <FileDropzone 
                    file={resumeFile} 
                    onFileDrop={f => handleFileDrop(f, 'resume')} 
                    accept={{ 'application/pdf': ['.pdf'] }}
                    dropText={isExtracting ? "Analyzing document with AI..." : "Drop PDF resume here"}
                  />
                  
                  {isExtracting && (
                    <div className="mt-4 flex items-center gap-3 text-[#00D4AA] text-sm">
                      <Loader2 className="animate-spin" size={16} /> Parsing skills...
                    </div>
                  )}

                  {suggestedSkills.length > 0 && (
                    <div className="mt-4 p-4 bg-black/40 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-white">Suggested Skills:</span>
                        <button 
                          type="button" 
                          onClick={() => setVolSkills(Array.from(new Set([...volSkills, ...suggestedSkills])))}
                          className="text-xs font-bold text-[#00D4AA] px-3 py-1 bg-[#00D4AA]/10 rounded-full hover:bg-[#00D4AA]/20"
                        >
                          Add All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestedSkills.map(skill => (
                          <button
                            key={skill} type="button"
                            onClick={() => {
                              if (!volSkills.includes(skill)) setVolSkills([...volSkills, skill]);
                            }}
                            className={`px-3 py-1 rounded-full text-xs border border-[#00D4AA]/30 text-white transition-colors ${volSkills.includes(skill) ? 'hidden' : 'hover:bg-[#00D4AA]/20'}`}
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-sm font-medium text-secondary mb-3 block">Your Skills</label>
                    <MultiSelectPills options={VOLUNTEER_SKILLS} selected={volSkills} onChange={setVolSkills} colorTheme="accent" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-secondary mb-3 block">Languages Spoken</label>
                    <MultiSelectPills options={LANGUAGES} selected={volLanguages} onChange={setVolLanguages} colorTheme="accent" />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-secondary mb-3 block flex justify-between">
                      <span>Maximum Travel Radius</span>
                      <span className="text-white">Up to {travelRadius}km from your location</span>
                    </label>
                    <input 
                      type="range" 
                      min="1" max="50" 
                      value={travelRadius}
                      onChange={e => setTravelRadius(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00D4AA]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-secondary mb-3 block">Weekly Availability</label>
                    <div className="grid grid-cols-[auto_1fr] gap-4 overflow-x-auto text-sm pb-4">
                      <div className="grid grid-rows-3 gap-2 mt-8 text-secondary font-medium">
                        <div className="h-11 flex items-center">Morning</div>
                        <div className="h-11 flex items-center">Afternoon</div>
                        <div className="h-11 flex items-center">Evening</div>
                      </div>
                      
                      <div className="flex gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <div key={day} className="flex flex-col gap-2">
                            <div className="text-center text-white/50 mb-2">{day}</div>
                            {['Morning', 'Afternoon', 'Evening'].map(time => {
                              const key = `${day}-${time}`;
                              const isSelected = availability.includes(key);
                              return (
                                <button
                                  type="button"
                                  key={key}
                                  onClick={() => toggleAvailability(day, time)}
                                  className={`w-12 h-11 rounded-lg border flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'bg-brand-accent/20 border-brand-accent text-brand-accent shadow-[0_0_10px_rgba(0,212,170,0.2)]' 
                                      : 'bg-white/5 border-white/10 text-transparent hover:bg-white/10'
                                  }`}
                                >
                                  {isSelected && <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleCreateAccount}
                  type="button" 
                  disabled={loading} 
                  className="w-full bg-brand-accent hover:bg-[#00e5b8] text-gray-900 font-bold py-4 rounded-xl text-lg mt-8 transition-colors"
                >
                  {loading ? 'Creating account...' : 'Create volunteer account'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
