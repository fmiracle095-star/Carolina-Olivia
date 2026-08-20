'use client';

import * as React from 'react';
import { createClient } from './supabase/client';
import type { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  supabase: any;
  session: Session | null;
  user: User | null;
  loading: boolean;
  isOwner: boolean;
};

const AuthContext = React.createContext<AuthContextType>({
  supabase: null,
  session: null,
  user: null,
  loading: true,
  isOwner: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [supabase] = React.useState(() => createClient());
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isOwner, setIsOwner] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function checkOwnerStatus(token: string, currentUserId: string | undefined) {
      try {
        const url = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://carolina-gateway.vercel.app';
        const targetEndpoint = `${url}/api/v1/system/status`;
        console.log(`[OWNER-AUTH] Calling Gateway URL: ${targetEndpoint}`);
        if (currentUserId) {
          console.log(`[OWNER-AUTH] Authenticated Supabase user.id: ${currentUserId}`);
        }

        const res = await fetch(targetEndpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log(`[OWNER-AUTH] HTTP Response Status: ${res.status}`);

        if (res.ok) {
          const data = await res.json();
          console.log(`[OWNER-AUTH] Response JSON:`, JSON.stringify(data));
          console.log(`[OWNER-AUTH] Returned data.isOwner: ${!!data.isOwner}`);
          
          if (mounted) {
            setIsOwner(!!data.isOwner);
          }
        } else {
          console.error(`[OWNER-AUTH] Request failed with status ${res.status}`);
          if (mounted) setIsOwner(false);
        }
      } catch (err) {
        console.error(`[OWNER-AUTH] Request threw an error:`, err);
        if (mounted) setIsOwner(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.access_token) {
          checkOwnerStatus(session.access_token, session?.user?.id);
        } else {
          setIsOwner(false);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.access_token) {
          checkOwnerStatus(session.access_token, session?.user?.id);
        } else {
          setIsOwner(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ supabase, session, user, loading, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return React.useContext(AuthContext);
}
