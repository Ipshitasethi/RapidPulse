import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';

export default function Certificate({ certData, certId, onClose }) {
  const certRef = useRef(null);
  const { t, i18n } = useTranslation();

  const {
    volunteerName = 'Volunteer',
    taskCount = 0,
    hoursServed = 0,
    topCategories = ['Health', 'Education'],
    locationArea = 'India',
    earnedBadges = [],
    partnerNgoName = 'RapidPulse Partner NGO',
    averageRating = 4.8,
    issuedAt = new Date(),
  } = certData || {};

  const issueDate = issuedAt?.toDate ? issuedAt.toDate() : new Date(issuedAt);
  const monthYear = issueDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const uniqueId = certId || `RP-${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}-DEMO`;

  const badgeIcons = ['🌱', '🔥', '🚨', '🏥'];

  const handleDownload = async () => {
    if (!certRef.current) return;
    const canvas = await html2canvas(certRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    pdf.save(`RapidPulse-Certificate-${volunteerName.replace(/\s+/g, '-')}-${uniqueId}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Language + Download Controls (outside capture div) */}
      <div className="flex justify-between items-center px-1">
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
          {['en', 'hi'].map(lang => (
            <button
              key={lang}
              onClick={() => i18n.changeLanguage(lang)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                i18n.language === lang
                  ? 'bg-[#6C47FF] text-white'
                  : 'text-[#A0A0B8] hover:text-white'
              }`}
            >
              {lang === 'en' ? 'EN' : 'हि'}
            </button>
          ))}
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
        >
          <Download size={15} /> Download PDF
        </button>
      </div>

      {/* Certificate Preview — captured by html2canvas */}
      <div
        ref={certRef}
        style={{
          background: '#ffffff',
          padding: '48px 40px',
          maxWidth: '700px',
          margin: '0 auto',
          fontFamily: 'Inter, sans-serif',
          color: '#111',
          borderRadius: '0px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top gradient bar */}
        <div style={{ height: '6px', background: 'linear-gradient(90deg, #6C47FF, #00D4AA)', borderRadius: '3px', width: '100%', marginBottom: '28px' }} />

        {/* Org header */}
        <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', textAlign: 'center', marginBottom: '12px' }}>
          RapidPulse — Smart Resource Allocation
        </p>

        {/* Title */}
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#6C47FF', textAlign: 'center', marginBottom: '6px' }}>
          {i18n.language === 'hi' ? 'योगदान का प्रमाणपत्र' : 'Certificate of Contribution'}
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: '14px', color: '#888', textAlign: 'center', marginBottom: '20px' }}>
          {i18n.language === 'hi' ? 'सामुदायिक सेवा एवं स्वयंसेवा की मान्यता में' : 'In recognition of community service and voluntary dedication'}
        </p>

        {/* Divider */}
        <div style={{ height: '1px', background: '#eee', marginBottom: '20px' }} />

        {/* Presented to */}
        <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {i18n.language === 'hi' ? 'प्रदान किया जाता है' : 'Presented to'}
        </p>

        {/* Name */}
        <h2 style={{ fontSize: '32px', fontWeight: '700', textAlign: 'center', marginBottom: '20px', background: 'linear-gradient(135deg, #6C47FF, #00D4AA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {volunteerName}
        </h2>

        {/* Body */}
        <p style={{ fontSize: '14px', color: '#444', lineHeight: '1.7', textAlign: 'center', maxWidth: '500px', margin: '0 auto 24px', }}>
          {i18n.language === 'hi'
            ? `${topCategories.join(' और ')} श्रेणियों में ${taskCount} स्वयंसेवी कार्य पूर्ण करने और ${locationArea} समुदायों की सेवा करने के लिए।`
            : `For completing ${taskCount} volunteer tasks across ${topCategories.join(' and ')}, serving the communities of ${locationArea} with dedication and impact.`}
        </p>

        {/* Badge icons row */}
        {earnedBadges.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
            {earnedBadges.slice(0, 4).map((badge, i) => (
              <div key={i} style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F5F2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                {badgeIcons[i] || '🏅'}
              </div>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: i18n.language === 'hi' ? 'कार्य पूर्ण' : 'Tasks Done', value: taskCount },
            { label: i18n.language === 'hi' ? 'घंटे दिए' : 'Hours Served', value: `${hoursServed}h` },
            { label: i18n.language === 'hi' ? 'जीवन प्रभावित' : 'Lives Impacted', value: `~${taskCount * 15}` },
            { label: i18n.language === 'hi' ? 'औसत रेटिंग' : 'Avg Rating', value: `${averageRating}★` },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', background: '#F9F6FF', borderRadius: '10px', padding: '12px 8px' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#6C47FF' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>RapidPulse Platform</div>
            <div style={{ fontSize: '11px', color: '#999' }}>Issued digitally · {monthYear}</div>
          </div>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700, #FF8C00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', boxShadow: '0 4px 12px rgba(255,215,0,0.4)' }}>
            🏅
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#333' }}>{partnerNgoName}</div>
            <div style={{ fontSize: '11px', color: '#999' }}>Partner organization</div>
          </div>
        </div>

        {/* Certificate ID */}
        <p style={{ fontSize: '10px', color: '#bbb', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '12px' }}>
          Certificate ID: {uniqueId} · Verify at rapidpulse.app/verify/{uniqueId}
        </p>
      </div>
    </div>
  );
}
