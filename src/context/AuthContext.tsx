import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, syncUserProfile } from '../firebase';
import { useToast } from './ToastContext';

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  roleTitle: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        try {
          await syncUserProfile(currentUser);
        } catch (e) {
          console.warn('Error syncing profile to Firestore:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        toast.success(
          'Welcome, Auditor',
          `Signed in as ${result.user.displayName || result.user.email}. Cloud sync enabled.`
        );
        setIsLoginModalOpen(false);
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        toast.info('Sign-in cancelled', 'The login window was closed before completing.');
      } else if (err.code === 'auth/popup-blocked') {
        toast.warning(
          'Popup Blocked',
          'Please allow popups in your browser to sign in with Google.'
        );
      } else {
        toast.error('Authentication Error', err.message || 'Failed to authenticate with Google.');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.info('Signed Out', 'You have been disconnected from the cloud audit session.');
    } catch (err: any) {
      console.error('Sign-out error:', err);
      toast.error('Sign-out failed', err.message || 'Could not log out.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        loginWithGoogle,
        logout,
        roleTitle: 'Customs Officer & Regulatory Auditor',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
