import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, UserCheck, TrendingUp, Camera, FileText, PlusCircle } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import NeedCard from '../../components/NeedCard';
import SkeletonCard from '../../components/SkeletonCard';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function NGODashboard() {
  const { currentUser } = useAuth();
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    resolved: 0,
    deployed: 0,
    impacted: 0
  });

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Listen to recent needs feed for this NGO
    const q = query(
      collection(db, 'needs'),
      where('ngoId', '==', currentUser.uid),
      orderBy('submittedAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNeeds = [];
      let activeCount = 0;
      let resolvedCount = 0;
      let impactedCount = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        fetchedNeeds.push({ id: doc.id, ...data });
        
        if (data.status === 'resolved') {
          resolvedCount++;
          impactedCount += (data.peopleAffected || 0); // Simplified calculation
        } else {
          activeCount++;
        }
      });

      setNeeds(fetchedNeeds);
      
      // Update stats based on recent fetch (Note: In a huge set, you'd aggregate via Cloud Functions)
      setStats(prev => ({
        ...prev,
        active: activeCount, // A real implementation would query all aggregate counts
        resolved: resolvedCount,
        impacted: impactedCount * 15 // Using mock multiplier from spec "resolved needs x 15" for visual impact if needed
      }));
      setLoading(false);
    }, (error) => {
      console.error("Dashboard feed error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-secondary">Track your submitted needs and volunteer impact.</p>
      </div>

      {/* STATS GRID */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard 
          icon={AlertTriangle} title="Active needs" value={stats.active} 
          trend="↑ 12%" trendUp={false} 
        />
        <StatCard 
          icon={CheckCircle} title="Resolved this month" value={stats.resolved} 
          trend="↑ 8%" trendUp={true} 
        />
        <StatCard 
          icon={UserCheck} title="Volunteers deployed" value={stats.deployed || 0} 
          trend="↑ 24%" trendUp={true} 
        />
        <StatCard 
          icon={TrendingUp} title="People impacted" value={stats.impacted || 0} 
          trend="↑ 5%" trendUp={true} 
        />
      </motion.div>

      {/* QUICK ACTIONS */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/ngo/submit" className="relative overflow-hidden group rounded-2xl p-6 bg-gradient-to-br from-[#6C47FF]/20 to-[#6C47FF]/5 border border-[#6C47FF]/20 hover:border-[#6C47FF]/40 transition-all">
          <div className="absolute inset-0 bg-[#6C47FF]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#6C47FF]/20 flex items-center justify-center text-[#8B6EFF]">
              <Camera size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Upload a survey photo</h3>
              <p className="text-[#8B6EFF] text-sm font-medium">Extract needs automatically with AI</p>
            </div>
          </div>
        </Link>
        <Link to="/ngo/report" className="relative overflow-hidden group rounded-2xl p-6 bg-gradient-to-br from-[#00D4AA]/20 to-[#00D4AA]/5 border border-[#00D4AA]/20 hover:border-[#00D4AA]/40 transition-all">
          <div className="absolute inset-0 bg-[#00D4AA]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00D4AA]/20 flex items-center justify-center text-[#00D4AA]">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Generate impact report</h3>
              <p className="text-[#00D4AA] text-sm font-medium">Download data for stakeholders</p>
            </div>
          </div>
        </Link>
      </div>

      {/* RECENT NEEDS FEED */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-bold text-white">Recent needs</h2>
          <Link to="/ngo/submit" className="text-brand-primary text-sm font-medium hover:text-white transition-colors">
            Submit new need →
          </Link>
        </div>

        <div className="space-y-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : needs.length > 0 ? (
            needs.map(need => <NeedCard key={need.id} need={need} />)
          ) : (
            <div className="glass rounded-xl p-10 text-center border-dashed border-2 hover:border-brand-primary/50 transition-colors">
              <Camera className="mx-auto text-secondary mb-4 opacity-50" size={48} />
              <h3 className="text-lg font-bold text-white mb-2">No needs submitted yet</h3>
              <p className="text-secondary mb-6 max-w-sm mx-auto">Start capturing field surveys or manually enter community needs to get matched with volunteers.</p>
              <Link to="/ngo/submit" className="btn-primary inline-flex items-center gap-2">
                <PlusCircle size={18} /> Submit Need
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, trend, trendUp }) {
  return (
    <motion.div variants={itemVariants} className="glass p-5 rounded-xl border border-white/5 relative overflow-hidden group">
      {/* Decorative gradient blob */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-primary/10 rounded-full blur-2xl group-hover:bg-brand-primary/20 transition-colors" />
      
      <div className="flex items-center gap-3 text-secondary mb-4 relative z-10">
        <Icon size={18} />
        <span className="text-sm font-medium truncate">{title}</span>
      </div>
      <div className="text-3xl font-bold gradient-text mb-2 relative z-10">
        {value}
      </div>
      <div className={`text-xs font-bold relative z-10 ${trendUp ? 'text-[#00C853]' : 'text-brand-coral'}`}>
        {trend} vs last month
      </div>
    </motion.div>
  );
}
