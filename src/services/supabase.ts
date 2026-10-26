import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = 'https://bgzczjlkatjdibqkxuqr.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnemN6amxrYXRqZGlicWt4dXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5ODkzNTMsImV4cCI6MjEwODU2NTM1M30.M_prqnkvbH_deQWF8pytvsYbI1PUPq7ulEz3P7VDdXM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
