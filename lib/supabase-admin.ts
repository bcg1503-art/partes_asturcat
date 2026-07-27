import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

let _supabaseAdmin: any;
if (supabaseUrl && serviceKey) {
  _supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
} else {
  _supabaseAdmin = {
    from: () => ({ insert: async () => ({ data: null, error: new Error('Supabase admin not configured') }) }),
    rpc: async () => ({ data: null, error: new Error('Supabase admin not configured') })
  } as any;
}

export const supabaseAdmin = _supabaseAdmin;
