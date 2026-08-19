'use client';

import { createContext, useContext, ReactNode } from 'react';
import { createClient } from './supabase/client';

const AuthContext = createContext<any>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createClient();
  return <AuthContext.Provider value={{ supabase, session: null, user: null }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return { supabase: createClient(), session: null, user: null };
  }
  return context;
};
