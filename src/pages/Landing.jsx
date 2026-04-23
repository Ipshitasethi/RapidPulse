import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation, useMotionValue, useSpring } from 'framer-motion';
import { Camera, Zap, Users, CheckCircle, MapPin, Star } from 'lucide-react';

// Reusable Counter Component
const Counter = ({ from = 0, to, duration = 2 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(from);
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    if (inView) {
      motionValue.set(to);
    }
  }, [inView, motionValue, to]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [springValue]);

  return <span ref={ref}>{displayValue.toLocaleString()}</span>;
};

export default function Landing() {
  const { t, i18n } = useTranslation();

  // Floating particles generator
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const newParticles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 4 + Math.random() * 4,
      delay: Math.random() * 2,
      color: Math.random() > 0.5 ? 'bg-brand-primary' : 'bg-brand-accent'
    }));
    setParticles(newParticles);
  }, []);

  const wordStagger = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const headlineWords = t('hero.headline').split(" ");

  return (
    <div className="bg-dark-bg min-h-screen overflow-hidden font-sans">
      
      {/* SECTION 1: HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-6">
        {/* Animated Mesh Gradient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] bg-brand-primary rounded-full mix-blend-screen filter blur-[120px] opacity-15"
          />
          <motion.div 
            animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-brand-accent rounded-full mix-blend-screen filter blur-[120px] opacity-15"
          />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className={`absolute w-1 h-1 rounded-full opacity-30 ${p.color}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="border border-brand-accent text-brand-accent px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-8 bg-brand-accent/5 backdrop-blur-sm shadow-[0_0_15px_rgba(0,212,170,0.15)]"
          >
            ⚡ {t('app.solution_tag')}
          </motion.div>

          <motion.h1 
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tightest leading-[1.1]"
          >
            {headlineWords.map((word, i) => (
              <motion.span key={i} variants={wordStagger} className="inline-block mr-[0.3em]">
                {word === 'AI' || word === 'एआई' ? (
                  <span className="gradient-text">{word}</span>
                ) : (
                  <span className="text-white">{word}</span>
                )}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t('hero.sub')}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto"
          >
            <Link to="/signup?role=ngo" className="btn-primary py-3 px-8 text-[15px] shadow-[0_0_20px_rgba(108,71,255,0.4)]">
              {t('hero.cta_ngo')}
            </Link>
            <Link to="/signup?role=volunteer" className="btn-outline py-3 px-8 text-[15px] bg-white/5 backdrop-blur-md">
              {t('hero.cta_vol')}
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-16 flex flex-wrap justify-center gap-3 md:gap-6"
          >
            {[t('hero.stat_needs'), t('hero.stat_vols'), t('hero.stat_ngos')].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-full px-5 py-2 text-sm text-secondary backdrop-blur-md">
                {stat}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4 tracking-tightest">{t('how_it_works.title')}</h2>
            <p className="text-secondary text-lg">{t('how_it_works.sub')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', icon: Camera, title: t('how_it_works.step1_title'), desc: t('how_it_works.step1_desc') },
              { num: '02', icon: Zap, title: t('how_it_works.step2_title'), desc: t('how_it_works.step2_desc') },
              { num: '03', icon: Users, title: t('how_it_works.step3_title'), desc: t('how_it_works.step3_desc') }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="glass p-8 relative overflow-hidden group hover:border-brand-primary/50 transition-colors duration-500"
              >
                <div className="absolute -top-4 -left-2 text-6xl font-bold gradient-text opacity-10 group-hover:opacity-20 transition-opacity">
                  {step.num}
                </div>
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-6 relative z-10 group-hover:bg-brand-primary/20 transition-colors">
                  <step.icon size={24} className="text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-secondary text-[15px] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: FOR NGOS */}
      <section id="for-ngos" className="py-24 px-6 border-t border-white/5 bg-[#0D0D14]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <div className="inline-block bg-brand-primary/20 text-brand-light text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-wider uppercase">
              {t('for_ngos.tag')}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tightest leading-tight">
              {t('for_ngos.title')}
            </h2>
            <ul className="space-y-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <li key={num} className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-brand-primary shrink-0 mt-0.5" />
                  <span className="text-secondary text-[15px]">{t(`for_ngos.bullet${num}`)}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full"
          >
            <div className="glass p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-dark-card to-dark-bg">
              {/* Subtle top glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-coral to-transparent opacity-50" />
              
              <div className="inline-flex items-center gap-2 bg-[#FF8C00]/10 text-[#FF8C00] px-3 py-1.5 rounded-md text-xs font-bold mb-4 border border-[#FF8C00]/20">
                <div className="w-2 h-2 rounded-full bg-[#FF8C00] animate-pulse" />
                {t('for_ngos.mock_badge')}
              </div>
              
              <h4 className="text-xl font-bold mb-3">{t('for_ngos.mock_title')}</h4>
              
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <MapPin size={16} /> {t('for_ngos.mock_location')}
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <div className="w-4 h-4 rounded-sm bg-brand-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-sm bg-brand-primary" />
                  </div>
                  {t('for_ngos.mock_category')}
                </div>
              </div>

              <div className="pt-5 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm font-medium text-white">{t('for_ngos.mock_matched')}</span>
                <div className="flex -space-x-2">
                  {['bg-blue-500', 'bg-green-500', 'bg-purple-500'].map((bg, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-dark-card flex items-center justify-center text-[10px] font-bold ${bg}`}>
                      {['VK', 'RS', 'AM'][i]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: FOR VOLUNTEERS */}
      <section id="for-volunteers" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full"
          >
            <div className="glass p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden bg-gradient-to-br from-dark-card to-dark-bg">
               <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50" />
               
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-16 h-16 rounded-full bg-brand-primary flex items-center justify-center text-xl font-bold shadow-[0_0_15px_rgba(108,71,255,0.4)]">
                   PS
                 </div>
                 <div>
                   <h4 className="text-lg font-bold">{t('for_volunteers.mock_name')}</h4>
                   <p className="text-sm text-brand-accent font-medium">{t('for_volunteers.mock_level')}</p>
                 </div>
               </div>

               <div className="mb-6">
                 <div className="flex justify-between text-xs mb-2">
                   <span className="text-secondary">Level Progress</span>
                   <span className="text-brand-accent text-right">62%</span>
                 </div>
                 <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     whileInView={{ width: '62%' }}
                     transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                     viewport={{ once: true }}
                     className="h-full bg-brand-accent rounded-full"
                   />
                 </div>
               </div>

               <div className="flex gap-3 mb-6">
                  {['🌱', '🔥', '🏥', '⭐'].map((emoji, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                      {emoji}
                    </div>
                  ))}
               </div>

               <div className="pt-4 border-t border-white/10">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-white font-medium">{t('for_volunteers.mock_stats').split('·')[0]}</span>
                   <span className="text-secondary font-medium">·</span>
                   <span className="text-white font-medium">{t('for_volunteers.mock_stats').split('·')[1]}</span>
                   <span className="text-secondary font-medium">·</span>
                   <span className="text-yellow-400 font-bold flex items-center gap-1">{t('for_volunteers.mock_stats').split('·')[2]}</span>
                 </div>
               </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <div className="inline-block bg-brand-accent/20 text-brand-accent text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-wider uppercase">
              {t('for_volunteers.tag')}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tightest leading-tight">
              {t('for_volunteers.title')}
            </h2>
            <ul className="space-y-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <li key={num} className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-brand-accent shrink-0 mt-0.5" />
                  <span className="text-secondary text-[15px]">{t(`for_volunteers.bullet${num}`)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* SECTION 5: IMPACT NUMBERS */}
      <section className="py-24 px-6 border-y border-white/5 relative overflow-hidden">
        {/* Subtle grid bg */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-16 tracking-tightest">{t('impact.title')}</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: 2400, suffix: '+', label: 'impact.label1' },
              { num: 47000, suffix: '+', label: 'impact.label2' },
              { num: 85000, suffix: '+', label: 'impact.label3' },
              { num: 12, suffix: '', label: 'impact.label4' }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                  <Counter from={0} to={stat.num} duration={2} />{stat.suffix}
                </div>
                <div className="text-secondary text-sm font-medium uppercase tracking-widest">{t(stat.label)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: CTA BANNER */}
      <section className="py-24 px-6 border-b border-white/5 relative" style={{ background: 'linear-gradient(135deg, rgba(108,71,255,0.1), rgba(0,212,170,0.05))'}}>
        <div className="max-w-4xl mx-auto text-center border-y border-white/10 py-16 px-6 bg-black/20 backdrop-blur-md rounded-3xl">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tightest">{t('cta.title')}</h2>
          <p className="text-secondary text-lg mb-10 max-w-2xl mx-auto">{t('cta.sub')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup?role=ngo" className="btn-primary py-3 px-8">
              {t('cta.btn_ngo')}
            </Link>
            <Link to="/signup?role=volunteer" className="btn-outline bg-dark-bg py-3 px-8">
              {t('cta.btn_vol')}
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 7: FOOTER */}
      <footer className="bg-dark-bg pt-16 pb-8 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
          
          <div className="text-center md:text-left">
            <div className="text-2xl font-bold gradient-text mb-2 tracking-tight">{t('app.name')}</div>
            <div className="text-secondary text-sm">{t('app.tagline')}</div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm font-medium text-secondary">
            <a href="#" className="hover:text-white transition-colors">{t('nav.home')}</a>
            <a href="#for-ngos" className="hover:text-white transition-colors">{t('nav.for_ngos')}</a>
            <a href="#for-volunteers" className="hover:text-white transition-colors">{t('nav.for_volunteers')}</a>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-secondary">
          <div>{t('app.copyright')}</div>
          <div className="flex items-center gap-4">
            <span className={i18n.language === 'en' ? 'text-white font-bold' : ''}>EN</span>
            <span className="opacity-50">|</span>
            <span className={i18n.language === 'hi' ? 'text-white font-bold' : ''}>हिंदी</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
