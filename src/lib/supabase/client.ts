import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let client: any = null;

// Only used during static build time where window is undefined.
const createMockClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: {}, error: new Error('Static Build Environment') }),
    signUp: async () => ({ data: {}, error: new Error('Static Build Environment') }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        then: (cb: any) => cb({ data: null, error: null }),
      }),
    }),
    upsert: () => ({
      then: (cb: any) => cb({ error: null })
    })
  }),
});

export const createClient = () => {
  if (typeof window === 'undefined') {
    return createMockClient();
  }
  
  if (client) return client;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    console.error('Supabase credentials missing. Authentication will fail.');
    // We do not fallback to placeholder strings here. We want it to explicitly throw an error or at least warn heavily,
    // but createBrowserClient requires valid url structure, so we must throw if they are entirely empty.
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  client = createSupabaseClient(url, anonKey);
  return client;
};
