import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sbdmfrfpzfmsuvdxaqxx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZG1mcmZwemZtc3V2ZHhhcXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzcxODEsImV4cCI6MjA5NzAxMzE4MX0.XoF9sI_Vos2R9AvbB-6iXYuI3DLI9F4_4jJuUOT6Ew4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
