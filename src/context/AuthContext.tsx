import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types/auth';
import { auth, signInWithGoogle, signOutUser, syncUserProfileToFirestore, getUserProfileFromFirestore } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const STORAGE_KEY = 'omniscribe_user_session_v1';

export const DEMO_USERS: Record<string, UserProfile> = {
  compliance_officer: {
    id: 'usr-demo-01',
    name: 'Elena Rostova',
    email: 'elena.rostova@meridiantrade.com',
    company: 'Meridian Global Freight & Customs',
    role: 'Logistics Compliance Officer',
    avatarInitials: 'ER',
    joinedAt: '2025-04-12',
  },
  customs_broker: {
    id: 'usr-demo-02',
    name: 'Marcus Chen',
    email: 'marcus.chen@pacificbrokerage.sg',
    company: 'Pacific TradeNet Brokerage LLP',
    role: 'Customs Broker',
    avatarInitials: 'MC',
    joinedAt: '2025-07-28',
  },
  supply_director: {
    id: 'usr-demo-03',
    name: 'Sarah Lindqvist',
    email: 'sarah.l@nordiclogistics.se',
    company: 'Nordic Trans-Atlantic Supply Chain AG',
    role: 'Supply Chain Director',
    avatarInitials: 'SL',
    joinedAt: '2024-11-19',
  },
};

interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    company: string,
    role: UserProfile['role']
  ) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  quickDemoLogin: (roleKey: 'compliance_officer' | 'customs_broker' | 'supply_director') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
      setFirebaseUser(currentFirebaseUser);

      if (currentFirebaseUser) {
        try {
          const remoteProfile = await getUserProfileFromFirestore(currentFirebaseUser.uid);
          const name = remoteProfile?.displayName || currentFirebaseUser.displayName || currentFirebaseUser.email?.split('@')[0] || 'Compliance Officer';
          const initials = name
            .split(' ')
            .map((p: string) => p.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'CO';

          const mappedUser: UserProfile = {
            id: currentFirebaseUser.uid,
            name: name,
            email: currentFirebaseUser.email || '',
            company: remoteProfile?.company || 'OmniScribe Global Logistics',
            role: (remoteProfile?.role as UserProfile['role']) || 'Logistics Compliance Officer',
            avatarInitials: initials,
            joinedAt: remoteProfile?.createdAt ? remoteProfile.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          };

          setUser(mappedUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));
        } catch (e) {
          console.warn('Failed to resolve Firebase user profile:', e);
        }
      } else {
        // Fall back to stored session if present
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.email) {
              setUser(parsed);
            }
          }
        } catch (e) {
          console.warn('Failed to parse stored user session:', e);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      const name = fbUser.displayName || fbUser.email?.split('@')[0] || 'Compliance Officer';
      const initials = name
        .split(' ')
        .map((p) => p.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CO';

      const newUser: UserProfile = {
        id: fbUser.uid,
        name: name,
        email: fbUser.email || '',
        company: 'OmniScribe Global Logistics',
        role: 'Logistics Compliance Officer',
        avatarInitials: initials,
        joinedAt: new Date().toISOString().split('T')[0],
      };

      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      console.error('Google Sign In failed:', err);
      return { success: false, error: err?.message || 'Google sign-in failed. Please try again.' };
    }
  };

  const login = async (
    email: string,
    _password?: string,
    rememberMe = true
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 300));

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setIsLoading(false);
      return { success: false, error: 'Please enter a valid work email address.' };
    }

    const namePart = trimmed.split('@')[0];
    const formattedName = namePart
      .split(/[._-]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Compliance Officer';

    const initials = formattedName
      .split(' ')
      .map((p) => p.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'OS';

    const newUser: UserProfile = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: formattedName,
      email: trimmed,
      company: trimmed.includes('@') ? trimmed.split('@')[1].split('.')[0].toUpperCase() + ' Logistics' : 'OmniScribe Global',
      role: 'Logistics Compliance Officer',
      avatarInitials: initials,
      joinedAt: new Date().toISOString().split('T')[0],
    };

    setUser(newUser);
    if (rememberMe) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      } catch (err) {
        console.warn('Failed to persist session:', err);
      }
    }
    setIsLoading(false);
    return { success: true };
  };

  const signup = async (
    name: string,
    email: string,
    _password: string,
    company: string,
    role: UserProfile['role']
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 300));

    if (!name.trim()) {
      setIsLoading(false);
      return { success: false, error: 'Full name is required.' };
    }
    if (!email.trim() || !email.includes('@')) {
      setIsLoading(false);
      return { success: false, error: 'Valid business email is required.' };
    }

    const initials = name
      .trim()
      .split(' ')
      .map((p) => p.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'OS';

    const newUser: UserProfile = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company.trim() || 'Global Trade Partner',
      role: role || 'Logistics Compliance Officer',
      avatarInitials: initials,
      joinedAt: new Date().toISOString().split('T')[0],
    };

    setUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.warn(e);
    }
    setIsLoading(false);
    return { success: true };
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 300));
    setIsLoading(false);

    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid registered email address.' };
    }

    return {
      success: true,
      message: `Password reset instructions and secure verification link have been dispatched to ${email.trim()}.`,
    };
  };

  const quickDemoLogin = (roleKey: 'compliance_officer' | 'customs_broker' | 'supply_director') => {
    const demo = DEMO_USERS[roleKey] || DEMO_USERS.compliance_officer;
    setUser(demo);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    } catch (e) {
      console.warn(e);
    }
  };

  const logout = () => {
    signOutUser().catch(() => {});
    setUser(null);
    setFirebaseUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: Boolean(user),
        isLoading,
        loginWithGoogle,
        login,
        signup,
        forgotPassword,
        quickDemoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
