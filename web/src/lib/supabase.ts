import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xdeyntmcrdvhspkucclu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZXludG1jcmR2aHNwa3VjY2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNDYzMzQsImV4cCI6MjEwNjYyMjMzNH0.f18NHyvz8qe4AVTG6kXWkQ2gLBM1lnuK2ZXFAYxgqgc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
