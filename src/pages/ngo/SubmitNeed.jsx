import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Edit3, Image as ImageIcon, CheckCircle, ChevronDown, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import FileDropzone from '../../components/FileDropzone';
import FormInput from '../../components/FormInput';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORIES = [
  "Food & Nutrition", "Healthcare", "Education", "Shelter & Housing", 
  "Women's Safety", "Child Welfare", "Elderly Care", "Disaster Relief", 
  "Water & Sanitation", "Livelihood"
];
const VULNERABLE_GROUPS = ["children", "elderly", "women", "disabled"];
const URGENCIES = [
  { id: 'immediate', label: 'Immediate (0-24 hrs)' },
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
  { id: 'long_term', label: 'Long term' }
];

export default function SubmitNeed() {
  const [activeTab, setActiveTab] = useState('photo'); // 'photo' | 'manual'
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Shared State
  const [needs, setNeeds] = useState([]); // Array of need objects
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('rapidpulse_need_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setNeeds(parsed);
          addToast("Restored your previous survey draft.", "info");
        }
      } catch (e) {
        localStorage.removeItem('rapidpulse_need_draft');
      }
    }
  }, []);

  // Save draft to localStorage whenever needs change
  useEffect(() => {
    if (needs.length > 0) {
      localStorage.setItem('rapidpulse_need_draft', JSON.stringify(needs));
    } else {
      localStorage.removeItem('rapidpulse_need_draft');
    }
  }, [needs]); // Text for the spinner

  // Photo State
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Manual State
  const [mCategory, setMCategory] = useState(CATEGORIES[0]);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mLoc, setMLoc] = useState('');
  const [mPeople, setMPeople] = useState('');
  const [mVulnerable, setMVulnerable] = useState([]);
  const [mUrgency, setMUrgency] = useState('immediate');

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const handlePhotoDrop = async (file) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    
    setIsProcessing(true);
    setProcessingStatus('Gemini is reading your survey...');
    
    try {
      const base64Image = await fileToBase64(file);
      const mimeType = file.type;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key missing");

      // We MUST use gemini-1.5-flash or gemini-1.5-pro for vision tasks
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const prompt = `
        You are a community needs data extractor for Indian NGOs.
        Analyze this image of a field survey or handwritten report.
        The text may be in Hindi, English, or mixed Hinglish.
        Extract ALL community needs mentioned.
        Return ONLY a valid JSON array of objects, no markdown, no explanation.

        For each need use this exact schema:
        {
          "title": "short English title, max 8 words",
          "description": "detailed English description, 2-3 sentences",
          "category": "choose exactly one from: Food & Nutrition, Healthcare, Education, Shelter & Housing, Women's Safety, Child Welfare, Elderly Care, Disaster Relief, Water & Sanitation, Livelihood",
          "location": "area name if mentioned or null",
          "peopleAffected": integer or null,
          "vulnerableGroup": array of matching strings from ["children","elderly","women","disabled"],
          "timeUrgency": "immediate" | "this_week" | "this_month" | "long_term"
        }
      `;

      const reqBody = {
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Image } }
          ]
        }],
        generationConfig: { temperature: 0.1 }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Gemini API Error Response:", errData);
        throw new Error(errData.error?.message || `AI extraction failed (Status ${res.status}).`);
      }
      
      const data = await res.json();
      console.log("Gemini AI Raw Response:", data);

      if (data.error) {
        throw new Error(`Gemini API Error: ${data.error.message}`);
      }

      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      
      // Robust JSON extraction
      try {
        // Remove markdown blocks if present
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          rawText = jsonMatch[0];
        }
        
        const extractedNeeds = JSON.parse(rawText);
        setNeeds(extractedNeeds);
        addToast(`Extracted ${extractedNeeds.length} needs successfully.`, 'success');
      } catch (parseErr) {
        console.error("Failed to parse Gemini response:", rawText);
        throw new Error("AI returned data in an invalid format. Please try again.");
      }
      
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to process image.", 'error');
      setPhotoFile(null);
      setPhotoPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const scoreAndSubmit = async (needsToScore) => {
    if (!needsToScore || needsToScore.length === 0) return;
    
    setIsProcessing(true);
    setProcessingStatus('Calculating severity scores...');
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key missing");

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const scoredNeeds = [];

      for (const need of needsToScore) {
        const prompt = `
          You are an urgency classification AI for a community needs platform in India.
          Assign a severity score to this community need. Return ONLY valid JSON, no other text.

          Need:
          Title: ${need.title}
          Description: ${need.description}  
          Category: ${need.category}
          People affected: ${need.peopleAffected}
          Vulnerable groups: ${JSON.stringify(need.vulnerableGroup)}
          Time urgency: ${need.timeUrgency}

          Scoring rules (be strict — most needs should be 2 or 3, not 5):
          Score 5 (Critical): ONLY if life is at immediate risk RIGHT NOW. Examples: no food for 2+ days, medical emergency happening now, flood/disaster active. Must affect children/elderly/disabled AND be happening today. Very rare — max 1-2 per survey.
          Score 4 (High): Urgent health or safety risk within 2-3 days. Medication stopped, water shortage with vulnerable people affected.
          Score 3 (Moderate): Important but no immediate life risk. School dropouts, recurring issues, quality of life problems.
          Score 2 (Low): Safety concern, infrastructure, long-term issue. Broken streetlights, cleanliness, general awareness needs.
          Score 1 (Informational): Aspirational or planning stage only.

          IMPORTANT: Streetlight/lighting issues are maximum Score 2.
          IMPORTANT: School dropout issues are maximum Score 3.
          IMPORTANT: When in doubt, score LOWER not higher.

          Return JSON exactly matching this schema:
          {
            "severityScore": integer 1-5,
            "severityLabel": "Critical" | "High" | "Moderate" | "Low" | "Informational",
            "actionWindow": "within 24 hours" | "within 3 days" | "this week" | "this month" | "long term",
            "reasoning": "one sentence explaining score",
            "suggestedSkills": ["skill1","skill2"]
          }
        `;

        const reqBody = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody)
        });
        
        let scoringParams = { severityScore: 3, severityLabel: 'Moderate', actionWindow: 'this week', reasoning: 'Default fallback', suggestedSkills: [] };
        
        if (res.ok) {
          const data = await res.json();
          let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
            scoringParams = JSON.parse(rawText);
          } catch(e) { console.error("Parse fail on scoring", e); }
        }

        // Attach scoring and timestamp to the need document
        scoredNeeds.push({
          ...need,
          ...scoringParams,
          ngoId: currentUser.uid,
          status: 'pending',
          submittedAt: serverTimestamp()
        });
      }

      setProcessingStatus('Saving to database...');
      
      const needsCol = collection(db, 'needs');
      for (const finalNeed of scoredNeeds) {
        await addDoc(needsCol, finalNeed);
      }

      addToast(`Successfully submitted ${scoredNeeds.length} need(s).`, 'success');
      localStorage.removeItem('rapidpulse_need_draft'); // Clear draft after success
      navigate('/ngo/dashboard');

    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!mTitle || !mDesc) return addToast("Please fill in required fields", "error");

    const manualNeed = {
      title: mTitle,
      description: mDesc,
      category: mCategory,
      location: mLoc,
      peopleAffected: parseInt(mPeople) || null,
      vulnerableGroup: mVulnerable,
      timeUrgency: mUrgency
    };
    
    scoreAndSubmit([manualNeed]);
  };

  const toggleVulnerableGroup = (group) => {
    if (mVulnerable.includes(group)) {
      setMVulnerable(mVulnerable.filter(g => g !== group));
    } else {
      setMVulnerable([...mVulnerable, group]);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-white mb-2">Submit New Need</h1>
        <p className="text-secondary">Capture field surveys instantly or enter data manually.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/5 rounded-2xl p-1.5 shadow-[inset_0_4px_4px_rgba(0,0,0,0.1)] mb-8 max-w-sm mx-auto md:mx-0">
        <button
          onClick={() => setActiveTab('photo')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'photo' ? 'bg-[#6C47FF] text-white shadow-lg' : 'text-secondary hover:text-white'
          }`}
        >
          <Camera size={16} /> 📷 Upload Photo
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'manual' ? 'bg-[#6C47FF] text-white shadow-lg' : 'text-secondary hover:text-white'
          }`}
        >
          <Edit3 size={16} /> ✏️ Manual Entry
        </button>
      </div>

      {isProcessing ? (
        <div className="glass rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <LoadingSpinner size={60} className="mb-6" />
          <h3 className="text-white font-bold text-xl mb-2">{processingStatus}</h3>
          <p className="text-brand-primary">This usually takes a few seconds...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* TAB A: PHOTO UPLOAD */}
          {activeTab === 'photo' && (
            <motion.div key="photo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              
              {!photoFile && (
                <div className="border-2 border-dashed border-[#6C47FF]/40 bg-[#6C47FF]/5 hover:bg-[#6C47FF]/10 rounded-2xl transition-colors">
                  <FileDropzone 
                    file={photoFile}
                    onFileDrop={handlePhotoDrop}
                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'], 'application/pdf': ['.pdf'] }}
                    dropText={
                      <div className="space-y-4">
                        <Camera size={48} className="mx-auto text-[#6C47FF]" />
                        <div>
                          <p className="text-white font-semibold text-lg">Drop a photo of a field survey or report</p>
                          <p className="text-secondary text-sm mt-1">Supports JPG, PNG, PDF · Hindi and English both supported</p>
                        </div>
                      </div>
                    }
                  />
                </div>
              )}

              {photoFile && needs.length > 0 && (
                <div className="space-y-8">
                  <div className="glass p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={photoPreview} alt="Survey preview" className="w-16 h-16 object-cover rounded-lg" />
                      <div>
                        <h4 className="text-white font-medium">{photoFile.name}</h4>
                        <p className="text-brand-primary text-sm font-semibold">{needs.length} needs extracted</p>
                      </div>
                    </div>
                    <button onClick={() => { setPhotoFile(null); setNeeds([]); }} className="text-secondary hover:text-white text-sm">
                      Discard
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-2">Review Extracted Needs</h3>
                    {needs.map((need, index) => (
                      <div key={index} className="glass p-6 rounded-xl border border-white/10 space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-xs text-secondary mb-1 block">Title</label>
                            <input 
                              value={need.title} 
                              onChange={e => { const updated = [...needs]; updated[index].title = e.target.value; setNeeds(updated); }}
                              className="w-full bg-transparent border-b border-white/10 text-white font-medium focus:border-[#00D4AA] outline-none pb-1"
                            />
                          </div>
                          <div className="w-1/3">
                            <label className="text-xs text-secondary mb-1 block">Category</label>
                            <select 
                              value={need.category}
                              onChange={e => { const updated = [...needs]; updated[index].category = e.target.value; setNeeds(updated); }}
                              className="w-full bg-black/50 border border-white/10 text-white text-sm rounded-lg p-1.5 outline-none focus:border-[#00D4AA] appearance-none"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-secondary mb-1 block">Description</label>
                          <textarea 
                            value={need.description} 
                            onChange={e => { const updated = [...needs]; updated[index].description = e.target.value; setNeeds(updated); }}
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-[#00D4AA] outline-none resize-none h-16"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <button onClick={() => setActiveTab('manual')} className="text-secondary hover:text-white text-sm font-medium">
                      + Add another manually
                    </button>
                    <button onClick={() => scoreAndSubmit(needs)} className="btn-primary py-3 px-8 text-lg flex items-center gap-2">
                      Score severity & Submit <CheckCircle size={18}/>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB B: MANUAL ENTRY */}
          {activeTab === 'manual' && (
            <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <form onSubmit={handleManualSubmit} className="glass p-6 sm:p-10 rounded-2xl relative space-y-6">
                
                <div>
                  <label className="text-sm font-medium text-secondary mb-2 block">Category</label>
                  <div className="relative">
                    <select 
                      value={mCategory} onChange={e=>setMCategory(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-brand-primary appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0A0A0F]">{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" size={20} />
                  </div>
                </div>

                <FormInput label="Title" placeholder="e.g. Clean drinking water required" value={mTitle} onChange={e=>setMTitle(e.target.value)} required />
                
                <div>
                  <label className="text-sm font-medium text-secondary mb-2 block">Description</label>
                  <textarea 
                    value={mDesc} onChange={e=>setMDesc(e.target.value)} required
                    placeholder="Describe the situation in detail..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 outline-none focus:border-brand-primary resize-none h-28 transition-all"
                  />
                </div>

                <FormInput label="Location (e.g. Village/Area)" placeholder="Where is this?" value={mLoc} onChange={e=>setMLoc(e.target.value)} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormInput label="Estimated People Affected" type="number" placeholder="0" value={mPeople} onChange={e=>setMPeople(e.target.value)} />
                  
                  <div>
                    <label className="text-sm font-medium text-secondary mb-2 block">Vulnerable Groups</label>
                    <div className="flex flex-wrap gap-2">
                      {VULNERABLE_GROUPS.map(group => (
                        <button
                          key={group} type="button" onClick={() => toggleVulnerableGroup(group)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-colors ${
                            mVulnerable.includes(group) ? 'border-[#00D4AA] bg-[#00D4AA]/20 text-white' : 'border-white/10 bg-white/5 text-secondary hover:text-white'
                          }`}
                        >
                          {group}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary mb-3 block">Urgency Timeline</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {URGENCIES.map(u => (
                      <label key={u.id} className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-colors ${
                        mUrgency === u.id ? 'border-[#6C47FF] bg-[#6C47FF]/20 text-[#8B6EFF]' : 'border-white/10 bg-white/5 text-secondary hover:bg-white/10'
                      }`}>
                        <input type="radio" name="urgency" value={u.id} checked={mUrgency === u.id} onChange={(e) => setMUrgency(e.target.value)} className="hidden" />
                        <span className="text-sm font-medium">{u.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 mt-8">
                  <button type="submit" className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-3">
                    Score & Submit Need <CheckCircle size={20} />
                  </button>
                  <p className="text-center text-secondary text-xs mt-3">Submitting will trigger RapidPulse AI to automatically evaluate and score the severity of this need before saving via Gemini 1.5 Flash.</p>
                </div>

              </form>
            </motion.div>
          )}
        </AnimatePresence>
      )}

    </div>
  );
}
