import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from './supabase/client';
import { User } from '@supabase/supabase-js';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

const supabase = createClient();

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const createProfileViaApi = async (session: any) => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const inserted = await response.json();
      console.log('Auto-created profile via API:', inserted);
      setUser(inserted);
    } catch (err) {
      console.error('Failed to auto-create profile via API:', err);
      setUser(null);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Session user found, fetching profile for:', session.user.id);
        
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.warn('User authenticated but no profile found in DB, calling API to create profile for:', session.user.id);
            await createProfileViaApi(session);
          } else {
            console.error('Error fetching profile:', error);
          }
        } else {
          console.log('Profile fetched:', profile);
          setUser(profile);
        }
      }
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state change event:', _event);
      if (session?.user) {
        console.log('Session user found in state change, fetching profile for:', session.user.id);
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            console.warn('User authenticated but no profile found in DB in state change, calling API for:', session.user.id);
            await createProfileViaApi(session);
          } else {
            console.error('Error fetching profile in state change:', error);
          }
        } else {
          console.log('Profile fetched in state change:', profile);
          setUser(profile);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
