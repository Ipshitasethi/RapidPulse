import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Sparkles, Calendar, Filter, Map as MapIcon, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0A0A0F' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A0A0B8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0A0F' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A1A2E' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#06060A' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#12121A' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1A1A2E' }] }
];

export default function Analytics() {
  const mapRef = useRef(null);
  const [needs, setNeeds] = useState([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [forecast, setForecast] = useState(null);

  // Recharts specific colors
  const COLORS = ['#6C47FF', '#00D4AA', '#FF6B6B', '#FFD700', '#FF8C00'];

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
      const q = query(collection(db, 'needs'));
      const snapshot = await getDocs(q);
      const fetched = [];
      snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
      setNeeds(fetched);
    };
    fetchNeeds();
  }, []);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      const loader = new Loader({
        apiKey: "YOUR_GOOGLE_MAPS_API_KEY", // Replace with real key in production or use env
        version: "weekly",
      });

      try {
        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement, PinElement } = await loader.importLibrary("marker");

        const map = new Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 }, // Center of India
          zoom: 5,
          styles: darkMapStyle,
          mapId: 'RAPIDPULSE_DARK_MAP', // Required for AdvancedMarkerElement
          disableDefaultUI: true,
          zoomControl: true,
        });

        // Mock data if no real needs with locations exist yet
        const mapData = needs.length > 0 ? needs : [
          { lat: 28.7041, lng: 77.1025, title: 'Medical Supplies needed', severityScore: 5 },
          { lat: 19.0760, lng: 72.8777, title: 'Flood Relief Volunteers', severityScore: 4 },
          { lat: 12.9716, lng: 77.5946, title: 'Educational Drive', severityScore: 2 },
          { lat: 22.5726, lng: 88.3639, title: 'Food Distribution', severityScore: 3 },
          { lat: 13.0827, lng: 80.2707, title: 'Blood Donation Camp', severityScore: 5 }
        ];

        const markers = mapData.map((need, i) => {
          // In real app, need.location might be a GeoPoint
          const position = need.location ? { lat: need.location.latitude, lng: need.location.longitude } : { lat: need.lat || 20, lng: need.lng || 78 };
          
          const pinBackground = new PinElement({
            background: getSeverityColor(need.severityScore),
            borderColor: '#FFFFFF',
            glyphColor: '#FFFFFF',
          });

          return new AdvancedMarkerElement({
            position,
            map,
            title: need.title,
            content: pinBackground.element
          });
        });

        new MarkerClusterer({ markers, map });
      } catch (error) {
        console.error("Map initialization failed", error);
      }
    };

    initMap();
  }, [needs]);

  const generateForecast = () => {
    setLoadingForecast(true);
    // Simulate AI processing
    setTimeout(() => {
      setForecast({
        summary: "Based on historical data and recent weather patterns, we expect a 40% increase in medical and flood relief requests in coastal regions over the next 30 days. Volunteer availability generally remains steady.",
        predictions: [
          {
            category: "Health & Medical",
            predictedCount: 145,
            confidence: "high",
            confidenceColor: "#00C853",
            reasoning: "Seasonal vector-borne diseases typically peak during this month.",
            recommendedAction: "Pre-approve medical volunteers and stockpile basic supplies."
          },
          {
            category: "Disaster Relief",
            predictedCount: 82,
            confidence: "medium",
            confidenceColor: "#FFD700",
            reasoning: "Meteorological predictions show higher than average rainfall in eastern states.",
            recommendedAction: "Alert quick-response teams in high-risk zones."
          }
        ]
      });
      setLoadingForecast(false);
    }, 3000);
  };

  // Mock Data for Charts
  const categoryData = [
    { category: 'Health', count: 400 },
    { category: 'Education', count: 300 },
    { category: 'Food', count: 300 },
    { category: 'Disaster', count: 200 },
    { category: 'Animal', count: 100 },
  ];

  const last30DaysData = [
    { date: '1', critical: 10, high: 20, moderate: 15, low: 5 },
    { date: '5', critical: 12, high: 18, moderate: 20, low: 10 },
    { date: '10', critical: 15, high: 25, moderate: 10, low: 12 },
    { date: '15', critical: 8, high: 22, moderate: 25, low: 8 },
    { date: '20', critical: 20, high: 30, moderate: 15, low: 10 },
    { date: '25', critical: 18, high: 28, moderate: 18, low: 15 },
    { date: '30', critical: 14, high: 24, moderate: 22, low: 18 },
  ];

  const responseRateData = [
    { week: 'W1', rate: 45 },
    { week: 'W2', rate: 52 },
    { week: 'W3', rate: 68 },
    { week: 'W4', rate: 74 },
    { week: 'W5', rate: 82 },
  ];

  const resolutionData = [
    { month: 'Jan', resolved: 40, open: 20 },
    { month: 'Feb', resolved: 60, open: 25 },
    { month: 'Mar', resolved: 85, open: 30 },
    { month: 'Apr', resolved: 120, open: 40 },
    { month: 'May', resolved: 150, open: 35 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0F] text-white overflow-y-auto">
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
            <p className="text-[#A0A0B8] mt-1">Data-driven views of community needs and volunteer impact.</p>
          </div>
          
          {/* Filters Bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors">
              <Filter size={16} /> All Categories
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors">
              <Calendar size={16} /> Last 30 Days
            </button>
          </div>
        </div>

        {/* Top Section - Map */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-lg relative">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-sm z-10 absolute top-0 left-0 right-0">
            <h2 className="font-semibold flex items-center gap-2">
              <MapIcon size={18} className="text-[#00D4AA]" /> Needs Heatmap
            </h2>
            <div className="flex gap-2">
              {[5, 4, 3, 2, 1].map(score => (
                <div key={score} className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: getSeverityColor(score) }} title={`Severity ${score}`} />
              ))}
            </div>
          </div>
          <div ref={mapRef} className="w-full h-[400px] mt-14" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Needs by Category */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart2 size={18} className="text-[#6C47FF]" /> Needs by Category
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="count"
                    nameKey="category"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#12121A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Needs by Severity over Time */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6">Needs by Severity (Last 30 Days)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last30DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#A0A0B8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A0A0B8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#12121A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="critical" stackId="a" fill="#FF3B3B" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="high" stackId="a" fill="#FF8C00" />
                  <Bar dataKey="moderate" stackId="a" fill="#FFD700" />
                  <Bar dataKey="low" stackId="a" fill="#00C853" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Volunteer Response Rate */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6">Volunteer Response Rate (%)</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseRateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="week" stroke="#A0A0B8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A0A0B8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#12121A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#00D4AA" strokeWidth={3} dot={{ r: 4, fill: '#00D4AA', strokeWidth: 2, stroke: '#0A0A0F' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Resolved vs Open */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-6">Resolved vs Open Needs</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={resolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00D4AA" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C47FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6C47FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="#A0A0B8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A0A0B8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#12121A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="resolved" stroke="#00D4AA" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
                  <Area type="monotone" dataKey="open" stroke="#6C47FF" fillOpacity={1} fill="url(#colorOpen)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Forecast Card */}
        <div className="relative rounded-2xl overflow-hidden p-[1px] group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#6C47FF] to-[#00D4AA] opacity-50 blur-sm group-hover:opacity-75 transition-opacity duration-500"></div>
          <div className="relative bg-[#0A0A0F] rounded-2xl p-8 h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Sparkles className="text-[#6C47FF]" /> AI Forecast — Next 30 Days
                </h2>
                <p className="text-[#A0A0B8] mt-1 text-sm flex items-center gap-2">
                  Powered by <span className="bg-gradient-to-r from-[#6C47FF] to-[#00D4AA] -webkit-background-clip-text text-transparent bg-clip-text font-semibold">Gemini 1.5 Pro</span>
                </p>
              </div>
              
              <button 
                onClick={generateForecast}
                disabled={loadingForecast}
                className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingForecast ? (
                  <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div> Analyzing...</>
                ) : (
                  <><Sparkles size={16} /> Generate Forecast</>
                )}
              </button>
            </div>

            {forecast && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {forecast.predictions.map((pred, idx) => (
                    <div key={idx} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-medium px-2.5 py-1 bg-white/5 rounded-md border border-white/10">{pred.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#A0A0B8]">Confidence</span>
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                            style={{ backgroundColor: `${pred.confidenceColor}20`, color: pred.confidenceColor, border: `1px solid ${pred.confidenceColor}40` }}
                          >
                            {pred.confidence}
                          </span>
                        </div>
                      </div>
                      <div className="text-3xl font-bold mb-2">
                        {pred.predictedCount} <span className="text-sm font-normal text-[#A0A0B8]">expected requests</span>
                      </div>
                      <p className="text-sm text-[#E0E0FF] italic mb-3">"{pred.reasoning}"</p>
                      <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/20 rounded-lg p-3 text-sm">
                        <span className="text-[#00D4AA] font-semibold block mb-1">Recommendation:</span>
                        {pred.recommendedAction}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-[#6C47FF]/10 border border-[#6C47FF]/30 rounded-xl p-5">
                  <h4 className="font-semibold text-[#6C47FF] mb-2 flex items-center gap-2">
                    <Sparkles size={16} /> Summary
                  </h4>
                  <p className="leading-relaxed text-white/90">{forecast.summary}</p>
                </div>
              </motion.div>
            )}

            {!forecast && !loadingForecast && (
              <div className="py-12 text-center text-[#5A5A72] border-2 border-dashed border-white/5 rounded-xl">
                Click "Generate Forecast" to analyze historical data and predict future community needs.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
