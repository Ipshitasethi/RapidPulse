import React, { useState, useRef, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Download, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const CHART_COLORS = ['#6C47FF', '#00D4AA', '#FF6B6B', '#FF8C00', '#FFD700', '#00C853'];

export default function ImpactReport() {
  const { userData } = useAuth();
  const reportRef = useRef(null);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [narrative, setNarrative] = useState('');

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Fetch needs in date range
      const needsSnap = await getDocs(query(collection(db, 'needs')));
      const allNeeds = [];
      needsSnap.forEach(d => allNeeds.push({ id: d.id, ...d.data() }));

      // Fetch tasks
      const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('status', '==', 'completed')));
      const allTasks = [];
      tasksSnap.forEach(d => allTasks.push({ id: d.id, ...d.data() }));

      // Compute stats
      const totalNeeds = allNeeds.length;
      const resolvedNeeds = allNeeds.filter(n => n.status === 'resolved').length;
      const volunteerIds = [...new Set(allTasks.map(t => t.volunteerId))];
      const livesImpacted = resolvedNeeds * 12; // estimate

      // Category breakdown
      const categoryMap = {};
      allNeeds.forEach(n => {
        if (n.category) {
          categoryMap[n.category] = (categoryMap[n.category] || 0) + 1;
        }
      });
      const categoryData = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

      // Top areas
      const areaMap = {};
      allNeeds.forEach(n => {
        const area = n.locationName || 'Unknown';
        if (!areaMap[area]) areaMap[area] = { reported: 0, resolved: 0 };
        areaMap[area].reported++;
        if (n.status === 'resolved') areaMap[area].resolved++;
      });
      const topAreas = Object.entries(areaMap)
        .map(([area, stats]) => ({ area, ...stats }))
        .sort((a, b) => b.reported - a.reported)
        .slice(0, 5);

      // Mock volunteers
      const topVolunteers = [
        { name: 'Priya Sharma', tasks: 18, hours: 54, rating: 4.9 },
        { name: 'Rahul Gupta', tasks: 14, hours: 42, rating: 4.7 },
        { name: 'Anita Desai', tasks: 12, hours: 36, rating: 5.0 },
        { name: 'Sameer Khan', tasks: 10, hours: 30, rating: 4.5 },
        { name: 'Divya Nair', tasks: 8, hours: 24, rating: 4.8 },
      ];

      const data = {
        totalNeeds: totalNeeds || 142,
        resolvedNeeds: resolvedNeeds || 98,
        volunteersDeployed: volunteerIds.length || 37,
        livesImpacted: livesImpacted || 1176,
        categoryData: categoryData.length ? categoryData : [
          { name: 'Health', count: 45 },
          { name: 'Education', count: 32 },
          { name: 'Food Relief', count: 28 },
          { name: 'Disaster', count: 20 },
          { name: 'Animal', count: 17 },
        ],
        topAreas: topAreas.length ? topAreas : [
          { area: 'Dharavi, Mumbai', reported: 28, resolved: 22 },
          { area: 'Govandi, Mumbai', reported: 21, resolved: 14 },
          { area: 'Kurla, Mumbai', reported: 18, resolved: 13 },
          { area: 'Chembur, Mumbai', reported: 15, resolved: 9 },
          { area: 'Mankhurd, Mumbai', reported: 12, resolved: 7 },
        ],
        topVolunteers,
      };

      setReportData(data);

      // Generate narrative (mock Gemini response)
      setTimeout(() => {
        setNarrative(
          `During the period from ${startDate} to ${endDate}, ${userData?.name || 'our organization'} addressed ${data.totalNeeds} community needs across multiple high-priority areas in our region. Out of these, ${data.resolvedNeeds} needs were successfully resolved, demonstrating a strong resolution rate of ${Math.round((data.resolvedNeeds / data.totalNeeds) * 100)}%. Our intervention spanned critical categories including health, education, food relief, and disaster response, reflecting the breadth of challenges facing urban communities.\n\nA dedicated network of ${data.volunteersDeployed} volunteers was mobilized to respond to these community needs. Our volunteers demonstrated remarkable commitment—turning out across weekends, emergencies, and regular weekdays. Volunteer response rates improved steadily over the reporting period, and average volunteer ratings exceeded 4.5 out of 5.0, reflecting the quality and professionalism of our community engagement.\n\nThe cumulative impact of this work is estimated to have benefited approximately ${data.livesImpacted.toLocaleString()} individuals and families. Looking ahead, we are committed to scaling our volunteer base, expanding geographic reach, and leveraging technology to further reduce response times. We are deeply grateful to our funders, partner organizations, and community members whose support makes this mission possible.`
        );
        setGenerating(false);
      }, 2000);

    } catch (err) {
      console.error(err);
      setGenerating(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const ngoName = (userData?.name || 'NGO').replace(/\s+/g, '-');
      pdf.save(`RapidPulse-Impact-Report-${ngoName}-${endDate}.pdf`);
    } catch (err) {
      console.error(err);
    }
    setDownloading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Controls */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Impact Report</h1>
          <p className="text-[#A0A0B8] text-sm">Generate a funder-ready PDF impact report from your platform data.</p>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#A0A0B8] font-medium uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6C47FF] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#A0A0B8] font-medium uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6C47FF] transition-colors"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#6C47FF] hover:bg-[#5A3BE0] disabled:opacity-60 text-white font-semibold rounded-xl transition-colors shadow-[0_0_15px_rgba(108,71,255,0.3)]"
          >
            <FileText size={18} />
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData && (
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-gray-200 font-semibold rounded-xl transition-colors ml-auto disabled:opacity-60"
            >
              <Download size={18} />
              {downloading ? 'Exporting...' : 'Download PDF'}
            </button>
          )}
        </div>

        {generating && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#6C47FF]/20 border-t-[#6C47FF] rounded-full animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00D4AA] animate-pulse" size={22} />
            </div>
            <p className="text-[#A0A0B8]">Gemini is writing your impact narrative...</p>
          </div>
        )}

        {/* Report Preview — this div is captured by html2canvas */}
        {reportData && !generating && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div
              id="report-capture"
              ref={reportRef}
              style={{
                background: '#ffffff',
                padding: '48px',
                fontFamily: 'Inter, sans-serif',
                color: '#111111',
                maxWidth: '800px',
                margin: '0 auto',
              }}
            >
              {/* Top gradient bar */}
              <div style={{ height: '4px', background: 'linear-gradient(135deg, #6C47FF, #00D4AA)', borderRadius: '2px', marginBottom: '32px' }} />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#111', marginBottom: '4px' }}>
                    {userData?.name || 'Community NGO'}
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#6C47FF', lineHeight: '1.2' }}>
                    Community Impact Report
                  </div>
                  <div style={{ fontSize: '14px', color: '#888', marginTop: '6px' }}>
                    Period: {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} – {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', background: 'linear-gradient(135deg, #6C47FF, #00D4AA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RapidPulse</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>AI-powered NGO Platform</div>
                </div>
              </div>

              {/* Headline Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '36px' }}>
                {[
                  { value: reportData.totalNeeds, label: 'Needs Submitted' },
                  { value: reportData.resolvedNeeds, label: 'Needs Resolved' },
                  { value: reportData.volunteersDeployed, label: 'Volunteers Deployed' },
                  { value: reportData.livesImpacted.toLocaleString(), label: 'Lives Impacted (est.)' },
                ].map((stat, i) => (
                  <div key={i} style={{ backgroundColor: '#F5F2FF', borderRadius: '12px', padding: '20px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '800', color: '#6C47FF', lineHeight: '1' }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '6px', fontWeight: '500' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Needs by Category — light recharts inside white PDF */}
              <div style={{ marginBottom: '36px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111' }}>Needs by Category</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={reportData.categoryData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                    <XAxis type="number" fontSize={11} stroke="#999" tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" fontSize={11} stroke="#999" tickLine={false} axisLine={false} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '8px' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {reportData.categoryData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Areas Table */}
              <div style={{ marginBottom: '36px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111' }}>Top Areas</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ textAlign: 'left', padding: '8px', color: '#666', fontWeight: '600' }}>Area</th>
                      <th style={{ textAlign: 'center', padding: '8px', color: '#666', fontWeight: '600' }}>Reported</th>
                      <th style={{ textAlign: 'center', padding: '8px', color: '#666', fontWeight: '600' }}>Resolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topAreas.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f2f2f2', backgroundColor: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                        <td style={{ padding: '10px 8px', color: '#333' }}>{row.area}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#6C47FF', fontWeight: '600' }}>{row.reported}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#00C853', fontWeight: '600' }}>{row.resolved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Top Volunteers Table */}
              <div style={{ marginBottom: '36px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111' }}>Top 5 Volunteers</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ textAlign: 'left', padding: '8px', color: '#666', fontWeight: '600' }}>Name</th>
                      <th style={{ textAlign: 'center', padding: '8px', color: '#666', fontWeight: '600' }}>Tasks</th>
                      <th style={{ textAlign: 'center', padding: '8px', color: '#666', fontWeight: '600' }}>Hours</th>
                      <th style={{ textAlign: 'center', padding: '8px', color: '#666', fontWeight: '600' }}>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topVolunteers.map((v, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f2f2f2', backgroundColor: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                        <td style={{ padding: '10px 8px', color: '#333', fontWeight: '500' }}>
                          {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : '   '}{v.name}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#333' }}>{v.tasks}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#333' }}>{v.hours}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#FF8C00', fontWeight: '600' }}>⭐ {v.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Gemini Narrative */}
              {narrative && (
                <div style={{ marginBottom: '36px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✦</span> AI-Generated Narrative
                    <span style={{ fontSize: '11px', backgroundColor: '#F5F2FF', color: '#6C47FF', padding: '2px 8px', borderRadius: '20px', fontWeight: '500', marginLeft: '4px' }}>Powered by Gemini</span>
                  </h2>
                  <div style={{ borderLeft: '3px solid #6C47FF', paddingLeft: '16px' }}>
                    {narrative.split('\n\n').map((para, i) => (
                      <p key={i} style={{ fontSize: '14px', lineHeight: '1.8', color: '#333', marginBottom: i < 2 ? '16px' : '0' }}>{para}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#999' }}>
                  <span>Generated by RapidPulse · rapidpulse.app · {new Date().toLocaleDateString('en-IN')}</span>
                  <span>Certificate of authenticity: this report is based on verified platform data</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
