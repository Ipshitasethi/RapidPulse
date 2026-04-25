import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Download, Shield, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Certificate from '../components/Certificate';

export default function VerifyCertificate() {
  const { certId } = useParams();
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState(null);
  const [found, setFound] = useState(false);

  useEffect(() => {
    const fetchCert = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'certificates'), where('certId', '==', certId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setCertData(data);
          setFound(true);
        } else {
          setFound(false);
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setFound(false);
      }
      setLoading(false);
    };

    if (certId) fetchCert();
  }, [certId]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-xl font-bold inline-block mb-4" style={{ background: 'linear-gradient(135deg, #6C47FF, #00D4AA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            RapidPulse
          </Link>
          <p className="text-[#5A5A72] text-sm">Certificate Verification Portal</p>
        </div>

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-16 text-center"
          >
            <div className="w-12 h-12 border-4 border-[#6C47FF]/20 border-t-[#6C47FF] rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[#A0A0B8]">Verifying certificate <span className="text-white font-mono">{certId}</span>...</p>
          </motion.div>
        )}

        {/* Found */}
        {!loading && found && certData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Success header */}
            <div className="rounded-2xl p-8 text-center"
              style={{ background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.3)', boxShadow: '0 0 20px rgba(0,212,170,0.1)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <CheckCircle size={56} className="text-[#00D4AA] mx-auto mb-4" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2" style={{ background: 'linear-gradient(135deg, #6C47FF, #00D4AA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Certificate verified
              </h1>
              <p className="text-[#A0A0B8] text-sm">This certificate is authentic and was issued by RapidPulse.</p>
            </div>

            {/* Certificate details */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={20} className="text-[#6C47FF]" />
                <h2 className="text-lg font-bold">Certificate Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow label="Volunteer Name" value={certData.volunteerName} />
                <DetailRow label="Issue Date" value={certData.issuedAt ? new Date(certData.issuedAt.seconds ? certData.issuedAt.seconds * 1000 : certData.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                <DetailRow label="Tasks Completed" value={certData.taskCount} />
                <DetailRow label="Hours Served" value={`${certData.hoursServed || 0}h`} />
                <DetailRow label="Lives Impacted" value={`~${(certData.taskCount || 0) * 15}`} />
                <DetailRow label="Avg Rating" value={`${certData.averageRating || 0}★`} />
                <DetailRow label="Partner NGO" value={certData.partnerNgoName || '—'} />
                <DetailRow label="Certificate ID" value={certData.certId} mono />
              </div>

              {/* Earned badges */}
              {certData.earnedBadges?.length > 0 && (
                <div className="pt-4 border-t border-white/[0.06]">
                  <p className="text-xs text-[#5A5A72] uppercase tracking-wider mb-3">Earned Badges</p>
                  <div className="flex flex-wrap gap-2">
                    {certData.earnedBadges.map((badge, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-[#6C47FF]/10 text-[#6C47FF] border border-[#6C47FF]/30 font-medium">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Certificate preview */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
              <Certificate certData={certData} certId={certData.certId} />
            </div>

            {/* Back */}
            <div className="text-center">
              <Link to="/" className="text-sm text-[#A0A0B8] hover:text-white transition-colors inline-flex items-center gap-2">
                <ArrowLeft size={14} /> Back to RapidPulse
              </Link>
            </div>
          </motion.div>
        )}

        {/* Not Found */}
        {!loading && !found && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.3)', boxShadow: '0 0 20px rgba(255,107,107,0.1)' }}
          >
            <XCircle size={56} className="text-[#FF6B6B] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#FF6B6B] mb-2">Certificate not found</h1>
            <p className="text-[#A0A0B8] text-sm mb-6">This certificate ID does not exist or may have been revoked.</p>
            <p className="text-xs text-[#5A5A72] font-mono mb-8">{certId}</p>
            <Link to="/" className="text-sm text-[#A0A0B8] hover:text-white transition-colors inline-flex items-center gap-2">
              <ArrowLeft size={14} /> Back to RapidPulse
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3">
      <p className="text-[10px] text-[#5A5A72] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm font-semibold ${mono ? 'font-mono text-[#6C47FF]' : ''}`}>{value}</p>
    </div>
  );
}
