import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import FormInput from '../components/FormInput';
import { useToast } from '../contexts/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const auth = getAuth();

  const handleRouteAfterLogin = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const { role } = userSnap.data();
        if (role === 'ngo') {
          navigate('/ngo/dashboard');
        } else if (role === 'volunteer') {
          navigate('/volunteer/dashboard');
        } else {
          navigate('/signup');
        }
      } else {
        navigate('/signup'); // No profile, go complete signup
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error fetching user profile', 'error');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleRouteAfterLogin(result.user);
    } catch (err) {
      console.error(err);
      addToast(err.message, 'error');
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return addToast('Please fill in all fields', 'error');
    }
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handleRouteAfterLogin(result.user);
    } catch (err) {
      console.error(err);
      let msg = 'Invalid credentials';
      if (err.code === 'auth/user-not-found') msg = 'User not found';
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password';
      addToast(msg, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex overflow-hidden">
      
      {/* LEFT PANEL - 60% */}
      <div className="hidden lg:flex w-[60%] relative flex-col justify-center px-16 xl:px-24">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-brand-primary/20 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-brand-accent/20 rounded-full blur-[100px]"
          />
        </div>

        <div className="relative z-10 max-w-2xl">
          <Link to="/" className="text-2xl font-bold gradient-text inline-block mb-24">RapidPulse</Link>
          
          <h1 className="text-5xl xl:text-6xl font-bold leading-tight text-white mb-8">
            Every community need, matched to the right hands.
          </h1>
          
          <div className="flex flex-wrap gap-4 mt-12">
            {/* Social proof pills */}
            <div className="glass px-4 py-3 rounded-full flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0F] bg-white/10 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="avatar" />
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium text-white/80">Join 50,000+ volunteers</span>
            </div>
            <div className="glass px-4 py-3 rounded-full flex items-center gap-3">
              <span className="text-sm font-medium text-white/80">Trusted by 100+ NGOs</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - 40% */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 sm:p-12 z-10 relative">
        <div className="absolute inset-0 bg-[#0A0A0F]/80 backdrop-blur-2xl lg:hidden z-0" />
        
        <div className="w-full max-w-[400px] relative z-10">
          <div className="lg:hidden mb-12 text-center">
            <Link to="/" className="text-3xl font-bold gradient-text inline-block">RapidPulse</Link>
          </div>

          <div className="glass p-8 sm:p-10 rounded-2xl w-full">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome back</h2>
            
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-white/90 text-gray-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors mb-6 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex flex-row items-center gap-4 mb-6">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-secondary text-sm">or</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
              <FormInput 
                label="Email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <FormInput 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <span className="text-secondary text-sm">Don't have an account? </span>
              <Link to="/signup" className="text-brand-primary text-sm font-medium hover:text-white transition-colors">
                Sign up →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
