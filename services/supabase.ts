import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const isSupabaseConfigured = (): boolean => {
    return !!supabaseUrl && supabaseUrl.length > 0 && !!supabaseKey && supabaseKey.length > 0;
};

// Create a single supabase client for interacting with your database.
// If config is missing, we use a mock object to prevent the app from crashing on load.
// The service layer checks isSupabaseConfigured() before attempting to use this client.
export const supabase = (isSupabaseConfigured()
    ? createClient(supabaseUrl!, supabaseKey!)
    : {
        from: () => ({ select: () => ({}), insert: () => ({}), upload: () => ({}) }),
        storage: { from: () => ({ upload: () => ({}), getPublicUrl: () => ({}) }) }
      }) as unknown as SupabaseClient;
