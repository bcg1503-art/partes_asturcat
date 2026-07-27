import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export async function supabaseServer() {
	const cookieStore = await cookies();
	const accessToken = cookieStore.get('sb-access-token')?.value;
	const refreshToken = cookieStore.get('sb-refresh-token')?.value;

	const client = createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false
		}
	});

	if (accessToken && refreshToken) {
		await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
	}

	return client;
}
