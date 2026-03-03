import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

import { auth } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAlumni, setIsAlumni] = useState(false);
  const [isAlumniManager, setIsAlumniManager] = useState(false);

  useEffect(() => {
    // Initialize persistence once to avoid extra async work during every login submit
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error('Error setting auth persistence:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const email = currentUser.email?.toLowerCase();

        // 1. Check for Admin Emails
        const adminEmails = [
          'dineshkumar.mech@sairam.edu.in',
          'murugan.math@sairam.edu.in',
          'prabhu.mech@sairam.edu.in',
          'viswanathan.phy@sairamit.edu.in'
        ];
        const isMasterAdmin = adminEmails.includes(email);

        // 2. Check for Alumni Manager (Email check)
        const alumniManagerEmails = ['alumini@sairamtao.edu.in', 'alumini@sairamtap.edu.in'];
        const isManager = alumniManagerEmails.includes(email);

        setIsAdmin(isMasterAdmin);
        setIsAlumniManager(isManager);

        // 3. Robust check if in Alumni collection (for regular alumni)
        // If they are not the master admin and not a manager, they are treated as an Alumni.
        setIsAlumni(!isMasterAdmin && !isManager);

      } else {
        setUser(null);
        setIsAdmin(false);
        setIsAlumni(false);
        setIsAlumniManager(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (email, pass) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    isAdmin,
    isAlumni,
    isAlumniManager,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};