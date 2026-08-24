import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thlsmxbenxovnfjqgnyq.supabase.co';
const supabaseKey = 'sb_publishable_g1PQlpZ4UJ7e0xiYhtn1og_gehileI7'; // User provided this

export const supabase = createClient(supabaseUrl, supabaseKey);
