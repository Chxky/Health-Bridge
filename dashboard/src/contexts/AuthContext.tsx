import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface AuthUser {
  uid: string;
  email: string;
  name: string;
  role: string;
  facilityId?: string;
  facilityName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const idTokenResult = await firebaseUser.getIdTokenResult();

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: data.name || idTokenResult.claims.name || '',
              role: (idTokenResult.claims.role as string) || data.role || 'pharmacist',
              facilityId: (idTokenResult.claims.facilityId as string) || data.facilityId,
              facilityName: data.facilityName,
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        // Only clear if not in a demo session
        setUser(prev => (prev?.email === 'demo@healthbridge.zw' ? prev : null));
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    if (email === 'demo@healthbridge.zw' && password === 'demo123') {
      setUser({
        uid: 'demo-user-123',
        email: 'demo@healthbridge.zw',
        name: 'Demo Administrator',
        role: 'natpharm_admin',
        facilityId: 'natpharm-central',
        facilityName: 'NatPharm Central Warehouse',
      });
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
