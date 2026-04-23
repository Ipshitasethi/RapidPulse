import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'ngo' | 'volunteer'
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Initializing Firebase auth listener...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthProvider: Auth state changed:", user ? "User logged in" : "No user");
      if (user) {
        setCurrentUser(user);
        
        // Fetch user role from /users/{uid}
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            setUserRole(role);
            
            // Fetch profile data based on role
            const profileCol = role === 'ngo' ? 'ngos' : 'volunteers';
            const profileDoc = await getDoc(doc(db, profileCol, user.uid));
            if (profileDoc.exists()) {
              setProfileData(profileDoc.data());
            }
          }
        } catch (error) {
          console.error("Error fetching user role/profile:", error);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setProfileData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
    userRole,
    profileData,
    userData: profileData,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-white font-sans">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-secondary animate-pulse">Initializing RapidPulse...</p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
