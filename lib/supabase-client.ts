import {createClient} from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// Create the client lazily and tolerate missing env vars during static builds.
let _supabase: any;
if (supabaseUrl && supabaseAnonKey) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // sessionStorage instead of localStorage: cleared when the tab/browser closes,
      // so the user has to sign in again instead of staying logged in indefinitely.
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      // We never rely on Supabase's automatic implicit-grant URL parsing — signin/signup
      // call signInWithPassword/signUp explicitly, and /reset-password verifies its token
      // itself. Leaving this on made the SDK race its own background parsing of a
      // confirmation-link hash against a manual sign-in submitted on the same page load,
      // so the first "Entrar" click after following an email link would silently no-op.
      detectSessionInUrl: false
    }
  });
} else {
  // Minimal stub to avoid throwing during build; runtime calls will throw a clearer error.
  const missing = () => {
    throw new Error('Supabase not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  };
  _supabase = {
    auth: {
      signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
      signUp: async () => ({ error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: new Error('Supabase not configured') }),
      getSession: async () => ({ data: null })
    },
    from: () => ({ select: async () => ({ data: null, error: new Error('Supabase not configured') }), insert: async () => ({ data: null, error: new Error('Supabase not configured') }) }),
    storage: {
      from: () => ({ upload: async () => ({ error: new Error('Supabase not configured') }), getPublicUrl: () => ({ data: null }) })
    }
  } as any;
}

export const supabase = _supabase;
